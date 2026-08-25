// ============================================================
// LET'S TRADE ZM
// ADMIN PORTAL
// FIREBASE AUTH + FIRESTORE
// ============================================================

import {
  auth,
  db
} from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

// ============================================================
// HELPERS
// ============================================================

const $ = (id) => document.getElementById(id);

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
}

function money(value) {
  const amount = Number(value || 0);

  return `K${amount.toFixed(2)}`;
}

function showMessage(message, type = "info") {
  const element = $("adminMessage");

  if (!element) {
    console.log(message);
    return;
  }

  element.textContent = message;

  element.style.color =
    type === "success"
      ? "green"
      : type === "error"
        ? "red"
        : "";
}

function showError(error) {
  console.error(error);

  showMessage(
    error?.message ||
      "Something went wrong. Please try again.",
    "error"
  );
}

function timestampValue(value) {
  if (!value) return "";

  if (
    typeof value === "object" &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toLocaleString();
  }

  return String(value);
}

function todayISO() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

// ============================================================
// ADMIN AUTHORIZATION
// ============================================================
//
// Authentication is not enough.
//
// The signed-in Firebase user must ALSO have:
//
// /admins/{uid}
//
// {
//   role: "admin",
//   active: true
// }
//
// Firestore Security Rules must enforce this too.
// Client-side JavaScript is only the first protection layer.
// ============================================================

let currentAdmin = null;

function redirectToAdminLogin() {
  window.location.href = "admin-login.html";
}

function requireAdmin() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {

        unsubscribe();

        if (!user) {
          redirectToAdminLogin();
          return;
        }

        try {

          const adminRef = doc(
            db,
            "admins",
            user.uid
          );

          const adminSnapshot =
            await getDoc(adminRef);

          if (!adminSnapshot.exists()) {

            await signOut(auth);

            alert(
              "This Firebase account is not authorized as an administrator."
            );

            redirectToAdminLogin();

            return;
          }

          const admin =
            adminSnapshot.data();

          if (
            admin.role !== "admin" ||
            admin.active !== true
          ) {

            await signOut(auth);

            alert(
              "Administrator access is disabled."
            );

            redirectToAdminLogin();

            return;
          }

          currentAdmin = {
            uid: user.uid,
            email: user.email || "",
            ...admin
          };

          const status = $("adminStatus");

          if (status) {

            status.textContent =
              `Administrator authenticated: ${user.email || user.uid}`;

            status.style.color = "green";
          }

          resolve(user);

        } catch (error) {

          console.error(
            "Admin authorization failed:",
            error
          );

          try {
            await signOut(auth);
          } catch (_) {}

          redirectToAdminLogin();
        }
      }
    );
  });
}

// ============================================================
// FIRESTORE HELPERS
// ============================================================

async function readCollection(collectionName) {

  const snapshot =
    await getDocs(
      collection(db, collectionName)
    );

  return snapshot.docs.map(
    (item) => ({
      id: item.id,
      ...item.data()
    })
  );
}

async function getDocument(
  collectionName,
  documentId
) {

  const snapshot =
    await getDoc(
      doc(
        db,
        collectionName,
        documentId
      )
    );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data()
  };
}

// ============================================================
// STATE
// ============================================================

let priceList = [];
let orders = [];
let payments = [];
let clients = [];
let subscriptions = [];
let accounts = [];

// ============================================================
// PRICELIST
// ============================================================

