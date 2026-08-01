import { createSlice } from '@reduxjs/toolkit';

/**
 * Tracks only whether a session exists — genuinely client-only UI state, not
 * server data. The user's profile (name/role/email) is server state and is
 * fetched/cached via TanStack Query's `useMeQuery` instead (see
 * features/auth/hooks.ts), never stored here.
 */
interface AuthState {
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionEstablished: (state) => {
      state.isAuthenticated = true;
    },
    sessionEnded: (state) => {
      state.isAuthenticated = false;
    },
  },
});

export const { sessionEstablished, sessionEnded } = authSlice.actions;
export default authSlice.reducer;
