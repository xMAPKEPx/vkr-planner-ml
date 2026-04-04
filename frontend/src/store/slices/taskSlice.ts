// src/store/slices/taskSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { tasksApi } from '@/lib/api';
import { Task, WorkLogEntry } from '@/types';

// ==================== STATE ====================
interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  selectedTask: Task | null;
  // Для self-finetuning (ВКР п. 3.3.1)
  userSpeedFactor: number;
  lastMape: number | null;
}

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
  selectedTask: null,
  userSpeedFactor: 1.0, // k_скорости по умолчанию
  lastMape: null,       // MAPE для отображения в интерфейсе
};

// ==================== ASYNC THUNKS ====================

// 1. Загрузка всех задач
export const fetchTasks = createAsyncThunk<Task[]>(
  'tasks/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const tasks = await tasksApi.getAll();
      return tasks;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка загрузки задач');
    }
  }
);

// 2. Создание новой задачи
export const createTask = createAsyncThunk<Task, Partial<Task>>(
  'tasks/create',
  async (taskData, { rejectWithValue }) => {
    try {
      const newTask = await tasksApi.create({
        ...taskData,
        status: 'todo',
      });
      return newTask;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка создания задачи');
    }
  }
);

// 3. Завершение задачи (WorkLog для self-finetuning)
// Это ключевой экшн для раздела 3.3.1 ВКР
export const completeTask = createAsyncThunk<
  { taskId: string; newSpeedFactor?: number; mape?: number },
  WorkLogEntry
>(
  'tasks/complete',
  async (workLog, { rejectWithValue }) => {
    try {
      // Отправляем WorkLog на бэкенд
      const result = await tasksApi.complete(workLog);
      
      // Бэкенд возвращает обновлённые метрики самообучения
      return {
        taskId: workLog.taskId,
        newSpeedFactor: result.newSpeedFactor,
        mape: result.mape,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Ошибка завершения задачи');
    }
  }
);

// ==================== SLICE ====================
const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    // Синхронные действия для локального управления состоянием
    setSelectedTask: (state, action: PayloadAction<Task | null>) => {
      state.selectedTask = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    // Локальное обновление задачи (без запроса к бэку, для оптимистичного UI)
    updateTaskLocally: (state, action: PayloadAction<{ taskId: string; updates: Partial<Task> }>) => {
      const index = state.tasks.findIndex(t => t.id === action.payload.taskId);
      if (index !== -1) {
        state.tasks[index] = { ...state.tasks[index], ...action.payload.updates };
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
        state.tasks = action.payload;
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
        state.tasks.push(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // ===== COMPLETE TASK (Self-finetuning) =====
      .addCase(completeTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(completeTask.fulfilled, (state, action) => {
        state.loading = false;
        
        // 1. Помечаем задачу как выполненную
        const task = state.tasks.find(t => t.id === action.payload.taskId);
        if (task) {
          task.status = 'done';
        }
        
        // 2. Обновляем метрики self-finetuning (ВКР п. 3.3.1)
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

// ==================== EXPORTS ====================
export const { setSelectedTask, clearError, updateTaskLocally } = taskSlice.actions;
export default taskSlice.reducer;