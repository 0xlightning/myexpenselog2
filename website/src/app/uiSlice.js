import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  lastError: null,
  lastErrorId: 0,
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showError(state, action) {
      state.lastError = action.payload;
      state.lastErrorId += 1;
    },
    clearError(state) {
      state.lastError = null;
    },
    setOnline(state, action) {
      state.online = action.payload;
    },
  },
});

export const { showError, clearError, setOnline } = uiSlice.actions;
export default uiSlice.reducer;
