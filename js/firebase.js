// ============================================================
// LET'S TRADE ZM
// Firebase configuration and shared Firebase services
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ------------------------------------------------------------
// FIREBASE PROJECT CONFIGURATION
// ------------------------------------------------------------

const firebaseConfig = {
  apiKey: "AIzaSyA09R5oFLuSPRzLc58dUHamFW0NB8P2M1Q",
  authDomain: "lets-trade-zm-488d9.firebaseapp.com",
  projectId: "lets-trade-zm-488d9",
  storageBucket: "lets-trade-zm-488d9.firebasestorage.app",
  messagingSenderId: "702125763072",
  appId: "1:702125763072:web:c6b6114b2a23cdb89e06e5"
};


// ------------------------------------------------------------
// INITIALIZE FIREBASE
// ------------------------------------------------------------

const app = initializeApp(firebaseConfig);


// ------------------------------------------------------------
// FIREBASE SERVICES
// ------------------------------------------------------------

export const db = getFirestore(app);

export const auth = getAuth(app);

export { onAuthStateChanged };

export { app };


// ------------------------------------------------------------
// PROJECT INFORMATION
// Useful for setup/debugging
// ------------------------------------------------------------

export const firebaseProjectId = firebaseConfig.projectId;

export const firebaseAppId = firebaseConfig.appId;


// ------------------------------------------------------------
// DEBUG MESSAGE
// ------------------------------------------------------------

console.log(
  "Let's Trade ZM Firebase connected:",
  firebaseConfig.projectId
);
