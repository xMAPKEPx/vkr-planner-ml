from app.models.schemas import Subtask

WBS_TEMPLATES = {
    "development": [
        Subtask(title="Анализ требований", estimatedHours=2.0, order=1),
        Subtask(title="Проектирование архитектуры", estimatedHours=4.0, order=2),
        Subtask(title="Реализация кода", estimatedHours=8.0, order=3),
        Subtask(title="Тестирование и отладка", estimatedHours=3.0, order=4),
        Subtask(title="Документирование", estimatedHours=1.5, order=5),
    ],
    "design": [
        Subtask(title="Сбор референсов", estimatedHours=1.5, order=1),
        Subtask(title="Прототипирование", estimatedHours=3.0, order=2),
        Subtask(title="Визуальный дизайн", estimatedHours=6.0, order=3),
        Subtask(title="Адаптация и экспорт", estimatedHours=2.0, order=4),
    ],
    "research": [
        Subtask(title="Обзор литературы/аналогов", estimatedHours=3.0, order=1),
        Subtask(title="Формулировка гипотез", estimatedHours=2.0, order=2),
        Subtask(title="Эксперимент/анализ данных", estimatedHours=6.0, order=3),
        Subtask(title="Оформление отчёта", estimatedHours=2.5, order=4),
    ]
}

DEFAULT_TEMPLATE = [
    Subtask(title="Подготовка и планирование", estimatedHours=2.0, order=1),
    Subtask(title="Основная работа", estimatedHours=6.0, order=2),
    Subtask(title="Проверка и сдача", estimatedHours=2.0, order=3),
]

def get_template(category: int | str | None) -> list[Subtask]:
    # Безопасное приведение к строке для поиска ключевых слов
    cat_str = str(category).lower() if category is not None else ""
    if "dev" in cat_str or "разраб" in cat_str: return WBS_TEMPLATES["development"]
    if "design" in cat_str or "дизайн" in cat_str: return WBS_TEMPLATES["design"]
    if "research" in cat_str or "исслед" in cat_str: return WBS_TEMPLATES["research"]
    return DEFAULT_TEMPLATE