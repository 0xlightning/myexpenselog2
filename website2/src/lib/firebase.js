import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app = null;
let auth = null;
let db = null;

function ensureConfig() {
  const required = ['apiKey', 'authDomain', 'projectId'];
  const missing = required.filter((k) => !firebaseConfig[k]);
  if (missing.length) {
    throw new Error(
      `Firebase config missing: ${missing.join(', ')}. ` +
        'Copy .env.local.example to .env.local and fill in the values.',
    );
  }
}

function getApp() {
  if (!app) {
    ensureConfig();
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth() {
  if (!auth) auth = getAuth(getApp());
  return auth;
}

export function getFirebaseDb() {
  if (!db) db = getFirestore(getApp());
  return db;
}
