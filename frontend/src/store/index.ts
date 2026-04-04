import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import contextReducer from './slices/contextSlice';
import taskReducer from './slices/taskSlice'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        context: contextReducer,
        tasks: taskReducer,
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
