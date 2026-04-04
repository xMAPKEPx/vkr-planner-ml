import math
from app.models.schemas import Subtask, DecompositionRequest, DecompositionResponse
from app.services.templates import get_template
from app.utils.nlp import extract_deadline, estimate_complexity, extract_keywords

def decompose_task(request: DecompositionRequest) -> dict:
    """Декомпозиция по шаблону категории"""
    category_name = str(request.categoryId) if request.categoryId else "general"
    
    template = get_template(request.categoryId)
    speed = request.userSpeedFactor or 1.0
    
    adjusted = []
    for i, sub in enumerate(template):
        adjusted.append(Subtask(
            title=sub.title,
            description=sub.description,
            estimatedHours=round(sub.estimatedHours / speed, 2),
            order=i+1,
            parentId=None
        ))
        
    return {
        "subtasks": adjusted,
        "method": "template_wbs",
        "category": category_name,
        "confidence": 0.85
    }

def decompose_with_nlp(request: DecompositionRequest) -> dict:
    """NLP-декомпозиция: парсинг текста + эвристики + шаблон"""
    text = f"{request.title} {request.description or ''}"
    complexity = estimate_complexity(text)
    keywords = extract_keywords(text)
    base_template = get_template(request.categoryId)
    speed = request.userSpeedFactor or 1.0
    
    if len(text) > 150 or complexity > 2.5:
        extra_tasks = [
            Subtask(title="Уточнение требований", estimatedHours=1.5, order=0),
            Subtask(title="Риск-менеджмент", estimatedHours=1.0, order=len(base_template)+1)
        ]
        base_template = extra_tasks + base_template
        
    adjusted = []
    for i, sub in enumerate(base_template):
        hours = sub.estimatedHours / speed
        if complexity > 2.0:
            hours *= 1.2
            
        adjusted.append(Subtask(
            title=sub.title,
            description=f"Ключевые слова: {', '.join(keywords[:3])}" if i == 0 else None,
            estimatedHours=round(hours, 2),
            order=i+1,
            parentId=None
        ))
        
    conf = 0.6
    if request.dueDate: conf += 0.15
    if len(text) > 50: conf += 0.15
    if complexity < 3.0: conf += 0.1
    
    category_name = str(request.categoryId) if request.categoryId else "auto_detected"

    parsed_deadline = extract_deadline(f"{request.title} {request.description or ''}", request.dueDate)
    
    return {
        "subtasks": adjusted,
        "method": "nlp_enhanced_wbs",
        "category": category_name,
        "confidence": round(min(conf, 0.95), 2),
        "parsedDeadline": parsed_deadline.isoformat() if parsed_deadline else None,
    }