async function loadPrices() {

  const root = $("adminPrices");

  if (!root) return;

  root.innerHTML =
    "<p>Loading PriceList...</p>";

  try {

    priceList =
      await readCollection("pricelist");

    priceList.sort((a, b) =>
      String(a.service || "")
        .localeCompare(
          String(b.service || "")
        )
    );

    if (!priceList.length) {

      root.innerHTML =
        "<p class='empty'>No PriceList products found.</p>";

      return;
    }

    root.innerHTML =
      priceList.map((item) => {

        const status =
          item.sub_status ||
          item.status ||
          "active";

        return `
          <div class="admin-card">

            <div>

              <strong>
                ${escapeHTML(item.service)}
              </strong>

              <p>
                Package:
                ${escapeHTML(item.package)}
              </p>

              <p>
                Ownership:
                ${escapeHTML(item.ownership)}
              </p>

              <p>
                Price:
                ${money(item.price)}
              </p>

              <p>
                Duration:
                ${escapeHTML(item.duration || "Monthly")}
              </p>

              ${
                item.description
                  ? `
                    <p>
                      ${escapeHTML(item.description)}
                    </p>
                  `
                  : ""
              }

              <span class="tag">
                ${escapeHTML(status)}
              </span>

            </div>

            <div>

              <button
                type="button"
                class="button-small edit-price"
                data-id="${escapeHTML(item.id)}"
              >
                Edit
              </button>

              <button
                type="button"
                class="button-small delete-price"
                data-id="${escapeHTML(item.id)}"
              >
                Delete
              </button>

            </div>

          </div>
        `;

      }).join("");

    document
      .querySelectorAll(".edit-price")
      .forEach((button) => {

        button.addEventListener(
          "click",
          () =>
            editPrice(
              button.dataset.id
            )
        );

      });

    document
      .querySelectorAll(".delete-price")
      .forEach((button) => {

        button.addEventListener(
          "click",
          () =>
            deletePrice(
              button.dataset.id
            )
        );

      });

  } catch (error) {

    root.innerHTML =
      `<p class="empty">
        Unable to load PriceList:
        ${escapeHTML(error.message)}
      </p>`;

    showError(error);
  }
}

// ============================================================
// PRICE CRUD
// ============================================================

async function savePrice(event) {

  event.preventDefault();

  try {

    const id =
      $("priceId")?.value.trim();

    const service =
      $("service")?.value.trim();

    const packageName =
      $("packageName")?.value.trim();

    const ownership =
      $("ownership")?.value;

    const price =
      Number(
        $("price")?.value
      );

    const duration =
      $("duration")?.value.trim() ||
      "Monthly";

    const status =
      $("priceStatus")?.value ||
      "active";

    const description =
      $("description")?.value.trim() ||
      "";

    if (!service) {
      throw new Error(
        "Enter the service name."
      );
    }

    if (!packageName) {
      throw new Error(
        "Enter the package name."
      );
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      throw new Error(
        "Enter a valid price."
      );
    }

    const data = {

      service,

      package: packageName,

      ownership,

      price,

      duration,

      description,

      sub_status: status,

      updatedAt:
        serverTimestamp()

    };

    if (id) {

      await updateDoc(
        doc(
          db,
          "pricelist",
          id
        ),
        data
      );

      showMessage(
        "PriceList item updated.",
        "success"
      );

    } else {

      await addDoc(
        collection(
          db,
          "pricelist"
        ),
        {
          ...data,
          createdAt:
            serverTimestamp()
        }
      );

      showMessage(
        "PriceList item added.",
        "success"
      );
    }

    resetPriceForm();

    await loadPrices();

  } catch (error) {

    showError(error);
  }
}

function editPrice(id) {

  const item =
    priceList.find(
      (product) =>
        product.id === id
    );

  if (!item) return;

  $("priceId").value =
    item.id;

  $("service").value =
    item.service || "";

  $("packageName").value =
    item.package || "";

  $("ownership").value =
    item.ownership || "shared";

  $("price").value =
    item.price ?? "";

  $("duration").value =
    item.duration || "Monthly";

  $("priceStatus").value =
    item.sub_status ||
    item.status ||
    "active";

  $("description").value =
    item.description || "";

  window.scrollTo({
    top: $("priceForm").offsetTop - 20,
    behavior: "smooth"
  });
}

function resetPriceForm() {

  const form =
    $("priceForm");

  if (form) {
    form.reset();
  }

  if ($("priceId")) {
    $("priceId").value = "";
  }

  if ($("duration")) {
    $("duration").value =
      "Monthly";
  }

  if ($("priceStatus")) {
    $("priceStatus").value =
      "active";
  }

  if ($("ownership")) {
    $("ownership").value =
      "shared";
  }
}

