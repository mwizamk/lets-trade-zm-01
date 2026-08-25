import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const client = JSON.parse(sessionStorage.getItem("client") || "null");

const subscriptionsList = document.getElementById("subscriptionsList");
const dashboardMessage = document.getElementById("dashboardMessage");

function showMessage(text, type = "error") {
  dashboardMessage.textContent = text;
  dashboardMessage.className = `form-message show ${type}`;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function statusOf(sub) {
  return String(sub.status || sub.sub_status || "pending")
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function daysUntil(dateString) {
  if (!dateString) return Infinity;
  const target = new Date(`${dateString}T23:59:59`);
  return Math.ceil((target - new Date()) / 86400000);
}

async function loadSubscriptions() {
  if (!client) return;

  const snapshot = await getDocs(query(
    collection(db, "subscriptions"),
    where("clientId", "==", client.id)
  ));

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

function renderSubscriptions(subscriptions) {
  if (!subscriptions.length) {
    subscriptionsList.innerHTML =
      `<div class="loading-card">No subscriptions found.</div>`;
    return;
  }

  const activeCount = subscriptions.filter(s =>
    ["active", "pending_expiry"].includes(statusOf(s))
  ).length;

  const expiringCount = subscriptions.filter(s => {
    const days = daysUntil(s.expiryDate || s.sub_expiry);
    return days >= 0 && days <= 5;
  }).length;

  document.getElementById("subscriptionCount").textContent = subscriptions.length;
  document.getElementById("activeCount").textContent = activeCount;
  document.getElementById("expiringCount").textContent = expiringCount;

  subscriptionsList.innerHTML = subscriptions.map(sub => {
    const status = statusOf(sub);
    const expiry = sub.expiryDate || sub.sub_expiry || "—";
    const accountAssigned = Boolean(sub.accountId);

    return `
      <article class="subscription-card">
        <div class="subscription-main">
          <div class="subscription-title">
            <span class="service-badge">${escapeHTML(sub.service || "Service")}</span>
            <h3>${escapeHTML(sub.package || "Subscription")}</h3>
          </div>

          <div class="subscription-details">
            <div><span>Status</span><strong class="status-${escapeHTML(status)}">${escapeHTML(status.replaceAll("_", " "))}</strong></div>
            <div><span>Start</span><strong>${escapeHTML(sub.startDate || sub.sub_start || "—")}</strong></div>
            <div><span>Expiry</span><strong>${escapeHTML(expiry)}</strong></div>
            <div><span>Account</span><strong>${accountAssigned ? escapeHTML(sub.accountLabel || "Assigned") : "Being assigned"}</strong></div>
          </div>

          ${
            accountAssigned
            ? `<div class="account-notice">
                Your service account has been assigned. Contact admin if you need assistance.
               </div>`
            : `<div class="account-notice pending">
                Your subscription is active/processing. Account assignment will appear here when completed.
               </div>`
          }
        </div>
      </article>
    `;
  }).join("");
}

async function startDashboard() {
  if (!client) {
    window.location.href = "login.html";
    return;
  }

  const name = client.name || "Customer";

  document.getElementById("customerName").textContent = name;
  document.getElementById("welcomeName").textContent = name;
  document.getElementById("detailName").textContent = name;
  document.getElementById("detailPhone").textContent = client.phone || "—";
  document.getElementById("detailEmail").textContent = client.email || "—";

  try {
    const subscriptions = await loadSubscriptions();
    renderSubscriptions(subscriptions);
    sessionStorage.setItem("clientSubscriptions", JSON.stringify(subscriptions));
  } catch (error) {
    console.error(error);
    showMessage("Unable to load your subscriptions.");
  }
}

document.getElementById("logoutButton")?.addEventListener("click", () => {
  sessionStorage.removeItem("client");
  sessionStorage.removeItem("clientSubscriptions");
  sessionStorage.removeItem("selectedPrice");
  window.location.href = "login.html";
});

startDashboard();
