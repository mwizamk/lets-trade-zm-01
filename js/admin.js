// ============================================================
// LET'S TRADE ZM
// ADMIN PORTAL
// COMPLETE ADMIN.JS
// ============================================================

import { db, auth } from "./firebase.js";

import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  runTransaction
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

// ============================================================
// CONFIGURATION
// ============================================================

const COLLECTIONS = {
  admins: "admins",
  pricelist: "pricelist",
  clients: "clients",
  orders: "orders",
  payments: "payments",
  accounts: "accounts",
  subscriptions: "subscriptions"
};

// ============================================================
// HELPERS
// ============================================================

function $(id) {
  return document.getElementById(id);
}

function safe(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value) {
  return `K${Number(value || 0).toFixed(2)}`;
}

function dateValue(value) {
  if (!value) return "—";

  if (typeof value?.toDate === "function") {
    return value.toDate().toLocaleDateString();
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString();
}

function showMessage(text, type = "success") {
  let box =
    $("adminMessage") ||
    $("message") ||
    $("errorMessage");

  if (!box) {
    alert(text);
    return;
  }

  box.textContent = text;
  box.className = `admin-message ${type}`;
  box.style.display = "block";
}

function hideMessage() {
  const box =
    $("adminMessage") ||
    $("message") ||
    $("errorMessage");

  if (box) {
    box.style.display = "none";
  }
}

// ============================================================
// ADMIN AUTHENTICATION
// ============================================================

let currentAdmin = null;

async function verifyAdmin(user) {
  if (!user) {
    return false;
  }

  try {
    const adminRef = doc(
      db,
      COLLECTIONS.admins,
      user.uid
    );

    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {
      return false;
    }

    const admin = adminSnap.data();

    if (admin.active === false) {
      return false;
    }

    currentAdmin = {
      uid: user.uid,
      ...admin
    };

    return true;

  } catch (error) {
    console.error("Admin verification failed:", error);
    return false;
  }
}

// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(auth, async (user) => {

  // If this is login.html, do not force dashboard logic.
  const isAdminPage =
    location.pathname.includes("admin.html");

  if (!isAdminPage) {
    return;
  }

  if (!user) {
    showLogin();
    return;
  }

  const validAdmin = await verifyAdmin(user);

  if (!validAdmin) {
    await signOut(auth);
    showLogin();
    showMessage(
      "You are not authorized to access the admin portal.",
      "error"
    );
    return;
  }

  showDashboard();

  await loadDashboard();
});

// ============================================================
// SHOW / HIDE ADMIN LOGIN
// ============================================================

function showLogin() {

  const login =
    $("adminLogin") ||
    $("loginSection") ||
    $("loginContainer");

  const dashboard =
    $("adminDashboard") ||
    $("dashboardSection") ||
    $("dashboardContainer");

  if (login) {
    login.style.display = "";
  }

  if (dashboard) {
    dashboard.style.display = "none";
  }
}

function showDashboard() {

  const login =
    $("adminLogin") ||
    $("loginSection") ||
    $("loginContainer");

  const dashboard =
    $("adminDashboard") ||
    $("dashboardSection") ||
    $("dashboardContainer");

  if (login) {
    login.style.display = "none";
  }

  if (dashboard) {
    dashboard.style.display = "";
  }

  if ($("adminName")) {
    $("adminName").textContent =
      currentAdmin?.name ||
      currentAdmin?.email ||
      "Administrator";
  }
}

// ============================================================
// LOGIN FORM
// ============================================================

const loginForm =
  $("adminLoginForm") ||
  $("loginForm");

loginForm?.addEventListener("submit", async (event) => {

  event.preventDefault();
  hideMessage();

  const email =
    $("adminEmail")?.value.trim() ||
    $("email")?.value.trim();

  const password =
    $("adminPassword")?.value ||
    $("password")?.value;

  if (!email || !password) {
    showMessage(
      "Enter your administrator email and password.",
      "error"
    );
    return;
  }

  try {

    const button =
      $("adminLoginButton") ||
      $("loginButton");

    if (button) {
      button.disabled = true;
      button.textContent = "Signing in...";
    }

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  } catch (error) {

    console.error(error);

    let message =
      "Unable to sign in.";

    if (
      error.code ===
      "auth/invalid-credential"
    ) {
      message =
        "Incorrect administrator email or password.";
    }

    if (
      error.code ===
      "auth/user-not-found"
    ) {
      message =
        "Administrator account was not found.";
    }

    showMessage(message, "error");

  } finally {

    const button =
      $("adminLoginButton") ||
      $("loginButton");

    if (button) {
      button.disabled = false;
      button.textContent = "Sign in";
    }
  }
});

