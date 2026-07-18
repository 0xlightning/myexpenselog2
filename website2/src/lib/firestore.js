
import { showError } from '../app/uiSlice';
import { getFirebaseDb } from './firebase';
import { incomeSnapshot } from '../features/income/incomeSlice';
import { expenditureSnapshot } from '../features/expenditure/expenditureSlice';
import { investmentsSnapshot } from '../features/investments/investmentsSlice';
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
} from 'firebase/firestore';

const PATHS = {
  incomeSources: (uid) => `users/${uid}/income_sources`,
  incomeRecords: (uid) => `users/${uid}/income_records`,
  expenseCategories: (uid) => `users/${uid}/expense_categories`,
  expenditureRecords: (uid) => `users/${uid}/expenditure_records`,
  investmentCategories: (uid) => `users/${uid}/investment_categories`,
  investments: (uid) => `users/${uid}/investments`,
};

// Tiny in-module cache so the second collection's snapshot dispatch
// includes the latest from the first. Without this, a state update
// for records fires before categories have arrived, momentarily
// clearing the categories list.
//
// Caveat: this cache assumes a single active subscription at a time.
const cache = {
  incomeRecords: null,
  incomeSources: null,
  expenditureRecords: null,
  expenseCategories: null,
  investmentRecords: null,
  investmentCategories: null,
};

export function subscribeUserData(uid, dispatch) {
  const db = getFirebaseDb();
  const unsubs = [];
  const onError = (label) => (err) => {
    const message = err instanceof Error ? err.message : String(err);
    dispatch(showError(`${label}: ${message}`));
  };

  unsubs.push(
    onSnapshot(
      query(collection(db, PATHS.incomeSources(uid))),
      (snap) => {
        const sources = snap.docs.map((d) => ({
          id: d.id,
          name: (d.data().name) || '',
        }));
        dispatch(incomeSnapshot({ records: cache.incomeRecords || [], sources }));
        cache.incomeSources = sources;
      },
      onError('Income sources'),
    ),
  );
  unsubs.push(
    onSnapshot(
      query(collection(db, PATHS.incomeRecords(uid))),
      (snap) => {
        const records = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            amount: (data.amount) || 0,
            date: (data.date) || '',
            sourceId: (data.sourceId) || null,
            notes: (data.notes) || '',
          };
        });
        dispatch(incomeSnapshot({ records, sources: cache.incomeSources || [] }));
        cache.incomeRecords = records;
      },
      onError('Income records'),
    ),
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, PATHS.expenseCategories(uid))),
      (snap) => {
        const categories = snap.docs.map((d) => ({
          id: d.id,
          name: (d.data().name) || '',
        }));
        dispatch(
          expenditureSnapshot({
            records: cache.expenditureRecords || [],
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
        const records = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            amount: (data.amount) || 0,
            date: (data.date) || '',
            categoryId: (data.categoryId) || null,
            notes: (data.notes) || '',
          };
        });
        dispatch(
          expenditureSnapshot({
            records,
            categories: cache.expenseCategories || [],
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
        const categories = snap.docs.map((d) => ({
          id: d.id,
          name: (d.data().name) || '',
        }));
        dispatch(
          investmentsSnapshot({
            records: cache.investmentRecords || [],
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
        const records = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            amount: (data.amount) || 0,
            date: (data.date) || '',
            categoryId: (data.categoryId) || null,
            notes: (data.notes) || '',
          };
        });
        dispatch(
          investmentsSnapshot({
            records,
            categories: cache.investmentCategories || [],
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

function recordsPath(uid, kind) {
  switch (kind) {
    case 'income':
      return PATHS.incomeRecords(uid);
    case 'expenditure':
      return PATHS.expenditureRecords(uid);
    case 'investment':
      return PATHS.investments(uid);
    default:
      return '';
  }
}

function categoriesPath(uid, kind) {
  switch (kind) {
    case 'income':
      return PATHS.incomeSources(uid);
    case 'expenditure':
      return PATHS.expenseCategories(uid);
    case 'investment':
      return PATHS.investmentCategories(uid);
    default:
      return '';
  }
}

export async function addRecord(uid, kind, input) {
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

export async function updateRecord(uid, kind, id, patch) {
  const db = getFirebaseDb();
  const ref = doc(db, recordsPath(uid, kind), id);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteRecord(uid, kind, id) {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, recordsPath(uid, kind), id));
}

export async function addCategory(uid, kind, input) {
  const db = getFirebaseDb();
  const ref = await addDoc(collection(db, categoriesPath(uid, kind)), {
    name: input.name,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function renameCategory(uid, kind, id, name) {
  const db = getFirebaseDb();
  await updateDoc(doc(db, categoriesPath(uid, kind), id), { name });
}

export async function deleteCategory(uid, kind, id) {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, categoriesPath(uid, kind), id));
}

export function _setRecordWithId(uid, kind, id, data) {
  const db = getFirebaseDb();
  return setDoc(doc(db, recordsPath(uid, kind), id), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
