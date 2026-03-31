import re
from typing import List, Dict

# Простой словарь ключевых слов для категорий (Раздел 2.1.3)
KEYWORDS = {
    'разработка': ['код', 'функция', 'api', 'backend', 'frontend', 'реализовать', 'разработать'],
    'тестирование': ['тест', 'проверка', 'баг', 'ошибка', 'отладка', 'qa'],
    'документирование': ['документ', 'описание', 'инструкция', 'readme', 'документация'],
    'дизайн': ['макет', 'дизайн', 'ui', 'ux', 'визуал', 'интерфейс'],
    'аналитика': ['анализ', 'исследование', 'метрики', 'данные', 'отчёт'],
    'обучение': ['изучить', 'курс', 'материал', 'лекция', 'практика'],
}

def detect_category(text: str) -> str:
    """Определяет категорию задачи по ключевым словам"""
    text_lower = text.lower()
    scores = {}
    
    for category, keywords in KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        scores[category] = score
    
    if max(scores.values()) == 0:
        return 'общая'
    
    return max(scores, key=scores.get)

def extract_keywords(text: str) -> List[str]:
    """Извлекает значимые слова из текста"""
    # Удаляем стоп-слова и спецсимволы
    stop_words = {'и', 'в', 'во', 'не', 'что', 'как', 'для', 'на', 'по', 'с', 'к', 'или', 'но', 'а'}
    words = re.findall(r'\b\w+\b', text.lower())
    return [w for w in words if w not in stop_words and len(w) > 3]