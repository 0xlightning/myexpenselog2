export type RecordKind = 'income' | 'expenditure' | 'investment';

export interface KindMeta {
  kind: RecordKind;
  label: string;
  singular: string;
  plural: string;
  categoryNoun: string;
  categoryField: 'sourceId' | 'categoryId';
  otherLabel: string;
}

export const KIND_META: Record<RecordKind, KindMeta> = {
  income: {
    kind: 'income',
    label: 'Income',
    singular: 'income',
    plural: 'incomes',
    categoryNoun: 'source',
    categoryField: 'sourceId',
    otherLabel: 'Other income',
  },
  expenditure: {
    kind: 'expenditure',
    label: 'Expenditure',
    singular: 'expense',
    plural: 'expenses',
    categoryNoun: 'category',
    categoryField: 'categoryId',
    otherLabel: 'Other expense',
  },
  investment: {
    kind: 'investment',
    label: 'Investments',
    singular: 'investment',
    plural: 'investments',
    categoryNoun: 'category',
    categoryField: 'categoryId',
    otherLabel: 'Other investment',
  },
};
