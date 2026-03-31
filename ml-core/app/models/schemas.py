from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime, date

class Subtask(BaseModel):
    title: str
    description: Optional[str] = None
    estimatedHours: float = 2.0
    order: int = 0
    parentId: Optional[int] = None

class ScheduleSlot(BaseModel):
    date: date
    startTime: str  # "09:00"
    endTime: str    # "11:00"
    taskId: int
    taskTitle: str
    estimatedHours: float

class ScheduleVariant(BaseModel):
    id: str
    name: str  # "Спринтер", "Равномерная нагрузка", "Критический путь"
    description: str
    slots: List[ScheduleSlot]
    metrics: dict  # {totalDays, avgLoadPerDay, riskScore, completionDate}
    confidence: float

class DecompositionRequest(BaseModel):
    title: str
    description: Optional[str] = None
    categoryId: Optional[int] = None
    dueDate: Optional[date] = None
    userId: Optional[int] = None
    userSpeedFactor: float = 1.0
    availability: Optional[dict] = None  # {monday: {start: "09:00", end: "18:00"}, ...}

class DecompositionResponse(BaseModel):
    subtasks: List[Subtask]
    method: str
    category: str
    confidence: float

class ScheduleGenerationRequest(BaseModel):
    subtasks: List[Subtask]
    userId: int
    dueDate: date
    userSpeedFactor: float = 1.0
    availability: Optional[dict] = None
    startDate: Optional[date] = None

class ScheduleGenerationResponse(BaseModel):
    variants: List[ScheduleVariant]
    recommendedVariantId: str
    generationMethod: str