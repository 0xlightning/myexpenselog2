
import * as React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Skeleton } from '../../components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { LedgerSection } from '../../components/LedgerSection';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import { useAppSelector } from '../../app/hooks';
import {
  addCategory,
  addRecord,
  deleteCategory,
  deleteRecord,
  renameCategory,
  updateRecord,
} from '../../lib/firestore';
import { validateCategoryName, validateRecord } from '../../lib/validation';
import {
  fromInputDate,
  formatAmount,
  formatForDisplay,
  toInputDate,
} from '../../lib/dates';
import { KIND_META } from './kindMeta';
import { cn } from '../../lib/utils';

const EMPTY_FORM = {
  amount: '',
  date: '',
  categoryId: '',
  notes: '',
};

const OTHER_VALUE = '__other__';
const toSelectValue = (id) => (id ? id : OTHER_VALUE);
const fromSelectValue = (v) => (v === OTHER_VALUE ? '' : v);

function recordToForm(r, categoryField) {
  return {
    amount: String(r.amount),
    date: toInputDate(r.date),
    categoryId: r[categoryField] || '',
    notes: r.notes || '',
  };
}

function selectSlice(state, kind) {
  switch (kind) {
    case 'income':
      return state.income;
    case 'expenditure':
      return state.expenditure;
    case 'investment':
      return state.investments;
    default:
      return state;
  }
}