// ============================================================
// LOGOUT
// ============================================================

const logoutButton =
  $("logoutButton") ||
  $("adminLogout");

logoutButton?.addEventListener("click", async () => {

  await signOut(auth);

  currentAdmin = null;

  location.href = "admin.html";
});

// ============================================================
// LOAD EVERYTHING
// ============================================================

async function loadDashboard() {

  try {

    await Promise.all([
      loadStats(),
      loadPendingPayments(),
      loadOrders(),
      loadClients(),
      loadAccounts(),
      loadSubscriptions(),
      loadPriceList()
    ]);

  } catch (error) {

    console.error(
      "Dashboard loading error:",
      error
    );

    showMessage(
      "Some admin data could not be loaded.",
      "error"
    );
  }
}

// ============================================================
// STATS
// ============================================================

async function loadStats() {

  const [
    paymentsSnap,
    ordersSnap,
    clientsSnap,
    subscriptionsSnap
  ] = await Promise.all([

    getDocs(
      collection(db, COLLECTIONS.payments)
    ),

    getDocs(
      collection(db, COLLECTIONS.orders)
    ),

    getDocs(
      collection(db, COLLECTIONS.clients)
    ),

    getDocs(
      collection(db, COLLECTIONS.subscriptions)
    )
  ]);

  const pendingPayments =
    paymentsSnap.docs.filter(
      d =>
        String(
          d.data().status || ""
        ).toLowerCase() === "pending"
    ).length;

  const activeSubscriptions =
    subscriptionsSnap.docs.filter(
      d =>
        String(
          d.data().status ||
          d.data().sub_status ||
          ""
        ).toLowerCase() === "active"
    ).length;

  setText(
    "pendingPaymentsCount",
    pendingPayments
  );

  setText(
    "ordersCount",
    ordersSnap.size
  );

  setText(
    "clientsCount",
    clientsSnap.size
  );

  setText(
    "activeSubscriptionsCount",
    activeSubscriptions
  );

  setText(
    "pendingCount",
    pendingPayments
  );
}

function setText(id, value) {

  const element = $(id);

  if (element) {
    element.textContent = value;
  }
}

// ============================================================
// LOAD PENDING PAYMENTS
// ============================================================

async function loadPendingPayments() {

  const container =
    $("pendingPayments") ||
    $("paymentsList");

  if (!container) return;

  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.payments),
      where("status", "==", "pending")
    )
  );

  if (snap.empty) {

    container.innerHTML =
      `<div class="empty-state">
        No pending payments.
      </div>`;

    return;
  }

  const payments = [];

  for (const paymentDoc of snap.docs) {

    const payment = paymentDoc.data();

    let client = null;
    let order = null;

    if (payment.clientId) {

      const clientSnap =
        await getDoc(
          doc(
            db,
            COLLECTIONS.clients,
            payment.clientId
          )
        );

      if (clientSnap.exists()) {
        client = clientSnap.data();
      }
    }

    if (payment.orderId) {

      const orderSnap =
        await getDoc(
          doc(
            db,
            COLLECTIONS.orders,
            payment.orderId
          )
        );

      if (orderSnap.exists()) {
        order = orderSnap.data();
      }
    }

    payments.push({
      id: paymentDoc.id,
      ...payment,
      client,
      order
    });
  }

  container.innerHTML =
    payments.map(renderPayment).join("");

  container
    .querySelectorAll("[data-payment-id]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          openPayment(
            button.dataset.paymentId
          )
      );
    });
}

// ============================================================
// PAYMENT CARD
// ============================================================

