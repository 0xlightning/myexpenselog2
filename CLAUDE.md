# CLAUDE.md — myexpense-log (website/)

Operational index for Claude Code inside the React app. The two canonical
specs live one level up:

- `../docs/Project-spec.md` — product + data model
- `../docs/technology.md` — stack + architecture
- `../docs/myexpense-log-build-plan.md` — phased work order (Phase 0 → 6)

This file is a **condensed working index**, not the source of truth. When in
doubt, the docs win.

---

## 1. Project

Personal finance tracker. Three entry types: **income, expenditure,
investment**. Net worth derived from these. Auth-gated SPA, single Firebase
project per user, free-tier only.

---

## 2. Stack lock

- **Build:** Vite + React + TypeScript *(deviation from `technology.md`
  §8.1 — CRA is unmaintained, shadcn/ui tooling assumes Vite; resolved in
  Phase 0).*
- **State:** Redux Toolkit (slices co-located with features; RTK Query or
  `onSnapshot` → slice — **no manual dual-sync**).
- **Styling:** Tailwind CSS utility-first; shadcn/ui components (copy
  source manually into `src/components/ui/`, do not rely on shadcn CLI).
- **UI tokens:** OKLCH CSS custom properties in `src/styles/tokens.css`
  (`:root` + `.dark`) — copied verbatim from `technology.md` §3a. Do not
  regenerate defaults.
- **Backend:** Firebase — Auth (email/password), Firestore, Hosting.
  **Free-tier only.** No Cloud Functions, no Cloud Run, no paid upgrade.
- **CI/CD:** GitHub Actions → Firebase Hosting via
  `FirebaseExtended/action-hosting-deploy`. Secrets in GitHub repo
  secrets, never in code.

---

## 3. Directory map

```
website/
├── src/
│   ├── features/
│   │   ├── auth/           # login form, auth slice, onAuthStateChanged
│   │   ├── income/         # income page + slice
│   │   ├── expenditure/    # expenditure page + slice
│   │   ├── investments/    # investments page + slice
│   │   └── dashboard/      # net worth, breakdowns, charts
│   │       └── components/, hooks/, store.ts   # per feature
│   ├── lib/
│   │   ├── firebase.ts     # single Firebase init (env-driven)
│   │   └── firestore/      # one typed helper per collection
│   ├── components/ui/      # shadcn/ui primitives, hand-copied
│   ├── styles/tokens.css   # OKLCH :root + .dark
│   ├── App.tsx             # router + Provider
│   └── main.tsx
├── tests/                  # Vitest + Testing Library
├── .github/workflows/deploy.yml
├── .env.local              # gitignored, VITE_FIREBASE_*
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
└── package.json
```

---

## 4. Data model

All paths scoped per authenticated user. Three separate collections — **not**
a unified `transactions/` collection (Phase 0 decision).

```
users/{uid}/
├── income_sources/          # { name, createdAt }
├── income_records/          # { amount, date, sourceId|null, notes }
├── expense_categories/      # { name, createdAt }
├── expenditure_records/     # { amount, date, categoryId|null, notes }
├── investment_categories/   # { name, createdAt }
└── investments/             # { amount, date, categoryId|null, notes }
```

- `amount`: number, **> 0** (Phase 0 validation).
- `date`: ISO string, parseable.
- `categoryId` / `sourceId`: optional. `null`/missing ⇒ "Other" at read
  time (see §5). Never a stored doc.
- Timestamps: `createdAt`, `updatedAt` (Firestore `serverTimestamp()`).

---

## 5. "Other" fallback rule

Empty `categoryId` / `sourceId` displays and groups as **"Other"** for its
**own** entry type at **read time** — never a real document, never a
create/delete target, never lumped across types.

- An uncategorized expense groups as "Other expense".
- An uncategorized income groups as "Other income".
- An uncategorized investment groups as "Other investment".

Deleting a category is allowed even if records reference it — those records
silently fall back to "Other".

---

## 6. Net worth

