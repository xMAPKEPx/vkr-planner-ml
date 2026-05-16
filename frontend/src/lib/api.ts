// src/lib/api.ts
import axios from 'axios';
import { Task, WorkLogEntry, User } from '@/types';

// ==================== НАСТРОЙКА AXIOS ====================
export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Интерцептор для добавления токена
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ==================== МОКОВЫЕ ДАННЫЕ (для разработки) ====================
// 🔥 Исправлено: id теперь number, как в типах

const INITIAL_MOCK_TASKS: Task[] = [
    {
        id: 1,
        title: 'Проектирование БД',
        description: 'Спроектировать структуру базы данных для модуля пользователей',
        estimatedDuration: 120,
        startDate: new Date(2026, 3, 4, 10, 0).toISOString(),
        endDate: new Date(2026, 3, 4, 12, 0).toISOString(),
        status: 'in_progress',
        userId: 1,
        category: 'development',
        assignee: 1,
        subtasks: [],
    },
    {
        id: 2,
        title: 'Code review',
        description: 'Проверить PR #42 по модулю авторизации',
        estimatedDuration: 45,
        startDate: new Date(2026, 3, 4, 14, 0).toISOString(),
        endDate: new Date(2026, 3, 4, 14, 45).toISOString(),
        status: 'todo',
        userId: 1,
        category: 'review',
        assignee: 2,
        subtasks: [],
    },
];

let mockTasks: Task[] = [...INITIAL_MOCK_TASKS];

