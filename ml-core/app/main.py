# ml-core/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import date, timedelta
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

# 🔥 НОВОЕ: Генерация расписания с учетом существующих задач
@app.post("/schedule/generate-with-existing", response_model=ScheduleGenerationResponse)
def generate_schedule_with_existing(request: dict):
    try:
        from datetime import datetime
        
        title = request.get('title', '')
        description = request.get('description', '')
        subtasks = request.get('subtasks', [])
        due_date_str = request.get('dueDate')
        existing_tasks = request.get('existingTasks', [])
        speed_factor = request.get('userSpeedFactor', 1.0)
        only_weekdays = request.get('onlyWeekdays', False)
        work_start = request.get('workingHours', {}).get('start', 9)
        work_end = request.get('workingHours', {}).get('end', 18)
        min_break = request.get('minBreakMinutes', 15)
        
        # Парсим даты
        start_date = date.today()
        due_date = datetime.fromisoformat(due_date_str).date() if due_date_str else date.today() + timedelta(days=7)
        
        # Преобразуем subtasks в объекты Subtask
        from app.models.schemas import Subtask as SubtaskModel
        subtask_objs = [
            SubtaskModel(
                title=s.get('title', ''),
                description=s.get('description'),
                estimatedHours=s.get('estimatedHours', 2.0),
                order=i
            )
            for i, s in enumerate(subtasks)
        ]
        
        variants = scheduler.generate_all_variants_with_existing(
            subtasks=subtask_objs,
            start_date=start_date,
            due_date=due_date,
            existing_tasks=existing_tasks,
            speed_factor=speed_factor,
            only_weekdays=only_weekdays,
            work_start=work_start,
            work_end=work_end,
            min_break=min_break
        )
        
        recommended_id = scheduler.recommend_variant(variants)
        
        return ScheduleGenerationResponse(
            variants=variants,
            recommendedVariantId=recommended_id,
            generationMethod="with-existing-conflicts",
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
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