from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Tuple
from app.models.schemas import Subtask, ScheduleSlot, ScheduleVariant
from app.utils.metrics import calculate_variant_metrics

def _fmt_time(base_hour: int, hours: float) -> str:
    total_min = int(base_hour * 60 + hours * 60)
    h, m = divmod(total_min, 60)
    return f"{h:02d}:{m:02d}"

def _is_working_day(check_date: date, only_weekdays: bool = False) -> bool:
    """Проверяет, является ли день рабочим (пн-пт для only_weekdays, либо любой день)"""
    if only_weekdays:
        return check_date.weekday() < 5  # 0-4 это пн-пт
    return True

def _get_next_working_day(current_date: date, only_weekdays: bool = False) -> date:
    """Получает следующий рабочий день"""
    next_date = current_date + timedelta(days=1)
    if only_weekdays:
        while next_date.weekday() >= 5:  # Пропускаем сб-вс
            next_date += timedelta(days=1)
    return next_date

def _calculate_break_minutes(user_history: Optional[List[Dict]] = None, default: int = 15) -> int:
    """Рассчитывает рекомендуемый перерыв на основе истории пользователя"""
    if not user_history or len(user_history) < 2:
        return default
    
    # Анализируем время между последовательными задачами
    breaks = []
    for i in range(1, len(user_history)):
        prev_end = user_history[i-1].get('endTime')
        curr_start = user_history[i].get('startTime')
        if prev_end and curr_start:
            try:
                break_mins = (datetime.fromisoformat(str(curr_start)) - datetime.fromisoformat(str(prev_end))).total_seconds() / 60
                if break_mins > 0:
                    breaks.append(break_mins)
            except:
                pass
    
    if breaks:
        avg_break = sum(breaks) / len(breaks)
        return max(int(avg_break), 15)  # Минимум 15 минут
    return default

def _get_occupied_slots(existing_tasks: List[Dict], only_weekdays: bool = False) -> List[Tuple[date, float, float]]:
    """Преобразует существующие задачи в занятые слоты (дата, начало_часов, конец_часов)"""
    occupied = []
    for task in existing_tasks:
        try:
            start = datetime.fromisoformat(str(task['startDate']))
            end = datetime.fromisoformat(str(task['endDate']))
            
            # Пропускаем задачи на выходных если only_weekdays=True
            if only_weekdays and start.date().weekday() >= 5:
                continue
            
            start_hour = start.hour + start.minute / 60
            end_hour = end.hour + end.minute / 60
            occupied.append((start.date(), start_hour, end_hour))
        except:
            pass
    
    return sorted(occupied, key=lambda x: (x[0], x[1]))

def _find_free_slot(target_date: date, hours_needed: float, occupied: List[Tuple[date, float, float]], 
                    work_start: int = 9, work_end: int = 18, min_break: int = 15) -> Optional[Tuple[float, float]]:
    """Находит свободный слот в день для задачи"""
    min_break_hours = min_break / 60
    
    # Получаем все занятые слоты для этого дня
    day_occupied = [(s, e) for d, s, e in occupied if d == target_date]
    day_occupied.sort()
    
    # Пытаемся разместить задачу
    current_hour = float(work_start)
    
    for occ_start, occ_end in day_occupied:
        # Есть ли место до следующей занятой задачи?
        available_before = occ_start - current_hour - min_break_hours
        if available_before >= hours_needed:
            return (current_hour, current_hour + hours_needed)
        current_hour = occ_end + min_break_hours
    
    # Проверяем место после последней задачи
    available_after = work_end - current_hour
    if available_after >= hours_needed:
        return (current_hour, current_hour + hours_needed)
    
    return None


import logging
logger = logging.getLogger(__name__)

def _generate_slots_with_existing(
    subtasks: List[Subtask], 
    start_date: date, 
    due_date: date, 
    strategy: str, 
    speed: float,
    existing_tasks: List[Dict] = None,
    only_weekdays: bool = False,
    work_start: int = 9,
    work_end: int = 18,
    min_break: int = 15
) -> List[ScheduleSlot]:
    """Генерирует слоты задач с учетом существующих задач"""
    logger.info(f"Generating slots: subtasks={len(subtasks)}, start={start_date}, due={due_date}")
    
    slots = []
    occupied = _get_occupied_slots(existing_tasks or [], only_weekdays)
    current_date = start_date
    task_counter = 1
    
    for sub in subtasks:
        hours = max(sub.estimatedHours / speed, 0.25)
        remaining_hours = hours
        
        while remaining_hours > 0 and current_date <= due_date:
            # Пропускаем нерабочие дни если нужно
            while not _is_working_day(current_date, only_weekdays):
                current_date = _get_next_working_day(current_date, only_weekdays)
            
            if current_date > due_date:
                break
            
            if strategy == "sprinter":
                day_hours = min(remaining_hours, work_end - work_start - 1)  # Оставляем перерыв
            elif strategy == "balanced":
                days_left = max((due_date - current_date).days + 1, 1)
                day_hours = max(remaining_hours / days_left, 0.5)
            else:  # critical_path
                day_hours = min(remaining_hours, work_end - work_start - 2)
            
            # Ищем свободный слот в этот день
            free_slot = _find_free_slot(current_date, day_hours, occupied, work_start, work_end, min_break)
            
            if free_slot:
                start_hour, end_hour = free_slot
                start_time = _fmt_time(int(start_hour), start_hour % 1)
                end_time = _fmt_time(int(end_hour), end_hour % 1)
                
                slots.append(ScheduleSlot(
                    date=current_date,
                    startTime=start_time,
                    endTime=end_time,
                    taskId=task_counter,
                    taskTitle=sub.title if strategy != "critical_path" else f"[КРИТ] {sub.title}",
                    estimatedHours=round(day_hours, 2)
                ))
                
                # Добавляем в занятые слоты
                occupied.append((current_date, start_hour, end_hour))
                occupied.sort(key=lambda x: (x[0], x[1]))
                
                remaining_hours -= day_hours
            
            current_date = _get_next_working_day(current_date, only_weekdays)
        
        task_counter += 1
    
    return slots

def _generate_slots(subtasks: List[Subtask], start_date: date, due_date: date, strategy: str, speed: float) -> List[ScheduleSlot]:
    """Базовая генерация слотов (совместимость)"""
    return _generate_slots_with_existing(subtasks, start_date, due_date, strategy, speed, None)

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

    def generate_all_variants_with_existing(
        self,
        subtasks: List[Subtask],
        start_date: date,
        due_date: date,
        existing_tasks: List[Dict] = None,
        speed_factor: float = 1.0,
        only_weekdays: bool = False,
        work_start: int = 9,
        work_end: int = 18,
        min_break: int = 15
    ) -> List[ScheduleVariant]:
        """Генерирует варианты расписания с учетом существующих задач"""
        
        strategies = [
            ("sprinter", "Спринтер", "Максимальная интенсивность, ранний финиш"),
            ("balanced", "Равномерная нагрузка", "Стабильный темп без перегрузок"),
            ("critical_path", "Критический путь", "Приоритет сложным задачам + буфер")
        ]
        
        variants = []
        for key, name, desc in strategies:
            slots = _generate_slots_with_existing(
                subtasks, start_date, due_date, key, speed_factor,
                existing_tasks, only_weekdays, work_start, work_end, min_break
            )
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
        return scored[0][0] if scored else "balanced"

scheduler = Scheduler()