import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import drawingRegisterAuthReducer from './slices/drawingRegisterAuthSlice';
import uiReducer from './slices/uiSlice';

/**
 * Redux holds only genuine client-only global state: session presence and
 * UI shell state. All server data (documents, users, departments) is
 * fetched and cached via TanStack Query — see src/features/*\/hooks.ts.
 * `auth` and `drawingRegisterAuth` are deliberately separate slices — two
 * independent account systems, so one signing in never implies the other.
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    drawingRegisterAuth: drawingRegisterAuthReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
