import * as React from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { useAppSelector } from '../../app/hooks';
import type { RootState } from '../../app/store';
import {
  addCategory,
  addRecord,
  deleteCategory,
  deleteRecord,
  renameCategory,
  updateRecord,
  type NewRecordInput,
} from '../../lib/firestore';
import { validateCategoryName, validateRecord } from '../../lib/validation';
import {
  fromInputDate,
  formatAmount,
  formatForDisplay,
  toInputDate,
} from '../../lib/dates';
import { KIND_META, type RecordKind } from './kindMeta';

interface RecordPageProps {
  kind: RecordKind;
}

type CategorySlice = {
  records: Array<{
    id: string;
    amount: number;
    date: string;
    sourceId?: string | null;
    categoryId?: string | null;
    notes: string;
  }>;
  categories: Array<{ id: string; name: string }>;
  status: 'idle' | 'loading' | 'ready' | 'error';
};

function selectSlice(state: RootState, kind: RecordKind): CategorySlice {
  switch (kind) {
    case 'income':
      return state.income as unknown as CategorySlice;
    case 'expenditure':
      return state.expenditure as unknown as CategorySlice;
    case 'investment':
      return state.investments as unknown as CategorySlice;
  }
}

interface FormState {
  amount: string;
  date: string;
  categoryId: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  amount: '',
  date: '',
  categoryId: '',
  notes: '',
};

function recordToForm(
  r: CategorySlice['records'][number],
  categoryField: 'sourceId' | 'categoryId',
): FormState {
  return {
    amount: String(r.amount),
    date: toInputDate(r.date),
    categoryId: (r[categoryField] as string | null) ?? '',
    notes: r.notes ?? '',
  };
}

export function RecordPage({ kind }: RecordPageProps): JSX.Element {
  const meta = KIND_META[kind];
  const auth = useAppSelector((s: RootState) => s.auth);
  const slice = useAppSelector((s: RootState) => selectSlice(s, kind));
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [showCategoryManager, setShowCategoryManager] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const [categoryError, setCategoryError] = React.useState<string | null>(null);

  const uid = auth.user?.uid;

  function resetForm(): void {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError(null);
  }

  function startEdit(id: string): void {
    const r = slice.records.find((x) => x.id === id);
    if (!r) return;
    setForm(recordToForm(r, meta.categoryField));
    setEditingId(id);
  }

  async function onSubmitRecord(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!uid) return;
    setFormError(null);
    const amountNum = Number(form.amount);
    const v = validateRecord({
      amount: amountNum,
      date: fromInputDate(form.date),
      notes: form.notes,
    });
    if (!v.ok) {
      setFormError(Object.values(v.errors).join('; '));
      return;
    }
    const payload: NewRecordInput = {
      amount: amountNum,
      date: fromInputDate(form.date),
      categoryId: form.categoryId || null,
      notes: form.notes,
    };
    try {
      if (editingId) {
        await updateRecord(uid, kind, editingId, payload);
      } else {
        await addRecord(uid, kind, payload);
      }
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save');
    }
  }

  async function onDeleteRecord(id: string): Promise<void> {
    if (!uid) return;
    if (!window.confirm('Delete this entry?')) return;
    await deleteRecord(uid, kind, id);
    if (editingId === id) resetForm();
  }

  async function onAddCategory(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!uid) return;
    setCategoryError(null);
    const v = validateCategoryName(newCategoryName);
    if (!v.ok) {
      setCategoryError(v.errors.name ?? 'Invalid name');
      return;
    }
    try {
      await addCategory(uid, kind, { name: newCategoryName.trim() });
      setNewCategoryName('');
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : 'Failed to add');
    }
  }

  async function onRenameCategory(id: string, currentName: string): Promise<void> {
    if (!uid) return;
    const next = window.prompt('Rename', currentName);
    if (next === null) return;
    const v = validateCategoryName(next);
    if (!v.ok) {
      window.alert(v.errors.name ?? 'Invalid name');
      return;
    }
    await renameCategory(uid, kind, id, next.trim());
  }

  async function onDeleteCategory(id: string): Promise<void> {
    if (!uid) return;
    if (!window.confirm('Delete this category? Records using it fall back to "Other".')) {
      return;
    }
    await deleteCategory(uid, kind, id);
  }

  const sortedRecords = [...slice.records].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
  );
  const total = slice.records.reduce((s, r) => s + r.amount, 0);
  const isLoading = slice.status === 'idle' || slice.status === 'loading';

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{meta.label}</h1>
          <p className="text-sm text-muted-foreground">
            {slice.records.length}{' '}
            {slice.records.length === 1 ? meta.singular : meta.plural}
            {' · total '}
            {formatAmount(total)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCategoryManager((s) => !s)}
        >
          Manage {meta.categoryNoun}s
        </Button>
      </div>

      {showCategoryManager ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">
              {meta.label} {meta.categoryNoun}s
            </CardTitle>
            <CardDescription>
              Deleting a {meta.categoryNoun} leaves existing entries — they
              group under {meta.otherLabel}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <form onSubmit={onAddCategory} className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="new-cat" className="sr-only">
                  New {meta.categoryNoun} name
                </Label>
                <Input
                  id="new-cat"
                  placeholder={`New ${meta.categoryNoun} name`}
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>
              <Button type="submit">Add</Button>
            </form>
            {categoryError ? (
              <p className="text-sm text-destructive" role="alert">
                {categoryError}
              </p>
            ) : null}
            {slice.categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No {meta.categoryNoun}s yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {slice.categories.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span>{c.name}</span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRenameCategory(c.id, c.name)}
                      >
                        Rename
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteCategory(c.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">
            {editingId ? `Edit ${meta.singular}` : `Add ${meta.singular}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmitRecord} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category">
                {meta.categoryNoun.charAt(0).toUpperCase() + meta.categoryNoun.slice(1)}
              </Label>
              <select
                id="category"
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">{meta.otherLabel}</option>
                {slice.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            {formError ? (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="flex gap-2">
              <Button type="submit">
                {editingId ? 'Update' : 'Add'} {meta.singular}
              </Button>
              {editingId ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : sortedRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No {meta.plural} yet. Add one above.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {sortedRecords.map((r) => {
                const catId = (r as Record<string, unknown>)[meta.categoryField] as
                  | string
                  | null
                  | undefined;
                const cat = catId
                  ? slice.categories.find((c) => c.id === catId)?.name
                  : null;
                return (
                  <li
                    key={r.id}
                    className="flex items-center justify-between py-3 text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {formatAmount(r.amount)}{' '}
                        <span className="text-xs text-muted-foreground">
                          · {formatForDisplay(r.date)}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {cat ?? meta.otherLabel}
                        {r.notes ? ` · ${r.notes}` : ''}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(r.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteRecord(r.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
