// ============================================================
// LET'S TRADE ZM
// FIREBASE CONFIGURATION
// ============================================================

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

// ============================================================
// FIREBASE CONFIG
// ============================================================
//
// IMPORTANT:
// Replace ONLY the values below with the values from:
//
// Firebase Console
// → Project settings
// → General
// → Your apps
// → Web app
//
// Project ID must remain:
// lets-trade-zm-488d
//
// Do NOT put a Firebase Admin SDK private key here.
// Do NOT put a service-account JSON file here.
// Do NOT put a password here.
//
// ============================================================

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",

  authDomain:
    "lets-trade-zm-488d.firebaseapp.com",

  projectId:
    "lets-trade-zm-488d",

  storageBucket:
    "YOUR_FIREBASE_STORAGE_BUCKET",

  messagingSenderId:
    "YOUR_FIREBASE_MESSAGING_SENDER_ID",

  appId:
    "YOUR_FIREBASE_APP_ID"
};

// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);

// ============================================================
// FIRESTORE
// ============================================================

const db = getFirestore(app);

// ============================================================
// FIREBASE AUTHENTICATION
// ============================================================

const auth = getAuth(app);

// ============================================================
// EXPORT
// ============================================================

export {
  app,
  db,
  auth
};
