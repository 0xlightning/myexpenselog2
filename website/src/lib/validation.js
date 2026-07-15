
const MAX_NOTES = 2000;

export function validateRecord(input) {
  const errors = {};

  const amount = input.amount;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    errors.amount = 'Amount must be a number greater than 0';
  }

  const date = input.date;
  if (typeof date !== 'string' || Number.isNaN(Date.parse(date))) {
    errors.date = 'Date must be a valid parseable date';
  }

  if (input.notes !== undefined && input.notes !== null && input.notes !== '') {
    if (typeof input.notes !== 'string') {
      errors.notes = 'Notes must be text';
    } else if (input.notes.length > MAX_NOTES) {
      errors.notes = `Notes must be ${MAX_NOTES} characters or fewer`;
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateCategoryName(name) {
  const errors = {};
  if (typeof name !== 'string' || name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (name.length > 80) {
    errors.name = 'Name must be 80 characters or fewer';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}