let userMetrics = {
    speedFactor: 1.0,
    mape: null as number | null,
    completedTasks: 0,
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let nextMockId = 100;

// ==================== API МЕТОДЫ ====================

interface GetTasksParams {
    context?: 'personal' | 'project';
    projectId?: number;
    userId?: number;
    status?: Task['status'][];
}

export interface CompleteTaskResponse {
    success: boolean;
    taskId: number;
    newSpeedFactor?: number;
    mape?: number;
    message?: string;
}

export const tasksApi = {
    getAll: async (params?: GetTasksParams): Promise<Task[]> => {
        await delay(300);
        
        // 🔥 Реальный запрос к бэкенду (раскомментируйте для продакшена):
        // const response = await api.get<Task[]>('/tasks', { params });
        // return response.data;

        // Моковая реализация для разработки:
        let filtered = [...mockTasks];
        if (params?.userId) {
            filtered = filtered.filter((t) => t.userId === params.userId);
        }
        if (params?.status?.length) {
            filtered = filtered.filter((t) => params.status!.includes(t.status));
        }
        if (params?.context === 'project' && params?.projectId) {
            filtered = filtered.filter((t) => t.projectId === params.projectId);
        }
        return JSON.parse(JSON.stringify(filtered));
    },

    getById: async (taskId: number): Promise<Task | null> => {
        await delay(200);
        // 🔥 Реальный запрос:
        // const response = await api.get<Task>(`/tasks/${taskId}`);
        // return response.data;

        const task = mockTasks.find((t) => t.id === taskId);
        return task ? JSON.parse(JSON.stringify(task)) : null;
    },

    create: async (taskData: Partial<Task>): Promise<Task> => {
        await delay(500);
        // 🔥 Реальный запрос:
        // const response = await api.post<Task>('/tasks', taskData);
        // return response.data;

        const newTask: Task = {
            id: nextMockId++,
            title: taskData.title || 'Новая задача',
            description: taskData.description || '',
            estimatedDuration: taskData.estimatedDuration || 60,
            startDate: taskData.startDate || new Date().toISOString(),
            endDate: taskData.endDate || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            status: taskData.status || 'todo',
            userId: taskData.userId || 1,
            category: taskData.category || 'general',
            assignee: taskData.assignee,
            subtasks: taskData.subtasks || [],
        };
        mockTasks = [...mockTasks, { ...newTask }];
        return { ...newTask };
    },

    update: async (taskId: number, updates: Partial<Task>): Promise<Task> => {
        await delay(300);
        // 🔥 Реальный запрос:
        // const response = await api.patch<Task>(`/tasks/${taskId}`, updates);
        // return response.data;

        const index = mockTasks.findIndex((t) => t.id === taskId);
        if (index === -1) throw new Error(`Task with id ${taskId} not found`);
        const updatedTask = { ...mockTasks[index], ...updates };
        mockTasks = [...mockTasks.slice(0, index), updatedTask, ...mockTasks.slice(index + 1)];
        return { ...updatedTask };
    },

    delete: async (taskId: number): Promise<{ success: boolean }> => {
        await delay(200);
        // 🔥 Реальный запрос:
        // await api.delete(`/tasks/${taskId}`);
        // return { success: true };

        const index = mockTasks.findIndex((t) => t.id === taskId);
        if (index === -1) throw new Error(`Task with id ${taskId} not found`);
        mockTasks = mockTasks.filter((t) => t.id !== taskId);
        return { success: true };
    },

    complete: async (workLog: WorkLogEntry): Promise<CompleteTaskResponse> => {
        await delay(500);
        // 🔥 Реальный запрос:
        // const response = await api.post<CompleteTaskResponse>('/tasks/complete', workLog);
        // return response.data;

        const taskIndex = mockTasks.findIndex((t) => t.id === workLog.taskId);
        if (taskIndex === -1) throw new Error(`Task with id ${workLog.taskId} not found`);

        mockTasks = mockTasks.map((task) =>
            task.id === workLog.taskId
                ? { ...task, status: 'done' as const, actualDuration: workLog.actualDuration }
                : task
        );

        const mape = Math.abs((workLog.plannedDuration - workLog.actualDuration) / workLog.plannedDuration) * 100;
        const ratio = workLog.plannedDuration / workLog.actualDuration;
        const alpha = 0.1;
        const newSpeedFactor = userMetrics.speedFactor * (1 - alpha) + ratio * alpha;

        userMetrics = {
            speedFactor: parseFloat(newSpeedFactor.toFixed(2)),
            mape: parseFloat(mape.toFixed(1)),
            completedTasks: userMetrics.completedTasks + 1,
        };

        console.log('📊 WorkLog зафиксирован:', {
            taskId: workLog.taskId,
            planned: workLog.plannedDuration,
            actual: workLog.actualDuration,
            mape: `${mape.toFixed(1)}%`,
            newSpeedFactor: userMetrics.speedFactor,
        });

        return {
            success: true,
            taskId: workLog.taskId,
            newSpeedFactor: userMetrics.speedFactor,
            mape: userMetrics.mape ?? undefined,
            message: `Задача завершена. Точность: ${(100 - (userMetrics.mape ?? 0)).toFixed(1)}%`,
        };
    },

    getUserStats: async (userId: number): Promise<{
        totalTasks: number;
        completedTasks: number;
        avgAccuracy: number;
        speedFactor: number;
    }> => {
        await delay(200);
        const userTasks = mockTasks.filter((t) => t.userId === userId);
        const completed = userTasks.filter((t) => t.status === 'done');
        return {
            totalTasks: userTasks.length,
            completedTasks: completed.length,
            avgAccuracy: userMetrics.mape !== null ? 100 - userMetrics.mape : 100,
            speedFactor: userMetrics.speedFactor,
        };
    },

    // 🔥 НОВЫЕ МЕТОДЫ: Работа с БД

    getForCalendar: async (startDate?: string, endDate?: string): Promise<Task[]> => {
        try {
            const response = await api.get<Task[]>('/tasks/calendar', {
                params: { startDate, endDate },
            });
            return response.data;
        } catch (error) {
            console.error('Ошибка получения задач для календаря:', error);
            return mockTasks.filter((t) => !t.parentId);
        }
    },

    generateSchedule: async (
        title: string,
        description: string,
        subtasks: Array<{ title: string; estimatedHours?: number }>,
        dueDate: string,
        onlyWeekdays: boolean = false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<{ variants: any[]; recommendedVariantId: string }> => {
        try {
            const response = await api.post('/tasks/schedule/generate-with-existing', {
                title,
                description,
                subtasks,
                dueDate,
                onlyWeekdays,
            });
            return response.data;
        } catch (error) {
            console.error('Ошибка генерации расписания:', error);
            throw error;
        }
    },

    saveWithSchedule: async (
        title: string,
        description: string,
        subtasks: Array<{ title: string; estimatedHours?: number; startDate?: string; endDate?: string }>,
        dueDate: string,
        startDate: string,
        endDate: string,
        categoryId?: number,
    ): Promise<Task> => {
        try {
            const response = await api.post<Task>('/tasks/schedule/save', {
                title,
                description,
                categoryId,
                dueDate,
                startDate,
                endDate,
                subtasks,
            });
            return response.data;
        } catch (error) {
            console.error('Ошибка сохранения задачи с расписанием:', error);
            throw error;
        }
    },

    __resetMocks: () => {
        mockTasks = [...INITIAL_MOCK_TASKS];
        userMetrics = { speedFactor: 1.0, mape: null, completedTasks: 0 };
        nextMockId = 100;
        console.log('🔄 Mock data reset');
    },
};

// ==================== AUTH API ====================

export interface RegisterData {
    email: string;
    password: string;
    name?: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    token: string;
    user: User;
}

export interface ProfileResponse extends User {
    email: string;
    createdAt: string;
    updatedAt: string;
}

export const authAPI = {
    register: async (data: RegisterData): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/register', data);
        return response.data;
    },

    login: async (data: LoginData): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', data);
        if (response.data.token) {
            localStorage.setItem('auth_token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    getProfile: async (): Promise<ProfileResponse> => {
        const response = await api.get<ProfileResponse>('/auth/profile');
        return response.data;
    },

    logout: (): void => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('auth_token');
    },
};

// ==================== ЭКСПОРТЫ ====================
export type { GetTasksParams };
export { userMetrics };