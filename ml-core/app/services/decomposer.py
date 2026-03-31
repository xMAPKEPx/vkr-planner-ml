from typing import List, Optional
from app.models.schemas import Subtask, DecompositionRequest
from app.utils import nlp
from app.services import templates

def decompose_task(
    title: str, 
    description: str = "", 
    category_id: Optional[int] = None,
    user_speed_factor: float = 1.0
) -> dict:
    """
    Основной метод декомпозиции (Раздел 2.1.3)
    Возвращает дерево подзадач + метаданные
    """
    full_text = f"{title} {description}"
    
    # 1. Определяем категорию по ключевым словам
    detected_category = nlp.detect_category(full_text)
    
    # 2. Получаем шаблон WBS
    template = templates.get_template_for_category(detected_category)
    
    # 3. Применяем коэффициент скорости пользователя (Раздел 3.3.1)
    adjusted_tasks = templates.apply_user_speed_factor(template, user_speed_factor)
    
    # 4. Формируем ответ
    subtasks = [
        Subtask(
            title=t['title'],
            description=f"Подзадача для: {title}",
            estimatedHours=t.get('estimatedHours'),
            order=i
        )
        for i, t in enumerate(adjusted_tasks)
    ]
    
    return {
        'subtasks': subtasks,
        'method': 'template',
        'category': detected_category,
        'confidence': 0.85,  # Высокая, т.к. используем шаблон
        'speedFactorApplied': user_speed_factor,
    }

def decompose_with_nlp(
    title: str, 
    description: str = "",
    user_speed_factor: float = 1.0
) -> dict:
    """
    Альтернативный метод: генерация подзадач на основе NLP
    (для задач без шаблона)
    """
    keywords = nlp.extract_keywords(f"{title} {description}")
    
    # Генерируем подзадачи на основе ключевых слов
    subtasks = [
        Subtask(
            title=f"Работа с: {kw.capitalize()}",
            description=f"Обработка элемента '{kw}'",
            estimatedHours=2.0 / user_speed_factor,
            order=i
        )
        for i, kw in enumerate(keywords[:5])  # Максимум 5 подзадач
    ]
    
    if not subtasks:
        subtasks = [
            Subtask(
                title="Анализ задачи",
                description="Изучение требований",
                estimatedHours=2.0,
                order=0
            ),
            Subtask(
                title="Реализация",
                description="Основная работа",
                estimatedHours=4.0,
                order=1
            ),
            Subtask(
                title="Проверка",
                description="Тестирование результата",
                estimatedHours=2.0,
                order=2
            ),
        ]
    
    return {
        'subtasks': subtasks,
        'method': 'nlp_keywords',
        'category': 'общая',
        'confidence': 0.65,  # Ниже, т.к. эвристика
        'speedFactorApplied': user_speed_factor,
    }