import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface UiState {
  lastError: string | null;
  lastErrorId: number;
  online: boolean;
}

const initialState: UiState = {
  lastError: null,
  lastErrorId: 0,
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showError(state, action: PayloadAction<string>) {
      state.lastError = action.payload;
      state.lastErrorId += 1;
    },
    clearError(state) {
      state.lastError = null;
    },
    setOnline(state, action: PayloadAction<boolean>) {
      state.online = action.payload;
    },
  },
});

export const { showError, clearError, setOnline } = uiSlice.actions;
export default uiSlice.reducer;
