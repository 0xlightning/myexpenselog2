// Firestore security rule tests. Runs against the Firestore emulator.
//
// To run locally:
//   1. firebase emulators:start --only firestore
//   2. export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
//   3. npm test
//
// Skipped if the emulator is not reachable.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;
const RUN_RULES = Boolean(EMULATOR_HOST);

const here = dirname(fileURLToPath(import.meta.url));
const rulesPath = resolve(here, '..', '..', 'firestore.rules');

const ALICE = 'user-alice';
const BOB = 'user-bob';

describe.skipIf(!RUN_RULES)('firestore.rules', () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    if (!EMULATOR_HOST) return;
    const [host, port] = EMULATOR_HOST.split(':');
    env = await initializeTestEnvironment({
      projectId: `rules-test-${Date.now()}`,
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

  it('owner can write to their own subcollection', async () => {
    const ctx = env.authenticatedContext(ALICE);
    const db = ctx.firestore();
    await assertSucceeds(
      setDoc(doc(db, `users/${ALICE}/income_records/r1`), {
        amount: 100,
        date: '2026-01-15',
        sourceId: null,
        notes: '',
      }),
    );
  });

  it('owner can read their own document', async () => {
    const ctx = env.authenticatedContext(ALICE);
    const db = ctx.firestore();
    await assertSucceeds(getDoc(doc(db, `users/${ALICE}/income_records/r1`)));
  });

  it('another user cannot read alice\'s data', async () => {
    const ctx = env.authenticatedContext(BOB);
    const db = ctx.firestore();
    await assertFails(getDoc(doc(db, `users/${ALICE}/income_records/r1`)));
  });

  it('another user cannot write to alice\'s data', async () => {
    const ctx = env.authenticatedContext(BOB);
    const db = ctx.firestore();
    await assertFails(
      setDoc(doc(db, `users/${ALICE}/income_records/r2`), { amount: 1 }),
    );
  });

  it('unauthenticated requests are denied', async () => {
    const ctx = env.unauthenticatedContext();
    const db = ctx.firestore();
    await assertFails(
      setDoc(doc(db, `users/${ALICE}/income_records/r3`), { amount: 1 }),
    );
  });

  it('owner can write to any of the 6 subcollections', async () => {
    const ctx = env.authenticatedContext(ALICE);
    const db = ctx.firestore();
    const paths = [
      `users/${ALICE}/income_sources/s1`,
      `users/${ALICE}/income_records/r4`,
      `users/${ALICE}/expense_categories/c1`,
      `users/${ALICE}/expenditure_records/e1`,
      `users/${ALICE}/investment_categories/i1`,
      `users/${ALICE}/investments/v1`,
    ];
    for (const p of paths) {
      await assertSucceeds(setDoc(doc(db, p), { ok: true }));
    }
  });
});
