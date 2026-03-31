import axios from 'axios';

const ML_CORE_URL = process.env.ML_CORE_URL || 'http://localhost:8000';

export interface ISubtask {
  title: string;
  description?: string;
  estimatedHours?: number;
  order: number;
}

export interface IDecompositionResult {
  subtasks: ISubtask[];
  method: string;
  confidence: number;
  category?: string;
}

export class MLService {
  // Декомпозиция задачи через ML-Core (Раздел 2.1.3)
  async decomposeTask(
    title: string,
    description?: string,
    categoryId?: number,
    speedFactor?: number
  ): Promise<IDecompositionResult> {
    try {
      const endpoint = speedFactor 
        ? '/decompose/personalized' 
        : '/decompose';
      
      const params = speedFactor ? { speed_factor: speedFactor } : {};
      
      const response = await axios.post(
        `${ML_CORE_URL}${endpoint}`,
        {
          title,
          description: description || '',
          categoryId: categoryId || null,
        },
        { params }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('ML-Core error:', error.message);
      
      // Fallback: возвращаем минимальную декомпозицию
      return {
        subtasks: [
          { title: 'Анализ задачи', order: 0, estimatedHours: 2 },
          { title: 'Реализация', order: 1, estimatedHours: 4 },
          { title: 'Проверка', order: 2, estimatedHours: 2 },
        ],
        method: 'fallback',
        confidence: 0.5,
      };
    }
  }

  // Проверка доступности ML-Core
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${ML_CORE_URL}/health`);
      return response.data.status === 'ok';
    } catch {
      return false;
    }
  }
}

export const mlService = new MLService();