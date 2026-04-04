// src/lib/api.ts
import axios from 'axios';
import { Task, WorkLogEntry } from '@/types';

// ==================== НАСТРОЙКА AXIOS ====================
export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    headers: {
        'Content-Type': 'application/json',
    },
    // Для отладки: показывать запросы в консоли
    // adapter: process.env.NODE_ENV === 'development' ? 'xhr' : undefined,
});

// Интерцептор для добавления токена (если есть аутентификация)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ==================== МОКОВЫЕ ДАННЫЕ (для разработки) ====================
// В продакшене эти данные будут приходить с бэкенда

const INITIAL_MOCK_TASKS: Task[] = [
    {
        id: 'task-1',
        title: 'Проектирование БД',
        description:
            'Спроектировать структуру базы данных для модуля пользователей',
        estimatedDuration: 120,
        startDate: new Date(2026, 3, 4, 10, 0).toISOString(),
        endDate: new Date(2026, 3, 4, 12, 0).toISOString(),
        status: 'in_progress',
        userId: 'user-1',
        category: 'development',
        assignee: 'Иван Иванов',
    },
    {
        id: 'task-2',
        title: 'Code review',
        description: 'Проверить PR #42 по модулю авторизации',
        estimatedDuration: 45,
        startDate: new Date(2026, 3, 4, 14, 0).toISOString(),
        endDate: new Date(2026, 3, 4, 14, 45).toISOString(),
        status: 'todo',
        userId: 'user-1',
        category: 'review',
        assignee: 'Анна Петрова',
    },
    {
        id: 'task-3',
        title: 'Спринт планирование',
        description: 'Планирование задач на следующий спринт',
        estimatedDuration: 90,
        startDate: new Date(2026, 3, 5, 11, 0).toISOString(),
        endDate: new Date(2026, 3, 5, 12, 30).toISOString(),
        status: 'todo',
        userId: 'user-1',
        category: 'management',
        assignee: 'Команда',
    },
];

// Локальное хранилище (не экспортируем напрямую!)
let mockTasks: Task[] = [...INITIAL_MOCK_TASKS];

// Хранилище для self-finetuning метрик
let userMetrics = {
    speedFactor: 1.0,
    mape: null as number | null,
    completedTasks: 0,
};

