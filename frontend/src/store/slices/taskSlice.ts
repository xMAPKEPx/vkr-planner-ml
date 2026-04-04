/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { tasksApi } from '@/lib/api';
import { Task, WorkLogEntry } from '@/types';

// ==================== STATE ====================
interface TaskState {
    tasks: Task[];
    loading: boolean;
    error: string | null;
    selectedTask: Task | null;
    // Метрики для Self-finetuning (ВКР п. 3.3.1)
    userSpeedFactor: number;
    lastMape: number | null;
}

const initialState: TaskState = {
    tasks: [],
    loading: false,
    error: null,
    selectedTask: null,
    userSpeedFactor: 1.0, // k_скорости по умолчанию
    lastMape: null,
};

// ==================== ASYNC THUNKS ====================

// 1. Загрузка всех задач
export const fetchTasks = createAsyncThunk<Task[]>(
    'tasks/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            return await tasksApi.getAll();
        } catch (error: any) {
            return rejectWithValue(error.message || 'Ошибка загрузки задач');
        }
    },
);

// 2. Создание новой задачи
export const createTask = createAsyncThunk<Task, Partial<Task>>(
    'tasks/create',
    async (taskData, { rejectWithValue }) => {
        try {
            return await tasksApi.create(taskData);
        } catch (error: any) {
            return rejectWithValue(error.message || 'Ошибка создания задачи');
        }
    },
);

// 3. Обновление задачи (ВАЖНО: Нужно для Drag-and-Drop и редактирования)
// Реализует сценарий "Корректировка плана" (ВКР 1.4.2.3)
export const updateTask = createAsyncThunk<
    Task,
    { taskId: string; updates: Partial<Task> }
>('tasks/update', async ({ taskId, updates }, { rejectWithValue }) => {
    try {
        return await tasksApi.update(taskId, updates);
    } catch (error: any) {
        return rejectWithValue(error.message || 'Ошибка обновления задачи');
    }
});

// 4. Завершение задачи (WorkLog для self-finetuning)
export const completeTask = createAsyncThunk<
    { taskId: string; newSpeedFactor?: number; mape?: number },
    WorkLogEntry
>('tasks/complete', async (workLog, { rejectWithValue }) => {
    try {
        return await tasksApi.complete(workLog);
    } catch (error: any) {
        return rejectWithValue(error.message || 'Ошибка завершения задачи');
    }
});

// 5. Удаление задачи
export const deleteTask = createAsyncThunk<string, string>(
    'tasks/delete',
    async (taskId, { rejectWithValue }) => {
        try {
            await tasksApi.delete(taskId);
            return taskId;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Ошибка удаления задачи');
        }
    },
);

// ==================== SLICE ====================
const taskSlice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {
        setSelectedTask: (state, action: PayloadAction<Task | null>) => {
            state.selectedTask = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        // Локальное обновление (без запроса к API, для оптимистичного UI)
        updateTaskLocally: (
            state,
            action: PayloadAction<{ taskId: string; updates: Partial<Task> }>,
        ) => {
            const index = state.tasks.findIndex(
                (t) => t.id === action.payload.taskId,
            );
            if (index !== -1) {
                state.tasks[index] = {
                    ...state.tasks[index],
                    ...action.payload.updates,
                };
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // ===== FETCH TASKS =====
            .addCase(fetchTasks.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTasks.fulfilled, (state, action) => {
                state.loading = false;
                state.tasks = action.payload.map((t) => ({ ...t }));
            })
            .addCase(fetchTasks.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // ===== CREATE TASK =====
            .addCase(createTask.pending, (state) => {
                state.loading = true;
            })
            .addCase(createTask.fulfilled, (state, action) => {
                state.loading = false;
                console.log('✅ Redux сохранил задачу. Subtasks в стейте:', action.payload.subtasks);
                state.tasks.push({ ...action.payload });
            })
            .addCase(createTask.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // ===== UPDATE TASK (Drag-and-Drop / Edit) =====
            .addCase(updateTask.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateTask.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.tasks.findIndex(
                    (t) => t.id === action.payload.id,
                );
                if (index !== -1) {
                    state.tasks[index] = action.payload;
                }
            })
            .addCase(updateTask.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // ===== COMPLETE TASK (Self-finetuning) =====
            .addCase(completeTask.pending, (state) => {
                state.loading = true;
            })
            .addCase(completeTask.fulfilled, (state, action) => {
                state.loading = false;

                // Обновляем статус задачи
                const taskIndex = state.tasks.findIndex(
                    (t) => t.id === action.payload.taskId,
                );
                if (taskIndex !== -1) {
                    state.tasks[taskIndex] = {
                        ...state.tasks[taskIndex],
                        status: 'done' as const,
                    };
                }

                // Обновляем метрики обучения
                if (action.payload.newSpeedFactor !== undefined) {
                    state.userSpeedFactor = action.payload.newSpeedFactor;
                }
                if (action.payload.mape !== undefined) {
                    state.lastMape = action.payload.mape;
                }
            })
            .addCase(completeTask.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // ===== DELETE TASK =====
            .addCase(deleteTask.fulfilled, (state, action) => {
                state.tasks = state.tasks.filter(
                    (t) => t.id !== action.payload,
                );
                if (state.selectedTask?.id === action.payload) {
                    state.selectedTask = null;
                }
            });
    },
});

// ==================== EXPORTS ====================
export const { setSelectedTask, clearError, updateTaskLocally } =
    taskSlice.actions;

export default taskSlice.reducer;

// ==================== SELECTORS ====================
export const selectTasks = (state: { tasks: TaskState }) => state.tasks.tasks;
export const selectUserSpeedFactor = (state: { tasks: TaskState }) =>
    state.tasks.userSpeedFactor;
export const selectLastMape = (state: { tasks: TaskState }) =>
    state.tasks.lastMape;
