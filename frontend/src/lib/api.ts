import axios from 'axios';
import type {
    User,
    Task,
    WorkLog,
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    CreateTaskRequest,
    CreateWorkLogRequest,
} from '@/types';
import { Subtask, CreateSubtaskRequest } from '@/store/slices/subtaskSlice';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Интерцептор для добавления токена
api.interceptors.request.use((config) => {
    const token =
        typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Интерцептор для обработки ошибок авторизации
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    },
);

// ============================================
// Auth API
// ============================================
export const authAPI = {
    login: (data: LoginRequest) =>
        api.post<AuthResponse>('/api/auth/login', data),
    register: (data: RegisterRequest) =>
        api.post<AuthResponse>('/api/auth/register', data),
};

// ============================================
// Tasks API
// ============================================
export const tasksAPI = {
    getAll: () => api.get<Task[]>('/api/tasks'),
    getByDateRange: (start: string, end: string) =>
        api.get<Task[]>(`/api/tasks/range?start=${start}&end=${end}`),
    getById: (id: number) => api.get<Task>(`/api/tasks/${id}`),
    create: (data: CreateTaskRequest) => api.post<Task>('/api/tasks', data),
    update: (id: number, data: Partial<Task>) =>
        api.put<Task>(`/api/tasks/${id}`, data),
    delete: (id: number) => api.delete(`/api/tasks/${id}`),
};

export const subtasksAPI = {
    getByTask: (taskId: number) =>
        api.get<Subtask[]>(`/api/subtasks/task/${taskId}`),
    create: (taskId: number, data: CreateSubtaskRequest) =>
        api.post<Subtask>(`/api/subtasks/task/${taskId}`, data),
    update: (id: number, data: Partial<Subtask>) =>
        api.put<Subtask>(`/api/subtasks/${id}`, data),
    delete: (id: number) => api.delete(`/api/subtasks/${id}`),
};

// ============================================
// WorkLogs API
// ============================================
export const workLogsAPI = {
    getAll: () => api.get<WorkLog[]>('/api/worklogs'),
    create: (data: CreateWorkLogRequest) =>
        api.post<WorkLog>('/api/worklogs', data),
};
