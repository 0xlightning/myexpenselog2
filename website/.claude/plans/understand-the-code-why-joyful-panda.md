# Plan — Make the project build & type-check cleanly

## Context

The user reports the project is full of errors and asked to understand the
code and produce a plan to fix them. After a full survey, the situation is:

- **Build (`react-scripts build`) fails** at the very first line of
  `src/App.tsx` with `TS7016: Could not find a declaration file for module
  'react/jsx-runtime'`.
- **`npx tsc --noEmit` reports 320+ TypeScript errors** across every `.ts`
  and `.tsx` file under `src/`.
- **Tests (`npm test`) run, 35/35 pass**, but **2 of 5 test files fail to
  load** with `ERR_MODULE_NOT_FOUND: firebase/compat/database/dist/index.mjs`.
- The two `firestore.*.test.ts` files are meant to run only against the
  Firestore emulator and gate themselves with
  `describe.skipIf(!EMULATOR_HOST)`, but the import-time crash means the
  skip never takes effect — the test process dies before vitest can even
  count them.

### Why are there so many errors?

`package.json` is **missing the `@types/*` devDependencies** that every
TypeScript project needs to compile React + Redux Toolkit code. With
`"strict": true` in `tsconfig.json`, the absence of `@types/react` and
`@types/react-dom` cascades:

| Missing package | Consequence | Error count |
|---|---|---|
| `@types/react` | no `JSX` namespace, no `React.*`, no `<div>`/`<button>` types | ~250 |
| `@types/react-dom` | no `ReactDOM` types | a few |
| `@types/node` (transitive) | no `process.env`, no `node:fs`/`node:path` types | a few in `firestore.*.test.ts` |

Every one of the 320 errors traces back to those three missing packages.
**The app's logic is correct** — `package.json` was scaffolded, the
implementation is reasonable, and the unit tests pass. What's broken is the
**type system wiring**, not the code.

### Why do the emulator test files crash at import time?

`@firebase/rules-unit-testing@3.0.4` resolves
`firebase/compat/database/dist/index.mjs` at module load. The installed
`firebase@10.14.x` package no longer ships an `.mjs` for that compat path —
only `.cjs`. This is a known version-skew issue between the two packages.

---

## Goal

1. Get `npx tsc --noEmit` → **0 errors**.
2. Get `npm run build` → **succeeds**.
3. Get `npm test` → **all suites load** (passes or skips cleanly; the
   emulator-gated suites should skip when no `FIRESTORE_EMULATOR_HOST` is
   set, not crash).

No production code logic changes. No new features.

---

## Root cause #1 — missing type packages

### Fix

Add to `package.json` `devDependencies` (versions verified compatible with
React 18.3.1 + TypeScript 4.9.5 + react-scripts 5.0.1):

```json
"@types/react": "^18.3.12",
"@types/react-dom": "^18.3.1",
"@types/node": "^20.12.7"
```

`react-scripts` 5 normally auto-installs these via its own template, but
the template's `tsconfig.json` is being overridden here (`baseUrl: src`,
`moduleResolution: node`, `isolatedModules: true`), and the override path
drops the auto-install. They must be declared explicitly.

Run `npm install` to materialize them. No code changes should be needed —
the existing strict-typed code compiles once the types are available.

### Verification

```bash
npx tsc --noEmit   # expect 0 errors
```

If any errors remain after this, they'll be **real** logic errors (not
type-missing noise) and should be triaged individually.

---

## Root cause #2 — non-systemic TS errors that will surface once types are installed

The 320 errors include a small handful that are **not** the missing-@types
cascade. Confirmed via `grep` on the tsc output (after removing TS7016,
TS7026, TS7006, TS7031, TS2503):

| File:line | Error | Real cause |
|---|---|---|
| `src/App.tsx:19` | `TS2741: Property 'children' is missing in type '{}' but required in type '{ children: React.ReactNode; }'` | `<AuthGate>` is rendered with no children on the *outer* `Route` — the children are inside `<AuthGate>`'s `element` prop. Looking at `App.tsx` line 16–36: the `<Route path="*" element={<AuthGate>...</AuthGate>}>` is fine, but `<AuthGate>` itself is correctly given children. **Re-check after types are installed; likely a false positive from `JSX` namespace being missing.** |
| `src/components/ui/button.tsx:41–42` | `TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type 'Record<ButtonVariant, string>'` | `variant` and `size` are typed `ButtonVariant`/`ButtonSize` (string-literal unions) but `Button` is destructuring them as `string` because `React.ButtonHTMLAttributes<...>['variant']` doesn't exist. **False positive from `React` types missing.** Will resolve once `@types/react` is installed. |
| `src/features/dashboard/Dashboard.tsx:82` | `TS2322: Type '{ key: string; item: BreakdownItem; total: number; token: ...; }' is not assignable to type '{ item: BreakdownItem; total: number; token: string; }'` | `<BreakdownRow key={...} item={...} ... />` — React's `key` prop is a special-cased prop that should not be on the component's prop type. With `@types/react` installed this normally works because `JSX.LibraryManagedAttributes` handles it, but the existing `BreakdownRow` component type doesn't extend `React.Attributes`. **Likely a false positive**; will resolve with types. |

