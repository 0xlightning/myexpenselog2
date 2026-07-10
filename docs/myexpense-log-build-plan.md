# myexpense-log — Build Plan for Claude Code

This plan breaks the project into phases sized for an AI coding agent to execute
sequentially. Each phase ends in a working, verifiable state. Feed phases one at
a time to Claude Code — don't paste the whole doc as a single instruction.

**Source specs:** `Project-spec.md` (product/data model), `technology.md` (stack/architecture).
Give Claude Code both files as context before starting Phase 0.

---

## Phase 0 — Decisions to lock before coding starts

Two items in `Project-spec.md` §5 and several in `technology.md` §8 are marked
undecided. Resolve these first — they affect the data layer Claude Code writes
in Phase 2, and changing them later means rework.

| Decision | Recommendation | Why |
|---|---|---|
| Unified `transactions/` collection vs. three separate collections | **Three separate collections**, as already defined in the data model | Matches the spec's existing schema exactly; a unified collection is a bigger refactor for a marginal Dashboard convenience. Dashboard can merge them client-side. |
| Entry validation | **Minimal**: require amount > 0, require a valid date. No negative-net-worth warnings for v1. | Keeps v1 scope tight; flag as a fast-follow. |
| Redux scope | **RTK Query or plain `onSnapshot` + Redux slices**, not manual dual-sync | Firestore's real-time listeners already do the caching Redux would duplicate — avoid two sources of truth. |
| Build tooling | **Vite, not CRA** | CRA is unmaintained (archived 2025) and shadcn/ui tooling assumes Vite. This is a deviation from `technology.md` §8.1 — confirm with the user before Claude Code scaffolds, since the spec says CRA. |
| Deploy trigger | **Push to `main` auto-deploys** for v1; revisit tagged releases later | Simplest CI/CD for a solo project. |

Action: confirm the Vite-vs-CRA swap with the user explicitly (it contradicts
`technology.md`), then have Claude Code update `technology.md` §8 to mark these
resolved before Phase 1.

---

## Phase 1 — Project scaffolding

**Goal:** empty app runs locally and deploys to Firebase Hosting via CI/CD.

1. Scaffold React app (Vite + TypeScript recommended, matches shadcn/ui tooling).
2. Install and configure Tailwind CSS.
3. Install shadcn/ui; copy in the design tokens from `technology.md` §3a
   (`:root` and `.dark` CSS variables) — do not regenerate defaults.
4. Set up Redux Toolkit store (empty slices for now: `auth`, `income`,
   `expenditure`, `investments`).
5. Initialize Firebase project (Hosting + Auth + Firestore, free plan) and add
   the client SDK config (via environment variables, never hardcoded).
6. Create GitHub repo, add GitHub Actions workflow:
   - Trigger: push to `main` and on PRs.
   - Steps: install → lint → build → (on `main` only) deploy to Firebase Hosting
     via `FirebaseExtended/action-hosting-deploy`.
   - Store the Firebase service account token as a GitHub repo secret.
7. Verify: empty app builds locally, workflow runs green on a test push, site
   is reachable at the Firebase Hosting URL.

**Deliverable check:** blank page loads over HTTPS at the Hosting URL, CI is green.

---

## Phase 2 — Auth

**Goal:** users can sign up, log in, log out; routes are protected.

1. `/login` page: Firebase email/password sign-in and sign-up forms (shadcn/ui
   `Form`, `Input`, `Button`).
2. Firebase Auth state synced into a Redux `auth` slice (`onAuthStateChanged`
   listener).
3. Route guard: `/`, `/income`, `/expenditure`, `/investments` redirect to
   `/login` when signed out.
4. Sign-out control (e.g. in a header/nav).
5. Decide and implement: is email verification required for v1? (Open question
   in `technology.md` §8.4 — default to **not required for v1** unless the
   user says otherwise.)

**Deliverable check:** can create an account, log out, log back in; protected
routes are inaccessible when signed out.

---

## Phase 3 — Firestore data layer & security rules

**Goal:** the three record types and their category lists are readable/writable,
scoped per user, with rules tested before anything else builds on top.

