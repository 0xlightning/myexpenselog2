
/**
 * Date utilities. The form's <input type="date"> returns YYYY-MM-DD.
 * Firestore stores ISO strings. Dashboard needs year/month buckets.
 *
 * Convention: every record's `date` is a UTC midnight ISO string
 * (e.g. "2026-01-15T00:00:00.000Z"). This keeps timezone math
 * predictable for monthly/yearly groupings.
 */

export function toInputDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function fromInputDate(yyyyMmDd) {
  const d = new Date(yyyyMmDd);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${yyyyMmDd}`);
  }
  return d.toISOString();
}

export function formatForDisplay(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatAmount(value) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}
