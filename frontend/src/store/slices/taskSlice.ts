import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { tasksApi } from '@/lib/api';
import { Task, WorkLogEntry } from '@/types';

interface TaskState {
    tasks: Task[];
    loading: boolean;
    error: string | null;
    selectedTask: Task | null;
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
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTasks.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTasks.fulfilled, (state, action) => {
                state.loading = false;
                // ✅ Полная замена массива (без мутаций)
                state.tasks = action.payload.map((t) => ({ ...t }));
            })
            .addCase(fetchTasks.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createTask.pending, (state) => {
                state.loading = true;
            })
            .addCase(createTask.fulfilled, (state, action) => {
                state.loading = false;
                // ✅ Добавляем копию объекта
                state.tasks = [...state.tasks, { ...action.payload }];
            })
            .addCase(createTask.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(completeTask.pending, (state) => {
                state.loading = true;
            })
            .addCase(completeTask.fulfilled, (state, action) => {
                state.loading = false;

                // ✅ Обновляем через map (иммутабельно)
                state.tasks = state.tasks.map((task) =>
                    task.id === action.payload.taskId
                        ? { ...task, status: 'done' as const }
                        : task,
                );

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
            });
    },
});

export const { setSelectedTask, clearError } = taskSlice.actions;
export default taskSlice.reducer;
