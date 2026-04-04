# app/services/finetuning.py
from typing import List, Dict
from collections import defaultdict
from app.services.ml_predictor import predictor  # Подключаем ML-модуль

# Хранилище ворк-логов в памяти (для демо). В продакшене -> PostgreSQL
user_worklogs: Dict[int, List[Dict]] = defaultdict(list)

def update_user_speed_factor(user_id: int, planned_hours: float, actual_hours: float) -> float:
    """
    Основная функция самообучения.
    Реализует п. 3.3.1 (статистика) + п. 2.1.6 (накопление данных для ML).
    """
    # 1. Сохраняем факт выполнения в лог
    user_worklogs[user_id].append({
        "planned": planned_hours,
        "actual": actual_hours
    })

    # 2. Статистический расчёт k_speed (формула из п. 3.3.1 ВКР)
    # Берём последние 20 задач, чтобы коэффициент реагировал на изменения в скорости
    logs = user_worklogs[user_id][-20:]
    n = len(logs)
    
    if n == 0:
        k_speed = 1.0
    else:
        # r_i = t_plan / t_fact
        ratio_sum = sum(log["planned"] / max(log["actual"], 0.1) for log in logs)
        k_speed = ratio_sum / n

    # Ограничиваем разумными рамками (0.5 - 2.0)
    k_speed = round(max(0.5, min(k_speed, 2.0)), 2)

    # 3. ML-часть: передаём данные в предиктор для накопления датасета
    # В реальном сценарии сюда можно передать title, description, category
    # Для демо используем плейсхолдер, но структура уже готова
    predictor.record_task(
        title=f"Task_{user_id}_{n}", 
        description=f"Planned: {planned_hours}h, Actual: {actual_hours}h",
        category="general",
        actual_hours=actual_hours
    )

    # 4. Пытаемся переобучить модель (если данных >= 10)
    predictor.retrain_model()

    return k_speed

def get_user_stats(user_id: int) -> dict:
    """Возвращает статистику пользователя без дублирования записи в лог"""
    logs = user_worklogs.get(user_id, [])
    if not logs:
        return {"tasksCompleted": 0, "k_speed": 1.0, "avg_mape": 0.0}

    # Считаем среднюю ошибку (MAPE)
    total_mape = sum(
        abs(l["planned"] - l["actual"]) / max(l["planned"], 0.1) * 100
        for l in logs
    )
    avg_mape = total_mape / len(logs)

    # Пересчитываем k_speed без добавления нового лога
    recent = logs[-20:]
    ratio_sum = sum(l["planned"] / max(l["actual"], 0.1) for l in recent)
    k_speed = round(max(0.5, min(ratio_sum / len(recent), 2.0)), 2)

    return {
        "tasksCompleted": len(logs),
        "k_speed": k_speed,
        "avg_mape": round(avg_mape, 2)
    }