from typing import List, Dict
from app.models.schemas import Subtask

# Шаблоны WBS для категорий (Раздел 3.2.2)
WBS_TEMPLATES = {
    'разработка': [
        {'title': 'Изучить требования', 'hours': 2},
        {'title': 'Спроектировать архитектуру', 'hours': 3},
        {'title': 'Реализовать базовую функциональность', 'hours': 8},
        {'title': 'Написать тесты', 'hours': 4},
        {'title': 'Провести код-ревью', 'hours': 2},
        {'title': 'Деплой на staging', 'hours': 1},
    ],
    'тестирование': [
        {'title': 'Составить тест-план', 'hours': 2},
        {'title': 'Написать автотесты', 'hours': 6},
        {'title': 'Провести ручное тестирование', 'hours': 4},
        {'title': 'Завести баг-репорты', 'hours': 2},
        {'title': 'Проверить исправления', 'hours': 2},
    ],
    'документирование': [
        {'title': 'Собрать информацию', 'hours': 2},
        {'title': 'Написать черновик', 'hours': 4},
        {'title': 'Согласовать с заказчиком', 'hours': 2},
        {'title': 'Оформить финальную версию', 'hours': 2},
    ],
    'дизайн': [
        {'title': 'Анализ референсов', 'hours': 2},
        {'title': 'Создание прототипа', 'hours': 4},
        {'title': 'Отрисовка макетов', 'hours': 6},
        {'title': 'Согласование', 'hours': 2},
        {'title': 'Подготовка ассетов', 'hours': 2},
    ],
    'аналитика': [
        {'title': 'Сбор данных', 'hours': 3},
        {'title': 'Очистка и подготовка', 'hours': 4},
        {'title': 'Анализ и визуализация', 'hours': 5},
        {'title': 'Формирование выводов', 'hours': 2},
    ],
    'обучение': [
        {'title': 'Изучить теорию', 'hours': 4},
        {'title': 'Пройти практику', 'hours': 6},
        {'title': 'Выполнить проект', 'hours': 8},
        {'title': 'Подготовить отчёт', 'hours': 2},
    ],
}

def get_template_for_category(category: str) -> list:
    """Возвращает шаблон подзадач для категории"""
    return WBS_TEMPLATES.get(category, WBS_TEMPLATES['разработка'])

def apply_user_speed_factor(subtasks: list, speed_factor: float = 1.0) -> list:
    """Корректирует оценки времени с учётом speed_factor (Раздел 3.3.1)"""
    for task in subtasks:
        if 'hours' in task:
            # t_оценка = t_базовое ⋅ k_скорости
            task['estimatedHours'] = round(task['hours'] / speed_factor, 2)
    return subtasks