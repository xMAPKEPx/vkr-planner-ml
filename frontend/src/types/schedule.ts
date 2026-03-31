export interface ScheduleSlot {
  date: string;
  startTime: string;
  endTime: string;
  taskId: number;
  taskTitle: string;
  estimatedHours: number;
}

export interface ScheduleVariant {
  id: string;
  name: string;
  description: string;
  slots: ScheduleSlot[];
  metrics: {
    totalDays: number;
    avgLoadPerDay: number;
    riskScore: number;
    completionDate: string;
  };
  confidence: number;
}

export interface ScheduleGenerationResponse {
  variants: ScheduleVariant[];
  recommendedVariantId: string;
  generationMethod: string;
}

export interface DecompositionRequest {
  title: string;
  description?: string;
  categoryId?: number;
  dueDate?: string;
  userId?: number;
  userSpeedFactor?: number;
}