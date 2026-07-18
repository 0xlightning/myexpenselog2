

function categoryFieldFor(kind) {
  return kind === 'income' ? 'sourceId' : 'categoryId';
}

function otherLabelFor(kind) {
  switch (kind) {
    case 'income':
      return 'Other income';
    case 'expenditure':
      return 'Other expense';
    case 'investment':
      return 'Other investment';
    default:
      return 'Other';
  }
}

export function netWorth(income, expenditure, investments) {
  const sum = (xs) =>
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

export function breakdownByCategory(records, categories, kind) {
  const field = categoryFieldFor(kind);
  const otherLabel = otherLabelFor(kind);
  const catById = new Map(categories.map((c) => [c.id, c.name]));

  const buckets = new Map();
  for (const r of records) {
    const raw = r[field];
    const key = raw && catById.has(raw) ? raw : null;
    buckets.set(key, (buckets.get(key) || 0) + r.amount);
  }

  const items = [];
  for (const c of categories) {
    const amount = buckets.get(c.id) || 0;
    if (amount <= 0) continue;
    items.push({ categoryId: c.id, label: c.name, amount, isOther: false });
    buckets.delete(c.id);
  }
  const otherAmount = buckets.get(null) || 0;
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

export function inRange(record, range) {
  if (range.mode === 'lifetime') return true;
  const d = new Date(record.date);
  if (Number.isNaN(d.getTime())) return true;
  if (range.mode === 'yearly') return d.getUTCFullYear() === range.year;
  return d.getUTCFullYear() === range.year && d.getUTCMonth() === range.month;
}

export function availableYears(...lists) {
  const set = new Set();
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
