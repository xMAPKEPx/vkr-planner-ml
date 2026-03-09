from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import random

app = FastAPI(title="ML Core API", version="1.0.0")

# 🔥 Добавь CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js frontend
        "http://localhost:3001",  # Backend API (если нужно)
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Разрешаем все HTTP методы
    allow_headers=["*"],  # Разрешаем все заголовки
)

# Модели данных
class TaskData(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str
    estimated_hours: Optional[float] = None

class PredictionResponse(BaseModel):
    predicted_hours: float
    confidence: float
    priority_recommendation: str

class WorkLogData(BaseModel):
    task_id: int
    actual_hours: float
    estimated_hours: float

# Health check
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ml-core"}

# Прогноз времени выполнения (заглушка для начала)
@app.post("/predict", response_model=PredictionResponse)
def predict_task_time(task: TaskData):
    # TODO: Здесь будет ML модель (раздел 2.1.5 ВКР)
    # Сейчас простая заглушка
    base_hours = random.uniform(1.0, 8.0)
    priority_multiplier = {"LOW": 0.8, "MEDIUM": 1.0, "HIGH": 1.2}
    
    predicted = base_hours * priority_multiplier.get(task.priority, 1.0)
    
    return PredictionResponse(
        predicted_hours=round(predicted, 2),
        confidence=0.75,
        priority_recommendation=task.priority
    )

# Self-finetuning: сбор обратной связи
@app.post("/feedback")
def collect_feedback(log: WorkLogData):
    # TODO: Здесь будет логика дообучения модели
    # Сохраняем данные для последующего fine-tuning
    print(f"Feedback received: Task {log.task_id}, Actual: {log.actual_hours}, Estimated: {log.estimated_hours}")
    return {"status": "feedback recorded"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)