async function deletePrice(id) {

  const item =
    priceList.find(
      (product) =>
        product.id === id
    );

  if (!item) return;

  const confirmed =
    window.confirm(
      `Delete ${item.service || "this service"} permanently?`
    );

  if (!confirmed) return;

  try {

    await deleteDoc(
      doc(
        db,
        "pricelist",
        id
      )
    );

    showMessage(
      "PriceList item deleted.",
      "success"
    );

    await loadPrices();

  } catch (error) {

    showError(error);
  }
}

// ============================================================
// ORDERS
// ============================================================

async function loadOrders() {

  const root =
    $("adminOrders");

  if (!root) return;

  root.innerHTML =
    "<p>Loading orders...</p>";

  try {

    orders =
      await readCollection(
        "orders"
      );

    orders.sort(
      (a, b) =>
        String(
          b.createdAt || ""
        ).localeCompare(
          String(
            a.createdAt || ""
          )
        )
    );

    if (!orders.length) {

      root.innerHTML =
        "<p class='empty'>No orders found.</p>";

      return;
    }

    root.innerHTML =
      orders.map((order) => {

        const items =
          Array.isArray(order.items)
            ? order.items
            : [];

        const customer =
          order.customer || {};

        return `
          <div class="admin-card">

            <div>

              <strong>
                ${escapeHTML(
                  order.orderId ||
                  order.id
                )}
              </strong>

              <p>
                Customer:
                ${escapeHTML(
                  customer.name ||
                  order.customerName ||
                  "Unknown"
                )}
              </p>

              <p>
                Phone/Email:
                ${escapeHTML(
                  customer.identifier ||
                  order.identifier ||
                  ""
                )}
              </p>

              <p>
                Services:
                ${
                  items.length
                    ? items.map(
                        (item) =>
                          `${escapeHTML(
                            item.service
                          )} — ${escapeHTML(
                            item.package
                          )}`
                      ).join(", ")
                    : "No items"
                }
              </p>

              <strong>
                ${money(
                  order.total
                )}
              </strong>

            </div>

            <span class="tag">
              ${escapeHTML(
                order.paymentStatus ||
                "pending"
              )}
            </span>

          </div>
        `;

      }).join("");

  } catch (error) {

    root.innerHTML =
      `<p class="empty">
        Unable to load orders:
        ${escapeHTML(error.message)}
      </p>`;

    showError(error);
  }
}

// ============================================================
// PAYMENTS
// ============================================================

async function loadPayments() {

  const root =
    $("adminPayments");

  if (!root) return;

  root.innerHTML =
    "<p>Loading payments...</p>";

  try {

    payments =
      await readCollection(
        "payments"
      );

    if (!payments.length) {

      root.innerHTML =
        "<p class='empty'>No payments found.</p>";

      return;
    }

    root.innerHTML =
      payments.map((payment) => {

        const status =
          normalizeStatus(
            payment.status ||
            "pending"
          );

        return `
          <div class="admin-card">

            <div>

              <strong>
                ${escapeHTML(
                  payment.method ||
                  "Payment"
                )}
              </strong>

              <p>
                Amount:
                ${money(
                  payment.amount
                )}
              </p>

              <p>
                Reference:
                ${escapeHTML(
                  payment.reference ||
                  payment.transactionId ||
                  ""
                )}
              </p>

              <p>
                Order:
                ${escapeHTML(
                  payment.orderId ||
                  ""
                )}
              </p>

              <p>
                Customer:
                ${escapeHTML(
                  payment.identifier ||
                  payment.phone ||
                  payment.email ||
                  ""
                )}
              </p>

            </div>

            <div>

              <span class="tag">
                ${escapeHTML(status)}
              </span>

              ${
                status === "pending"
                  ? `
                    <br><br>

                    <button
                      type="button"
                      class="button-small approve-payment"
                      data-id="${escapeHTML(payment.id)}"
                      data-order="${escapeHTML(payment.orderId || "")}"
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      class="button-small reject-payment"
                      data-id="${escapeHTML(payment.id)}"
                      data-order="${escapeHTML(payment.orderId || "")}"
                    >
                      Reject
                    </button>
                  `
                  : ""
              }

            </div>

          </div>
        `;

      }).join("");

    document
      .querySelectorAll(
        ".approve-payment"
      )
      .forEach((button) => {

        button.addEventListener(
          "click",
          () =>
            reviewPayment(
              button.dataset.id,
              button.dataset.order,
              "approved"
            )
        );

      });

    document
      .querySelectorAll(
        ".reject-payment"
      )
      .forEach((button) => {

        button.addEventListener(
          "click",
          () =>
            reviewPayment(
              button.dataset.id,
              button.dataset.order,
              "rejected"
            )
        );

      });

  } catch (error) {

    root.innerHTML =
      `<p class="empty">
        Unable to load payments:
        ${escapeHTML(error.message)}
      </p>`;

    showError(error);
  }
}

