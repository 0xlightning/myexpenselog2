# Plan: Apply Firebase Security & Hosting Configuration

## Context

`PROJECT.md` §16 lists three v1 sign-off blockers that are missing from
the working tree:

1. `firestore.rules` (security rules — sole access-control layer)
2. `.github/workflows/deploy.yml` (CI/CD)
3. `firebase.json` / `.firebaserc` / `.env.local.example` (hosting + env)

The user has asked to apply the recommended rule set that scopes every
read/write to `users/{uid}/...` and protects the rest with a deny-all
fallback, plus the matching Firebase Hosting config, the Storage rules
template (Storage is unused today but the rule file is harmless to add
as a deny-by-default placeholder), Email/Password-only auth, and the
deploy workflow.

The user also asked to **rewrite the deleted files** to reflect the new
tech stack (project spec). The working tree's `git status` shows a
mid-restructuring state where most of the prior Firebase config and
many source files are staged-as-deleted. This plan **restores** the
config files (firebase.json, firestore.rules, firestore.indexes.json,
.firebaserc, .env.local.example, .github/workflows/deploy.yml) with
content aligned to `PROJECT.md`. The application source code is
already present as `.js`/`.jsx` files in `website/src/` — those are
**not** being rewritten by this plan; only the Firebase/security/CI
config is in scope.

Intended outcome: a fresh-clone-ready project where `firebase deploy`
works, the rules block cross-user access, the deploy workflow builds
and ships to Firebase Hosting, and the env template is present and
filled with placeholders (no leaked keys).

---

## Current state (from `git status` and code reads)

**Already in the working tree (untracked or modified):**
- `website/.env.local` — real keys (gitignored).
- `website/src/lib/firebase.js` — initializes app, exports `auth` and
  `db`. Reads the 6 `REACT_APP_FIREBASE_*` env vars.
- `website/src/lib/firestore.js` — `PATHS`, `subscribeUserData`,
  CRUD helpers. All paths under `users/{uid}/...`.
- `website/src/lib/auth.js` — email/password only (`signIn`,
  `signUp`, `logOut`, `onAuthStateChanged`).
- `website/src/features/auth/authSlice.js` — auth state.
- `website/src/App.js` + `website/src/index.js` — routes wired with
  `<AuthGate>`, `<BrowserRouter>`, `initAuthListener()`.
- `website/.gitignore` — CRA template; **missing** Firebase entries
  (`.firebase/`, `firebase-debug.log*`).
- `website/package.json` — CRA 5 / React 19 / Firebase 12 / Redux
  Toolkit 2.

**Missing from the working tree (deleted in `git status`):**
- `website/firebase.json` — needed.
- `website/firestore.rules` — needed (the headline deliverable).
- `website/firestore.indexes.json` — needed (empty index list is fine;
  no composite queries are issued).
- `website/.firebaserc` — needed (project ID binding).
- `website/.env.local.example` — needed (placeholder env template).
- `website/.github/workflows/deploy.yml` — needed (CI/CD).
- `website/public/404.html` — already deleted; the SPA rewrite in
  `firebase.json` makes it redundant. Leave deleted.

**Storage audit (searched `src/`):**
- No `getStorage` / `uploadBytes` / `getDownloadURL` / `ref(` / `child(`
  imports or calls.
- Only storage token: `process.env.REACT_APP_FIREBASE_STORAGE_BUCKET`
  inside the `firebaseConfig` object in `src/lib/firebase.js`.
- Storage is **not used** by any feature code, but the user wants the
  `storage.rules` file included anyway as a deny-by-default placeholder.

**Auth provider audit (searched `src/`):**
- Only `createUserWithEmailAndPassword`, `signInWithEmailAndPassword`,
  `signOut`, `onAuthStateChanged` are imported.
- No Google, Facebook, GitHub, phone, anonymous, or OAuth provider.
- Email/Password is the only provider in code. The companion console
  step (disable other providers in the Firebase Console under
  Authentication → Sign-in method) is **out of repo**.

---

## Files to create

### 1. `website/firebase.json`

```json
{
  "hosting": {
    "public": "build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "hosting": { "port": 5000 },
    "ui": { "enabled": true }
  }
}
```

- `public: "build"` — CRA production build output (matches the README
  and `PROJECT.md` §10/§7.1).
- The `rewrites` block makes the SPA fallback work for client-side
  routes (`/login`, `/income`, `/expenditure`, `/investments`).
