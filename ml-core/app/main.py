from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models.schemas import (
    DecompositionRequest, DecompositionResponse,
    ScheduleGenerationRequest, ScheduleGenerationResponse
)
from app.services.decomposer import decompose_task, decompose_with_nlp
from app.services.scheduler import scheduler

app = FastAPI(
    title="ML Core for Task Planner",
    description="NLP-декомпозиция и генерация расписаний для ВКР",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ml-core"}

@app.post("/decompose", response_model=DecompositionResponse)
def decompose(request: DecompositionRequest):
    """Декомпозиция задачи на подзадачи (Раздел 2.1.3)"""
    try:
        if request.categoryId:
            result = decompose_task(
                title=request.title,
                description=request.description or "",
                category_id=request.categoryId,
                user_speed_factor=request.userSpeedFactor,
            )
        else:
            result = decompose_with_nlp(
                title=request.title,
                description=request.description or "",
                user_speed_factor=request.userSpeedFactor,
            )
        
        return DecompositionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/schedule/generate", response_model=ScheduleGenerationResponse)
def generate_schedule(request: ScheduleGenerationRequest):
    """
    Генерация НЕСКОЛЬКИХ вариантов расписаний (Раздел 2.1.5)
    """
    try:
        start_date = request.startDate or date.today()
        
        # Генерируем 3 варианта
        variants = scheduler.generate_all_variants(
            subtasks=request.subtasks,
            start_date=start_date,
            due_date=request.dueDate,
            speed_factor=request.userSpeedFactor,
        )
        
        # Рекомендация лучшего варианта
        recommended_id = scheduler.recommend_variant(variants)
        
        return ScheduleGenerationResponse(
            variants=variants,
            recommendedVariantId=recommended_id,
            generationMethod="multi-strategy",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/schedule/compare")
def compare_variants(variants: list):
    """Сравнение метрик вариантов расписания"""
    comparison = []
    for v in variants:
        comparison.append({
            'id': v['id'],
            'name': v['name'],
            'totalDays': v['metrics']['totalDays'],
            'avgLoadPerDay': v['metrics']['avgLoadPerDay'],
            'riskScore': v['metrics']['riskScore'],
            'completionDate': v['metrics']['completionDate'],
        })
    return {'comparison': comparison}

@app.get("/strategies")
def get_strategies():
    """Список доступных стратегий планирования (Раздел 2.1.5)"""
    return {
        'strategies': [
            {
                'id': 'sprinter',
                'name': 'Спринтер',
                'description': 'Максимальная интенсивность, быстрое выполнение',
                'bestFor': 'Срочные задачи с жёстким дедлайном',
            },
            {
                'id': 'balanced',
                'name': 'Равномерная нагрузка',
                'description': 'Стабильный темп без перегрузок',
                'bestFor': 'Долгосрочные проекты, профилактика выгорания',
            },
            {
                'id': 'critical_path',
                'name': 'Критический путь',
                'description': 'Приоритет сложным задачам + буфер времени',
                'bestFor': 'Задачи с высокой неопределённостью',
            },
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)