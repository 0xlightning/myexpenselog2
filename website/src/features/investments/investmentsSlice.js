
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  records: [],
  categories: [],
  status: 'idle',
  error: null,
};

const investmentsSlice = createSlice({
  name: 'investments',
  initialState,
  reducers: {
    investmentsSnapshot(state, action) {
      state.records = action.payload.records;
      state.categories = action.payload.categories;
      state.status = 'ready';
    },
    investmentsError(state, action) {
      state.error = action.payload;
      state.status = 'error';
    },
  },
});

export const { investmentsSnapshot, investmentsError } = investmentsSlice.actions;
export default investmentsSlice.reducer;