function Field({ label, htmlFor, children, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label
        htmlFor={htmlFor}
        className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

function EntryRow({ record, category, otherLabel, onEdit, onDelete }) {
  return (
    <li className="group grid grid-cols-[1fr_auto] items-baseline gap-4 border-b border-ink/10 py-3 last:border-b-0">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="font-mono text-base font-medium tabular-nums text-foreground">
            {formatAmount(record.amount)}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {formatForDisplay(record.date)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <span className="text-ink">
            {(category && category.name) || otherLabel}
          </span>
          {record.notes ? (
            <span className="truncate text-muted-foreground">
              · {record.notes}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <Button
          type="button"
          variant="ledger"
          size="sm"
          aria-label="Edit entry"
          onClick={onEdit}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          Edit
        </Button>
        <Button
          type="button"
          variant="ledger"
          size="sm"
          aria-label="Delete entry"
          className="text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Delete
        </Button>
      </div>
    </li>
  );
}

export function RecordPage({ kind }) {
  const meta = KIND_META[kind];
  const auth = useAppSelector((s) => s.auth);
  const slice = useAppSelector((s) => selectSlice(s, kind));
  const [editingId, setEditingId] = React.useState(null);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [formError, setFormError] = React.useState(null);
  const [showCategoryManager, setShowCategoryManager] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const [categoryError, setCategoryError] = React.useState(null);

  const [renamingCategory, setRenamingCategory] = React.useState(null);
  const [renameInput, setRenameInput] = React.useState('');
  const [renameError, setRenameError] = React.useState(null);
  const [deletingCategoryId, setDeletingCategoryId] = React.useState(null);
  const [deletingRecordId, setDeletingRecordId] = React.useState(null);

  const uid = auth.user ? auth.user.uid : null;

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError(null);
  }

  function startEdit(id) {
    const r = slice.records.find((x) => x.id === id);
    if (!r) return;
    setForm(recordToForm(r, meta.categoryField));
    setEditingId(id);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  async function onSubmitRecord(e) {
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
    const payload = {
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

  function askDeleteRecord(id) {
    setDeletingRecordId(id);
  }

  async function confirmDeleteRecord() {
    if (!uid || !deletingRecordId) return;
    const id = deletingRecordId;
    setDeletingRecordId(null);
    await deleteRecord(uid, kind, id);
    if (editingId === id) resetForm();
  }

  async function onAddCategory(e) {
    e.preventDefault();
    if (!uid) return;
    setCategoryError(null);
    const v = validateCategoryName(newCategoryName);
    if (!v.ok) {
      setCategoryError(v.errors.name || 'Invalid name');
      return;
    }
    try {
      await addCategory(uid, kind, { name: newCategoryName.trim() });
      setNewCategoryName('');
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : 'Failed to add');
    }
  }

  function askRenameCategory(id, currentName) {
    setRenamingCategory({ id, name: currentName });
    setRenameInput(currentName);
    setRenameError(null);
  }

  function closeRenameDialog() {
    setRenamingCategory(null);
    setRenameInput('');
    setRenameError(null);
  }

  async function confirmRenameCategory() {
    if (!uid || !renamingCategory) return;
    const v = validateCategoryName(renameInput);
    if (!v.ok) {
      setRenameError(v.errors.name || 'Invalid name');
      return;
    }
    const { id } = renamingCategory;
    const next = renameInput.trim();
    closeRenameDialog();
    await renameCategory(uid, kind, id, next);
  }

  function askDeleteCategory(id) {
    setDeletingCategoryId(id);
  }

  async function confirmDeleteCategory() {
    if (!uid || !deletingCategoryId) return;
    const id = deletingCategoryId;
    setDeletingCategoryId(null);
    await deleteCategory(uid, kind, id);
  }

  const sortedRecords = slice.records.slice().sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
  );
  const total = slice.records.reduce((s, r) => s + r.amount, 0);
  const isLoading = slice.status === 'idle' || slice.status === 'loading';
  const deletingCategory = deletingCategoryId
    ? slice[meta.categoryStateKey].find((c) => c.id === deletingCategoryId)
    : null;

  return (
    <div className="container mx-auto max-w-2xl space-y-12 px-4 py-12 sm:py-16">
      <PageHeader
        eyebrow={kind}
        title={meta.label}
        description={`${slice.records.length} ${slice.records.length === 1 ? meta.singular : meta.plural
          } · total ${formatAmount(total)}`}
      >
        <Button
          variant="ledger"
          size="sm"
          onClick={() => setShowCategoryManager((s) => !s)}
        >
          {showCategoryManager
            ? '→ Done'
            : `→ Manage ${meta.categoryNoun}s`}
        </Button>
      </PageHeader>

      {showCategoryManager ? (
        <LedgerSection label={`${meta.categoryNoun}s`}>
          <div className="rounded-sm border border-ink/10 bg-card">
            <form
              onSubmit={onAddCategory}
              className="flex items-end gap-4 border-b border-ink/10 px-5 py-4"
            >
              <div className="flex-1">
                <Field
                  label={`new ${meta.categoryNoun}`}
                  htmlFor="new-cat"
                >
                  <Input
                    id="new-cat"
                    placeholder={`e.g. Salary, Groceries, Index fund`}
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                </Field>
              </div>
              <Button type="submit" variant="ink">
                Add {meta.categoryNoun}
              </Button>
            </form>
            {categoryError ? (
              <p
                className="border-b border-destructive/30 px-5 py-3 font-mono text-xs text-destructive"
                role="alert"
              >
                {categoryError}
              </p>
            ) : null}
            {slice[meta.categoryStateKey].length === 0 ? (
              <EmptyState
                title={`No ${meta.categoryNoun}s yet`}
                description={`Add your first ${meta.categoryNoun} above to start grouping entries.`}
                className="py-10"
              />
            ) : (
              <ul>
                {slice[meta.categoryStateKey].map((c) => (
                  <li
                    key={c.id}
                    className="group grid grid-cols-[1fr_auto] items-baseline gap-4 border-b border-ink/10 px-5 py-3 last:border-b-0"
                  >
                    <span className="font-sans text-sm text-foreground">
                      {c.name}
                    </span>
                    <div className="flex items-center gap-3 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <Button
                        type="button"
                        variant="ledger"
                        size="sm"
                        onClick={() => askRenameCategory(c.id, c.name)}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                        Rename
                      </Button>
                      <Button
                        type="button"
                        variant="ledger"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => askDeleteCategory(c.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </LedgerSection>
      ) : null}

      <LedgerSection label={editingId ? 'Edit entry' : 'New entry'}>
        <form
          onSubmit={onSubmitRecord}
          className="rounded-sm border border-ink/10 bg-card"
        >
          <div className="space-y-6 px-5 py-5">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field label="amount" htmlFor="amount">
                <Input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                />
              </Field>
              <Field label="date" htmlFor="date">
                <Input
                  id="date"
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
              </Field>
            </div>
            <Field
              label={meta.categoryNoun}
              htmlFor="category"
            >
              <Select
                value={toSelectValue(form.categoryId)}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, categoryId: fromSelectValue(v) }))
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder={meta.otherLabel} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={OTHER_VALUE}>{meta.otherLabel}</SelectItem>
                  {slice[meta.categoryStateKey].map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="notes" htmlFor="notes">
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Optional"
              />
            </Field>
            {formError ? (
              <p
                className="border-t border-destructive/40 pt-4 font-mono text-xs text-destructive"
                role="alert"
              >
                {formError}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-5">
              {editingId ? (
                <Button type="button" variant="ledger" onClick={resetForm}>
                  ← Cancel
                </Button>
              ) : (
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  saved to your account
                </span>
              )}
              <Button type="submit" variant="ink">
                {editingId ? 'Save changes' : `Add ${meta.singular}`}
              </Button>
            </div>
          </div>
        </form>
      </LedgerSection>

      <LedgerSection
        label="Entries"
        meta={`${sortedRecords.length}`}
        action={isLoading ? null : 'newest first'}
      >
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : sortedRecords.length === 0 ? (
          <div className="rounded-sm border border-ink/10 bg-card">
            <EmptyState
              title={`No ${meta.plural} yet`}
              description={`Add your first ${meta.singular} above to start the ledger.`}
            />
          </div>
        ) : (
          <div className="rounded-sm border border-ink/10 bg-card">
            <ul className="px-5">
              {sortedRecords.map((r) => {
                const catId = r[meta.categoryField];
                const cat = catId
                  ? slice[meta.categoryStateKey].find((c) => c.id === catId)
                  : null;
                return (
                  <EntryRow
                    key={r.id}
                    record={r}
                    category={cat}
                    otherLabel={meta.otherLabel}
                    onEdit={() => startEdit(r.id)}
                    onDelete={() => askDeleteRecord(r.id)}
                  />
                );
              })}
            </ul>
          </div>
        )}
      </LedgerSection>

      <AlertDialog
        open={deletingRecordId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingRecordId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteRecord}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={renamingCategory !== null}
        onOpenChange={(open) => {
          if (!open) closeRenameDialog();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename {meta.categoryNoun}</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new name for this {meta.categoryNoun}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Field label="name" htmlFor="rename-input">
            <Input
              id="rename-input"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  confirmRenameCategory();
                }
              }}
              autoFocus
            />
          </Field>
          {renameError ? (
            <p
              className="font-mono text-xs text-destructive"
              role="alert"
            >
              {renameError}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRenameCategory}>
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deletingCategoryId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingCategoryId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {meta.categoryNoun}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingCategory
                ? `Delete "${deletingCategory.name}"? Entries using it fall back to "${meta.otherLabel}".`
                : `Entries using this ${meta.categoryNoun} will fall back to "${meta.otherLabel}".`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCategory}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
