import { describe, expect, it } from 'vitest';
import { validateRecord, validateCategoryName } from './validation';

describe('validateRecord', () => {
  it('accepts a valid record', () => {
    const result = validateRecord({
      amount: 100,
      date: '2026-01-15',
      notes: 'salary',
    });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('rejects amount of 0', () => {
    const result = validateRecord({ amount: 0, date: '2026-01-15' });
    expect(result.ok).toBe(false);
    expect(result.errors.amount).toBeDefined();
  });

  it('rejects negative amount', () => {
    const result = validateRecord({ amount: -5, date: '2026-01-15' });
    expect(result.ok).toBe(false);
    expect(result.errors.amount).toBeDefined();
  });

  it('rejects non-numeric amount', () => {
    const result = validateRecord({ amount: 'abc', date: '2026-01-15' });
    expect(result.ok).toBe(false);
    expect(result.errors.amount).toBeDefined();
  });

  it('rejects NaN amount', () => {
    const result = validateRecord({ amount: NaN, date: '2026-01-15' });
    expect(result.ok).toBe(false);
    expect(result.errors.amount).toBeDefined();
  });

  it('rejects unparseable date', () => {
    const result = validateRecord({ amount: 1, date: 'not a date' });
    expect(result.ok).toBe(false);
    expect(result.errors.date).toBeDefined();
  });

  it('rejects non-string date', () => {
    const result = validateRecord({ amount: 1, date: 12345 });
    expect(result.ok).toBe(false);
    expect(result.errors.date).toBeDefined();
  });

  it('allows empty notes', () => {
    const result = validateRecord({ amount: 1, date: '2026-01-15', notes: '' });
    expect(result.ok).toBe(true);
  });

  it('rejects overly long notes', () => {
    const result = validateRecord({
      amount: 1,
      date: '2026-01-15',
      notes: 'a'.repeat(2001),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.notes).toBeDefined();
  });
});

describe('validateCategoryName', () => {
  it('accepts a normal name', () => {
    expect(validateCategoryName('Groceries').ok).toBe(true);
  });

  it('rejects empty', () => {
    const r = validateCategoryName('   ');
    expect(r.ok).toBe(false);
    expect(r.errors.name).toBeDefined();
  });

  it('rejects non-string', () => {
    expect(validateCategoryName(42).ok).toBe(false);
  });

  it('rejects overly long', () => {
    expect(validateCategoryName('a'.repeat(81)).ok).toBe(false);
  });
});
