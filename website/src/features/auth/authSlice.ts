import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  uid: string;
  email: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStateChanged(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.status = action.payload ? 'authenticated' : 'unauthenticated';
    },
    authError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
  },
});

export const { authStateChanged, authError } = authSlice.actions;
export default authSlice.reducer;