// ============================================================
// PAYMENT REVIEW
// ============================================================

async function reviewPayment(
  paymentId,
  orderId,
  status
) {

  if (!paymentId) {
    showMessage(
      "Payment ID is missing.",
      "error"
    );
    return;
  }

  const action =
    status === "approved"
      ? "approve"
      : "reject";

  const confirmed =
    window.confirm(
      `Are you sure you want to ${action} this payment?`
    );

  if (!confirmed) return;

  try {

    const paymentRef =
      doc(
        db,
        "payments",
        paymentId
      );

    const paymentSnapshot =
      await getDoc(
        paymentRef
      );

    if (!paymentSnapshot.exists()) {
      throw new Error(
        "Payment record no longer exists."
      );
    }

    const payment =
      paymentSnapshot.data();

    const resolvedOrderId =
      orderId ||
      payment.orderId;

    await updateDoc(
      paymentRef,
      {
        status,

        reviewedBy:
          currentAdmin?.uid ||
          "",

        reviewedByEmail:
          currentAdmin?.email ||
          "",

        reviewedAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()
      }
    );

    if (resolvedOrderId) {

      const orderRef =
        doc(
          db,
          "orders",
          resolvedOrderId
        );

      const orderSnapshot =
        await getDoc(
          orderRef
        );

      if (orderSnapshot.exists()) {

        await updateDoc(
          orderRef,
          {
            paymentStatus:
              status,

            orderStatus:
              status === "approved"
                ? "ready_for_fulfillment"
                : "payment_rejected",

            updatedAt:
              serverTimestamp()
          }
        );
      }
    }

    showMessage(
      status === "approved"
        ? "Payment approved successfully."
        : "Payment rejected.",
      status === "approved"
        ? "success"
        : "error"
    );

    await Promise.all([
      loadPayments(),
      loadOrders()
    ]);

  } catch (error) {

    showError(error);
  }
}

// ============================================================
// CUSTOMERS
// ============================================================

async function loadClients() {

  const root =
    $("adminClients");

  if (!root) return;

  root.innerHTML =
    "<p>Loading customers...</p>";

  try {

    clients =
      await readCollection(
        "clients"
      );

    if (!clients.length) {

      root.innerHTML =
        "<p class='empty'>No customers found.</p>";

      return;
    }

    root.innerHTML =
      clients.map((client) => {

        return `
          <div class="admin-card">

            <div>

              <strong>
                ${escapeHTML(
                  client.name ||
                  "Unnamed customer"
                )}
              </strong>

              <p>
                Phone:
                ${escapeHTML(
                  client.phone ||
                  ""
                )}
              </p>

              <p>
                Email:
                ${escapeHTML(
                  client.email ||
                  ""
                )}
              </p>

              <p>
                Identifier:
                ${escapeHTML(
                  client.identifier ||
                  ""
                )}
              </p>

            </div>

          </div>
        `;

      }).join("");

  } catch (error) {

    root.innerHTML =
      `<p class="empty">
        Unable to load customers:
        ${escapeHTML(error.message)}
      </p>`;

    showError(error);
  }
}

