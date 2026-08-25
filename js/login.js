import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
  limit
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const form = document.getElementById("loginForm");
const identifierInput = document.getElementById("loginIdentifier");
const button = document.getElementById("loginButton");
const message = document.getElementById("loginMessage");

function showMessage(text, type = "error") {
  message.textContent = text;
  message.className = `form-message show ${type}`;
}

function normalizePhone(value) {
  return value.replace(/\s+/g, "").replace(/^\+260/, "0");
}

async function findClient(identifier) {
  const raw = identifier.trim();
  const normalizedPhone = normalizePhone(raw);

  let snapshot = await getDocs(query(
    collection(db, "clients"),
    where("phone", "==", raw),
    limit(1)
  ));

  if (!snapshot.empty) return snapshot.docs[0];

  if (normalizedPhone !== raw) {
    snapshot = await getDocs(query(
      collection(db, "clients"),
      where("phone", "==", normalizedPhone),
      limit(1)
    ));
    if (!snapshot.empty) return snapshot.docs[0];
  }

  const email = raw.toLowerCase();

  snapshot = await getDocs(query(
    collection(db, "clients"),
    where("email", "==", email),
    limit(1)
  ));

  if (!snapshot.empty) return snapshot.docs[0];

  return null;
}

async function getClientSubscriptions(clientId) {
  const snapshot = await getDocs(query(
    collection(db, "subscriptions"),
    where("clientId", "==", clientId)
  ));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

form?.addEventListener("submit", async event => {
  event.preventDefault();

  const identifier = identifierInput.value.trim();
  if (!identifier) {
    showMessage("Enter your phone number or email.");
    return;
  }

  button.disabled = true;
  button.textContent = "Checking...";

  try {
    const clientDoc = await findClient(identifier);

    if (!clientDoc) {
      showMessage("We couldn't find an account with those details. Please sign up first.");
      return;
    }

    const client = { id: clientDoc.id, ...clientDoc.data() };
    const subscriptions = await getClientSubscriptions(client.id);

    const active = subscriptions.filter(sub =>
      ["active", "pending", "pending_expiry", "pending expiry"].includes(
        String(sub.status || sub.sub_status || "").toLowerCase()
      )
    );

    if (!active.length) {
      showMessage("Your account was found, but there is no active subscription yet. Please contact admin or place a new order.");
      return;
    }

    sessionStorage.setItem("client", JSON.stringify(client));
    sessionStorage.setItem("clientSubscriptions", JSON.stringify(subscriptions));

    window.location.href = "dashboard.html";

  } catch (error) {
    console.error(error);
    showMessage("Unable to access your account right now. Please try again.");
  } finally {
    button.disabled = false;
    button.textContent = "Continue";
  }
});
