// Data layer mutation tests. Runs against the Firestore emulator.
// Skipped if no FIRESTORE_EMULATOR_HOST is set.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;
const RUN_DATA = Boolean(EMULATOR_HOST);

const here = dirname(fileURLToPath(import.meta.url));
const rulesPath = resolve(here, '..', '..', 'firestore.rules');

const ALICE = 'user-alice';
const BOB = 'user-bob';

describe.skipIf(!RUN_DATA)('firestore data layer (against emulator)', () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    if (!EMULATOR_HOST) return;
    const [host, port] = EMULATOR_HOST.split(':');
    env = await initializeTestEnvironment({
      projectId: `data-test-${Date.now()}`,
      firestore: {
        host,
        port: Number(port),
        rules: readFileSync(rulesPath, 'utf8'),
      },
    });
  });

  afterAll(async () => {
    if (env) await env.cleanup();
  });

  it('alice can add a record, then read it', async () => {
    const ctx = env.authenticatedContext(ALICE);
    const db = ctx.firestore();
    await assertSucceeds(
      db
        .doc(`users/${ALICE}/income_records/test-1`)
        .set({ amount: 50, date: '2026-01-15', sourceId: null, notes: '' }),
    );
    const snap = await getDoc(doc(db, `users/${ALICE}/income_records/test-1`));
    expect(snap.exists()).toBe(true);
    expect(snap.data()?.amount).toBe(50);
  });

  it('alice can update a record', async () => {
    const ctx = env.authenticatedContext(ALICE);
    const db = ctx.firestore();
    await assertSucceeds(
      db
        .doc(`users/${ALICE}/expenditure_records/test-1`)
        .set({ amount: 25, date: '2026-01-15', categoryId: null, notes: '' }),
    );
    await assertSucceeds(
      db
        .doc(`users/${ALICE}/expenditure_records/test-1`)
        .update({ amount: 30 }),
    );
    const snap = await getDoc(
      doc(db, `users/${ALICE}/expenditure_records/test-1`),
    );
    expect(snap.data()?.amount).toBe(30);
  });

  it('alice can delete a record', async () => {
    const ctx = env.authenticatedContext(ALICE);
    const db = ctx.firestore();
    await assertSucceeds(
      db
        .doc(`users/${ALICE}/investments/test-1`)
        .set({ amount: 100, date: '2026-01-15', categoryId: null, notes: '' }),
    );
    await assertSucceeds(
      db.doc(`users/${ALICE}/investments/test-1`).delete(),
    );
    const snap = await getDoc(doc(db, `users/${ALICE}/investments/test-1`));
    expect(snap.exists()).toBe(false);
  });

  it('bob cannot read alice\'s record', async () => {
    const aliceCtx = env.authenticatedContext(ALICE);
    const aliceDb = aliceCtx.firestore();
    await assertSucceeds(
      aliceDb
        .doc(`users/${ALICE}/income_records/private-1`)
        .set({ amount: 1, date: '2026-01-15', sourceId: null, notes: '' }),
    );

    const bobCtx = env.authenticatedContext(BOB);
    const bobDb = bobCtx.firestore();
    await assertFails(
      getDoc(doc(bobDb, `users/${ALICE}/income_records/private-1`)),
    );
  });
});
