// ============================================================
// LET'S TRADE ZM
// ADMIN LOGIN
// ============================================================

import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ============================================================
// HELPERS
// ============================================================

const $ = (id) =>
  document.getElementById(id);


// ============================================================
// ADMIN LOGIN
// ============================================================

async function adminLogin(event) {

  event.preventDefault();


  const email =
    $("adminEmail")
      .value
      .trim()
      .toLowerCase();


  const password =
    $("adminPassword")
      .value;


  const button =
    $("adminLoginButton");


  const message =
    $("adminLoginMessage");


  button.disabled = true;

  button.textContent =
    "Checking...";


  try {

    // --------------------------------------------------------
    // FIREBASE AUTHENTICATION
    // --------------------------------------------------------

    const credential =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );


    const user =
      credential.user;


    // --------------------------------------------------------
    // VERIFY ADMIN RECORD
    // --------------------------------------------------------

    const adminRef =
      doc(
        db,
        "admins",
        user.uid
      );


    const adminSnapshot =
      await getDoc(
        adminRef
      );


    if (!adminSnapshot.exists()) {

      await auth.signOut();

      throw new Error(
        "This account is not authorized as an administrator."
      );

    }


    const admin =
      adminSnapshot.data();


    if (
      admin.role !== "admin" ||
      admin.active !== true
    ) {

      await auth.signOut();

      throw new Error(
        "Administrator access is disabled."
      );

    }


    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    message.textContent =
      "Login successful. Opening Admin Portal...";

    message.style.color =
      "green";


    window.location.href =
      "admin.html";


  } catch (error) {

    console.error(
      "Admin login error:",
      error
    );


    message.textContent =
      getFriendlyAuthError(error);


    message.style.color =
      "red";


    button.disabled =
      false;

    button.textContent =
      "Sign in";

  }

}


// ============================================================
// FRIENDLY ERRORS
// ============================================================

function getFriendlyAuthError(error) {

  switch (error.code) {

    case "auth/invalid-credential":
      return "Incorrect email or password.";

    case "auth/invalid-email":
      return "Enter a valid email address.";

    case "auth/user-disabled":
      return "This administrator account has been disabled.";

    case "auth/too-many-requests":
      return "Too many login attempts. Please try again later.";

    default:
      return error.message ||
        "Unable to sign in.";

  }

}


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    $("adminLoginForm")
      ?.addEventListener(
        "submit",
        adminLogin
      );

  }
);