function renderPayment(payment) {

  const client =
    payment.client || {};

  const order =
    payment.order || {};

  return `
    <article class="admin-card payment-card">

      <div>
        <span class="status pending">
          PAYMENT PENDING
        </span>

        <h3>
          ${safe(
            client.name ||
            "Unknown customer"
          )}
        </h3>

        <p>
          ${safe(
            client.phone ||
            client.email ||
            ""
          )}
        </p>
      </div>

      <div>
        <strong>
          ${safe(
            order.service ||
            payment.service ||
            "Subscription"
          )}
        </strong>

        <p>
          ${safe(
            order.package ||
            payment.package ||
            ""
          )}
        </p>

        <strong>
          ${money(payment.amount)}
        </strong>
      </div>

      <div>
        <p>
          <strong>Method:</strong>
          ${safe(payment.method)}
        </p>

        <p>
          <strong>Reference:</strong>
          ${safe(payment.transactionRef)}
        </p>
      </div>

      <button
        class="primary-btn"
        data-payment-id="${payment.id}">
        Review Payment
      </button>

    </article>
  `;
}

// ============================================================
// REVIEW PAYMENT
// ============================================================

async function openPayment(paymentId) {

  try {

    const paymentSnap =
      await getDoc(
        doc(
          db,
          COLLECTIONS.payments,
          paymentId
        )
      );

    if (!paymentSnap.exists()) {
      showMessage(
        "Payment no longer exists.",
        "error"
      );
      return;
    }

    const payment =
      paymentSnap.data();

    const modal =
      $("paymentModal");

    if (!modal) {

      const approved =
        confirm(
          `Payment ${payment.transactionRef || ""}\n\n` +
          `Amount: ${money(payment.amount)}\n` +
          `Method: ${payment.method}\n\n` +
          `Approve this payment?`
        );

      if (approved) {
        await approvePayment(paymentId);
      } else {
        const reject =
          confirm("Reject this payment?");

        if (reject) {
          await rejectPayment(paymentId);
        }
      }

      return;
    }

    modal.style.display = "flex";

    setText(
      "modalPaymentReference",
      payment.transactionRef
    );

    setText(
      "modalPaymentAmount",
      money(payment.amount)
    );

    setText(
      "modalPaymentMethod",
      payment.method
    );

    const approve =
      $("approvePaymentButton");

    const reject =
      $("rejectPaymentButton");

    if (approve) {
      approve.onclick = () =>
        approvePayment(paymentId);
    }

    if (reject) {
      reject.onclick = () =>
        rejectPayment(paymentId);
    }

  } catch (error) {

    console.error(error);

    showMessage(
      "Unable to open payment.",
      "error"
    );
  }
}

// ============================================================
// APPROVE PAYMENT
// ============================================================

async function approvePayment(paymentId) {

  if (!currentAdmin) {
    showMessage(
      "Administrator authentication required.",
      "error"
    );
    return;
  }

  try {

    await runTransaction(
      db,
      async transaction => {

        const paymentRef =
          doc(
            db,
            COLLECTIONS.payments,
            paymentId
          );

        const paymentSnap =
          await transaction.get(
            paymentRef
          );

        if (!paymentSnap.exists()) {
          throw new Error(
            "Payment not found."
          );
        }

        const payment =
          paymentSnap.data();

        if (
          payment.status !==
          "pending"
        ) {
          throw new Error(
            "Payment has already been processed."
          );
        }

        let order = null;

        if (payment.orderId) {

          const orderRef =
            doc(
              db,
              COLLECTIONS.orders,
              payment.orderId
            );

          const orderSnap =
            await transaction.get(
              orderRef
            );

          if (orderSnap.exists()) {
            order = {
              ref: orderRef,
              ...orderSnap.data()
            };
          }
        }

        transaction.update(
          paymentRef,
          {
            status: "approved",
            verifiedBy: currentAdmin.uid,
            verifiedAt: serverTimestamp()
          }
        );

        if (order) {

          transaction.update(
            order.ref,
            {
              paymentStatus: "approved",
              orderStatus: "approved",
              verifiedBy: currentAdmin.uid,
              verifiedAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }
          );
        }
      }
    );

    showMessage(
      "Payment approved successfully.",
      "success"
    );

    closePaymentModal();

    await loadDashboard();

  } catch (error) {

    console.error(error);

    showMessage(
      error.message ||
      "Unable to approve payment.",
      "error"
    );
  }
}

