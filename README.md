# myexpense-log

A personal finance tracker. Three kinds of entries — **income**,
**expenditure**, **investment** — and a derived **net worth** total
computed from the full history on every Dashboard load.

Free-tier Firebase: Auth (email/password), Firestore, Hosting. No
backend, no Cloud Functions, no paid services.

## Source specs

- `docs/PROJECT.md` — canonical project reference (data model, stack,
  decisions, directory tree, open gaps)
- `website/CLAUDE.md` — operational index for Claude Code in the app

## Stack

- **Build:** Create React App 5 (`react-scripts`)
- **UI:** React 19, react-router v7
- **State:** Redux Toolkit (slices per feature; `onSnapshot` → slice, no
  manual dual-sync)
- **Styling:** Tailwind v3 + PostCSS; design tokens in
  `src/styles/tokens.css` (OKLCH custom properties)
- **UI primitives:** shadcn-style components hand-copied into
  `src/components/ui/`
- **Backend:** Firebase — Auth + Firestore + Hosting (free plan)
- **Charts:** recharts
- **Toasts:** sonner
- **Forms:** react-hook-form + zod + `@hookform/resolvers`
- **Tests:** `react-scripts test` (Jest + Testing Library)

## Local dev

```bash
cd website
cp .env.local.example .env.local   # create this file — see Firebase section
# fill in REACT_APP_FIREBASE_* values
npm install
npm start                            # http://localhost:3000
```

## Firebase setup

1. Create a Firebase project (free Spark plan).
2. Enable **Email/Password** sign-in under Authentication.
3. Create a Firestore database (Native mode, any region).
4. Copy the web app config from Project Settings → Your apps.
5. Add to `website/.env.local`:
   ```
   REACT_APP_FIREBASE_API_KEY=...
   REACT_APP_FIREBASE_AUTH_DOMAIN=...
   REACT_APP_FIREBASE_PROJECT_ID=...
   REACT_APP_FIREBASE_STORAGE_BUCKET=...
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
   REACT_APP_FIREBASE_APP_ID=...
   ```
6. **Firestore Security Rules must be written and tested before any
   production data lands.** See `website/firestore.rules` (to be
   restored) and the test suite in `src/lib/firestore.rules.test.js`.

## Scripts

```bash
npm start         # CRA dev server
npm test          # Jest + Testing Library (watch mode)
npm run build     # production build → website/build/
npm run eject     # one-way — exposes webpack/Babel/ESLint config
```

## Deploy

Push to `main` triggers GitHub Actions → Firebase Hosting. The deploy
workflow (`.github/workflows/deploy.yml`) and the Firebase service
account secret are **not yet configured** — see
`docs/technology.md` §8c.

## Data model

```
users/{uid}/
├── income_sources/          # { name, createdAt }
├── income_records/          # { amount, date, sourceId|null, notes }
├── expense_categories/      # { name, createdAt }
├── expenditure_records/     # { amount, date, categoryId|null, notes }
├── investment_categories/   # { name, createdAt }
└── investments/             # { amount, date, categoryId|null, notes }
```

Three separate collections, not a unified `transactions/`. Optional
`categoryId` / `sourceId` falls back to "Other" at read time — never a
stored document.

## License

Personal project. No license granted.
