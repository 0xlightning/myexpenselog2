# myexpense-log — Project Reference

> **Status:** Phase 0–5 complete in code; Phase 6 partial. Three v1-blocking
> gaps remain (`firestore.rules`, `.github/workflows/deploy.yml`,
> `.env.local.example`). See §16.
>
> **Stack as built:** Create React App 5 + React 19, JavaScript (no TS),
> Redux Toolkit, Tailwind v3 with shadcn-style hand-copied components,
> Firebase (Auth + Firestore + Hosting, free plan), recharts, sonner.
>
> **Source of truth for code questions:** read the code first. This
> doc is the human/spec side.

---

## 1. Overview

A personal finance tracker. Three kinds of entries — **income,
expenditure, investment** — and a derived **net worth** total computed
from the full history on every Dashboard load.

**App stack (as built, 2026-07-14):**

- **Build:** Create React App 5 (`react-scripts 5.0.1`)
- **UI:** React 19, react-router v7
- **State:** Redux Toolkit (slices per feature; `onSnapshot` → slice)
- **Styling:** Tailwind v3 + PostCSS; OKLCH design tokens in
  `src/styles/tokens.css`
- **UI primitives:** shadcn-style hand-copied into `src/components/ui/`
- **Backend:** Firebase — Auth + Firestore + Hosting (free plan)
- **Charts:** recharts. **Toasts:** sonner. **Forms:** react-hook-form + zod
- **Tests:** `react-scripts test` (Jest + Testing Library)
- **Env prefix:** `REACT_APP_FIREBASE_*` (CRA convention)

**Constraint:** free-tier only for Firebase. No Cloud Functions, no
Cloud Run, no paid upgrade.

This combination is the free-tier-native stack: everything runs
client-side in the browser, with no server runtime required anywhere.

---

## 2. Data model

All paths scoped per authenticated user. Three separate collections —
**not** a unified `transactions/`.

```
users/{uid}/
├── income_sources/          # { name, createdAt }
├── income_records/          # { amount, date, sourceId|null, notes }
├── expense_categories/      # { name, createdAt }
├── expenditure_records/     # { amount, date, categoryId|null, notes }
├── investment_categories/   # { name, createdAt }
└── investments/             # { amount, date, categoryId|null, notes }
```

Field contracts:

- `amount`: number, **> 0**.
- `date`: ISO string, parseable.
- `categoryId` / `sourceId`: optional. `null`/missing ⇒ "Other" at read
  time. Never a stored doc.
- `notes`: optional string, **max 2000 characters** (enforced
  client-side in `src/lib/validation.js`).
- Timestamps: `createdAt`, `updatedAt` (Firestore `serverTimestamp()`).

Firestore paths are defined in the `PATHS` object in
`src/lib/firestore.js`.

---

## 3. "Other" fallback rule

Empty `categoryId` / `sourceId` displays and groups as **"Other"** for
its **own** entry type at **read time** — never a real document, never
a create/delete target, never lumped across types.

- An uncategorized expense groups as "Other expense".
- An uncategorized income groups as "Other income".
- An uncategorized investment groups as "Other investment".

Deleting a category is allowed even if records reference it — those
records silently fall back to "Other".

Implemented in `breakdownByCategory` in
`src/features/dashboard/derive.js`. Labels come from
`src/features/records/kindMeta.js`.

---

## 4. Net worth

Derived, not stored. Recompute on every Dashboard load:

```
net worth = Σ(income_records.amount) − Σ(expenditure_records.amount) − Σ(investments.amount)
```

Computed by `netWorth(income, expenditure, investments)` in
`src/features/dashboard/derive.js`. Returns `{ income, expenditure,
investments, total }`. No running total, no cached field, no persisted
net-worth doc.

Within a type, group/sum by `categoryId` (with "Other" fallback) for
the Dashboard breakdowns view.

---

## 5. Validation (Phase 0 decision, locked)

Client-side, before any Firestore write, enforced in
`src/lib/validation.js`:

- `amount > 0` (reject 0, negative, `NaN`, non-numbers).
- `date` is a valid parseable date.
- `notes` optional, free text, **max 2000 characters**.
- `categoryId` / `sourceId` optional, null is valid.

No negative-net-worth warning in v1 (fast-follow).

---

## 6. Routes