// ============================================================
// SUBSCRIPTIONS
// ============================================================

async function loadSubscriptions() {

  const root =
    $("adminSubscriptions");

  if (!root) return;

  root.innerHTML =
    "<p>Loading subscriptions...</p>";

  try {

    subscriptions =
      await readCollection(
        "subscriptions"
      );

    updateSubscriptionStatuses();

    if (!subscriptions.length) {

      root.innerHTML =
        "<p class='empty'>No subscriptions found.</p>";

      refreshAssignmentChoices();

      return;
    }

    root.innerHTML =
      subscriptions.map(
        (item) => {

          const status =
            normalizeStatus(
              item.status ||
              item.sub_status ||
              "pending"
            );

          return `
            <div class="admin-card">

              <div>

                <strong>
                  ${escapeHTML(
                    item.service
                  )}
                  —
                  ${escapeHTML(
                    item.package
                  )}
                </strong>

                <p>
                  Order:
                  ${escapeHTML(
                    item.orderId
                  )}
                </p>

                <p>
                  Start:
                  ${escapeHTML(
                    item.startDate ||
                    item.sub_start ||
                    ""
                  )}
                </p>

                <p>
                  Expiry:
                  ${escapeHTML(
                    item.expiryDate ||
                    item.sub_expiry ||
                    ""
                  )}
                </p>

                <p>
                  Account:
                  ${escapeHTML(
                    item.accountLabel ||
                    "Not assigned"
                  )}
                </p>

                <span class="tag">
                  ${escapeHTML(status)}
                </span>

              </div>

            </div>
          `;
        }
      ).join("");

    refreshAssignmentChoices();

  } catch (error) {

    root.innerHTML =
      `<p class="empty">
        Unable to load subscriptions:
        ${escapeHTML(error.message)}
      </p>`;

    showError(error);
  }
}

// ============================================================
// AUTOMATIC SUBSCRIPTION STATUS
// ============================================================
//
// 5 days or less before expiry:
// pending_expiry
//
// On expiry date / after:
// expired
//
// This runs when the admin portal loads.
// For guaranteed automatic server-side changes,
// later we should add a scheduled Cloud Function.
// ============================================================

async function updateSubscriptionStatuses() {

  const today =
    todayISO();

  for (const item of subscriptions) {

    const expiry =
      item.expiryDate ||
      item.sub_expiry;

    if (!expiry) continue;

    let newStatus = null;

    if (
      expiry < today
    ) {

      newStatus =
        "expired";

    } else {

      const expiryDate =
        new Date(
          `${expiry}T23:59:59`
        );

      const now =
        new Date();

      const daysLeft =
        Math.ceil(
          (
            expiryDate - now
          ) /
          (
            1000 *
            60 *
            60 *
            24
          )
        );

      if (
        daysLeft <= 5
      ) {

        newStatus =
          "pending_expiry";

      } else if (
        item.status ===
        "pending_expiry"
      ) {

        newStatus =
          "active";
      }
    }

    if (
      newStatus &&
      newStatus !==
        item.status
    ) {

      try {

        await updateDoc(
          doc(
            db,
            "subscriptions",
            item.id
          ),
          {
            status:
              newStatus,

            sub_status:
              newStatus,

            updatedAt:
              serverTimestamp()
          }
        );

        item.status =
          newStatus;

        item.sub_status =
          newStatus;

      } catch (error) {

        console.error(
          "Subscription status update failed:",
          item.id,
          error
        );
      }
    }
  }
}

// ============================================================
// CREATE SUBSCRIPTION
// ============================================================

