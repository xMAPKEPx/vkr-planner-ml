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
    userSpeedFactor: 1.0,
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

// 3. Обновление задачи — 🔥 ИСПРАВЛЕНО: taskId: number
export const updateTask = createAsyncThunk<
    Task,
    { taskId: number; updates: Partial<Task> }
>('tasks/update', async ({ taskId, updates }, { rejectWithValue }) => {
    try {
        return await tasksApi.update(taskId, updates);
    } catch (error: any) {
        return rejectWithValue(error.message || 'Ошибка обновления задачи');
    }
});

// 4. Завершение задачи — 🔥 ИСПРАВЛЕНО: тип возврата
export const completeTask = createAsyncThunk<
    { taskId: number; newSpeedFactor?: number; mape?: number }, // 🔥 taskId: number
    WorkLogEntry
>('tasks/complete', async (workLog, { rejectWithValue }) => {
    try {
        const response = await tasksApi.complete(workLog);
        return {
            taskId: response.taskId, // уже number
            newSpeedFactor: response.newSpeedFactor,
            mape: response.mape,
        };
    } catch (error: any) {
        return rejectWithValue(error.message || 'Ошибка завершения задачи');
    }
});

// 5. Удаление задачи — 🔥 ИСПРАВЛЕНО: number
export const deleteTask = createAsyncThunk<number, number>(
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

// 6. Загрузка задач для календаря из БД
export const fetchTasksForCalendar = createAsyncThunk<
    Task[],
    { startDate?: string; endDate?: string }
>(
    'tasks/fetchForCalendar',
    async ({ startDate, endDate }, { rejectWithValue }) => {
        try {
            const result = await tasksApi.getForCalendar(startDate, endDate);
            return result;
        } catch (error: any) {
            return rejectWithValue(
                error.message || 'Ошибка загрузки задач из календаря',
            );
        }
    },
);

// 7. Генерация расписания — 🔥 Уточнены типы
export const generateSchedule = createAsyncThunk<
    { variants: any[]; recommendedVariantId: string },
    {
        title: string;
        description: string;
        subtasks: Array<{ title: string; estimatedHours?: number }>;
        dueDate: string;
        onlyWeekdays?: boolean;
    }
>('tasks/generateSchedule', async (params, { rejectWithValue }) => {
    try {
        return await tasksApi.generateSchedule(
            params.title,
            params.description,
            params.subtasks,
            params.dueDate,
            params.onlyWeekdays,
        );
    } catch (error: any) {
        return rejectWithValue(error.message || 'Ошибка генерации расписания');
    }
});

// 8. Сохранение задачи с расписанием
export const saveTaskWithSchedule = createAsyncThunk<
    Task,
    {
        title: string;
        description: string;
        subtasks: Array<{ title: string; estimatedHours?: number; startDate?: string; endDate?: string }>;
        dueDate: string;
        startDate: string;
        endDate: string;
        categoryId?: number;
    }
>('tasks/saveWithSchedule', async (params, { rejectWithValue }) => {
    try {
        return await tasksApi.saveWithSchedule(
            params.title,
            params.description,
            params.subtasks,
            params.dueDate,
            params.startDate,
            params.endDate,
            params.categoryId,
        );
    } catch (error: any) {
        return rejectWithValue(error.message || 'Ошибка сохранения задачи');
    }
});

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
        // 🔥 Локальное обновление — ИСПРАВЛЕНО: taskId: number
        updateTaskLocally: (
            state,
            action: PayloadAction<{ taskId: number; updates: Partial<Task> }>,
        ) => {
            const index = state.tasks.findIndex(
                (t) => t.id === action.payload.taskId, // 🔥 number === number
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
                state.tasks.push({ ...action.payload });
            })
            .addCase(createTask.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // ===== UPDATE TASK — 🔥 ИСПРАВЛЕНО: сравнение number === number
            .addCase(updateTask.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateTask.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.tasks.findIndex(
                    (t) => t.id === action.payload.id, // 🔥 number === number
                );
                if (index !== -1) {
                    state.tasks[index] = action.payload;
                }
            })
            .addCase(updateTask.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // ===== COMPLETE TASK — 🔥 ИСПРАВЛЕНО: taskId: number
            .addCase(completeTask.pending, (state) => {
                state.loading = true;
            })
            .addCase(completeTask.fulfilled, (state, action) => {
                state.loading = false;

                // 🔥 Сравнение number === number
                const taskIndex = state.tasks.findIndex(
                    (t) => t.id === action.payload.taskId,
                );
                if (taskIndex !== -1) {
                    state.tasks[taskIndex] = {
                        ...state.tasks[taskIndex],
                        status: 'done' as const,
                    };
                }

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

            // ===== DELETE TASK — 🔥 ИСПРАВЛЕНО: number
            .addCase(deleteTask.fulfilled, (state, action) => {
                state.tasks = state.tasks.filter(
                    (t) => t.id !== action.payload, // 🔥 number !== number
                );
                if (state.selectedTask?.id === action.payload) {
                    state.selectedTask = null;
                }
            })

            // ===== FETCH TASKS FOR CALENDAR =====
            .addCase(fetchTasksForCalendar.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTasksForCalendar.fulfilled, (state, action) => {
                state.loading = false;
                state.tasks = action.payload.map((t) => ({ ...t }));
            })
            .addCase(fetchTasksForCalendar.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // ===== GENERATE SCHEDULE =====
            .addCase(generateSchedule.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(generateSchedule.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(generateSchedule.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // ===== SAVE TASK WITH SCHEDULE =====
            .addCase(saveTaskWithSchedule.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(saveTaskWithSchedule.fulfilled, (state, action) => {
                state.loading = false;
                state.tasks.push({ ...action.payload });
            })
            .addCase(saveTaskWithSchedule.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
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