| Path | Page | Guard |
|---|---|---|
| `/login` | Login (email/password sign-in + sign-up) | public |
| `/` | Dashboard — net worth, breakdowns, lifetime/monthly/yearly toggle | auth |
| `/income` | `<RecordPage kind="income" />` | auth |
| `/expenditure` | `<RecordPage kind="expenditure" />` | auth |
| `/investments` | `<RecordPage kind="investment" />` | auth |

`/login` is public; everything else is wrapped in `<AuthGate>` (in
`src/features/auth/AuthGate.jsx`), which redirects to `/login` when
`auth.user` is null.

---

## 7. System components

### 7.1 CI/CD pipeline (planned, not yet wired)

- **Repository** holds the React app source.
- **GitHub Actions workflow** (`.github/workflows/deploy.yml` —
  **missing**) runs build/lint/test on push and PR, and deploys the
  static output to Firebase Hosting via
  `FirebaseExtended/action-hosting-deploy`. GitHub has no runtime role
  once the site is deployed.

### 7.2 Application

- **React SPA** built with CRA, static HTML/JS/CSS output served by
  Firebase Hosting (free plan).
- **Firebase Authentication** — email/password, sign-in + sign-up
  entirely client-side. The `onAuthStateChanged` listener is wired in
  `src/lib/auth.js` and registered from `src/index.js`.
- **Firestore** — primary data store, accessed directly from the
  browser via the Firebase client SDK. One `onSnapshot` listener per
  collection, all six mounted in `subscribeUserData(uid, dispatch)`.
- **Redux Toolkit** — auth + income + expenditure + investments + ui
  slices, wired in `src/app/store.js`.

---

## 8. Website architecture

- **State management:** Redux (Redux Toolkit) holds the client-side
  cache of Firestore data + UI state. Firebase Auth/Firestore remain
  the source of truth. **`onSnapshot` is the only data-flow into
  Redux** — no manual dual-sync.
- **UI/design system:** Tailwind v3 + shadcn-style hand-copied
  components. Design tokens defined as CSS custom properties in
  `:root` / `.dark` (see §9). Tailwind utilities are mapped to those
  tokens in `tailwind.config.js`, so `bg-background`, `text-foreground`,
  `bg-primary`, etc. resolve to the OKLCH values.
- **Auth layer:** Firebase Authentication, email/password. Sign-up,
  sign-in, sign-out are handled client-side via the Firebase SDK; the
  SDK manages session tokens in the browser.
- **Data layer:** Firestore, accessed directly from the client using
  the authenticated user's Firebase Auth identity. Real-time updates
  come via `onSnapshot` listeners, dispatched into Redux slices.
- **Access control:** no backend server. **Firestore Security Rules
  are the sole enforcement layer** — every rule must reference
  `request.auth.uid` to scope reads/writes to the signed-in user's
  own data. **Rules file is missing from the working tree** — see §16.

---

## 9. Design tokens (OKLCH)

Theme is defined via CSS custom properties in
`src/styles/tokens.css`, consumed by Tailwind (via
`tailwind.config.js`) and by component classes.