- `emulators` block is local-only; ignored by `firebase deploy`.

### 2. `website/firestore.rules`

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null
                          && request.auth.uid == uid;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Matches the user's spec verbatim. `{document=**}` is the wildcard
match-everything-else and is deny-by-default; Firebase's own
default-deny is what would catch this anyway, but keeping the explicit
`if false` line documents intent and matches the requested shape.

### 3. `website/firestore.indexes.json`

```json
{
  "indexes": [],
  "fieldOverrides": []
}
```

The app only calls `collection()` and `query()` with no `where` or
`orderBy` clauses (see `src/lib/firestore.js` `subscribeUserData`).
No composite indexes are needed. Empty list is correct.

### 4. `website/.firebaserc`

```json
{
  "projects": {
    "default": "myexpenselog2"
  }
}
```

Matches the `REACT_APP_FIREBASE_PROJECT_ID` value currently in
`website/.env.local`. If the user has renamed the project, replace
`myexpenselog2` with the real project ID before `firebase deploy`.

### 5. `website/storage.rules`

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{uid}/{allPaths=**} {
      allow read, write: if request.auth != null
                          && request.auth.uid == uid;
    }
  }
}
```

Storage is unused by code but the user wants the file in place as a
deny-by-default posture. Deploying this is a no-op until Storage is
enabled in the Firebase project (the rule file alone won't fail).

### 6. `website/.env.local.example`

```
# Firebase web config — copy this to .env.local and fill in.
# Do NOT commit .env.local.
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=000000000000
REACT_APP_FIREBASE_APP_ID=1:000000000000:web:0000000000000000000000
```

Placeholders only. The previously committed `.env.local.example` (per
git history) leaked a real `AIzaSy…` key — the rewrite uses
placeholders deliberately. The `REACT_APP_FIREBASE_STORAGE_BUCKET`
line stays for parity with `src/lib/firebase.js`'s `initializeApp`
call even though Storage is unused.

### 7. `website/.github/workflows/deploy.yml`

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  build_and_deploy:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: website/package-lock.json
      - name: Install
        working-directory: website
        run: npm ci || npm install
      - name: Build
        working-directory: website
        env:
          REACT_APP_FIREBASE_API_KEY: ${{ secrets.REACT_APP_FIREBASE_API_KEY }}
          REACT_APP_FIREBASE_AUTH_DOMAIN: ${{ secrets.REACT_APP_FIREBASE_AUTH_DOMAIN }}
          REACT_APP_FIREBASE_PROJECT_ID: ${{ secrets.REACT_APP_FIREBASE_PROJECT_ID }}
          REACT_APP_FIREBASE_STORAGE_BUCKET: ${{ secrets.REACT_APP_FIREBASE_STORAGE_BUCKET }}
          REACT_APP_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.REACT_APP_FIREBASE_MESSAGING_SENDER_ID }}
          REACT_APP_FIREBASE_APP_ID: ${{ secrets.REACT_APP_FIREBASE_APP_ID }}
        run: npm run build
      - name: Deploy to Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: ${{ secrets.FIREBASE_PROJECT_ID }}
          workingDirectory: website

  ci:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: website/package-lock.json
      - name: Install
        working-directory: website
        run: npm ci || npm install
      - name: Build
        working-directory: website
        env:
          REACT_APP_FIREBASE_API_KEY: ${{ secrets.REACT_APP_FIREBASE_API_KEY }}
          REACT_APP_FIREBASE_AUTH_DOMAIN: ${{ secrets.REACT_APP_FIREBASE_AUTH_DOMAIN }}
          REACT_APP_FIREBASE_PROJECT_ID: ${{ secrets.REACT_APP_FIREBASE_PROJECT_ID }}
          REACT_APP_FIREBASE_STORAGE_BUCKET: ${{ secrets.REACT_APP_FIREBASE_STORAGE_BUCKET }}
          REACT_APP_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.REACT_APP_FIREBASE_MESSAGING_SENDER_ID }}
          REACT_APP_FIREBASE_APP_ID: ${{ secrets.REACT_APP_FIREBASE_APP_ID }}
        run: npm run build
```

Two jobs: `build_and_deploy` runs only on push to `main`; `ci` runs on
PRs to validate the build. Does not run rules tests (the rules test
harness is not in `package.json` — see "Follow-up" below).

