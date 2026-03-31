from typing import List, Dict, Optional
from datetime import date, timedelta, datetime
from app.models.schemas import Subtask, ScheduleSlot, ScheduleVariant
import uuid

class ScheduleGenerator:
    """
    Генератор вариантов расписаний (Раздел 2.1.5 ВКР)
    Реализует 3 стратегии планирования
    """
    
    def __init__(self, availability: Optional[Dict] = None):
        # Доступность пользователя по дням (часы работы)
        self.availability = availability or {
            'monday': {'start': '09:00', 'end': '18:00', 'hours': 8},
            'tuesday': {'start': '09:00', 'end': '18:00', 'hours': 8},
            'wednesday': {'start': '09:00', 'end': '18:00', 'hours': 8},
            'thursday': {'start': '09:00', 'end': '18:00', 'hours': 8},
            'friday': {'start': '09:00', 'end': '18:00', 'hours': 8},
            'saturday': {'start': None, 'end': None, 'hours': 0},
            'sunday': {'start': None, 'end': None, 'hours': 0},
        }
    
    def _get_day_name(self, d: date) -> str:
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        return days[d.weekday()]
    
    def _get_available_hours(self, d: date) -> float:
        day_name = self._get_day_name(d)
        return self.availability.get(day_name, {}).get('hours', 0)
    
    def _calculate_metrics(self, slots: List[ScheduleSlot], start_date: date, due_date: date) -> dict:
        """Расчёт метрик качества расписания (Раздел 2.1.5)"""
        if not slots:
            return {'totalDays': 0, 'avgLoadPerDay': 0, 'riskScore': 1.0, 'completionDate': None}
        
        # Группировка по дням
        days_load = {}
        for slot in slots:
            day_key = slot.date.isoformat()
            days_load[day_key] = days_load.get(day_key, 0) + slot.estimatedHours
        
        total_days = len(days_load)
        avg_load = sum(days_load.values()) / total_days if total_days > 0 else 0
        
        # Риск перегрузки (если средний день > 6 часов)
        overload_days = sum(1 for load in days_load.values() if load > 6)
        risk_score = min(1.0, overload_days / total_days) if total_days > 0 else 1.0
        
        completion_date = max(slot.date for slot in slots) if slots else start_date
        
        return {
            'totalDays': total_days,
            'avgLoadPerDay': round(avg_load, 2),
            'riskScore': round(risk_score, 3),
            'completionDate': completion_date.isoformat(),
            'daysLoad': days_load,
        }
    
    def generate_sprinter(self, subtasks: List[Subtask], start_date: date, due_date: date, speed_factor: float = 1.0) -> ScheduleVariant:
        """
        Стратегия "Спринтер" (Раздел 2.1.5)
        Максимальная интенсивность, задача выполняется как можно быстрее
        """
        slots = []
        current_date = start_date
        task_index = 0
        
        while task_index < len(subtasks) and current_date <= due_date:
            day_hours = self._get_available_hours(current_date)
            if day_hours == 0:
                current_date += timedelta(days=1)
                continue
            
            hours_used_today = sum(s.estimatedHours for s in slots if s.date == current_date)
            remaining_today = day_hours - hours_used_today
            
            if remaining_today <= 0:
                current_date += timedelta(days=1)
                continue
            
            task = subtasks[task_index]
            task_hours = task.estimatedHours / speed_factor
            
            if task_hours <= remaining_today:
                # Задача помещается в сегодняшний слот
                slots.append(ScheduleSlot(
                    date=current_date,
                    startTime="09:00",
                    endTime=f"{int(9 + task_hours)}:00",
                    taskId=task_index,
                    taskTitle=task.title,
                    estimatedHours=round(task_hours, 2),
                ))
                task_index += 1
            else:
                # Задача не помещается целиком — разбиваем
                slots.append(ScheduleSlot(
                    date=current_date,
                    startTime="09:00",
                    endTime="18:00",
                    taskId=task_index,
                    taskTitle=f"{task.title} (часть 1)",
                    estimatedHours=round(remaining_today, 2),
                ))
                # Остаток задачи будет на следующий день
                subtasks[task_index].estimatedHours = task_hours - remaining_today
                current_date += timedelta(days=1)
        
        metrics = self._calculate_metrics(slots, start_date, due_date)
        
        return ScheduleVariant(
            id=str(uuid.uuid4()),
            name="Спринтер",
            description="Максимальная интенсивность. Задача будет выполнена как можно быстрее, но с высокой нагрузкой.",
            slots=slots,
            metrics=metrics,
            confidence=0.85,
        )
    
    def generate_balanced(self, subtasks: List[Subtask], start_date: date, due_date: date, speed_factor: float = 1.0) -> ScheduleVariant:
        """
        Стратегия "Равномерная нагрузка" (Раздел 2.1.5)
        Задачи распределяются равномерно по доступным дням
        """
        slots = []
        
        # Рассчитываем общую трудоёмкость
        total_hours = sum(t.estimatedHours / speed_factor for t in subtasks)
        days_available = 0
        current = start_date
        while current <= due_date:
            if self._get_available_hours(current) > 0:
                days_available += 1
            current += timedelta(days=1)
        
        if days_available == 0:
            days_available = 1
        
        # Целевая нагрузка в день
        target_hours_per_day = total_hours / days_available
        target_hours_per_day = min(target_hours_per_day, 4)  # Не больше 4 часов в день
        
        current_date = start_date
        task_index = 0
        hours_today = 0
        
        while task_index < len(subtasks) and current_date <= due_date:
            day_hours = self._get_available_hours(current_date)
            if day_hours == 0:
                current_date += timedelta(days=1)
                hours_today = 0
                continue
            
            if hours_today >= target_hours_per_day:
                current_date += timedelta(days=1)
                hours_today = 0
                continue
            
            task = subtasks[task_index]
            task_hours = task.estimatedHours / speed_factor
            remaining_slot = target_hours_per_day - hours_today
            
            if task_hours <= remaining_slot:
                slots.append(ScheduleSlot(
                    date=current_date,
                    startTime=f"{int(9 + hours_today)}:00",
                    endTime=f"{int(9 + hours_today + task_hours)}:00",
                    taskId=task_index,
                    taskTitle=task.title,
                    estimatedHours=round(task_hours, 2),
                ))
                hours_today += task_hours
                task_index += 1
            else:
                # Разбиваем задачу
                slots.append(ScheduleSlot(
                    date=current_date,
                    startTime=f"{int(9 + hours_today)}:00",
                    endTime=f"{int(9 + target_hours_per_day)}:00",
                    taskId=task_index,
                    taskTitle=f"{task.title} (часть 1)",
                    estimatedHours=round(remaining_slot, 2),
                ))
                subtasks[task_index].estimatedHours = task_hours - remaining_slot
                current_date += timedelta(days=1)
                hours_today = 0
        
        metrics = self._calculate_metrics(slots, start_date, due_date)
        
        return ScheduleVariant(
            id=str(uuid.uuid4()),
            name="Равномерная нагрузка",
            description="Стабильный темп работы без перегрузок. Рекомендуется для долгосрочных проектов.",
            slots=slots,
            metrics=metrics,
            confidence=0.90,
        )
    
    def generate_critical_path(self, subtasks: List[Subtask], start_date: date, due_date: date, speed_factor: float = 1.0) -> ScheduleVariant:
        """
        Стратегия "Фокус на критическом пути" (Раздел 2.1.5)
        Приоритет важным задачам, буфер времени на конец
        """
        slots = []
        
        # Сортируем задачи по оценке (сначала самые трудоёмкие — критические)
        sorted_tasks = sorted(subtasks, key=lambda t: t.estimatedHours, reverse=True)
        
        # Резервируем 20% времени на буфер
        buffer_factor = 0.8
        
        current_date = start_date
        task_index = 0
        
        while task_index < len(sorted_tasks) and current_date <= due_date:
            day_hours = self._get_available_hours(current_date) * buffer_factor
            if day_hours == 0:
                current_date += timedelta(days=1)
                continue
            
            hours_used_today = sum(s.estimatedHours for s in slots if s.date == current_date)
            remaining_today = day_hours - hours_used_today
            
            if remaining_today <= 0:
                current_date += timedelta(days=1)
                continue
            
            task = sorted_tasks[task_index]
            task_hours = task.estimatedHours / speed_factor
            
            if task_hours <= remaining_today:
                slots.append(ScheduleSlot(
                    date=current_date,
                    startTime="09:00",
                    endTime=f"{int(9 + task_hours)}:00",
                    taskId=task_index,
                    taskTitle=task.title,
                    estimatedHours=round(task_hours, 2),
                ))
                task_index += 1
            else:
                slots.append(ScheduleSlot(
                    date=current_date,
                    startTime="09:00",
                    endTime="18:00",
                    taskId=task_index,
                    taskTitle=f"{task.title} (часть 1)",
                    estimatedHours=round(remaining_today, 2),
                ))
                sorted_tasks[task_index].estimatedHours = task_hours - remaining_today
                current_date += timedelta(days=1)
        
        metrics = self._calculate_metrics(slots, start_date, due_date)
        
        return ScheduleVariant(
            id=str(uuid.uuid4()),
            name="Критический путь",
            description="Приоритет сложным задачам с буфером времени на непредвиденные обстоятельства.",
            slots=slots,
            metrics=metrics,
            confidence=0.80,
        )
    
    def generate_all_variants(self, subtasks: List[Subtask], start_date: date, due_date: date, speed_factor: float = 1.0) -> List[ScheduleVariant]:
        """Генерирует все 3 варианта расписания"""
        variants = [
            self.generate_sprinter(subtasks.copy(), start_date, due_date, speed_factor),
            self.generate_balanced(subtasks.copy(), start_date, due_date, speed_factor),
            self.generate_critical_path(subtasks.copy(), start_date, due_date, speed_factor),
        ]
        return variants
    
    def recommend_variant(self, variants: List[ScheduleVariant]) -> str:
        """
        Рекомендует лучший вариант на основе метрик (Раздел 2.1.5)
        Критерии: низкий риск, равномерная нагрузка, раннее завершение
        """
        if not variants:
            return ""
        
        # Простая эвристика: выбираем с наименьшим riskScore и хорошим avgLoad
        best = min(variants, key=lambda v: (v.metrics.get('riskScore', 1.0), -v.metrics.get('avgLoadPerDay', 0)))
        return best.id


# Экспорт экземпляра
scheduler = ScheduleGenerator()