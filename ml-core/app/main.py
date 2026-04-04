# ml-core/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import date
from app.models.schemas import (
    DecompositionRequest, DecompositionResponse,
    ScheduleGenerationRequest, ScheduleGenerationResponse
)
from app.services.decomposer import decompose_task, decompose_with_nlp
from app.services.scheduler import scheduler
from app.services.finetuning import update_user_speed_factor, get_user_stats

app = FastAPI(
    title="ML Core for Task Planner",
    description="NLP-декомпозиция, планирование и self-finetuning для ВКР",
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
    try:
        if request.categoryId:
            result = decompose_task(request)
        else:
            result = decompose_with_nlp(request)
        return DecompositionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/schedule/generate", response_model=ScheduleGenerationResponse)
def generate_schedule(request: ScheduleGenerationRequest):
    try:
        start_date = request.startDate or date.today()
        variants = scheduler.generate_all_variants(
            subtasks=request.subtasks,
            start_date=start_date,
            due_date=request.dueDate,
            speed_factor=request.userSpeedFactor,
        )
        recommended_id = scheduler.recommend_variant(variants)
        return ScheduleGenerationResponse(
            variants=variants,
            recommendedVariantId=recommended_id,
            generationMethod="multi-strategy",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 🔥 НОВЫЙ ЭНДПОИНТ: Self-finetuning (п. 3.3.1 ВКР)
@app.post("/finetune/update")
def finetune(user_id: int, planned_hours: float, actual_hours: float):
    try:
        k_speed = update_user_speed_factor(user_id, planned_hours, actual_hours)
        stats = get_user_stats(user_id)
        return {
            "success": True,
            "k_speed": k_speed,
            "stats": stats,
            "message": "Коэффициент скорости обновлён. Система адаптируется под ваш темп."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/finetune/stats/{user_id}")
def get_stats(user_id: int):
    return get_user_stats(user_id)

@app.get("/strategies")
def get_strategies():
    return {
        'strategies': [
            {'id': 'sprinter', 'name': 'Спринтер', 'description': 'Максимальная интенсивность, быстрое выполнение'},
            {'id': 'balanced', 'name': 'Равномерная нагрузка', 'description': 'Стабильный темп без перегрузок'},
            {'id': 'critical_path', 'name': 'Критический путь', 'description': 'Приоритет сложным задачам + буфер времени'},
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)