Both light (`:root`) and dark (`.dark`) modes are defined. Dark mode
is in-scope for the UI, not an afterthought. Theme toggle is wired
via the `<ThemeToggle>` component and the `darkMode: 'class'` strategy
in Tailwind.

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.147 0.004 49.3);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.147 0.004 49.3);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.147 0.004 49.3);
  --primary: oklch(0.496 0.265 301.924);
  --primary-foreground: oklch(0.977 0.014 308.299);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.96 0.002 17.2);
  --muted-foreground: oklch(0.547 0.021 43.1);
  --accent: oklch(0.496 0.265 301.924);
  --accent-foreground: oklch(0.977 0.014 308.299);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.977 0.014 308.299);
  --border: oklch(0.922 0.005 34.3);
  --input: oklch(0.922 0.005 34.3);
  --ring: oklch(0.714 0.014 41.2);
  --chart-1: oklch(0.845 0.143 164.978);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.596 0.145 163.225);
  --chart-4: oklch(0.508 0.118 165.612);
  --chart-5: oklch(0.432 0.095 166.913);
  --radius: 0.45rem;
  --sidebar: oklch(0.986 0.002 67.8);
  --sidebar-foreground: oklch(0.147 0.004 49.3);
  --sidebar-primary: oklch(0.558 0.288 302.321);
  --sidebar-primary-foreground: oklch(0.977 0.014 308.299);
  --sidebar-accent: oklch(0.96 0.002 17.2);
  --sidebar-accent-foreground: oklch(0.214 0.009 43.1);
  --sidebar-border: oklch(0.922 0.005 34.3);
  --sidebar-ring: oklch(0.714 0.014 41.2);
}
.dark {
  --background: oklch(0.147 0.004 49.3);
  --foreground: oklch(0.986 0.002 67.8);
  --card: oklch(0.214 0.009 43.1);
  --card-foreground: oklch(0.986 0.002 67.8);
  --popover: oklch(0.214 0.009 43.1);
  --popover-foreground: oklch(0.986 0.002 67.8);
  --primary: oklch(0.438 0.218 303.724);
  --primary-foreground: oklch(0.977 0.014 308.299);
  --secondary: oklch(0.274 0.006 286.033);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.268 0.011 36.5);
  --muted-foreground: oklch(0.714 0.014 41.2);
  --accent: oklch(0.438 0.218 303.724);
  --accent-foreground: oklch(0.977 0.014 308.299);
  --destructive: oklch(0.704 0.191 22.216);
  --destructive-foreground: oklch(0.977 0.014 308.299);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.547 0.021 43.1);
  --chart-1: oklch(0.845 0.143 164.978);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.596 0.145 163.225);
  --chart-4: oklch(0.508 0.118 165.612);
  --chart-5: oklch(0.432 0.095 166.913);
  --sidebar: oklch(0.214 0.009 43.1);
  --sidebar-foreground: oklch(0.986 0.002 67.8);
  --sidebar-primary: oklch(0.627 0.265 303.9);
  --sidebar-primary-foreground: oklch(0.977 0.014 308.299);
  --sidebar-accent: oklch(0.268 0.011 36.5);
  --sidebar-accent-foreground: oklch(0.986 0.002 67.8);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.547 0.021 43.1);
}
```

`tailwind.config.js` exposes these as utility classes:

- `bg-background`, `text-foreground`
- `bg-card text-card-foreground`, `bg-popover text-popover-foreground`
- `bg-primary text-primary-foreground`, `bg-secondary text-secondary-foreground`
- `bg-muted text-muted-foreground`, `bg-accent text-accent-foreground`
- `bg-destructive text-destructive-foreground`
- `border-border`, `bg-input`, `ring-ring`
- `bg-chart-1` … `bg-chart-5` (and `text-chart-N`, `fill-chart-N` for
  recharts)
- `bg-sidebar text-sidebar-foreground` etc. for the sidebar palette
- `rounded-lg` / `rounded-md` / `rounded-sm` driven by `--radius`

---

## 10. CI/CD pipeline details (planned)

- **Purpose:** automate build, lint/test, and deployment on push and PR.
- **Deployment:** GitHub Actions → `FirebaseExtended/action-hosting-deploy`,
  authenticated with a Firebase service account token.
- **Secret storage:** the Firebase service account token + any other
  CI-time secrets are stored as GitHub repository secrets (Settings →
  Secrets and variables → Actions), encrypted at rest.
- **Requirement:** repository access to configure the deploy workflow
  and secrets.

**Status:** not wired. See §16.

---

## 11. Permissions model

### 11.1 GitHub Actions (CI/CD only)

- Repo-scoped workflow permissions, minimum required for build/deploy
  steps (e.g. `contents: read`).
- The Firebase service account used for deployment should be scoped to
  Hosting deploy permissions only — not broader project-owner access.

### 11.2 Firestore

- Security rules must be scoped **per authenticated user**, referencing
  `request.auth.uid` (populated by Firebase Authentication).
- Default-open rules (`allow read, write: if true;`) must never be
  used in production.
- Because all data access happens client-side with no server to
  mediate it, rules must be written defensively and tested — there
  is no fallback access-control layer.

**Intended rule shape (to be added in `firestore.rules`):**

```
match /users/{uid}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

---

## 12. Data flow

### 12.1 CI/CD pipeline (planned)

```
Push / PR event → GitHub Actions workflow triggers
→ build, lint/test steps run
→ (main only) deploy step pushes static output to Firebase Hosting
```

### 12.2 Live application

```
User's browser
  → Firebase Hosting (serves static React build, free plan)
  → Firebase Authentication (client SDK sign-in/sign-up)
  → authenticated client
  → Firestore (client SDK, access governed entirely by Security Rules)
  → onSnapshot dispatch → Redux slice → React UI
```

### 12.3 Free-tier quotas

- ~50K Firestore reads/day
- ~20K writes/day
- 1 GiB storage

