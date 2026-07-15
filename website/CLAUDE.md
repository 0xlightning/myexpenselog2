# CLAUDE.md — myexpense-log (website/)

Operational index for Claude Code inside the React app. The canonical
spec lives one level up:

- `../docs/PROJECT.md` — data model, stack, decisions, directory tree,
  open gaps. **Source of truth.**

This file is a **condensed working index**, not the source of truth. When in
doubt, the docs win.

---

## 1. Project

Personal finance tracker. Three entry types: **income, expenditure,
investment**. Net worth derived from these. Auth-gated SPA, single Firebase
project per user, free-tier only.

---

## 2. Stack lock (as actually built)

- **Build:** Create React App 5 (`react-scripts 5.0.1`). **Not Vite** —
  this is a deviation from `myexpense-log-build-plan.md` Phase 0; see
  `docs/technology.md` §8.1.
- **Language:** **JavaScript (ES modules)**, not TypeScript. The original
  TS source was stripped before commit. Files are `*.js` / `*.jsx`. Type
  hints may return via JSDoc. See `docs/technology.md` §8.7.
- **State:** Redux Toolkit (slices co-located with features; real-time
  data via `onSnapshot` → slice — **no manual dual-sync**).
- **Styling:** Tailwind CSS v3 utility-first; shadcn-style components
  hand-copied into `src/components/ui/`, no shadcn CLI.
- **UI tokens:** OKLCH CSS custom properties in `src/styles/tokens.css`
  (`:root` + `.dark`).
- **Backend:** Firebase — Auth (email/password), Firestore, Hosting.
  **Free-tier only.** No Cloud Functions, no Cloud Run, no paid upgrade.
- **Charts:** recharts. **Toasts:** sonner. **Forms:** react-hook-form +
  zod.
- **Env prefix:** `REACT_APP_FIREBASE_*` (CRA convention). See
  `src/lib/firebase.js`.
- **CI/CD:** GitHub Actions → Firebase Hosting via
  `FirebaseExtended/action-hosting-deploy` is the **plan**, but
  `.github/workflows/deploy.yml` does **not exist yet**. See
  `docs/technology.md` §8c for the open gaps.

---

## 3. Actual directory map (matches the code)

```
website/
├── public/
├── src/
│   ├── app/
│   │   ├── store.js
│   │   ├── hooks.js
│   │   └── uiSlice.js
│   ├── components/
│   │   ├── ui/                # shadcn-style primitives, hand-copied
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── input.jsx
│   │   │   ├── label.jsx
│   │   │   └── skeleton.jsx
│   │   ├── ErrorToast.jsx
│   │   ├── OnlineStatusBridge.jsx
│   │   └── ThemeToggle.jsx
│   ├── features/
│   │   ├── auth/              # login form, auth slice, AuthGate, Header
│   │   │   ├── authSlice.js
│   │   │   ├── AuthGate.jsx
│   │   │   ├── Header.jsx
│   │   │   └── LoginPage.jsx
│   │   ├── income/            # income slice
│   │   ├── expenditure/       # expenditure slice
│   │   ├── investments/       # investments slice
│   │   ├── records/           # generic <RecordPage kind="..."/>
│   │   │   ├── kindMeta.js
│   │   │   └── RecordPage.jsx
│   │   └── dashboard/         # net worth, breakdowns, charts
│   │       ├── derive.js
│   │       └── Dashboard.jsx
│   ├── lib/
│   │   ├── auth.js            # onAuthStateChanged wiring
│   │   ├── firebase.js        # single Firebase init (env-driven)
│   │   ├── firestore.js       # PATHS, subscribeUserData, CRUD helpers
│   │   ├── validation.js      # validateRecord, validateCategoryName
│   │   ├── dates.js
│   │   └── utils.js
│   ├── styles/
│   │   ├── index.css
│   │   └── tokens.css         # OKLCH :root + .dark
│   ├── App.js
│   ├── App.css
│   ├── App.test.js
│   ├── index.js
│   ├── index.css
│   ├── logo.svg
│   ├── reportWebVitals.js
│   └── setupTests.js
├── ARCHITECTURE.md            # current tree, target tree
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json              # CRA-generated, unused (no TS sources)
```

The previously-published target structure (`src/hooks/`, `src/services/`,
`src/pages/`, `src/assets/`, `src/components/layout/`, `src/components/shared/`,
`src/lib/firebase/`, `src/lib/utils/`, `src/lib/constants/`) is **not in
place**. Do not assume those folders exist.