1. Define Firestore collections per the schema in `Project-spec.md` §1, all
   nested under `users/{uid}/`.
2. Write Firestore Security Rules: every rule checks `request.auth.uid == uid`
   in the path. No default-open rules.
3. Test rules with the Firestore emulator (positive case: owner can read/write
   their own data; negative case: another authenticated user cannot).
4. Build the data-access layer (RTK Query API slice or `onSnapshot`-backed
   Redux slices per Phase 0 decision) for:
   - `income_sources` (CRUD) + `income_records` (CRUD)
   - `expense_categories` (CRUD) + `expenditure_records` (CRUD)
   - `investment_categories` (CRUD) + `investments` (CRUD)
5. Enforce the "Other" fallback at **read time**, not as a stored document:
   any record with empty `categoryId`/`sourceId` displays and groups as
   "Other" for its own entry type. Confirm categories can be deleted even if
   records reference them (those records just fall back to "Other").
6. Apply Phase 0's validation decision (amount > 0, valid date) client-side
   before writes.

**Deliverable check:** can create/edit/delete a category and a record of each
type directly against Firestore from the app; emulator rule tests pass;
a second test user cannot see the first user's data.

---

## Phase 4 — Income / Expenditure / Investments pages

**Goal:** the three near-identical CRUD pages described in `Project-spec.md` §4.

Build one page fully, then replicate the pattern for the other two (they share
almost all UI/logic — only the collection names and labels differ). Consider
a single generic `<RecordPage type="income" | "expenditure" | "investment">`
component to avoid triplicated code.

Each page needs:
1. List of existing entries (amount, date, category/source, notes), sorted by
   date descending.
2. "Add entry" form: amount, date, optional category/source dropdown ("none
   selected" is a valid choice), notes.
3. Edit / delete on existing entries.
4. Category/source management (add/rename/delete) — separate from record
   entry, e.g. a small management panel or modal.
5. Empty states and loading states (shadcn/ui `Skeleton` while Firestore data
   loads).

**Deliverable check:** can fully manage income, expenditure, and investment
entries and their categories end to end.

---

## Phase 5 — Dashboard

**Goal:** `/` shows net worth and breakdowns per `Project-spec.md` §2–3.

1. Net worth: recompute on every Dashboard load as
   `Σincome − Σexpenditure − Σinvestments` across full history — do not store
   a running total.
2. Category breakdowns per type (income by source, expenditure by category,
   investments by category), with "Other" grouping uncategorized entries per
   type as described in §2.
3. View toggle: lifetime / monthly / yearly.
4. Charts: use the `--chart-1` … `--chart-5` CSS variables from the design
   tokens for consistency with the rest of the UI (shadcn/ui charts or
   Recharts).

**Deliverable check:** Dashboard net worth matches a manual calculation from
seeded test data; switching lifetime/monthly/yearly changes the breakdowns
correctly; an uncategorized expense and an uncategorized income both show
under their own type's "Other" bucket, not merged together.

---

## Phase 6 — Polish & hardening

1. Dark mode toggle (tokens already defined — wire up `.dark` class toggle).
2. Responsive layout pass (mobile/tablet/desktop).
3. Error handling: Firestore write failures, offline state, form validation
   errors surfaced in the UI.
4. Firestore free-tier quota awareness (`technology.md` §8.3): confirm no
   page mounts an unbounded `onSnapshot` on a large, unpaginated collection.
5. Rotate/verify the Firebase deploy service account token is scoped to
   Hosting-deploy only, not project-owner.
6. Final emulator rules test pass + manual security spot-check (try to read
   another user's data from the browser console while signed in).

**Deliverable check:** app is usable end-to-end on mobile and desktop, in both
themes, with no console errors and no security-rule gaps.

---

## How to hand this to Claude Code

- Work one phase at a time; don't let it jump ahead.
- At the end of each phase, ask it to summarize what changed and run/report
  any tests before moving on.
- Re-paste the relevant spec section (not the whole doc) when starting a new
  phase, so context stays tight.
- If a phase surfaces a spec ambiguity not covered in Phase 0, stop and
  resolve it before continuing — don't let the agent guess silently.
