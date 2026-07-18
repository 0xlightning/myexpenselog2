import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { getFirebaseAuth } from './firebase';
import { authError, authStateChanged } from '../features/auth/authSlice';
import { subscribeUserData } from './firestore';
import { showError } from '../app/uiSlice';
import { store } from '../app/store';

// Map Firebase auth error codes to user-friendly messages.
const ERROR_MESSAGES = {
  'auth/configuration-not-found':
    'Firebase project not configured. Enable Email/Password in Firebase Console → Authentication → Sign-in method.',
  'auth/invalid-email': 'Invalid email address.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/invalid-login-credentials': 'Incorrect email or password.',
  'auth/email-already-in-use': 'An account already exists with that email.',
  'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  'auth/too-many-requests': 'Too many failed attempts. Try again later.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/operation-not-allowed':
    'Email/Password sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.',
};

function friendlyMessage(err) {
  if (err && err.code && ERROR_MESSAGES[err.code]) {
    return ERROR_MESSAGES[err.code];
  }
  if (err && err.message) return err.message;
  return 'Authentication failed. Please try again.';
}

function toAuthUser(user) {
  if (!user) return null;
  return { uid: user.uid, email: user.email };
}

let dataUnsub = null;
let authUnsub = null;

export function initAuthListener() {
  if (authUnsub) return authUnsub;
  try {
    const auth = getFirebaseAuth();
    authUnsub = onAuthStateChanged(
      auth,
      (user) => {
        store.dispatch(authStateChanged(toAuthUser(user)));
        if (dataUnsub) {
          dataUnsub();
          dataUnsub = null;
        }
        if (user) {
          dataUnsub = subscribeUserData(user.uid, store.dispatch);
        }
      },
      (err) => {
        const message = friendlyMessage(err);
        store.dispatch(authError(message));
        store.dispatch(showError(message));
      },
    );
  } catch (err) {
    const message = friendlyMessage(err);
    store.dispatch(authError(message));
    store.dispatch(showError(message));
    store.dispatch(authStateChanged(null));
  }
  return authUnsub || (() => undefined);
}

export async function signIn(email, password) {
  const auth = getFirebaseAuth();
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    throw new Error(friendlyMessage(err));
  }
}

export async function signUp(email, password) {
  const auth = getFirebaseAuth();
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (err) {
    throw new Error(friendlyMessage(err));
  }
}

export async function logOut() {
  const auth = getFirebaseAuth();
  try {
    await signOut(auth);
  } catch (err) {
    throw new Error(friendlyMessage(err));
  }
}