The current implementation mounts **six `onSnapshot` listeners per
signed-in user** for the session lifetime (one per collection,
registered in `subscribeUserData` in `src/lib/firestore.js`). That's
fine at v1 scale but must not grow. Pages must not add additional
unbounded listeners. Re-evaluate if record counts grow past a few
thousand per type.

---

## 13. Security considerations

- Never hardcode the Firebase service account token or any credential
  in the repository — always reference via GitHub secrets.
- Rotate the Firebase deploy service account token periodically
  (cadence TBD, §16).
- Avoid logging workflow variables that may contain secrets.
- Firestore Security Rules are the only access-control mechanism —
  they must be explicitly written, reviewed, and tested (e.g. with
  the Firestore emulator) before go-live.
- Firebase Authentication settings (authorized domains, allowed
  sign-in methods) should be restricted to the production domain to
  prevent abuse.
- **Single Firebase project risk:** since dev and production share
  one Firestore instance, local/dev testing can read or write real
  user data. Mitigate with clear collection naming (e.g. a `dev_`
  prefix or separate top-level collections) or by pointing local
  development at the Firestore emulator instead of the live project.

---

## 14. Directory structure

```
myexpense-log/
├── docs/
│   └── PROJECT.md            # this file
├── website/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── store.js
│   │   │   ├── hooks.js
│   │   │   └── uiSlice.js
│   │   ├── components/
│   │   │   ├── ui/           # shadcn-style primitives, hand-copied
│   │   │   │   ├── button.jsx
│   │   │   │   ├── card.jsx
│   │   │   │   ├── input.jsx
│   │   │   │   ├── label.jsx
│   │   │   │   └── skeleton.jsx
│   │   │   ├── ErrorToast.jsx
│   │   │   ├── OnlineStatusBridge.jsx
│   │   │   └── ThemeToggle.jsx
│   │   ├── features/
│   │   │   ├── auth/         # login form, auth slice, AuthGate, Header
│   │   │   │   ├── authSlice.js
│   │   │   │   ├── AuthGate.jsx
│   │   │   │   ├── Header.jsx
│   │   │   │   └── LoginPage.jsx
│   │   │   ├── income/
│   │   │   │   └── incomeSlice.js
│   │   │   ├── expenditure/
│   │   │   │   └── expenditureSlice.js
│   │   │   ├── investments/
│   │   │   │   └── investmentsSlice.js
│   │   │   ├── records/      # generic <RecordPage kind="..."/>
│   │   │   │   ├── kindMeta.js
│   │   │   │   └── RecordPage.jsx
│   │   │   └── dashboard/
│   │   │       ├── derive.js
│   │   │       └── Dashboard.jsx
│   │   ├── lib/
│   │   │   ├── auth.js
│   │   │   ├── firebase.js
│   │   │   ├── firestore.js  # PATHS, subscribeUserData, CRUD
│   │   │   ├── validation.js
│   │   │   ├── dates.js
│   │   │   └── utils.js
│   │   ├── styles/
│   │   │   ├── index.css     # @tailwind directives + @layer base
│   │   │   └── tokens.css    # OKLCH :root + .dark
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── App.test.js
│   │   ├── index.js
│   │   ├── index.css
│   │   ├── logo.svg
│   │   ├── reportWebVitals.js
│   │   └── setupTests.js
│   ├── ARCHITECTURE.md       # points here
│   ├── CLAUDE.md             # points here
│   ├── package.json
│   ├── postcss.config.js
│   └── tailwind.config.js    # wires OKLCH tokens → Tailwind utilities
├── .gitignore
└── README.md
```

A previous "target structure" listing `src/hooks/`, `src/services/`,
`src/pages/`, `src/assets/`, `src/components/layout/`,
`src/components/shared/`, `src/lib/firebase/`, `src/lib/utils/`,
`src/lib/constants/` was never adopted. Do not assume those folders
exist.

---

## 15. Conventions

- **JavaScript, ES modules.** No TypeScript. Files are `*.js` / `*.jsx`.
  Strict mode is whatever ESLint's `react-app` preset enforces.
- **Tailwind for all styling** — no inline `style={}`, no CSS modules.
  Use the token-mapped utility classes (`bg-background`,
  `text-foreground`, etc.).
- **shadcn-style components** — hand-copied in `src/components/ui/`.
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

## 16. Open gaps (v1 sign-off blockers)