Derived, not stored. Recompute on every Dashboard load:

```
net worth = Σ(income_records.amount)
          − Σ(expenditure_records.amount)
          − Σ(investments.amount)
```

No running total, no cached field. Reads from the three record collections
directly. Within a type, group/sum by `categoryId` (with "Other" fallback)
for the breakdowns view.

---

## 7. Routes

| Path | Page | Guard |
|---|---|---|
| `/login` | Login (email/password sign-in + sign-up) | public |
| `/` | Dashboard — net worth, breakdowns, lifetime/monthly/yearly toggle | auth |
| `/income` | Income CRUD + income-source mgmt | auth |
| `/expenditure` | Expenditure CRUD + category mgmt | auth |
| `/investments` | Investments CRUD + category mgmt | auth |

Unauthenticated visits to guarded routes ⇒ redirect to `/login`. After
sign-in, return to originally requested path.

---

## 8. Validation (Phase 0 decision)

Client-side, before any Firestore write:

- `amount > 0` (reject 0, negative, NaN).
- `date` is a valid parseable date.
- `notes` optional, free text, no length cap in v1.

No negative-net-worth warnings in v1 (fast-follow).

---

## 9. Security rules

Firestore Security Rules are the **only** access-control layer (no
backend). Every rule must reference `request.auth.uid`:

```
match /users/{uid}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

- **Never** `allow read, write: if true;` in production.
- Rules tested with the **Firestore emulator** before go-live (Phase 3).
- Negative test: a second signed-in user cannot read or write the first
  user's data.
- Dev: use the emulator or a top-level `dev_` collection prefix — never
  read/write real user data from local dev (see `technology.md` §7 last
  bullet).

---

## 10. Free-tier quotas

- ~50K Firestore reads/day.
- ~20K writes/day.
- 1 GiB storage.

Constraints:

- No unbounded `onSnapshot` on large collections. Paginate or scope by
  date.
- Prefer single composite queries over many small reads.
- Cache in Redux only what the UI needs *right now*.

---

## 11. Conventions

- **TypeScript strict** — no `any`, no implicit returns.
- **Tailwind for all styling** — no inline `style={}`, no CSS modules.
- **shadcn/ui for components** — copy source from shadcn, don't depend
  on the CLI.
- **Co-locate** — feature components/hooks/store next to the feature.
- **No secrets in repo** — `.env.local` is gitignored; CI reads GitHub
  Actions secrets.
- **Tests** — Vitest + Testing Library; `*.test.ts(x)` next to source.
- **Commit format** — `phase-N: <verb> <thing>` (e.g.
  `phase-1: scaffold vite + react + ts`).
- **Lint/format** — ESLint + Prettier defaults; `pnpm lint` and
  `pnpm test` must pass before each phase's deliverable check.

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
     Vite-vs-CRA decision. Ask, don't assume.
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

Before **any** scaffolding:

1. Confirm with the user: **Vite** (recommended) vs **CRA**
   (matches `technology.md` §8.1 but is archived/unmaintained).
2. Confirm: unified `transactions/` collection (rejected by build plan)
   vs **three separate collections** (locked).
3. Confirm: entry validation = `amount > 0` + valid date, no negative
   net-worth warnings (locked).
4. Confirm: Redux scope = `onSnapshot` → slice or RTK Query, **not**
   manual dual-sync (locked).
5. Confirm: deploy trigger = push to `main` auto-deploys (locked).
6. Update `../docs/technology.md` §8 to mark these resolved before
   writing any code.

If the user defers an answer, emit `PHASE 0 BLOCKED` and stop. Do not
guess.

---

## 14. Open questions

Live backlog — see:

- `../docs/Project-spec.md` §5 (unified ledger, validation strictness).
- `../docs/technology.md` §8 (Redux scope confirmed, deploy trigger
  confirmed, password reset/email verification TBD, token rotation
  cadence TBD).

If a phase surfaces a new ambiguity not in those lists, **stop the loop
and ask** — do not let the agent guess silently.
