# myexpense-log — Project Spec

A personal finance tracker with three kinds of entries: income,
expenditure, investment. Net worth is calculated from these entries.

## 1. Data model

```
users/{uid}/
├── income_sources/
├── income_records/         # amount, date, sourceId, notes
├── expense_categories/
├── expenditure_records/    # amount, date, categoryId, notes
├── investment_categories/
└── investments/            # amount, date, categoryId, notes
```

## 2. Categories

Each type has its own category list (`income_sources`, `expense_categories`,
`investment_categories`) — not shared across types.

Picking a category is optional. An entry with none selected is tagged
"Other" for its own type at read time — an uncategorized expense is "Other"
expense, not lumped in with "Other" income. "Other" isn't a real document to
create or delete; it's the fallback label whenever `categoryId` (or
`sourceId`) is empty. Dashboard breakdowns group these under "Other" rather
than dropping them.

## 3. Net worth

Derived, not stored:

```
net worth = Σ(income_records.amount) − Σ(expenditure_records.amount) − Σ(investments.amount)
```

Recomputed from the full history every time it's shown (e.g. on Dashboard
load) rather than tracked as a running total.

## 4. Pages

| Route | Page | Notes |
|---|---|---|
| `/login` | Login | Firebase email/password auth |
| `/` | Dashboard | Shows net worth (§3), income/expense/investment breakdowns by category, lifetime/monthly/yearly views |
| `/income` | Income | Log income entries; manage income sources; optional category |
| `/expenditure` | Expenditure | Log expense entries; manage expense categories; optional category |
| `/investments` | Investments | Log investment entries; manage investment categories; optional category |

## 5. Open questions

1. **Does a unified ledger collection (e.g. `transactions/`) exist**, giving
   Dashboard one place to read everything, or does Dashboard read the three
   collections (`income_records`, `expenditure_records`, `investments`)
   directly? Undecided.
2. **Any validation on entries** — e.g. warn on negative net worth, or none
   at all? Undecided.

---

*Update this doc as decisions land — "Open questions" is the current
backlog, not permanent unknowns.*