// ============================================================
// REJECT PAYMENT
// ============================================================

async function rejectPayment(paymentId) {

  if (!currentAdmin) return;

  const reason =
    prompt(
      "Reason for rejecting this payment:"
    );

  if (reason === null) return;

  try {

    await updateDoc(
      doc(
        db,
        COLLECTIONS.payments,
        paymentId
      ),
      {
        status: "rejected",
        rejectionReason:
          reason.trim(),
        verifiedBy:
          currentAdmin.uid,
        verifiedAt:
          serverTimestamp()
      }
    );

    const paymentSnap =
      await getDoc(
        doc(
          db,
          COLLECTIONS.payments,
          paymentId
        )
      );

    const payment =
      paymentSnap.data();

    if (payment?.orderId) {

      await updateDoc(
        doc(
          db,
          COLLECTIONS.orders,
          payment.orderId
        ),
        {
          paymentStatus: "rejected",
          orderStatus: "rejected",
          updatedAt:
            serverTimestamp()
        }
      );
    }

    closePaymentModal();

    showMessage(
      "Payment rejected.",
      "success"
    );

    await loadDashboard();

  } catch (error) {

    console.error(error);

    showMessage(
      "Unable to reject payment.",
      "error"
    );
  }
}

// ============================================================
// CLOSE PAYMENT MODAL
// ============================================================

function closePaymentModal() {

  const modal =
    $("paymentModal");

  if (modal) {
    modal.style.display = "none";
  }
}

$("closePaymentModal")
  ?.addEventListener(
    "click",
    closePaymentModal
  );

// ============================================================
// ORDERS
// ============================================================

async function loadOrders() {

  const container =
    $("ordersList");

  if (!container) return;

  const snap =
    await getDocs(
      collection(
        db,
        COLLECTIONS.orders
      )
    );

  if (snap.empty) {

    container.innerHTML =
      `<div class="empty-state">
        No orders found.
      </div>`;

    return;
  }

  container.innerHTML =
    snap.docs.map(d => {

      const order = d.data();

      return `
        <article class="admin-card">

          <h3>
            ${safe(
              order.service ||
              "Service"
            )}
          </h3>

          <p>
            ${safe(
              order.package || ""
            )}
          </p>

          <strong>
            ${money(order.amount)}
          </strong>

          <p>
            Payment:
            <strong>
              ${safe(
                order.paymentStatus ||
                "pending"
              )}
            </strong>
          </p>

        </article>
      `;

    }).join("");
}

// ============================================================
// CLIENTS
// ============================================================

async function loadClients() {

  const container =
    $("clientsList");

  if (!container) return;

  const snap =
    await getDocs(
      collection(
        db,
        COLLECTIONS.clients
      )
    );

  if (snap.empty) {

    container.innerHTML =
      `<div class="empty-state">
        No customers found.
      </div>`;

    return;
  }

  container.innerHTML =
    snap.docs.map(d => {

      const client =
        d.data();

      return `
        <article class="admin-card">

          <h3>
            ${safe(
              client.name ||
              "Customer"
            )}
          </h3>

          <p>
            ${safe(
              client.phone || ""
            )}
          </p>

          <p>
            ${safe(
              client.email || ""
            )}
          </p>

        </article>
      `;

    }).join("");
}

// ============================================================
// ACCOUNTS
// ============================================================

async function loadAccounts() {

  const container =
    $("accountsList");

  if (!container) return;

  const snap =
    await getDocs(
      collection(
        db,
        COLLECTIONS.accounts
      )
    );

  if (snap.empty) {

    container.innerHTML =
      `<div class="empty-state">
        No subscription accounts found.
      </div>`;

    return;
  }

  container.innerHTML =
    snap.docs.map(d => {

      const account =
        d.data();

      return `
        <article class="admin-card">

          <h3>
            ${safe(
              account.service ||
              "Account"
            )}
          </h3>

          <p>
            ${safe(
              account.package ||
              ""
            )}
          </p>

          <p>
            Status:
            ${safe(
              account.sub_status ||
              account.status ||
              "—"
            )}
          </p>

          <p>
            Assigned:
            ${safe(
              account.assigned ||
              "no"
            )}
          </p>

        </article>
      `;

    }).join("");
}

