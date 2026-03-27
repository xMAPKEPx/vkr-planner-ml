import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { workLogsAPI } from '@/lib/api';

export interface WorkLog {
    id: number;
    taskId: number;
    userId: number;
    hours: number;
    comment: string | null;
    createdAt: string;
    task?: {
        id: number;
        title: string;
        estimatedHours: number | null;
    };
}

interface WorkLogState {
    workLogs: WorkLog[];
    loading: boolean;
    error: string | null;
}

const initialState: WorkLogState = {
    workLogs: [],
    loading: false,
    error: null,
};

export const fetchWorkLogs = createAsyncThunk<WorkLog[]>(
    'workLogs/fetchAll',
    async () => {
        const response = await workLogsAPI.getAll();
        return response.data;
    },
);

export const createWorkLog = createAsyncThunk<
    WorkLog,
    { taskId: number; hours: number; comment?: string }
>('workLogs/create', async ({ taskId, hours, comment }) => {
    const response = await workLogsAPI.create({ taskId, hours, comment });
    return response.data;
});

const workLogSlice = createSlice({
    name: 'workLogs',
    initialState,
    reducers: {
        clearWorkLogError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWorkLogs.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWorkLogs.fulfilled, (state, action) => {
                state.loading = false;
                state.workLogs = action.payload;
            })
            .addCase(fetchWorkLogs.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    action.error.message || 'Failed to fetch work logs';
            })
            .addCase(createWorkLog.fulfilled, (state, action) => {
                state.workLogs.unshift(action.payload);
            });
    },
});

export const { clearWorkLogError } = workLogSlice.actions;
export default workLogSlice.reducer;
