import axios from 'axios';

const ML_CORE_URL = process.env.ML_CORE_URL || 'http://localhost:8000';

export interface IScheduleSlot {
  date: string;
  startTime: string;
  endTime: string;
  taskId: number;
  taskTitle: string;
  estimatedHours: number;
}

export interface IScheduleVariant {
  id: string;
  name: string;
  description: string;
  slots: IScheduleSlot[];
  metrics: {
    totalDays: number;
    avgLoadPerDay: number;
    riskScore: number;
    completionDate: string;
  };
  confidence: number;
}

export interface IScheduleGenerationResult {
  variants: IScheduleVariant[];
  recommendedVariantId: string;
  generationMethod: string;
}

export class ScheduleService {
  // Генерация вариантов расписаний (Раздел 2.1.5)
  async generateScheduleVariants(
    subtasks: any[],
    userId: number,
    dueDate: string,
    speedFactor?: number,
    startDate?: string
  ): Promise<IScheduleGenerationResult> {
    try {
      const response = await axios.post(`${ML_CORE_URL}/schedule/generate`, {
        subtasks,
        userId,
        dueDate,
        userSpeedFactor: speedFactor || 1.0,
        startDate: startDate || new Date().toISOString().split('T')[0],
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Schedule generation error:', error.message);
      
      // Fallback: возвращаем один базовый вариант
      return {
        variants: [
          {
            id: 'fallback-1',
            name: 'Базовый план',
            description: 'Автоматически сгенерированный план',
            slots: [],
            metrics: { totalDays: 0, avgLoadPerDay: 0, riskScore: 0.5, completionDate: dueDate },
            confidence: 0.5,
          },
        ],
        recommendedVariantId: 'fallback-1',
        generationMethod: 'fallback',
      };
    }
  }

  // Получить доступные стратегии
  async getStrategies(): Promise<any> {
    try {
      const response = await axios.get(`${ML_CORE_URL}/strategies`);
      return response.data;
    } catch {
      return { strategies: [] };
    }
  }
}

export const scheduleService = new ScheduleService();