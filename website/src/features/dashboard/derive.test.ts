import { describe, expect, it } from 'vitest';
import {
  availableYears,
  breakdownByCategory,
  inRange,
  netWorth,
  type RecordLike,
} from './derive';

const r = (
  id: string,
  amount: number,
  date: string,
  sourceId: string | null = null,
  categoryId: string | null = null,
): RecordLike & {
  sourceId?: string | null;
  categoryId?: string | null;
} => ({ id, amount, date, notes: '', sourceId, categoryId });

describe('netWorth', () => {
  it('sums and subtracts', () => {
    const nw = netWorth(
      [r('i1', 1000, '2026-01-01')],
      [r('e1', 200, '2026-01-02'), r('e2', 100, '2026-01-03')],
      [r('v1', 50, '2026-01-04')],
    );
    expect(nw.income).toBe(1000);
    expect(nw.expenditure).toBe(300);
    expect(nw.investments).toBe(50);
    expect(nw.total).toBe(650);
  });

  it('handles empty lists', () => {
    const nw = netWorth([], [], []);
    expect(nw.total).toBe(0);
  });

  it('tolerates bad amount values', () => {
    const nw = netWorth(
      [
        r('i1', 100, '2026-01-01'),
        { id: 'i2', amount: NaN, date: '2026-01-01', notes: '' },
      ],
      [],
      [],
    );
    expect(nw.income).toBe(100);
  });
});

describe('breakdownByCategory (income)', () => {
  it('groups by source, falls back to "Other income"', () => {
    const cats = [
      { id: 'salary', name: 'Salary' },
      { id: 'gift', name: 'Gift' },
    ];
    const records = [
      r('i1', 500, '2026-01-01', 'salary'),
      r('i2', 100, '2026-01-02', 'salary'),
      r('i3', 50, '2026-01-03', 'gift'),
      r('i4', 25, '2026-01-04', null),
    ];
    const out = breakdownByCategory(records, cats, 'income');
    expect(out).toHaveLength(3);
    expect(out[0]).toMatchObject({ label: 'Salary', amount: 600, isOther: false });
    expect(out[1]).toMatchObject({ label: 'Gift', amount: 50, isOther: false });
    expect(out[2]).toMatchObject({
      label: 'Other income',
      amount: 25,
      isOther: true,
    });
  });

  it('skips categories with zero amount', () => {
    const cats = [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ];
    const records = [r('i1', 100, '2026-01-01', 'a')];
    const out = breakdownByCategory(records, cats, 'income');
    expect(out).toHaveLength(1);
    expect(out[0].label).toBe('A');
  });

  it('uses expense-specific "Other" label for expenditure', () => {
    const records = [r('e1', 50, '2026-01-01', null, null)];
    const out = breakdownByCategory(records, [], 'expenditure');
    expect(out[0].label).toBe('Other expense');
  });

  it('uses investment-specific "Other" label for investment', () => {
    const records = [r('v1', 50, '2026-01-01', null, null)];
    const out = breakdownByCategory(records, [], 'investment');
    expect(out[0].label).toBe('Other investment');
  });

  it('records pointing to a deleted category fall back to Other', () => {
    const cats = [{ id: 'salary', name: 'Salary' }];
    const records = [r('i1', 100, '2026-01-01', 'deleted-id')];
    const out = breakdownByCategory(records, cats, 'income');
    expect(out).toHaveLength(1);
    expect(out[0].label).toBe('Other income');
  });
});

describe('inRange', () => {
  const rec = r('i1', 100, '2026-03-15');

  it('lifetime includes everything', () => {
    expect(inRange(rec, { mode: 'lifetime' })).toBe(true);
  });

  it('yearly matches year', () => {
    expect(inRange(rec, { mode: 'yearly', year: 2026 })).toBe(true);
    expect(inRange(rec, { mode: 'yearly', year: 2025 })).toBe(false);
  });

  it('monthly matches year+month', () => {
    expect(inRange(rec, { mode: 'monthly', year: 2026, month: 2 })).toBe(true);
    expect(inRange(rec, { mode: 'monthly', year: 2026, month: 1 })).toBe(false);
  });

  it('unparseable dates are kept in lifetime, dropped elsewhere', () => {
    const bad = r('x', 1, 'not a date');
    expect(inRange(bad, { mode: 'lifetime' })).toBe(true);
    expect(inRange(bad, { mode: 'yearly', year: 2026 })).toBe(true);
  });
});

describe('availableYears', () => {
  it('includes current year even with no data', () => {
    const years = availableYears([], [], []);
    expect(years).toContain(new Date().getUTCFullYear());
  });

  it('collects distinct years across all three record lists, desc', () => {
    const years = availableYears(
      [r('i1', 1, '2024-05-01')],
      [r('e1', 1, '2025-05-01')],
      [r('v1', 1, '2026-05-01')],
    );
    expect(years[0]).toBeGreaterThanOrEqual(2026);
    expect(years).toContain(2024);
    expect(years).toContain(2025);
  });
});
