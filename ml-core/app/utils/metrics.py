from datetime import date
from typing import List
from app.models.schemas import ScheduleSlot

def calculate_mape(planned_hours: float, actual_hours: float) -> float:
    """MAPE = |t_plan - t_fact| / t_plan * 100%"""
    if planned_hours == 0: return 0.0
    return abs(planned_hours - actual_hours) / planned_hours * 100.0

def calculate_variant_metrics(slots: List[ScheduleSlot]) -> dict:
    """Расчёт метрик варианта расписания"""
    if not slots:
        return {"totalDays": 0, "avgLoadPerDay": 0.0, "riskScore": 1.0, "completionDate": date.today()}
        
    dates = [s.date for s in slots]
    total_days = len(set(dates))
    completion_date = max(dates)
    
    daily_load = {}
    for s in slots:
        daily_load[s.date] = daily_load.get(s.date, 0) + s.estimatedHours
        
    avg_load = sum(daily_load.values()) / total_days if total_days else 0
    max_load = max(daily_load.values()) if daily_load else 0
    
    # Risk score: чем выше пиковая нагрузка и длиннее срок, тем выше риск
    risk = (max_load / 8.0) * 0.6 + (total_days / 30.0) * 0.4
    risk = min(max(risk, 0.1), 1.0)
    
    return {
        "totalDays": total_days,
        "avgLoadPerDay": round(avg_load, 2),
        "riskScore": round(risk, 2),
        "completionDate": completion_date.isoformat()
    }