---

## 4. Data model

All paths scoped per authenticated user. Three separate collections — **not**
a unified `transactions/` collection (Phase 0 decision, locked).

```
users/{uid}/
├── income_sources/          # { name, createdAt }
├── income_records/          # { amount, date, sourceId|null, notes }
├── expense_categories/      # { name, createdAt }
├── expenditure_records/     # { amount, date, categoryId|null, notes }
├── investment_categories/   # { name, createdAt }
└── investments/             # { amount, date, categoryId|null, notes }
```

- `amount`: number, **> 0**.
- `date`: ISO string, parseable.
- `categoryId` / `sourceId`: optional. `null`/missing ⇒ "Other" at read
  time (see §5). Never a stored doc.
- Timestamps: `createdAt`, `updatedAt` (Firestore `serverTimestamp()`).
- `notes`: optional string, **max 2000 characters** (the previously
  published "no length cap in v1" was wrong — `validation.js` enforces
  2000).

---

## 5. "Other" fallback rule

Empty `categoryId` / `sourceId` displays and groups as **"Other"** for its
**own** entry type at **read time** — never a real document, never a
create/delete target, never lumped across types.

- An uncategorized expense groups as "Other expense".
- An uncategorized income groups as "Other income".
- An uncategorized investment groups as "Other investment".

Deleting a category is allowed even if records reference it — those records
silently fall back to "Other". `breakdownByCategory` in
`src/features/dashboard/derive.js` implements this.

---

## 6. Net worth

Derived, not stored. Recompute on every Dashboard load:

```
net worth = Σ(income_records.amount)
          − Σ(expenditure_records.amount)
          − Σ(investments.amount)
```

No running total, no cached field. `netWorth()` in
`src/features/dashboard/derive.js` reads from the three record collections
in Redux and returns `{ income, expenditure, investments, total }`. Within
a type, group/sum by `categoryId` (with "Other" fallback) for the
breakdowns view.

---

## 7. Routes

| Path | Page | Guard |
|---|---|---|
| `/login` | Login (email/password sign-in + sign-up) | public |
| `/` | Dashboard — net worth, breakdowns, lifetime/monthly/yearly toggle | auth |
| `/income` | `<RecordPage kind="income" />` | auth |
| `/expenditure` | `<RecordPage kind="expenditure" />` | auth |
| `/investments` | `<RecordPage kind="investment" />` | auth |

Unauthenticated visits to guarded routes ⇒ redirect to `/login`
(`<AuthGate>` in `src/features/auth/AuthGate.jsx`).

---

## 8. Validation (Phase 0 decision, locked)

Client-side, before any Firestore write, enforced in
`src/lib/validation.js`:

- `amount > 0` (reject 0, negative, `NaN`, non-numbers).
- `date` is a valid parseable date.
- `notes` optional, free text, **max 2000 characters**.
- `categoryId` / `sourceId` optional, null is valid.

No negative-net-worth warnings in v1 (fast-follow).

---

## 9. Security rules

Firestore Security Rules are the **only** access-control layer (no
backend). **Rules file is missing from the working tree** — see
`docs/technology.md` §8c. The intended shape is:

