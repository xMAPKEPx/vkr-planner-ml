import re
from datetime import date, timedelta

def extract_deadline(text: str, default_due: date | None = None) -> date | None:
    text_lower = text.lower()
    today = date.today()
    
    # 1. Относительные даты ("завтра", "через неделю")
    if "завтра" in text_lower:
        return today + timedelta(days=1)
    if "через неделю" in text_lower:
        return today + timedelta(days=7)
    
    # "через N дней"
    match_days = re.search(r"через\s+(\d+)\s+дн", text_lower)
    if match_days:
        return today + timedelta(days=int(match_days.group(1)))

    # 2. Дни недели ("до пятницы", "к понедельнику")
    # Ищем паттерн "до <день_недели>"
    match_weekday = re.search(r"до\s+(понедельника|вторника|среды|четверга|пятницы|субботы|воскресенья|пн|вт|ср|чт|пт|сб|вс)", text_lower)
    if match_weekday:
        found_day = match_weekday.group(1)
        day_num = -1
        
        # Определяем номер дня (0 - Пн, ..., 4 - Пт)
        if "понедельник" in found_day or found_day == "пн": day_num = 0
        elif "вторник" in found_day or found_day == "вт": day_num = 1
        elif "сред" in found_day or found_day == "ср": day_num = 2
        elif "четверг" in found_day or found_day == "чт": day_num = 3
        elif "пятниц" in found_day or found_day == "пт": day_num = 4
        elif "суббот" in found_day or found_day == "сб": day_num = 5
        elif "воскресень" in found_day or found_day == "вс": day_num = 6
        
        if day_num != -1:
            # Считаем сколько дней до следующего такого дня недели
            days_ahead = day_num - today.weekday()
            if days_ahead <= 0: # Если день уже прошел на этой неделе
                days_ahead += 7
            return today + timedelta(days=days_ahead)

    # 3. Конкретные даты (ДД.ММ.ГГГГ)
    date_patterns = [
        r"(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})",
        r"(\d{4})-(\d{1,2})-(\d{1,2})"
    ]
    for pattern in date_patterns:
        match = re.search(pattern, text)
        if match:
            try:
                d, m, y = map(int, match.groups())
                if y < 100: y += 2000
                return date(y, m, d)
            except ValueError:
                continue
                
    return default_due

def estimate_complexity(text: str) -> float:
    text_lower = text.lower()
    base = 1.0
    words = text_lower.split()
    
    complexity_keywords = {
        "архитектура": 1.5, "оптимизация": 1.4, "рефакторинг": 1.3,
        "интеграция": 1.4, "тестирование": 1.2, "документация": 1.1,
        "дизайн": 1.3, "безопасность": 1.5, "миграт": 1.4
    }
    
    for word, factor in complexity_keywords.items():
        if word in text_lower:
            base += factor
            
    base += len(words) * 0.02
    return min(max(base, 1.0), 5.0)

def extract_keywords(text: str) -> list[str]:
    keywords = re.findall(r'\b[а-яА-Яa-zA-Z]{4,}\b', text)
    stop_words = {"задача", "сделать", "нужно", "проект", "работа", "этап", "план"}
    return [w.lower() for w in keywords if w.lower() not in stop_words][:10]