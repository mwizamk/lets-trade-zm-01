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
// FIREBASE CONFIGURATION
// ============================================================

const firebaseConfig = {

  // KEEP YOUR EXISTING VALUES HERE
  // Do not use the example values below.

  apiKey: "YOUR_EXISTING_API_KEY",
  authDomain: "YOUR_EXISTING_AUTH_DOMAIN",
  projectId: "lets-trade-zm-488d9",
  storageBucket: "YOUR_EXISTING_STORAGE_BUCKET",
  messagingSenderId: "YOUR_EXISTING_MESSAGING_SENDER_ID",
  appId: "YOUR_EXISTING_APP_ID"

};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app =
  initializeApp(firebaseConfig);


// ============================================================
// SERVICES
// ============================================================

const db =
  getFirestore(app);

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
