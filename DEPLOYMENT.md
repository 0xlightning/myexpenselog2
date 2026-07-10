# Deployment & operations

## Token scoping (CI deploy service account)

The Firebase service account stored in GitHub secrets as
`FIREBASE_SERVICE_ACCOUNT` should be **scoped to Hosting deploy only**,
not project-owner.

Recommended setup:

1. In Firebase console → Project settings → Service accounts → Generate
   new private key. Save the JSON locally.
2. In Google Cloud console → IAM & admin → IAM, find or create a custom
   role with **only** these permissions:
   - `firebasehosting.sites.update`
   - `firebasehosting.releases.create`
   - `firebasehosting.releases.update`
   - `storage.buckets.get` (needed for the deployment action to read the
     default bucket metadata)
3. Create a service account (or use the one from step 1) and grant it
   that custom role on the project. Disable the "Editor" / "Owner" roles
   for that account.
4. Re-download the JSON key for this scoped account, paste its full
   contents into the `FIREBASE_SERVICE_ACCOUNT` repo secret.

Rotate this key periodically (suggested: every 90 days). After rotation,
redeploy once to confirm the new key works, then revoke the old one.

If you skip this step the deploy still works, but a leaked secret would
have full project access.

## Free-tier quota awareness

Default Firestore free plan (Spark): ~50K reads/day, ~20K writes/day,
1 GiB storage. The app currently:

- mounts **6 unbounded `onSnapshot` listeners per signed-in user**
  (one per collection under `users/{uid}/`)
- reads each record once on initial subscription, then on every write
  to that collection

For a single solo user generating a few hundred records, this is well
within budget. If usage grows, the levers are:
- paginate the `RecordPage` list (e.g. limit 50 most-recent, infinite
  scroll)
- scope the `onSnapshot` by date range in the dashboard's breakdown
  queries (e.g. only subscribe to records in the active range)

## Manual security spot-check

After the first deploy, run this in the browser console while signed in
as user A:

```js
const { getFirestore, doc, getDoc } = await import('firebase/firestore');
const db = getFirestore();
// Replace USER_B_UID with another real user id
const r = await getDoc(doc(db, `users/USER_B_UID/income_records/anything`));
console.log(r.exists()); // should be false — and the call should reject
```

Expected: the call rejects with `permission-denied`. If `r.exists()`
ever returns `true`, treat it as a P0 — the rules have a gap.

The same check works for writes:

```js
const { setDoc } = await import('firebase/firestore');
await setDoc(doc(db, `users/USER_B_UID/income_records/pwn`), { amount: 1 });
// should reject
```
