import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ExpenditureRecord {
  id: string;
  amount: number;
  date: string;
  categoryId: string | null;
  notes: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface ExpenditureState {
  records: ExpenditureRecord[];
  categories: ExpenseCategory[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
}

const initialState: ExpenditureState = {
  records: [],
  categories: [],
  status: 'idle',
  error: null,
};

const expenditureSlice = createSlice({
  name: 'expenditure',
  initialState,
  reducers: {
    expenditureSnapshot(
      state,
      action: PayloadAction<{
        records: ExpenditureRecord[];
        categories: ExpenseCategory[];
      }>,
    ) {
      state.records = action.payload.records;
      state.categories = action.payload.categories;
      state.status = 'ready';
    },
    expenditureError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.status = 'error';
    },
  },
});

export const { expenditureSnapshot, expenditureError } = expenditureSlice.actions;
export default expenditureSlice.reducer;
