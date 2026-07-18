
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  records: [],
  sources: [],
  status: 'idle',
  error: null,
};

const incomeSlice = createSlice({
  name: 'income',
  initialState,
  reducers: {
    incomeSnapshot(state, action) {
      state.records = action.payload.records;
      state.sources = action.payload.sources;
      state.status = 'ready';
    },
    incomeError(state, action) {
      state.error = action.payload;
      state.status = 'error';
    },
  },
});

export const { incomeSnapshot, incomeError } = incomeSlice.actions;
export default incomeSlice.reducer;