async function createSubscription(event) {

  event.preventDefault();

  try {

    const orderId =
      $("subscriptionOrderId")
        ?.value
        .trim();

    const customerUid =
      $("subscriptionCustomerUid")
        ?.value
        .trim() ||
      "";

    const service =
      $("subscriptionService")
        ?.value
        .trim();

    const packageName =
      $("subscriptionPackage")
        ?.value
        .trim();

    const startDate =
      $("startDate")
        ?.value;

    const expiryDate =
      $("expiryDate")
        ?.value;

    const status =
      $("subscriptionStatus")
        ?.value ||
      "pending";

    if (!orderId) {
      throw new Error(
        "Enter the Firestore Order ID."
      );
    }

    if (!service) {
      throw new Error(
        "Enter the subscription service."
      );
    }

    if (!packageName) {
      throw new Error(
        "Enter the subscription package."
      );
    }

    if (!startDate) {
      throw new Error(
        "Select a start date."
      );
    }

    if (!expiryDate) {
      throw new Error(
        "Select an expiry date."
      );
    }

    if (
      expiryDate <
      startDate
    ) {
      throw new Error(
        "Expiry date cannot be before the start date."
      );
    }

    const orderSnapshot =
      await getDoc(
        doc(
          db,
          "orders",
          orderId
        )
      );

    if (!orderSnapshot.exists()) {
      throw new Error(
        "The specified order does not exist."
      );
    }

    const order =
      orderSnapshot.data();

    if (
      order.paymentStatus !==
      "approved"
    ) {

      throw new Error(
        "The order must have an approved payment before creating a subscription."
      );
    }

    await addDoc(
      collection(
        db,
        "subscriptions"
      ),
      {

        orderId,

        clientId:
          order.clientId ||
          order.customerId ||
          "",

        customerUid,

        service,

        package:
          packageName,

        startDate,

        expiryDate,

        status,

        sub_status:
          status,

        accountId:
          "",

        accountLabel:
          "",

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()
      }
    );

    showMessage(
      "Subscription created successfully.",
      "success"
    );

    $("subscriptionForm")
      ?.reset();

    await loadSubscriptions();

  } catch (error) {

    showError(error);
  }
}

// ============================================================
// ACCOUNTS
// ============================================================

async function loadAccounts() {

  const root =
    $("adminAccounts");

  if (!root) return;

  root.innerHTML =
    "<p>Loading accounts...</p>";

  try {

    accounts =
      await readCollection(
        "accounts"
      );

    if (!accounts.length) {

      root.innerHTML =
        "<p class='empty'>No accounts found.</p>";

      refreshAssignmentChoices();

      return;
    }

    root.innerHTML =
      accounts.map(
        (account) => {

          const status =
            normalizeStatus(
              account.status ||
              "available"
            );

          return `
            <div class="admin-card">

              <div>

                <strong>
                  ${escapeHTML(
                    account.accountLabel ||
                    "Account"
                  )}
                </strong>

                <p>
                  Service:
                  ${escapeHTML(
                    account.service
                  )}
                </p>

                <p>
                  Email:
                  ${escapeHTML(
                    account.email ||
                    ""
                  )}
                </p>

                <span class="tag">
                  ${escapeHTML(status)}
                </span>

              </div>

              <div>

                <button
                  type="button"
                  class="button-small edit-account"
                  data-id="${escapeHTML(account.id)}"
                >
                  Edit
                </button>

                <button
                  type="button"
                  class="button-small delete-account"
                  data-id="${escapeHTML(account.id)}"
                >
                  Delete
                </button>

              </div>

            </div>
          `;
        }
      ).join("");

    document
      .querySelectorAll(
        ".edit-account"
      )
      .forEach((button) => {

        button.addEventListener(
          "click",
          () =>
            editAccount(
              button.dataset.id
            )
        );

      });

    document
      .querySelectorAll(
        ".delete-account"
      )
      .forEach((button) => {

        button.addEventListener(
          "click",
          () =>
            deleteAccount(
              button.dataset.id
            )
        );

      });

    refreshAssignmentChoices();

  } catch (error) {

    root.innerHTML =
      `<p class="empty">
        Unable to load accounts:
        ${escapeHTML(error.message)}
      </p>`;

    showError(error);
  }
}

// ============================================================
// ACCOUNT CRUD
// ============================================================