```
match /users/{uid}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

- **Never** `allow read, write: if true;` in production.
- Rules must be tested with the **Firestore emulator** before go-live.
- Negative test: a second signed-in user cannot read or write the first
  user's data.

---

## 10. Free-tier quotas

- ~50K Firestore reads/day.
- ~20K writes/day.
- 1 GiB storage.

The current implementation mounts **six `onSnapshot` listeners per
signed-in user** for the session lifetime (one per collection, registered
in `subscribeUserData`). That's fine at v1 scale but must not grow. Don't
add new unbounded listeners from pages.

---

## 11. Conventions

- **JavaScript, ES modules.** No TypeScript. No `any` to worry about.
  Strict mode is whatever ESLint's `react-app` preset enforces.
- **Tailwind for all styling** — no inline `style={}`, no CSS modules.
- **shadcn-style for components** — hand-copied in `src/components/ui/`.
- **Co-locate** — feature components/hooks/store next to the feature.
- **No secrets in repo** — `.env.local` is gitignored; CI reads GitHub
  Actions secrets (when the workflow file is restored).
- **Tests** — Jest + Testing Library (via `react-scripts test`);
  `*.test.js(x)` next to source.
- **Commit format** — `phase-N: <verb> <thing>` (e.g.
  `phase-1: scaffold cra + react + js`).
- **Lint/format** — ESLint defaults from CRA; `pnpm lint` and
  `pnpm test` should pass before each phase's deliverable check.

---

## 12. Loop protocol (READ ON EVERY `/loop` ITERATION)

The build plan is split into Phase 0 → Phase 6. The loop walks them in
order, one per iteration, and stops on a hard condition.

### State

Progress is tracked by **marker files** in `website/`:

```
website/.phase-0.done   # decisions locked
website/.phase-1.done   # scaffold + CI/CD
website/.phase-2.done   # auth
website/.phase-3.done   # firestore + security rules
website/.phase-4.done   # income/expenditure/investments pages
website/.phase-5.done   # dashboard
website/.phase-6.done   # polish
```

To inspect: `Get-ChildItem website/.phase-*.done` (PowerShell) /
`ls website/.phase-*.done` (POSIX). To reset a phase: delete its marker.

### Per-iteration steps

1. **Load context.** Read this file end-to-end.
2. **Find next phase.** Scan `website/.phase-*.done`. `next = max(completed)
   + 1`, or `0` if none. If `next > 6`, emit `ALL_PHASES_COMPLETE` and
   stop.
3. **Read the phase spec.** Open `../docs/myexpense-log-build-plan.md` and
   re-read the section for `next` plus the relevant chunks of
   `../docs/Project-spec.md` and `../docs/technology.md`. Don't re-load
   the whole doc — keep the prompt tight.
4. **Stop conditions before work:**
   - Phase 0 must NOT proceed to coding until the user confirms the
     Vite-vs-CRA decision. **The current answer is: CRA, JavaScript.**
     Do not re-ask unless the user signals a change.
   - If the user typed anything other than the loop command (e.g.
     `stop`, `help`, a question, or a non-phase message), emit
     `LOOP_HALTED` and stop.
5. **Execute the phase** — run the steps in the build plan for `next`.
6. **Run the deliverable check** at the end of the phase in the build
   plan. Lint, tests, and the manual check must pass.
7. **Outcome:**
   - **Pass** → write `website/.phase-N.done` (PowerShell:
     `New-Item -ItemType File website/.phase-N.done`; POSIX:
     `touch website/.phase-N.done`). Report `PHASE N COMPLETE` with a
     short diff summary (files added/changed, test result, deploy status
     if applicable). Continue to next iteration.
   - **Fail / blocked** → do **not** mark complete. Emit
     `PHASE N BLOCKED: <one-line reason>` listing the failing check or
     missing input. Stop the loop, surface to the user.
   - **User interrupted** → emit `LOOP_HALTED`, stop.

### Stop conditions (any one ends the loop)

- `ALL_PHASES_COMPLETE` — phases 0 through 6 all done.
- `PHASE N BLOCKED: <reason>` — deliverable failed, ambiguity surfaced,
  or dependency missing.
- `LOOP_HALTED` — user typed `stop` / `help` / a question mid-loop.
- User runs `/exit` or closes the session.

### Invocation

```
/loop "Execute the next incomplete phase of website/CLAUDE.md. Follow
the loop protocol in that file. Stop only on ALL_PHASES_COMPLETE,
PHASE N BLOCKED, or LOOP_HALTED."
```

---

## 13. Phase 0 gate (do not skip)

**Already cleared (2026-07-14):** Build tooling = CRA, language = JS,
data layout = three separate collections, validation = `amount > 0` +
valid date + notes ≤ 2000, Redux scope = `onSnapshot` → slice, deploy
trigger = push to `main` auto-deploys. Locked in `docs/technology.md` §8.

Do not re-ask these. If a future phase introduces a new ambiguity
(missing rule, missing deploy file, etc.), add it to
`docs/technology.md` §8c and surface it before guessing.

---

## 14. Open gaps (live backlog)

Tracked in `docs/technology.md` §8c. Current items:

- `firestore.rules` missing — write and test before any production data.
- `.github/workflows/deploy.yml` missing.
- `.env.local.example` missing.
- Vite + TS migration is **not** planned; revisit only on user request.
- Dark mode + responsive layout polish pending Phase 6.
- Service account token rotation cadence TBD.
