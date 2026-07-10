# Security

## Rule coverage

`firestore.rules` denies all access by default. The single allow rule
is:

```
match /users/{uid}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

This covers all six per-user collections:
`income_sources`, `income_records`, `expense_categories`,
`expenditure_records`, `investment_categories`, `investments`.

Any future collection added under `users/{uid}/...` is automatically
covered. Public collections (if any are added later) need their own
explicit `match` block.

## Field-shape validation

Field-shape validation is **client-side only** (`src/lib/validation.ts`).
Rules do not enforce `amount > 0` or `date` parseability. Rationale:
client validates; rules are an access-control layer. A malicious
authenticated user could in principle write a malformed document to
their own tree — the worst outcome is their own bad data, since
`request.auth.uid == uid` is the only constraint.

To tighten later: add a `validateRecord()` rules function and a
`match` block per collection that calls it on write. Tracked as a
follow-up.

## Local dev

Per `technology.md` §7, local development should point at the
**Firestore emulator**, not live. Start it with:

```
firebase emulators:start --only firestore,auth,hosting
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
npm test    # rules + data tests run against the emulator
```

The CI deploys to the real project on `main`. Unit tests in CI skip the
emulator suite (no emulator in workflow) but still pass.

## Spot-check

See `DEPLOYMENT.md` for the manual browser-console spot-check after
first deploy.