async function saveAccount(event) {

  event.preventDefault();

  try {

    const id =
      $("accountId")
        ?.value
        .trim();

    const service =
      $("accountService")
        ?.value
        .trim();

    const accountLabel =
      $("accountLabel")
        ?.value
        .trim();

    const status =
      $("accountStatus")
        ?.value ||
      "available";

    if (!service) {
      throw new Error(
        "Enter the service."
      );
    }

    if (!accountLabel) {
      throw new Error(
        "Enter the account label."
      );
    }

    const data = {

      service,

      accountLabel,

      status,

      updatedAt:
        serverTimestamp()
    };

    if (id) {

      await updateDoc(
        doc(
          db,
          "accounts",
          id
        ),
        data
      );

      showMessage(
        "Account updated successfully.",
        "success"
      );

    } else {

      await addDoc(
        collection(
          db,
          "accounts"
        ),
        {
          ...data,

          subscriptionId:
            "",

          createdAt:
            serverTimestamp()
        }
      );

      showMessage(
        "Account added successfully.",
        "success"
      );
    }

    resetAccountForm();

    await loadAccounts();

  } catch (error) {

    showError(error);
  }
}

function editAccount(id) {

  const account =
    accounts.find(
      (item) =>
        item.id === id
    );

  if (!account) return;

  $("accountId").value =
    account.id;

  $("accountService").value =
    account.service || "";

  $("accountLabel").value =
    account.accountLabel || "";

  $("accountStatus").value =
    account.status ||
    "available";

  window.scrollTo({
    top:
      $("accountForm")
        .offsetTop - 20,
    behavior:
      "smooth"
  });
}

function resetAccountForm() {

  $("accountForm")
    ?.reset();

  if ($("accountId")) {
    $("accountId").value =
      "";
  }

  if ($("accountStatus")) {
    $("accountStatus").value =
      "available";
  }
}

async function deleteAccount(id) {

  const account =
    accounts.find(
      (item) =>
        item.id === id
    );

  if (!account) return;

  if (
    account.subscriptionId
  ) {

    showMessage(
      "This account is currently assigned and cannot be deleted.",
      "error"
    );

    return;
  }

  const confirmed =
    window.confirm(
      `Delete ${account.accountLabel || "this account"}?`
    );

  if (!confirmed) return;

  try {

    await deleteDoc(
      doc(
        db,
        "accounts",
        id
      )
    );

    showMessage(
      "Account deleted.",
      "success"
    );

    await loadAccounts();

  } catch (error) {

    showError(error);
  }
}

// ============================================================
// ACCOUNT ASSIGNMENT
// ============================================================

function refreshAssignmentChoices() {

  const subscriptionSelect =
    $("assignmentSubscription");

  const accountSelect =
    $("assignmentAccount");

  if (
    !subscriptionSelect ||
    !accountSelect
  ) {
    return;
  }

  subscriptionSelect.innerHTML = `
    <option value="">
      Choose subscription
    </option>
    ${
      subscriptions
        .filter(
          (item) => {

            const status =
              normalizeStatus(
                item.status ||
                item.sub_status ||
                "pending"
              );

            return (
              !item.accountId &&
              status !== "expired"
            );
          }
        )
        .map(
          (item) => `
            <option value="${escapeHTML(item.id)}">
              ${escapeHTML(
                item.service
              )}
              —
              ${escapeHTML(
                item.package
              )}
              —
              ${escapeHTML(
                item.orderId
              )}
            </option>
          `
        )
        .join("")
    }
  `;

  accountSelect.innerHTML = `
    <option value="">
      Choose account
    </option>
    ${
      accounts
        .filter(
          (account) =>
            normalizeStatus(
              account.status
            ) ===
            "available"
        )
        .map(
          (account) => `
            <option value="${escapeHTML(account.id)}">
              ${escapeHTML(
                account.service
              )}
              —
              ${escapeHTML(
                account.accountLabel
              )}
            </option>
          `
        )
        .join("")
    }
  `;
}