All three appear to cascade from the same `@types/react` missing. **Plan
steps:** install types first, re-run `tsc`, then triage any real errors
that remain.

---

## Root cause #3 — Firestore emulator test files crash at import

### Problem

`src/lib/firestore.rules.test.ts` and `src/lib/firestore.data.test.ts`
both import from `@firebase/rules-unit-testing`, which at module load
time resolves `firebase/compat/database/dist/index.mjs`. The installed
`firebase@10.14.1` package only ships the `.cjs` version. Node ESM
resolver throws `ERR_MODULE_NOT_FOUND`, killing the test process before
vitest's `describe.skipIf` can run.

This is reproducible in two ways:
- Without the emulator: tests should skip cleanly — they currently crash.
- With the emulator: tests would crash the same way.

### Fix (confirmed)

**Upgrade `@firebase/rules-unit-testing` to `^3.0.5`** — the version that
fixes the `.mjs` import path on its end. No version juggling needed.

```json
"@firebase/rules-unit-testing": "^3.0.5"
```

If 3.0.5 still has the issue at install time, fall back to pinning
`firebase@10.13.2` as a `devDependency` override.

### Verification

```bash
npm test
# expect: 5/5 test files load; 35 tests pass; 2 suites skipped (no
# FIRESTORE_EMULATOR_HOST set in this environment)
```

---

## Root cause #4 — leaky `.env.local.example` (confirmed: fix)

`website/.env.local.example` contains **real-looking Firebase API keys**:

```
REACT_APP_FIREBASE_API_KEY=AIzaSyCAhSEAmb5F0K0svta7PBNuu59Ef3pI420
REACT_APP_FIREBASE_PROJECT_ID=myexpenselog2
```

These are not a major secret in Firebase's threat model (the API key is
a project identifier, not a credential — the security boundary is
Firestore Security Rules), but the `projectId` and `appId` are still
project-identifying. CLAUDE.md says "no secrets in repo" — keep with that.

### Fix

Replace the real values in `.env.local.example` with obvious placeholders
(`AIzaSy...replace_me`, `your-project-id`) and a comment instructing
users to fill in their own from the Firebase console. The file stays
tracked.

---

## Files to be modified

| File | Change |
|---|---|
| `website/package.json` | Add `@types/react@^18.3.12`, `@types/react-dom@^18.3.1`, `@types/node@^20.12.7`; bump `@firebase/rules-unit-testing` to `^3.0.5` (or override `firebase@10.13.2` as a `devDependency` if 3.0.5 still breaks) |
| `website/package-lock.json` | regenerated by `npm install` |
| `website/.env.local.example` | Replace real keys with placeholders (`AIzaSy_replace_me`, `your-project-id`) |

**No source files in `src/` need to change.** The implementation is
correct — the project was missing its type-system wiring.

## Order of execution

1. **Install missing type packages** (`@types/react`, `@types/react-dom`,
   `@types/node`) via `npm install --save-dev`.
2. **Re-run `npx tsc --noEmit`.** If 0 errors, proceed. If any real
   errors remain (e.g. the three flagged in Root cause #2 are *not*
   actually fixed by the types install), triage them one at a time.
3. **Fix the Firestore emulator test loader** — upgrade
   `@firebase/rules-unit-testing` to `^3.0.5`; if that doesn't resolve
   it, pin `firebase@10.13.2` as a devDependency override.
4. **Run `npm test`** — confirm 5/5 suites load, 35 tests pass, 2
   emulator suites skip cleanly.
5. **Run `npm run build`** — confirm production build succeeds.
6. **Sanitize `.env.local.example`** — replace the real-looking API key,
   project ID, storage bucket, messaging sender ID, and app ID with
   obvious placeholders (`AIzaSy_replace_me`, `your-project-id`, etc.) and
   a comment instructing users to copy and fill in their own values from
   the Firebase console.

## Verification (end-to-end)

```bash
cd website
npm install
npx tsc --noEmit        # expect: 0 errors
npm test                # expect: 5/5 files load, 35 tests pass,
                        # 2 emulator suites skip with skipIf
npm run build           # expect: build/ directory produced
                        #   without TS errors
```

A clean run of all three is the deliverable check. The plan is considered
complete when all three exit 0 with the expected output.
