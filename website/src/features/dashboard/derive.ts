import type { RecordKind } from '../records/kindMeta';

export interface CategoryLike {
  id: string;
  name: string;
}

export interface RecordLike {
  id: string;
  amount: number;
  date: string;
  notes: string;
}

export type BreakdownItem = {
  categoryId: string | null;
  label: string;
  amount: number;
  isOther: boolean;
};

export interface NetWorth {
  income: number;
  expenditure: number;
  investments: number;
  total: number;
}

export type DateRange =
  | { mode: 'lifetime' }
  | { mode: 'yearly'; year: number }
  | { mode: 'monthly'; year: number; month: number };

export function netWorth(
  income: RecordLike[],
  expenditure: RecordLike[],
  investments: RecordLike[],
): NetWorth {
  const sum = (xs: RecordLike[]): number =>
    xs.reduce((s, r) => s + (Number.isFinite(r.amount) ? r.amount : 0), 0);
  const inc = sum(income);
  const exp = sum(expenditure);
  const inv = sum(investments);
  return {
    income: inc,
    expenditure: exp,
    investments: inv,
    total: inc - exp - inv,
  };
}

function categoryFieldFor(kind: RecordKind): 'sourceId' | 'categoryId' {
  return kind === 'income' ? 'sourceId' : 'categoryId';
}

function otherLabelFor(kind: RecordKind): string {
  switch (kind) {
    case 'income':
      return 'Other income';
    case 'expenditure':
      return 'Other expense';
    case 'investment':
      return 'Other investment';
  }
}

export function breakdownByCategory(
  records: RecordLike[],
  categories: CategoryLike[],
  kind: RecordKind,
): BreakdownItem[] {
  const field = categoryFieldFor(kind);
  const otherLabel = otherLabelFor(kind);
  const catById = new Map(categories.map((c) => [c.id, c.name]));

  const buckets = new Map<string | null, number>();
  for (const r of records) {
    const raw = (r as unknown as Record<string, unknown>)[field] as
      | string
      | null
      | undefined;
    const key = raw && catById.has(raw) ? raw : null;
    buckets.set(key, (buckets.get(key) ?? 0) + r.amount);
  }

  const items: BreakdownItem[] = [];
  for (const c of categories) {
    const amount = buckets.get(c.id) ?? 0;
    if (amount <= 0) continue;
    items.push({ categoryId: c.id, label: c.name, amount, isOther: false });
    buckets.delete(c.id);
  }
  const otherAmount = buckets.get(null) ?? 0;
  if (otherAmount > 0) {
    items.push({
      categoryId: null,
      label: otherLabel,
      amount: otherAmount,
      isOther: true,
    });
  }
  items.sort((a, b) => b.amount - a.amount);
  return items;
}

export function inRange(record: RecordLike, range: DateRange): boolean {
  if (range.mode === 'lifetime') return true;
  const d = new Date(record.date);
  if (Number.isNaN(d.getTime())) return true;
  if (range.mode === 'yearly') return d.getUTCFullYear() === range.year;
  return d.getUTCFullYear() === range.year && d.getUTCMonth() === range.month;
}

export function availableYears(...lists: RecordLike[][]): number[] {
  const set = new Set<number>();
  const current = new Date().getUTCFullYear();
  set.add(current);
  for (const list of lists) {
    for (const r of list) {
      const d = new Date(r.date);
      const y = d.getUTCFullYear();
      if (!Number.isNaN(y)) set.add(y);
    }
  }
  return Array.from(set).sort((a, b) => b - a);
}
