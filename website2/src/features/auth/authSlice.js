import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  // Start as 'loading' so <AuthGate> shows a splash until
  // onAuthStateChanged fires its first callback.
  status: 'loading',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStateChanged(state, action) {
      state.user = action.payload;
      state.status = action.payload ? 'authenticated' : 'unauthenticated';
      state.error = null;
    },
    authError(state, action) {
      state.error = action.payload;
      state.status = 'unauthenticated';
    },
  },
});

export const { authStateChanged, authError } = authSlice.actions;
export default authSlice.reducer;
