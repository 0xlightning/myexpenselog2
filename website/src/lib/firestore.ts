import { showError } from '../app/uiSlice';
import { getFirebaseDb } from './firebase';
import {
  incomeSnapshot,
  type IncomeRecord,
  type IncomeSource,
} from '../features/income/incomeSlice';
import {
  expenditureSnapshot,
  type ExpenditureRecord,
  type ExpenseCategory,
} from '../features/expenditure/expenditureSlice';
import {
  investmentsSnapshot,
  type InvestmentRecord,
  type InvestmentCategory,
} from '../features/investments/investmentsSlice';
import type { AppDispatch } from '../app/store';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';

const PATHS = {
  incomeSources: (uid: string) => `users/${uid}/income_sources`,
  incomeRecords: (uid: string) => `users/${uid}/income_records`,
  expenseCategories: (uid: string) => `users/${uid}/expense_categories`,
  expenditureRecords: (uid: string) => `users/${uid}/expenditure_records`,
  investmentCategories: (uid: string) => `users/${uid}/investment_categories`,
  investments: (uid: string) => `users/${uid}/investments`,
};

export type RecordKind = 'income' | 'expenditure' | 'investment';

export interface NewRecordInput {
  amount: number;
  date: string;
  categoryId: string | null;
  notes: string;
}

export interface NewCategoryInput {
  name: string;
}

// Tiny in-module cache so the second collection's snapshot dispatch
// includes the latest from the first. Without this, a state update
// for records fires before categories have arrived, momentarily
// clearing the categories list.
//
// Caveat: this cache assumes a single active subscription at a time.
const cache: {
  incomeRecords: IncomeRecord[] | null;
  incomeSources: IncomeSource[] | null;
  expenditureRecords: ExpenditureRecord[] | null;
  expenseCategories: ExpenseCategory[] | null;
  investmentRecords: InvestmentRecord[] | null;
  investmentCategories: InvestmentCategory[] | null;
} = {
  incomeRecords: null,
  incomeSources: null,
  expenditureRecords: null,
  expenseCategories: null,
  investmentRecords: null,
  investmentCategories: null,
};

