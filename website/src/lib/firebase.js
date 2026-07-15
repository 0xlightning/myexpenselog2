import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
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
