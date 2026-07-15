
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  records: [],
  categories: [],
  status: 'idle',
  error: null,
};

const expenditureSlice = createSlice({
  name: 'expenditure',
  initialState,
  reducers: {
    expenditureSnapshot(state, action) {
      state.records = action.payload.records;
      state.categories = action.payload.categories;
      state.status = 'ready';
    },
    expenditureError(state, action) {
      state.error = action.payload;
      state.status = 'error';
    },
  },
});

export const { expenditureSnapshot, expenditureError } = expenditureSlice.actions;
export default expenditureSlice.reducer;
