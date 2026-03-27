import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Task, CreateTaskRequest } from '@/types';
import { tasksAPI } from '@/lib/api';

interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  loading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  tasks: [],
  selectedTask: null,
  loading: false,
  error: null,
};

// Async thunks для API запросов
export const fetchTasks = createAsyncThunk<Task[]>(
  'tasks/fetchAll',
  async () => {
    const response = await tasksAPI.getAll();
    return response.data;
  }
);

export const createTask = createAsyncThunk<Task, CreateTaskRequest>(
  'tasks/create',
  async (data) => {
    const response = await tasksAPI.create(data);
    return response.data;
  }
);

export const updateTask = createAsyncThunk<Task, { id: number; data: Partial<Task> }>(
  'tasks/update',
  async ({ id, data }) => {
    const response = await tasksAPI.update(id, data);
    return response.data;
  }
);

export const deleteTask = createAsyncThunk<void, number>(
  'tasks/delete',
  async (id) => {
    await tasksAPI.delete(id);
  }
);

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
      // Fetch tasks
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
        state.error = action.error.message || 'Failed to fetch tasks';
      })
      // Create task
      .addCase(createTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks.unshift(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create task';
      })
      // Update task
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      // Delete task
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t.id !== action.meta.arg);
      });
  },
});

export const { setSelectedTask, clearError } = taskSlice.actions;
export default taskSlice.reducer;