export function subscribeUserData(uid: string, dispatch: AppDispatch): Unsubscribe {
  const db = getFirebaseDb();
  const unsubs: Unsubscribe[] = [];
  const onError = (label: string) => (err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    dispatch(showError(`${label}: ${message}`));
  };

  unsubs.push(
    onSnapshot(
      query(collection(db, PATHS.incomeSources(uid))),
      (snap) => {
        const sources: IncomeSource[] = snap.docs.map((d) => ({
          id: d.id,
          name: (d.data().name as string) ?? '',
        }));
        dispatch(incomeSnapshot({ records: cache.incomeRecords ?? [], sources }));
        cache.incomeSources = sources;
      },
      onError('Income sources'),
    ),
  );
  unsubs.push(
    onSnapshot(
      query(collection(db, PATHS.incomeRecords(uid))),
      (snap) => {
        const records: IncomeRecord[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            amount: (data.amount as number) ?? 0,
            date: (data.date as string) ?? '',
            sourceId: (data.sourceId as string | null) ?? null,
            notes: (data.notes as string) ?? '',
          };
        });
        dispatch(incomeSnapshot({ records, sources: cache.incomeSources ?? [] }));
        cache.incomeRecords = records;
      },
      onError('Income records'),
    ),
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, PATHS.expenseCategories(uid))),
      (snap) => {
        const categories: ExpenseCategory[] = snap.docs.map((d) => ({
          id: d.id,
          name: (d.data().name as string) ?? '',
        }));
        dispatch(
          expenditureSnapshot({
            records: cache.expenditureRecords ?? [],
            categories,
          }),
        );
        cache.expenseCategories = categories;
      },
      onError('Expense categories'),
    ),
  );
  unsubs.push(
    onSnapshot(
      query(collection(db, PATHS.expenditureRecords(uid))),
      (snap) => {
        const records: ExpenditureRecord[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            amount: (data.amount as number) ?? 0,
            date: (data.date as string) ?? '',
            categoryId: (data.categoryId as string | null) ?? null,
            notes: (data.notes as string) ?? '',
          };
        });
        dispatch(
          expenditureSnapshot({
            records,
            categories: cache.expenseCategories ?? [],
          }),
        );
        cache.expenditureRecords = records;
      },
      onError('Expenditure records'),
    ),
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, PATHS.investmentCategories(uid))),
      (snap) => {
        const categories: InvestmentCategory[] = snap.docs.map((d) => ({
          id: d.id,
          name: (d.data().name as string) ?? '',
        }));
        dispatch(
          investmentsSnapshot({
            records: cache.investmentRecords ?? [],
            categories,
          }),
        );
        cache.investmentCategories = categories;
      },
      onError('Investment categories'),
    ),
  );
  unsubs.push(
    onSnapshot(
      query(collection(db, PATHS.investments(uid))),
      (snap) => {
        const records: InvestmentRecord[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            amount: (data.amount as number) ?? 0,
            date: (data.date as string) ?? '',
            categoryId: (data.categoryId as string | null) ?? null,
            notes: (data.notes as string) ?? '',
          };
        });
        dispatch(
          investmentsSnapshot({
            records,
            categories: cache.investmentCategories ?? [],
          }),
        );
        cache.investmentRecords = records;
      },
      onError('Investments'),
    ),
  );

  return () => {
    unsubs.forEach((u) => u());
    cache.incomeRecords = null;
    cache.incomeSources = null;
    cache.expenditureRecords = null;
    cache.expenseCategories = null;
    cache.investmentRecords = null;
    cache.investmentCategories = null;
  };
}

function recordsPath(uid: string, kind: RecordKind): string {
  switch (kind) {
    case 'income':
      return PATHS.incomeRecords(uid);
    case 'expenditure':
      return PATHS.expenditureRecords(uid);
    case 'investment':
      return PATHS.investments(uid);
  }
}

function categoriesPath(uid: string, kind: RecordKind): string {
  switch (kind) {
    case 'income':
      return PATHS.incomeSources(uid);
    case 'expenditure':
      return PATHS.expenseCategories(uid);
    case 'investment':
      return PATHS.investmentCategories(uid);
  }
}

export async function addRecord(
  uid: string,
  kind: RecordKind,
  input: NewRecordInput,
): Promise<string> {
  const db = getFirebaseDb();
  const ref = await addDoc(collection(db, recordsPath(uid, kind)), {
    amount: input.amount,
    date: input.date,
    categoryId: input.categoryId,
    notes: input.notes,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateRecord(
  uid: string,
  kind: RecordKind,
  id: string,
  patch: Partial<NewRecordInput>,
): Promise<void> {
  const db = getFirebaseDb();
  const ref = doc(db, recordsPath(uid, kind), id);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteRecord(
  uid: string,
  kind: RecordKind,
  id: string,
): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, recordsPath(uid, kind), id));
}

export async function addCategory(
  uid: string,
  kind: RecordKind,
  input: NewCategoryInput,
): Promise<string> {
  const db = getFirebaseDb();
  const ref = await addDoc(collection(db, categoriesPath(uid, kind)), {
    name: input.name,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function renameCategory(
  uid: string,
  kind: RecordKind,
  id: string,
  name: string,
): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, categoriesPath(uid, kind), id), { name });
}

export async function deleteCategory(
  uid: string,
  kind: RecordKind,
  id: string,
): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, categoriesPath(uid, kind), id));
}

export function _setRecordWithId(
  uid: string,
  kind: RecordKind,
  id: string,
  data: NewRecordInput,
): Promise<void> {
  const db = getFirebaseDb();
  return setDoc(doc(db, recordsPath(uid, kind), id), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