async function assignAccount(event) {

  event.preventDefault();

  const subscriptionId =
    $("assignmentSubscription")
      ?.value;

  const accountId =
    $("assignmentAccount")
      ?.value;

  if (
    !subscriptionId ||
    !accountId
  ) {

    showMessage(
      "Choose both a subscription and an available account.",
      "error"
    );

    return;
  }

  try {

    await runTransaction(
      db,
      async (transaction) => {

        const subscriptionRef =
          doc(
            db,
            "subscriptions",
            subscriptionId
          );

        const accountRef =
          doc(
            db,
            "accounts",
            accountId
          );

        const [
          subscriptionSnapshot,
          accountSnapshot
        ] = await Promise.all([
          transaction.get(
            subscriptionRef
          ),
          transaction.get(
            accountRef
          )
        ]);

        if (
          !subscriptionSnapshot.exists()
        ) {
          throw new Error(
            "Subscription no longer exists."
          );
        }

        if (
          !accountSnapshot.exists()
        ) {
          throw new Error(
            "Account no longer exists."
          );
        }

        const subscription =
          subscriptionSnapshot.data();

        const account =
          accountSnapshot.data();

        if (
          subscription.accountId
        ) {
          throw new Error(
            "This subscription already has an account assigned."
          );
        }

        if (
          normalizeStatus(
            account.status
          ) !== "available"
        ) {
          throw new Error(
            "This account is no longer available."
          );
        }

        const accountService =
          String(
            account.service ||
            ""
          ).trim().toLowerCase();

        const subscriptionService =
          String(
            subscription.service ||
            ""
          ).trim().toLowerCase();

        if (
          accountService &&
          subscriptionService &&
          accountService !==
            subscriptionService
        ) {

          throw new Error(
            "The selected account does not match the subscription service."
          );
        }

        transaction.update(
          subscriptionRef,
          {

            accountId,

            accountLabel:
              account.accountLabel ||
              "",

            status:
              "active",

            sub_status:
              "active",

            updatedAt:
              serverTimestamp()
          }
        );

        transaction.update(
          accountRef,
          {

            status:
              "assigned",

            subscriptionId,

            assigned:
              "yes",

            updatedAt:
              serverTimestamp()
          }
        );
      }
    );

    showMessage(
      "Account assigned and subscription activated.",
      "success"
    );

    $("assignmentForm")
      ?.reset();

    await Promise.all([
      loadSubscriptions(),
      loadAccounts()
    ]);

  } catch (error) {

    showError(error);
  }
}

// ============================================================
// LOGOUT
// ============================================================

async function logoutAdmin() {

  try {

    await signOut(auth);

    window.location.href =
      "admin-login.html";

  } catch (error) {

    showError(error);
  }
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function registerEvents() {

  $("priceForm")
    ?.addEventListener(
      "submit",
      savePrice
    );

  $("cancelPriceEdit")
    ?.addEventListener(
      "click",
      resetPriceForm
    );

  $("subscriptionForm")
    ?.addEventListener(
      "submit",
      createSubscription
    );

  $("accountForm")
    ?.addEventListener(
      "submit",
      saveAccount
    );

  $("cancelAccountEdit")
    ?.addEventListener(
      "click",
      resetAccountForm
    );

  $("assignmentForm")
    ?.addEventListener(
      "submit",
      assignAccount
    );

  $("logoutButton")
    ?.addEventListener(
      "click",
      logoutAdmin
    );

  $("refreshOrders")
    ?.addEventListener(
      "click",
      loadOrders
    );

  $("refreshPayments")
    ?.addEventListener(
      "click",
      loadPayments
    );

  $("refreshClients")
    ?.addEventListener(
      "click",
      loadClients
    );

  const year =
    $("year");

  if (year) {
    year.textContent =
      new Date()
        .getFullYear();
  }
}

// ============================================================
// LOAD ADMIN PORTAL
// ============================================================

async function loadAdminPortal() {

  await requireAdmin();

  registerEvents();

  try {

    await Promise.all([
      loadPrices(),
      loadOrders(),
      loadPayments(),
      loadClients(),
      loadSubscriptions(),
      loadAccounts()
    ]);

  } catch (error) {

    showError(error);
  }
}

// ============================================================
// START
// ============================================================

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    loadAdminPortal
  );

} else {

  loadAdminPortal();
}
