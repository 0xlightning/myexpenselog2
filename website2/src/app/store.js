
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import incomeReducer from '../features/income/incomeSlice';
import expenditureReducer from '../features/expenditure/expenditureSlice';
import investmentsReducer from '../features/investments/investmentsSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    income: incomeReducer,
    expenditure: expenditureReducer,
    investments: investmentsReducer,
    ui: uiReducer,
  },
});