| Gap | Severity | What to do |
|---|---|---|
| `firestore.rules` missing | **Blocker** | Write the rules from §11.2. Test positive + negative cases with the Firestore emulator before any production data lands. |
| `.github/workflows/deploy.yml` missing | **Blocker** | Restore the workflow per §10. Add the Firebase service account token as a GitHub repo secret. |
| `.env.local.example` missing | **Blocker** | Restore a template listing `REACT_APP_FIREBASE_*` keys. |
| `firebase.json` / `.firebaserc` missing | **Blocker** | Restore the Firebase Hosting config (public dir = `build`, single-page-app rewrites). |
| Service account token rotation cadence | TBD | Re-evaluate at Phase 6. |
| Responsive layout pass | Phase 6 | Mobile / tablet / desktop audit. |
| Quota hardening | Phase 6 | Confirm no page mounts additional unbounded `onSnapshot` listeners. |

---

## 17. Phase log

Status of the build plan (`docs/myexpense-log-build-plan.md` before
consolidation) as of 2026-07-14:

| Phase | Status | Notes |
|---|---|---|
| 0 — Decisions | **Done** | All items in §18 locked. |
| 1 — Scaffolding | **Partial** | App runs via `react-scripts start`. CI/CD + Firebase Hosting config files missing. |
| 2 — Auth | **Done** | `authSlice`, `LoginPage`, `AuthGate`, `onAuthStateChanged` in `src/lib/auth.js`. |
| 3 — Firestore data layer | **Partial** | `subscribeUserData` + CRUD helpers in `src/lib/firestore.js`. **`firestore.rules` missing** — must be added + tested with emulator. |
| 4 — Record pages | **Done** | Single generic `<RecordPage kind="…" />` driven by `kindMeta.js`. |
| 5 — Dashboard | **Done** | `Dashboard.jsx` + `derive.js` (net worth, breakdown, in-range, available years). |
| 6 — Polish | **Partial** | Dark mode token CSS in place (`.dark` in `tokens.css`); `<ThemeToggle>` exists. Responsive layout not audited. Quota hardening not done. Token rotation not done. |

**Deviation from the original build plan:** the plan recommended
**Vite + TypeScript**. The actual implementation landed on
**CRA + JavaScript** (see §18.1, §18.7). Code, `package.json` scripts,
and env prefix all reflect CRA (`react-scripts`,
`REACT_APP_FIREBASE_*`). If Vite + TS is still desired, treat it as
its own migration phase.

---

## 18. Resolved decisions (locked at Phase 0, 2026-07-09)

1. **Build tooling:** **CRA** (`react-scripts 5.0.1`), confirmed by
   user despite archived upstream status. shadcn/ui source hand-copied
   into `src/components/ui/` (no CLI). Tailwind v3 + PostCSS configured
   manually. The Vite recommendation in
   `myexpense-log-build-plan.md` Phase 0 was **not adopted**.
2. **Redux scope:** `onSnapshot` listeners feed Redux slices via the
   single `subscribeUserData(uid, dispatch)` entry point in
   `src/lib/firestore.js`. **No manual dual-sync** of Firestore data.
3. **Firestore free-plan quota awareness:** ~50K reads/day,
   ~20K writes/day, 1 GiB storage. The current implementation mounts
   six `onSnapshot` listeners per signed-in user (one per collection)
   for the lifetime of the session — fine for v1 single-user data,
   but pages must not add additional unbounded listeners. Re-evaluate
   if record counts grow past a few thousand per type.
4. **Password reset / email verification:** **Email verification NOT
   required for v1.** Password reset is available via Firebase out of
   the box but not surfaced in the UI for v1.
5. **Deploy trigger scope:** **Push to `main` auto-deploys** to
   Firebase Hosting via GitHub Actions. No tagged-release gate for v1.
6. **Secret rotation cadence:** **TBD** — not a v1 blocker.
   Re-evaluate at Phase 6.
7. **Language:** JavaScript (ES modules), not TypeScript. The original
   TS source was stripped; code is `*.js` / `*.jsx`. Type hints may
   return later via JSDoc.
8. **Env prefix:** `REACT_APP_FIREBASE_*` (CRA convention), not
   `VITE_FIREBASE_*`. See `src/lib/firebase.js`.
9. **Data layout:** Three separate collections per §2 — **not** a
   unified `transactions/` collection. Dashboard reads all three and
   merges client-side.
10. **Entry validation:** `amount > 0`, `date` parseable, `notes`
    ≤ 2000 chars. No negative-net-worth warning in v1.

---

*Update this doc as decisions land — the "Open gaps" section is the
current backlog, not permanent unknowns.*
