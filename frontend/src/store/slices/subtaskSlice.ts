import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { subtasksAPI } from '@/lib/api';

export interface Subtask {
  id: number;
  taskId: number;
  title: string;
  description: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  order: number;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface SubtaskState {
  subtasks: Record<number, Subtask[]>; // По taskId
  loading: boolean;
  error: string | null;
}

const initialState: SubtaskState = {
  subtasks: {},
  loading: false,
  error: null,
};

export const fetchSubtasks = createAsyncThunk<Subtask[], number>(
  'subtasks/fetchByTask',
  async (taskId) => {
    const response = await subtasksAPI.getByTask(taskId);
    return response.data;
  }
);

export const createSubtask = createAsyncThunk<Subtask, { taskId: number;  data: Partial<Subtask> }>(
  'subtasks/create',
  async ({ taskId, data }) => {
    const response = await subtasksAPI.create(taskId, data);
    return response.data;
  }
);

export const updateSubtask = createAsyncThunk<Subtask, { id: number;  data: Partial<Subtask> }>(
  'subtasks/update',
  async ({ id, data }) => {
    const response = await subtasksAPI.update(id, data);
    return response.data;
  }
);

export const deleteSubtask = createAsyncThunk<void, number>(
  'subtasks/delete',
  async (id) => {
    await subtasksAPI.delete(id);
  }
);

const subtaskSlice = createSlice({
  name: 'subtasks',
  initialState,
  reducers: {
    clearSubtaskError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubtasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubtasks.fulfilled, (state, action) => {
        state.loading = false;
        const taskId = action.meta.arg;
        state.subtasks[taskId] = action.payload;
      })
      .addCase(fetchSubtasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch subtasks';
      })
      .addCase(createSubtask.fulfilled, (state, action) => {
        const taskId = action.meta.arg.taskId;
        if (!state.subtasks[taskId]) {
          state.subtasks[taskId] = [];
        }
        state.subtasks[taskId].push(action.payload);
      })
      .addCase(updateSubtask.fulfilled, (state, action) => {
        const subtask = action.payload;
        const taskSubtasks = state.subtasks[subtask.taskId];
        if (taskSubtasks) {
          const index = taskSubtasks.findIndex((s) => s.id === subtask.id);
          if (index !== -1) {
            taskSubtasks[index] = subtask;
          }
        }
      })
      .addCase(deleteSubtask.fulfilled, (state, action) => {
        // Удаляем из всех списков
        Object.keys(state.subtasks).forEach((taskId) => {
          state.subtasks[taskId] = state.subtasks[taskId].filter(
            (s) => s.id !== action.meta.arg
          );
        });
      });
  },
});

export const { clearSubtaskError } = subtaskSlice.actions;
export default subtaskSlice.reducer;