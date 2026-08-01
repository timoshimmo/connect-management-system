import { createSlice } from '@reduxjs/toolkit';

/**
 * Mirrors authSlice.ts exactly, but as a fully separate flag — the Drawing
 * Register is a completely separate account system from MS Publishing (see
 * drawingRegisterTokenStore.ts / drawingRegisterApiClient.ts), so its
 * "is a session active" state must live outside MS Publishing's `auth` slice
 * too. Signing in on one never establishes a session on the other.
 */
interface DrawingRegisterAuthState {
  isAuthenticated: boolean;
}

const initialState: DrawingRegisterAuthState = {
  isAuthenticated: false,
};

const drawingRegisterAuthSlice = createSlice({
  name: 'drawingRegisterAuth',
  initialState,
  reducers: {
    drawingRegisterSessionEstablished: (state) => {
      state.isAuthenticated = true;
    },
    drawingRegisterSessionEnded: (state) => {
      state.isAuthenticated = false;
    },
  },
});

export const { drawingRegisterSessionEstablished, drawingRegisterSessionEnded } = drawingRegisterAuthSlice.actions;
export default drawingRegisterAuthSlice.reducer;
