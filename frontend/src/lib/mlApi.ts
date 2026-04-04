import axios from 'axios';

// Создаем инстанс для ML-Core
const mlApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Типизация ответа от ML-Core
export interface MLSubtask {
  title: string;
  description?: string | null;
  estimatedHours: number;
  order: number;
}

export interface DecomposeResponse {
  subtasks: MLSubtask[];
  method: string;
  category: string;
  confidence: number;
  parsedDeadline?: string | null;
}

// Функция декомпозиции
export const decomposeTask = async (
  title: string,
  description: string,
  categoryId: number | null,
  userSpeedFactor: number = 1.0
): Promise<DecomposeResponse> => {
  try {
    const response = await mlApi.post<DecomposeResponse>('/decompose', {
      title,
      description,
      categoryId, // null запускает NLP-режим
      userId: 1, // Пока хардкод, потом из auth
      userSpeedFactor,
    });
    return response.data;
  } catch (error) {
    console.error('❌ ML-Core API Error:', error);
    throw new Error('Ошибка связи с ML-сервером');
  }
};