---

## Files to update

### 8. `website/.gitignore`

Add the Firebase-flavoured entries that the current file is missing.
Add these lines near the bottom (after `yarn-error.log*`):

```
# Firebase
.firebase/
firebase-debug.log*
firebase-debug.*.log*
```

This keeps the emulator cache and CLI debug logs out of git.

---

## Files NOT modified (out of scope)

- `src/lib/firebase.js` — already lazy-imports `firebase/app`,
  `firebase/auth`, `firebase/firestore`. Reads the 6 env vars. Works
  with the new `.env.local.example`. No code change required for the
  security/hosting deliverable.
- `src/lib/firestore.js` — paths are already `users/{uid}/...`, so
  the new rules shape permits every existing read/write. No change.
- `src/lib/auth.js` — already email/password only. No change.
- `src/features/auth/authSlice.js` — already routes via
  `request.auth.uid`-derived `uid`. No change.
- The `.js`/`.jsx` application source — already present and matches
  `PROJECT.md`. The user asked to rewrite "the deleted files based on
  the new tech stack @project.md", but the application source is
  **not** the headline ask (which is the security rules), and is
  already aligned to the new stack (JS not TS, no `getStorage`,
  email/password only). Leaving source untouched keeps scope tight.
- `package.json` — no new dependencies. `firebase-tools` (for
  `firebase deploy` + emulator) is intentionally **not** added; the
  user installs it locally with `npm i -g firebase-tools` rather than
  bloating the project dep tree. CI uses
  `FirebaseExtended/action-hosting-deploy`, which doesn't require
  the CLI in the project.

---

## Verification

After applying the changes, verify end-to-end:

1. **Build sanity** —
   `cd website && npm run build` should complete with no errors and
   emit `build/index.html` + asset bundles.

2. **Rules shape** —
   Open `website/firestore.rules` and confirm:
   - The `users/{uid}/{document=**}` match comes **before** the
     `{document=**}` catch-all.
   - The catch-all denies both reads and writes.
   - The auth check uses `request.auth.uid == uid` (strict equality).

3. **Hosting rewrite** —
   `cd website && firebase serve --only hosting` and visit
   `http://localhost:5000/login`, then
   `http://localhost:5000/income` (deep link). Both should serve
   the SPA shell — confirms the rewrite to `/index.html`.

4. **Rules emulator (manual, optional)** —
   `firebase emulators:start --only firestore,auth` and a quick
   sanity check that a second signed-in user cannot read the first
   user's `users/{uid}/income_records` doc. (Automated
   rules-unit-testing is the follow-up below.)

5. **CI dry-run** —
   Push to a non-`main` branch and confirm the `ci` job builds.
   Configure GitHub secrets first:
   - `REACT_APP_FIREBASE_API_KEY`
   - `REACT_APP_FIREBASE_AUTH_DOMAIN`
   - `REACT_APP_FIREBASE_PROJECT_ID`
   - `REACT_APP_FIREBASE_STORAGE_BUCKET`
   - `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
   - `REACT_APP_FIREBASE_APP_ID`
   - `FIREBASE_SERVICE_ACCOUNT` (service account JSON)
   - `FIREBASE_PROJECT_ID` (project ID, for the deploy step)
   Then push to `main` and confirm `build_and_deploy` runs the build
   and ships to Firebase Hosting.

6. **Production deploy** —
   `cd website && firebase deploy --only firestore:rules,firestore:indexes,storage`
   then `firebase deploy --only hosting` (or `firebase deploy` for all
   targets).

---

## Out-of-repo / follow-up

- **Firebase Console auth provider cleanup** — disable Google,
  Anonymous, Phone, etc. under Authentication → Sign-in method. The
  code is already email/password only; this is a one-time console
  toggle.
- **Rules unit tests** — the deleted `src/lib/firestore.rules.test.*`
  and `src/lib/firestore.data.test.*` referenced Vitest +
  `@firebase/rules-unit-testing`, neither of which is in the current
  `package.json`. Restoring them is a separate task (add devDeps,
  port the files, add a `firebase-rules` CI job). The new rules are
  still safe to deploy; the test harness is the missing safety net.
- **Rotating the leaked API key** — the previously committed
  `.env.local.example` included a real `AIzaSy…` key. That key is in
  git history. If the project is production-sensitive, rotate the
  key in the Firebase Console. Out of scope for this plan.
