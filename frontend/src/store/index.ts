import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import taskReducer from './slices/taskSlice';
import subtaskReducer from './slices/subtaskSlice';
import workLogReducer from './slices/workLogSlice';
import dashboardReducer from './slices/dashboardSlice'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        tasks: taskReducer,
        subtasks: subtaskReducer,
        workLog: workLogReducer,
        dashboard: dashboardReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['auth/login'],
                ignoredPaths: ['auth.user'],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
