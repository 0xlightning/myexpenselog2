import { describe, expect, it } from 'vitest';
import { fromInputDate, toInputDate } from './dates';
import { validateCategoryName, validateRecord } from './validation';

describe('dates', () => {
  it('toInputDate extracts YYYY-MM-DD from ISO UTC midnight', () => {
    expect(toInputDate('2026-01-15T00:00:00.000Z')).toBe('2026-01-15');
  });

  it('toInputDate returns empty for null/undefined/invalid', () => {
    expect(toInputDate(null)).toBe('');
    expect(toInputDate(undefined)).toBe('');
    expect(toInputDate('not a date')).toBe('');
  });

  it('fromInputDate produces UTC midnight ISO', () => {
    expect(fromInputDate('2026-01-15')).toBe('2026-01-15T00:00:00.000Z');
  });

  it('fromInputDate throws on invalid', () => {
    expect(() => fromInputDate('not a date')).toThrow();
  });

  it('roundtrips through both helpers', () => {
    const original = '2026-07-09T00:00:00.000Z';
    expect(fromInputDate(toInputDate(original))).toBe(original);
  });
});

describe('validation', () => {
  it('validates a fresh record', () => {
    const r = validateRecord({ amount: 1, date: '2026-01-15' });
    expect(r.ok).toBe(true);
  });

  it('rejects non-positive amount', () => {
    const r = validateRecord({ amount: 0, date: '2026-01-15' });
    expect(r.ok).toBe(false);
  });

  it('validates category name', () => {
    expect(validateCategoryName('Groceries').ok).toBe(true);
    expect(validateCategoryName('').ok).toBe(false);
  });
});
