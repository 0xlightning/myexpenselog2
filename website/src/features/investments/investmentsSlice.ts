import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface InvestmentRecord {
  id: string;
  amount: number;
  date: string;
  categoryId: string | null;
  notes: string;
}

export interface InvestmentCategory {
  id: string;
  name: string;
}

export interface InvestmentsState {
  records: InvestmentRecord[];
  categories: InvestmentCategory[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
}

const initialState: InvestmentsState = {
  records: [],
  categories: [],
  status: 'idle',
  error: null,
};

const investmentsSlice = createSlice({
  name: 'investments',
  initialState,
  reducers: {
    investmentsSnapshot(
      state,
      action: PayloadAction<{
        records: InvestmentRecord[];
        categories: InvestmentCategory[];
      }>,
    ) {
      state.records = action.payload.records;
      state.categories = action.payload.categories;
      state.status = 'ready';
    },
    investmentsError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.status = 'error';
    },
  },
});

export const { investmentsSnapshot, investmentsError } = investmentsSlice.actions;
export default investmentsSlice.reducer;