// Утилита для эмуляции задержки сети
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Утилита для генерации уникального ID
const generateId = () =>
    `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ==================== API МЕТОДЫ ====================

/**
 * Интерфейс для параметров запроса задач
 */
interface GetTasksParams {
    context?: 'personal' | 'project';
    projectId?: string;
    userId?: string;
    status?: Task['status'][];
}

/**
 * Интерфейс ответа от API при завершении задачи
 * Соответствует алгоритму self-finetuning из п. 3.3.1 ВКР
 */
export interface CompleteTaskResponse {
    success: boolean;
    taskId: string;
    newSpeedFactor?: number;
    mape?: number;
    message?: string;
}

export const tasksApi = {
    /**
     * Получить все задачи с фильтрацией
     * Реализует сценарий из п. 2.1.2 и 2.2 ВКР
     */
    getAll: async (params?: GetTasksParams): Promise<Task[]> => {
        // Эмуляция задержки сети
        await delay(300);

        // В реальном приложении здесь будет:
        // const response = await api.get<Task[]>('/tasks', { params });
        // return response.data;

        // Фильтрация моковых данных (для демонстрации)
        let filtered = [...mockTasks];

        if (params?.userId) {
            filtered = filtered.filter((t) => t.userId === params.userId);
        }

        if (params?.status?.length) {
            filtered = filtered.filter((t) =>
                params.status!.includes(t.status),
            );
        }

        if (params?.context === 'project' && params?.projectId) {
            filtered = filtered.filter((t) => t.projectId === params.projectId);
        }

        // Возвращаем глубокую копию (чтобы избежать мутаций)
        return JSON.parse(JSON.stringify(filtered));
    },

    /**
     * Получить задачу по ID
     */
    getById: async (taskId: string): Promise<Task | null> => {
        await delay(200);

        // В реальном приложении:
        // const response = await api.get<Task>(`/tasks/${taskId}`);
        // return response.data;

        const task = mockTasks.find((t) => t.id === taskId);
        return task ? JSON.parse(JSON.stringify(task)) : null;
    },

    /**
     * Создать новую задачу
     * Реализует ввод задачи из п. 2.1.2 ВКР (ручной или NLP-режим)
     */
    create: async (taskData: Partial<Task>): Promise<Task> => {
        await delay(500);

        // В реальном приложении:
        // const response = await api.post<Task>('/tasks', taskData);
        // return response.data;

        // Создаём СОВЕРШЕННО НОВЫЙ объект (иммутабельно)
        const newTask: Task = {
            id: generateId(),
            title: taskData.title || 'Новая задача',
            description: taskData.description || '',
            estimatedDuration: taskData.estimatedDuration || 60,
            startDate: taskData.startDate || new Date().toISOString(),
            endDate:
                taskData.endDate ||
                new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            status: taskData.status || 'todo',
            userId: taskData.userId || 'user-1',
            category: taskData.category || 'general',
            assignee: taskData.assignee,
            projectId: taskData.projectId,
            actualDuration: undefined,
        };

        // Добавляем копию в локальное хранилище
        mockTasks = [...mockTasks, { ...newTask }];

        // Возвращаем копию
        return { ...newTask };
    },

    /**
     * Обновить задачу
     * Используется для drag-and-drop, редактирования и т.д.
     */
    update: async (taskId: string, updates: Partial<Task>): Promise<Task> => {
        await delay(300);

        // В реальном приложении:
        // const response = await api.patch<Task>(`/tasks/${taskId}`, updates);
        // return response.data;

        const index = mockTasks.findIndex((t) => t.id === taskId);
        if (index === -1) {
            throw new Error(`Task with id ${taskId} not found`);
        }

        // Создаём обновлённую копию
        const updatedTask = { ...mockTasks[index], ...updates };
        mockTasks = [
            ...mockTasks.slice(0, index),
            updatedTask,
            ...mockTasks.slice(index + 1),
        ];

        return { ...updatedTask };
    },

    /**
     * Удалить задачу
     */
    delete: async (taskId: string): Promise<{ success: boolean }> => {
        await delay(200);

        // В реальном приложении:
        // await api.delete(`/tasks/${taskId}`);
        // return { success: true };

        const index = mockTasks.findIndex((t) => t.id === taskId);
        if (index === -1) {
            throw new Error(`Task with id ${taskId} not found`);
        }

        mockTasks = mockTasks.filter((t) => t.id !== taskId);
        return { success: true };
    },

    /**
     * Завершить задачу с фиксацией фактического времени (WorkLog)
     *
     * 🔥 КЛЮЧЕВОЙ МЕТОД для self-finetuning (п. 3.3.1 ВКР)
     *
     * Алгоритм:
     * 1. Сохраняем факт выполнения в БД
     * 2. Вычисляем MAPE (Mean Absolute Percentage Error)
     * 3. Пересчитываем коэффициент скорости пользователя:
     *    k_скорости = (1/N) * Σ(t_план / t_факт)
     * 4. Обновляем профиль пользователя для будущих прогнозов
     */
    complete: async (workLog: WorkLogEntry): Promise<CompleteTaskResponse> => {
        await delay(500);

        // В реальном приложении:
        // const response = await api.post<CompleteTaskResponse>('/tasks/complete', workLog);
        // return response.data;

        // 1. Находим задачу и обновляем статус
        const taskIndex = mockTasks.findIndex((t) => t.id === workLog.taskId);
        if (taskIndex === -1) {
            throw new Error(`Task with id ${workLog.taskId} not found`);
        }

        mockTasks = mockTasks.map((task) =>
            task.id === workLog.taskId
                ? {
                      ...task,
                      status: 'done' as const,
                      actualDuration: workLog.actualDuration,
                  }
                : task,
        );

        // 2. Self-finetuning: вычисляем метрики (алгоритм из п. 3.3.1 ВКР)

        // MAPE = |t_план - t_факт| / t_план * 100%
        const mape =
            Math.abs(
                (workLog.plannedDuration - workLog.actualDuration) /
                    workLog.plannedDuration,
            ) * 100;

        // Отношение план/факт для расчёта скорости
        const ratio = workLog.plannedDuration / workLog.actualDuration;

        // Обновляем скользящее среднее коэффициента скорости
        // (в реальности это делается на основе последних N задач)
        const alpha = 0.1; // коэффициент сглаживания
        const newSpeedFactor =
            userMetrics.speedFactor * (1 - alpha) + ratio * alpha;

        // Обновляем локальные метрики
        userMetrics = {
            speedFactor: parseFloat(newSpeedFactor.toFixed(2)),
            mape: parseFloat(mape.toFixed(1)),
            completedTasks: userMetrics.completedTasks + 1,
        };

        // 3. Логируем для отладки (в консоли разработчика)
        console.log('📊 WorkLog зафиксирован:', {
            taskId: workLog.taskId,
            planned: workLog.plannedDuration,
            actual: workLog.actualDuration,
            mape: `${mape.toFixed(1)}%`,
            newSpeedFactor: userMetrics.speedFactor,
        });

        // 4. Возвращаем результат с обновлёнными метриками
        const mapeValue = userMetrics.mape ?? undefined;
        const accuracy =
            userMetrics.mape !== null
                ? (100 - userMetrics.mape).toFixed(1)
                : 'N/A';

        return {
            success: true,
            taskId: workLog.taskId,
            newSpeedFactor: userMetrics.speedFactor,
            mape: mapeValue,
            message: `Задача завершена. Точность прогноза: ${accuracy}%`,
        };
    },

    /**
     * Получить статистику пользователя для отображения в интерфейсе
     * Используется для демонстрации self-finetuning комиссии
     */
    getUserStats: async (
        userId: string,
    ): Promise<{
        totalTasks: number;
        completedTasks: number;
        avgAccuracy: number;
        speedFactor: number;
    }> => {
        await delay(200);

        // В реальном приложении:
        // const response = await api.get(`/users/${userId}/stats`);
        // return response.data;

        const userTasks = mockTasks.filter((t) => t.userId === userId);
        const completed = userTasks.filter((t) => t.status === 'done');

        return {
            totalTasks: userTasks.length,
            completedTasks: completed.length,
            avgAccuracy:
                userMetrics.mape !== null ? 100 - userMetrics.mape : 100,
            speedFactor: userMetrics.speedFactor,
        };
    },

    /**
     * Сбросить моковые данные (для тестирования)
     * Только для разработки!
     */
    __resetMocks: () => {
        mockTasks = [...INITIAL_MOCK_TASKS];
        userMetrics = {
            speedFactor: 1.0,
            mape: null,
            completedTasks: 0,
        };
        console.log('🔄 Mock data reset');
    },
};

// ==================== ЭКСПОРТЫ ДЛЯ ДРУГИХ МОДУЛЕЙ ====================
export type { GetTasksParams };
export { userMetrics }; // Экспортируем для отображения в UI (опционально)
