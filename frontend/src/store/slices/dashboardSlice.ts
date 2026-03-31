import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardAPI } from '@/lib/api';

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  totalHours: number;
  avgAccuracy: number;
  speedFactor: number;
  tasksOnTime: number;
  tasksLate: number;
}

export interface AccuracyTrend {
  month: string;
  accuracy: number;
  estimatedHours: number;
  actualHours: number;
}

export interface CategoryStats {
  category: string;
  count: number;
  avgEstimatedHours: number;
  avgActualHours: number;
  accuracy: number;
}

interface DashboardState {
  stats: DashboardStats | null;
  accuracyTrend: AccuracyTrend[];
  categoryStats: CategoryStats[];
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  stats: null,
  accuracyTrend: [],
  categoryStats: [],
  loading: false,
  error: null,
};

export const fetchDashboardStats = createAsyncThunk<DashboardStats>(
  'dashboard/fetchStats',
  async () => {
    const response = await dashboardAPI.getStats();
    return response.data;
  }
);

export const fetchAccuracyTrend = createAsyncThunk<AccuracyTrend[]>(
  'dashboard/fetchAccuracyTrend',
  async () => {
    const response = await dashboardAPI.getAccuracyTrend();
    return response.data;
  }
);

export const fetchCategoryStats = createAsyncThunk<CategoryStats[]>(
  'dashboard/fetchCategoryStats',
  async () => {
    const response = await dashboardAPI.getCategoryStats();
    return response.data;
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch stats';
      })
      .addCase(fetchAccuracyTrend.fulfilled, (state, action) => {
        state.accuracyTrend = action.payload;
      })
      .addCase(fetchCategoryStats.fulfilled, (state, action) => {
        state.categoryStats = action.payload;
      });
  },
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;