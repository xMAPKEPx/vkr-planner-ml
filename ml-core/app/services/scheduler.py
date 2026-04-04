from datetime import date, timedelta
from typing import List
from app.models.schemas import Subtask, ScheduleSlot, ScheduleVariant
from app.utils.metrics import calculate_variant_metrics

def _fmt_time(base_hour: int, hours: float) -> str:
    total_min = int(base_hour * 60 + hours * 60)
    h, m = divmod(total_min, 60)
    return f"{h:02d}:{m:02d}"

def _generate_slots(subtasks: List[Subtask], start_date: date, due_date: date, strategy: str, speed: float) -> List[ScheduleSlot]:
    slots = []
    current_date = start_date
    task_counter = 1
    
    for sub in subtasks:
        hours = max(sub.estimatedHours / speed, 0.25) # Минимум 15 мин
        if strategy == "sprinter":
            while hours > 0:
                day_hours = min(hours, 8.0)
                slots.append(ScheduleSlot(
                    date=current_date,
                    startTime="09:00",
                    endTime=_fmt_time(9, day_hours),
                    taskId=task_counter,
                    taskTitle=sub.title,
                    estimatedHours=round(day_hours, 2)
                ))
                hours -= day_hours
                current_date += timedelta(days=1)
        elif strategy == "balanced":
            days_left = max((due_date - current_date).days + 1, 1)
            day_hours = max(hours / days_left, 0.5)
            slots.append(ScheduleSlot(
                date=current_date,
                startTime="10:00",
                endTime=_fmt_time(10, day_hours),
                taskId=task_counter,
                taskTitle=sub.title,
                estimatedHours=round(day_hours, 2)
            ))
            current_date += timedelta(days=1)
        else:  # critical_path
            buffer = hours * 0.2
            total_h = hours + buffer
            slots.append(ScheduleSlot(
                date=current_date,
                startTime="08:00",
                endTime=_fmt_time(8, total_h),
                taskId=task_counter,
                taskTitle=f"[КРИТ] {sub.title}",
                estimatedHours=round(total_h, 2)
            ))
            current_date += timedelta(days=1)
            
        task_counter += 1
        if current_date > due_date:
            break
            
    return slots

class Scheduler:
    def generate_all_variants(self, subtasks: List[Subtask], start_date: date, due_date: date, speed_factor: float = 1.0) -> List[ScheduleVariant]:
        strategies = [
            ("sprinter", "Спринтер", "Максимальная интенсивность, ранний финиш"),
            ("balanced", "Равномерная нагрузка", "Стабильный темп без перегрузок"),
            ("critical_path", "Критический путь", "Приоритет сложным задачам + буфер")
        ]
        
        variants = []
        for key, name, desc in strategies:
            slots = _generate_slots(subtasks, start_date, due_date, key, speed_factor)
            metrics = calculate_variant_metrics(slots)
            variants.append(ScheduleVariant(
                id=key,
                name=name,
                description=desc,
                slots=slots,
                metrics=metrics,
                confidence=0.8 if key == "balanced" else 0.7
            ))
        return variants

    def recommend_variant(self, variants: List[ScheduleVariant]) -> str:
        # Приоритет balanced, если риск < 0.6, иначе выбираем по метрикам
        for v in variants:
            if v.id == "balanced" and v.metrics["riskScore"] < 0.6:
                return "balanced"
                
        scored = []
        for v in variants:
            score = v.metrics["riskScore"] * 0.5 + abs(v.metrics["avgLoadPerDay"] - 3.5) * 0.5
            scored.append((v.id, score))
        scored.sort(key=lambda x: x[1])
        return scored[0][0]

scheduler = Scheduler()