// ============================================================
// SUBSCRIPTIONS
// ============================================================

async function loadSubscriptions() {

  const container =
    $("subscriptionsList");

  if (!container) return;

  const snap =
    await getDocs(
      collection(
        db,
        COLLECTIONS.subscriptions
      )
    );

  if (snap.empty) {

    container.innerHTML =
      `<div class="empty-state">
        No subscriptions found.
      </div>`;

    return;
  }

  container.innerHTML =
    snap.docs.map(d => {

      const subscription =
        d.data();

      return `
        <article class="admin-card">

          <h3>
            ${safe(
              subscription.service ||
              "Subscription"
            )}
          </h3>

          <p>
            ${safe(
              subscription.package ||
              ""
            )}
          </p>

          <p>
            Status:
            <strong>
              ${safe(
                subscription.status ||
                subscription.sub_status ||
                "pending"
              )}
            </strong>
          </p>

          <p>
            Start:
            ${dateValue(
              subscription.startDate ||
              subscription.sub_start
            )}
          </p>

          <p>
            Expiry:
            ${dateValue(
              subscription.expiryDate ||
              subscription.sub_expiry
            )}
          </p>

        </article>
      `;

    }).join("");
}

// ============================================================
// PRICE LIST
// ============================================================

async function loadPriceList() {

  const container =
    $("priceListAdmin") ||
    $("priceList") ||
    $("productsList");

  if (!container) return;

  const snap =
    await getDocs(
      collection(
        db,
        COLLECTIONS.pricelist
      )
    );

  if (snap.empty) {

    container.innerHTML =
      `<div class="empty-state">
        No PriceList products found.
      </div>`;

    return;
  }

  container.innerHTML =
    snap.docs.map(d => {

      const item =
        d.data();

      return `
        <article
          class="admin-card price-card"
          data-product-id="${d.id}">

          <h3>
            ${safe(
              item.service ||
              "Product"
            )}
          </h3>

          <p>
            ${safe(
              item.package ||
              item.description ||
              ""
            )}
          </p>

          <strong>
            ${money(item.price)}
          </strong>

          <p>
            Status:
            ${safe(
              item.sub_status ||
              item.status ||
              "active"
            )}
          </p>

        </article>
      `;

    }).join("");
}

// ============================================================
// MANUAL SUBSCRIPTION CREATION
// ============================================================

async function createSubscription({
  clientId,
  customerUid,
  orderId,
  accountId,
  service,
  packageName,
  startDate,
  expiryDate
}) {

  if (!currentAdmin) {
    throw new Error(
      "Administrator authentication required."
    );
  }

  const subscription =
    await addDoc(
      collection(
        db,
        COLLECTIONS.subscriptions
      ),
      {
        customerUid,
        clientId,
        orderId,
        accountId:
          accountId || null,

        service:
          service || "",

        package:
          packageName || "",

        startDate:
          startDate || null,

        expiryDate:
          expiryDate || null,

        status:
          "active",

        createdBy:
          currentAdmin.uid,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()
      }
    );

  return subscription.id;
}

// ============================================================
// EXPOSE ADMIN FUNCTIONS
// ============================================================

window.LetsTradeAdmin = {

  approvePayment,
  rejectPayment,
  createSubscription,
  loadDashboard,
  loadPendingPayments,
  loadOrders,
  loadClients,
  loadAccounts,
  loadSubscriptions,
  loadPriceList,
  closePaymentModal,

  getCurrentAdmin() {
    return currentAdmin;
  }
};

// ============================================================
// AUTO REFRESH
// ============================================================

setInterval(async () => {

  if (!currentAdmin) return;

  try {
    await loadStats();
    await loadPendingPayments();
  } catch (error) {
    console.error(
      "Admin refresh error:",
      error
    );
  }

}, 60000);
