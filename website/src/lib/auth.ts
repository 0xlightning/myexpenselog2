import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import type { Unsubscribe } from 'firebase/firestore';
import { getFirebaseAuth } from './firebase';
import { authError, authStateChanged } from '../features/auth/authSlice';
import { subscribeUserData } from './firestore';
import { showError } from '../app/uiSlice';
import { store } from '../app/store';
import type { AppDispatch } from '../app/store';
import type { AuthUser } from '../features/auth/authSlice';

function toAuthUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return { uid: user.uid, email: user.email };
}

let dataUnsub: Unsubscribe | null = null;
let authUnsub: Unsubscribe | null = null;

export function initAuthListener(): () => void {
  if (authUnsub) return authUnsub;
  try {
    const auth = getFirebaseAuth();
    authUnsub = onAuthStateChanged(
      auth,
      (user) => {
        (store.dispatch as AppDispatch)(authStateChanged(toAuthUser(user)));
        if (dataUnsub) {
          dataUnsub();
          dataUnsub = null;
        }
        if (user) {
          dataUnsub = subscribeUserData(
            user.uid,
            store.dispatch as AppDispatch,
          );
        }
      },
      (err) => {
        (store.dispatch as AppDispatch)(
          showError(err instanceof Error ? err.message : 'Auth error'),
        );
      },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to initialize Firebase';
    (store.dispatch as AppDispatch)(authError(message));
    (store.dispatch as AppDispatch)(showError(message));
    // Surface as unauthenticated so the user lands on /login and can
    // see the real problem instead of a perpetual "Loading…".
    (store.dispatch as AppDispatch)(authStateChanged(null));
  }
  return authUnsub ?? (() => undefined);
}

export async function signIn(email: string, password: string): Promise<void> {
  try {
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign-in failed';
    (store.dispatch as AppDispatch)(authError(message));
    (store.dispatch as AppDispatch)(showError(message));
    throw err;
  }
}

export async function signUp(email: string, password: string): Promise<void> {
  try {
    await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign-up failed';
    (store.dispatch as AppDispatch)(authError(message));
    (store.dispatch as AppDispatch)(showError(message));
    throw err;
  }
}

export async function logOut(): Promise<void> {
  await signOut(getFirebaseAuth());
}
