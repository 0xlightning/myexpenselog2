import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface IncomeRecord {
  id: string;
  amount: number;
  date: string;
  sourceId: string | null;
  notes: string;
}

export interface IncomeSource {
  id: string;
  name: string;
}

export interface IncomeState {
  records: IncomeRecord[];
  sources: IncomeSource[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
}

const initialState: IncomeState = {
  records: [],
  sources: [],
  status: 'idle',
  error: null,
};

const incomeSlice = createSlice({
  name: 'income',
  initialState,
  reducers: {
    incomeSnapshot(
      state,
      action: PayloadAction<{ records: IncomeRecord[]; sources: IncomeSource[] }>,
    ) {
      state.records = action.payload.records;
      state.sources = action.payload.sources;
      state.status = 'ready';
    },
    incomeError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.status = 'error';
    },
  },
});

export const { incomeSnapshot, incomeError } = incomeSlice.actions;
export default incomeSlice.reducer;
