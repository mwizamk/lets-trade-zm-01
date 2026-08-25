// ============================================================
// LET'S TRADE ZM
// FIREBASE CONFIGURATION
// ============================================================

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import { getFirestore } from
  "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import { getAuth } from
  "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


// ============================================================
// FIREBASE WEB APP CONFIG
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyA09R5oFLuSPRzLc58dUHamFW0NB8P2M1Q",

  authDomain:
    "lets-trade-zm-488d.firebaseapp.com",

  projectId:
    "lets-trade-zm-488d9",

  storageBucket:
    "lets-trade-zm-488d9.firebasestorage.app",

  messagingSenderId:
    "702125763072",

  appId:
    "1:702125763072:web:c6b6114b2a23cdb89e06e5"
};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app =
  initializeApp(firebaseConfig);


// ============================================================
// FIRESTORE
// ============================================================

const db =
  getFirestore(app);


// ============================================================
// AUTHENTICATION
// ============================================================

const auth =
  getAuth(app);


// ============================================================
// EXPORT
// ============================================================

export {
  app,
  db,
  auth
};
