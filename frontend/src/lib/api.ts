// lib/api.ts
import axios from 'axios';
import { Task, WorkLogEntry } from '@/types';

// Создаем axios инстанс
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// МОКОВЫЕ ДАННЫЕ (пока нет реального бэкенда)
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Проектирование БД',
    description: 'Спроектировать структуру базы данных',
    estimatedDuration: 120,
    startDate: new Date(2026, 3, 4, 10, 0),
    endDate: new Date(2026, 3, 4, 12, 0),
    status: 'in_progress',
    userId: 'user-1',
    category: 'development',
  },
];

// Эмуляция задержки сети
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API методы (ПОТОМ ЗАМЕНИМ НА РЕАЛЬНЫЕ ВЫЗОВЫ)
export const tasksApi = {
  // Получить все задачи
  getAll: async (): Promise<Task[]> => {
    await delay(300); // эмуляция запроса
    return mockTasks;
  },

  // Создать задачу
  create: async (taskData: Partial<Task>): Promise<Task> => {
    await delay(500);
    const newTask: Task = {
      id: Date.now().toString(),
      title: taskData.title || 'Новая задача',
      description: taskData.description,
      estimatedDuration: taskData.estimatedDuration || 60,
      startDate: taskData.startDate || new Date(),
      endDate: taskData.endDate || new Date(),
      status: 'todo',
      userId: taskData.userId || 'user-1',
      category: taskData.category,
    };
    mockTasks.push(newTask);
    return newTask;
  },

  // Завершить задачу (с фиксацией WorkLog)
  complete: async (workLog: WorkLogEntry): Promise<{ success: boolean; newSpeedFactor?: number; mape?: number; }> => {
    await delay(500);
    
    // Обновляем задачу
    const task = mockTasks.find(t => t.id === workLog.taskId);
    if (task) {
      task.status = 'done';
      task.actualDuration = workLog.actualDuration;
    }

    // Здесь потом будет реальный вызов бэкенда
    // который запустит self-finetuning алгоритм
    console.log('📊 WorkLog отправлен:', workLog);
    console.log('🤖 Запускаем пересчет коэффициента скорости...');
    
    // Эмуляция ответа от ML-core
    const newSpeedFactor = 1.0 + (Math.random() * 0.2 - 0.1);
    
    return {
      success: true,
      newSpeedFactor,
      mape: 12.5,
    };
  },

  // Получить статистику пользователя
  getUserStats: async (userId: string) => {
    await delay(300);
    return {
      totalTasks: mockTasks.filter(t => t.userId === userId).length,
      completedTasks: mockTasks.filter(t => t.userId === userId && t.status === 'done').length,
      avgAccuracy: 85, // MAPE из ВКР
    };
  },
};