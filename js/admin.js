// ============================================================
// LET'S TRADE ZM
// ADMIN.JS
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
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  runTransaction
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

// ============================================================
// GLOBAL STATE
// ============================================================

let currentAdmin = null;

let priceList = [];
let orders = [];
let payments = [];
let clients = [];
let subscriptions = [];
let accounts = [];

// ============================================================
// HELPERS
// ============================================================

const $ = (id) =>
  document.getElementById(id);

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
}

function money(value) {

  return `K${Number(value || 0).toFixed(2)}`;
}

function showMessage(
  message,
  type = "success"
) {

  const element =
    $("adminMessage");

  if (!element) return;

  element.textContent =
    message;

  element.className =
    `message show ${type}`;

  setTimeout(() => {

    element.className =
      "message";

  }, 5000);
}

function errorMessage(error) {

  console.error(error);

  showMessage(
    error?.message ||
    "An unexpected error occurred.",
    "error"
  );
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

async function checkAdmin() {

  return new Promise(resolve => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async user => {

          unsubscribe();

          if (!user) {

            window.location.href =
              "admin-login.html";

            return;
          }

          try {

            const adminRef =
              doc(
                db,
                "admins",
                user.uid
              );

            const snapshot =
              await getDoc(
                adminRef
              );

            if (!snapshot.exists()) {

              await signOut(auth);

              alert(
                "This account is not authorized as an administrator."
              );

              window.location.href =
                "admin-login.html";

              return;
            }

            const admin =
              snapshot.data();

            if (
              admin.role !== "admin" ||
              admin.active !== true
            ) {

              await signOut(auth);

              alert(
                "Administrator access is disabled."
              );

              window.location.href =
                "admin-login.html";

              return;
            }

            currentAdmin = {

              uid:
                user.uid,

              email:
                user.email || "",

              ...admin

            };

            $("adminStatus")
              .textContent =
              `Administrator: ${user.email}`;

            resolve(true);

          } catch (error) {

            errorMessage(error);
          }
        }
      );
  });
}

// ============================================================
// NAVIGATION
// ============================================================

function setupNavigation() {

  document
    .querySelectorAll(".nav-button")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const section =
            button.dataset.section;

          document
            .querySelectorAll(
              ".nav-button"
            )
            .forEach(
              item =>
                item.classList.remove(
                  "active"
                )
            );

          button.classList.add(
            "active"
          );

          document
            .querySelectorAll(
              ".section"
            )
            .forEach(
              item =>
                item.classList.remove(
                  "active"
                )
            );

          const target =
            $(
              `section-${section}`
            );

          if (target) {

            target.classList.add(
              "active"
            );
          }
        }
      );
    });
}

// ============================================================
// PRICELIST
// ============================================================

async function loadPrices() {

  const root =
    $("adminPrices");

  if (!root) return;

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "pricelist"
        )
      );

    priceList =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );

    $("statPrices")
      .textContent =
      priceList.length;

    if (!priceList.length) {

      root.innerHTML =
        "<p>No products found.</p>";

      return;
    }

    priceList.sort(
      (a, b) =>
        String(a.service || "")
          .localeCompare(
            String(b.service || "")
          )
    );

    root.innerHTML =
      priceList.map(
        item => `

          <div class="admin-card">

            <div>

              <strong>
                ${escapeHTML(
                  item.service
                )}
              </strong>

              <p>
                ${escapeHTML(
                  item.package
                )}
              </p>

              <p>
                ${escapeHTML(
                  item.ownership
                )}
              </p>

              <p>
                ${money(
                  item.price
                )}
              </p>

              <span class="tag">
                ${escapeHTML(
                  item.sub_status ||
                  "active"
                )}
              </span>

            </div>

            <div>

              <button
                class="secondary edit-price"
                data-id="${item.id}"
              >
                Edit
              </button>

              <button
                class="danger delete-price"
                data-id="${item.id}"
              >
                Delete
              </button>

            </div>

          </div>
        `
      ).join("");

    document
      .querySelectorAll(
        ".edit-price"
      )
      .forEach(button => {

        button.onclick =
          () =>
            editPrice(
              button.dataset.id
            );
      });

    document
      .querySelectorAll(
        ".delete-price"
      )
      .forEach(button => {

        button.onclick =
          () =>
            deletePrice(
              button.dataset.id
            );
      });

  } catch (error) {

    errorMessage(error);
  }
}

// ============================================================
// PRICE SAVE
// ============================================================

async function savePrice(event) {

  event.preventDefault();

  try {

    const id =
      $("priceId").value.trim();

    const data = {

      service:
        $("service").value.trim(),

      package:
        $("packageName")
          .value.trim(),

      ownership:
        $("ownership").value,

      price:
        Number(
          $("price").value
        ),

      duration:
        $("duration")
          .value.trim(),

      description:
        $("description")
          .value.trim(),

      sub_status:
        $("priceStatus").value,

      updatedAt:
        serverTimestamp()
    };

    if (!data.service) {

      throw new Error(
        "Service is required."
      );
    }

    if (!data.package) {

      throw new Error(
        "Package is required."
      );
    }

    if (
      !Number.isFinite(
        data.price
      )
    ) {

      throw new Error(
        "Enter a valid price."
      );
    }

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
        "Product updated."
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
        "Product added."
      );
    }

    clearPriceForm();

    await loadPrices();

  } catch (error) {

    errorMessage(error);
  }
}

// ============================================================
// EDIT PRICE
// ============================================================

function editPrice(id) {

  const item =
    priceList.find(
      product =>
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
    "active";

  $("description").value =
    item.description || "";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// ============================================================
// DELETE PRICE
// ============================================================

async function deletePrice(id) {

  if (
    !confirm(
      "Delete this PriceList product?"
    )
  ) return;

  try {

    await deleteDoc(
      doc(
        db,
        "pricelist",
        id
      )
    );

    showMessage(
      "Product deleted."
    );

    await loadPrices();

  } catch (error) {

    errorMessage(error);
  }
}

// ============================================================
// CLEAR PRICE FORM
// ============================================================

function clearPriceForm() {

  $("priceForm")
    ?.reset();

  $("priceId").value =
    "";
}

// ============================================================
// PRICE LIST SEED
// ============================================================
//
// The actual seed data is stored in import-pricelist.js.
// This button dynamically imports that module.
//
// ============================================================

async function seedPriceList() {

  if (
    !confirm(
      "This will create/update the 23 PriceList products. Continue?"
    )
  ) return;

  try {

    await import(
      "./import-pricelist.js"
    );

    showMessage(
      "PriceList seed started. Refresh in a few seconds."
    );

    setTimeout(
      loadPrices,
      3000
    );

  } catch (error) {

    errorMessage(error);
  }
}

// ============================================================
// ORDERS
// ============================================================

async function loadOrders() {

  const root =
    $("adminOrders");

  if (!root) return;

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "orders"
        )
      );

    orders =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );

    $("statOrders")
      .textContent =
      orders.length;

    if (!orders.length) {

      root.innerHTML =
        "<p>No orders found.</p>";

      return;
    }

    root.innerHTML =
      orders.map(
        order => `

          <div class="admin-card">

            <div>

              <strong>
                Order:
                ${escapeHTML(
                  order.orderId ||
                  order.id
                )}
              </strong>

              <p>
                Customer:
                ${escapeHTML(
                  order.customerName ||
                  "Unknown"
                )}
              </p>

              <p>
                Total:
                ${money(
                  order.total
                )}
              </p>

            </div>

            <span class="tag">
              ${escapeHTML(
                order.paymentStatus ||
                "pending"
              )}
            </span>

          </div>
        `
      ).join("");

  } catch (error) {

    errorMessage(error);
  }
}

// ============================================================
// PAYMENTS
// ============================================================

async function loadPayments() {

  const root =
    $("adminPayments");

  if (!root) return;

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "payments"
        )
      );

    payments =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );

    $("statPayments")
      .textContent =
      payments.length;

    if (!payments.length) {

      root.innerHTML =
        "<p>No payments found.</p>";

      return;
    }

    root.innerHTML =
      payments.map(
        payment => `

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

            </div>

            <div>

              <span class="tag">
                ${escapeHTML(
                  payment.status ||
                  "pending"
                )}
              </span>

              ${
                payment.status ===
                "pending"
                  ? `

                    <br><br>

                    <button
                      class="primary approve-payment"
                      data-id="${payment.id}"
                    >
                      Approve
                    </button>

                    <button
                      class="danger reject-payment"
                      data-id="${payment.id}"
                    >
                      Reject
                    </button>

                  `
                  : ""
              }

            </div>

          </div>
        `
      ).join("");

    document
      .querySelectorAll(
        ".approve-payment"
      )
      .forEach(button => {

        button.onclick =
          () =>
            reviewPayment(
              button.dataset.id,
              "approved"
            );
      });

    document
      .querySelectorAll(
        ".reject-payment"
      )
      .forEach(button => {

        button.onclick =
          () =>
            reviewPayment(
              button.dataset.id,
              "rejected"
            );
      });

  } catch (error) {

    errorMessage(error);
  }
}

// ============================================================
// PAYMENT REVIEW
// ============================================================

async function reviewPayment(
  paymentId,
  status
) {

  if (
    !confirm(
      `Change payment status to ${status}?`
    )
  ) return;

  try {

    const paymentRef =
      doc(
        db,
        "payments",
        paymentId
      );

    await updateDoc(
      paymentRef,
      {

        status,

        reviewedBy:
          currentAdmin.uid,

        reviewedAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()
      }
    );

    showMessage(
      `Payment ${status}.`
    );

    await loadPayments();

  } catch (error) {

    errorMessage(error);
  }
}

// ============================================================
// CLIENTS
// ============================================================

async function loadClients() {

  const root =
    $("adminClients");

  if (!root) return;

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "clients"
        )
      );

    clients =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );

    $("statClients")
      .textContent =
      clients.length;

    if (!clients.length) {

      root.innerHTML =
        "<p>No customers found.</p>";

      return;
    }

    root.innerHTML =
      clients.map(
        client => `

          <div class="admin-card">

            <div>

              <strong>
                ${escapeHTML(
                  client.name ||
                  "Unnamed"
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

            </div>

          </div>
        `
      ).join("");

  } catch (error) {

    errorMessage(error);
  }
}

// ============================================================
// SUBSCRIPTIONS
// ============================================================

async function loadSubscriptions() {

  const root =
    $("adminSubscriptions");

  if (!root) return;

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "subscriptions"
        )
      );

    subscriptions =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );

    $("statSubscriptions")
      .textContent =
      subscriptions.length;

    if (!subscriptions.length) {

      root.innerHTML =
        "<p>No subscriptions found.</p>";

      refreshAssignmentLists();

      return;
    }

    root.innerHTML =
      subscriptions.map(
        sub => `

          <div class="admin-card">

            <div>

              <strong>
                ${escapeHTML(
                  sub.service ||
                  ""
                )}
              </strong>

              <p>
                Package:
                ${escapeHTML(
                  sub.package ||
                  ""
                )}
              </p>

              <p>
                Start:
                ${escapeHTML(
                  sub.startDate ||
                  ""
                )}
              </p>

              <p>
                Expiry:
                ${escapeHTML(
                  sub.expiryDate ||
                  ""
                )}
              </p>

              <p>
                Account:
                ${escapeHTML(
                  sub.accountLabel ||
                  "Not assigned"
                )}
              </p>

            </div>

            <span class="tag">
              ${escapeHTML(
                sub.status ||
                "pending"
              )}
            </span>

          </div>
        `
      ).join("");

    refreshAssignmentLists();

  } catch (error) {

    errorMessage(error);
  }
}

// ============================================================
// ACCOUNTS
// ============================================================

async function loadAccounts() {

  const root =
    $("adminAccounts");

  if (!root) return;

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          "accounts"
        )
      );

    accounts =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );

    $("statAccounts")
      .textContent =
      accounts.length;

    if (!accounts.length) {

      root.innerHTML =
        "<p>No accounts found.</p>";

      refreshAssignmentLists();

      return;
    }

    root.innerHTML =
      accounts.map(
        account => `

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
                  account.service ||
                  ""
                )}
              </p>

              <p>
                Email:
                ${escapeHTML(
                  account.email ||
                  ""
                )}
              </p>

            </div>

            <div>

              <span class="tag">
                ${escapeHTML(
                  account.status ||
                  "available"
                )}
              </span>

              <br><br>

              <button
                class="secondary edit-account"
                data-id="${account.id}"
              >
                Edit
              </button>

              <button
                class="danger delete-account"
                data-id="${account.id}"
              >
                Delete
              </button>

            </div>

          </div>
        `
      ).join("");

    document
      .querySelectorAll(
        ".edit-account"
      )
      .forEach(button => {

        button.onclick =
          () =>
            editAccount(
              button.dataset.id
            );
      });

    document
      .querySelectorAll(
        ".delete-account"
      )
      .forEach(button => {

        button.onclick =
          () =>
            deleteAccount(
              button.dataset.id
            );
      });

    refreshAssignmentLists();

  } catch (error) {

    errorMessage(error);
  }
}

// ============================================================
// ACCOUNT SAVE
// ============================================================

async function saveAccount(event) {

  event.preventDefault();

  try {

    const id =
      $("accountId").value.trim();

    const data = {

      service:
        $("accountService")
          .value.trim(),

      accountLabel:
        $("accountLabel")
          .value.trim(),

      status:
        $("accountStatus").value,

      updatedAt:
        serverTimestamp()
    };

    if (!data.service) {

      throw new Error(
        "Service is required."
      );
    }

    if (!data.accountLabel) {

      throw new Error(
        "Account label is required."
      );
    }

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
        "Account updated."
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

          assigned:
            "no",

          createdAt:
            serverTimestamp()
        }
      );

      showMessage(
        "Account created."
      );
    }

    $("accountForm")
      .reset();

    $("accountId").value =
      "";

    await loadAccounts();

  } catch (error) {

    errorMessage(error);
  }
}

// ============================================================
// EDIT ACCOUNT
// ============================================================

function editAccount(id) {

  const account =
    accounts.find(
      item =>
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

  document
    .querySelector(
      '[data-section="accounts"]'
    )
    ?.click();
}

// ============================================================
// DELETE ACCOUNT
// ============================================================

async function deleteAccount(id) {

  const account =
    accounts.find(
      item =>
        item.id === id
    );

  if (!account) return;

  if (
    account.subscriptionId
  ) {

    showMessage(
      "This account is assigned and cannot be deleted.",
      "error"
    );

    return;
  }

  if (
    !confirm(
      "Delete this account?"
    )
  ) return;

  try {

    await deleteDoc(
      doc(
        db,
        "accounts",
        id
      )
    );

    showMessage(
      "Account deleted."
    );

    await loadAccounts();

  } catch (error) {

    errorMessage(error);
  }
}

// ============================================================
// ASSIGNMENT
// ============================================================

function refreshAssignmentLists() {

  const subscriptionSelect =
    $("assignmentSubscription");

  const accountSelect =
    $("assignmentAccount");

  if (
    !subscriptionSelect ||
    !accountSelect
  ) return;

  subscriptionSelect.innerHTML = `
    <option value="">
      Choose subscription
    </option>

    ${
      subscriptions
        .filter(
          sub =>
            !sub.accountId &&
            normalizeStatus(
              sub.status ||
              "pending"
            ) !== "expired"
        )
        .map(
          sub => `

            <option value="${sub.id}">

              ${escapeHTML(
                sub.service
              )}
              —
              ${escapeHTML(
                sub.package
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
          account =>
            normalizeStatus(
              account.status ||
              "available"
            ) ===
            "available"
        )
        .map(
          account => `

            <option value="${account.id}">

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

// ============================================================
// ASSIGN ACCOUNT
// ============================================================

async function assignAccount(event) {

  event.preventDefault();

  const subscriptionId =
    $("assignmentSubscription")
      .value;

  const accountId =
    $("assignmentAccount")
      .value;

  if (
    !subscriptionId ||
    !accountId
  ) {

    showMessage(
      "Select both a subscription and an account.",
      "error"
    );

    return;
  }

  try {

    await runTransaction(
      db,
      async transaction => {

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

        const subscriptionSnapshot =
          await transaction.get(
            subscriptionRef
          );

        const accountSnapshot =
          await transaction.get(
            accountRef
          );

        if (
          !subscriptionSnapshot.exists()
        ) {

          throw new Error(
            "Subscription not found."
          );
        }

        if (
          !accountSnapshot.exists()
        ) {

          throw new Error(
            "Account not found."
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
            "Subscription already has an account."
          );
        }

        if (
          normalizeStatus(
            account.status
          ) !== "available"
        ) {

          throw new Error(
            "Account is not available."
          );
        }

        transaction.update(
          subscriptionRef,
          {

            accountId,

            accountLabel:
              account.accountLabel,

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

            assigned:
              "yes",

            subscriptionId,

            updatedAt:
              serverTimestamp()
          }
        );
      }
    );

    showMessage(
      "Account assigned successfully."
    );

    $("assignmentForm")
      .reset();

    await Promise.all([
      loadSubscriptions(),
      loadAccounts()
    ]);

  } catch (error) {

    errorMessage(error);
  }
}

// ============================================================
// LOGOUT
// ============================================================

async function logout() {

  try {

    await signOut(auth);

    window.location.href =
      "admin-login.html";

  } catch (error) {

    errorMessage(error);
  }
}

// ============================================================
// EVENTS
// ============================================================

function setupEvents() {

  $("priceForm")
    ?.addEventListener(
      "submit",
      savePrice
    );

  $("cancelPriceEdit")
    ?.addEventListener(
      "click",
      clearPriceForm
    );

  $("seedPriceList")
    ?.addEventListener(
      "click",
      seedPriceList
    );

  $("refreshPrices")
    ?.addEventListener(
      "click",
      loadPrices
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

  $("subscriptionForm")
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        try {

          const orderId =
            $("subscriptionOrderId")
              .value.trim();

          const orderSnapshot =
            await getDoc(
              doc(
                db,
                "orders",
                orderId
              )
            );

          if (
            !orderSnapshot.exists()
          ) {

            throw new Error(
              "Order does not exist."
            );
          }

          const order =
            orderSnapshot.data();

          if (
            order.paymentStatus !==
            "approved"
          ) {

            throw new Error(
              "Payment must be approved before creating the subscription."
            );
          }

          await addDoc(
            collection(
              db,
              "subscriptions"
            ),
            {

              orderId,

              customerUid:
                $("subscriptionCustomerUid")
                  .value.trim(),

              service:
                $("subscriptionService")
                  .value.trim(),

              package:
                $("subscriptionPackage")
                  .value.trim(),

              startDate:
                $("startDate").value,

              expiryDate:
                $("expiryDate").value,

              status:
                $("subscriptionStatus")
                  .value,

              sub_status:
                $("subscriptionStatus")
                  .value,

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
            "Subscription created."
          );

          $("subscriptionForm")
            .reset();

          await loadSubscriptions();

        } catch (error) {

          errorMessage(error);
        }
      }
    );

  $("accountForm")
    ?.addEventListener(
      "submit",
      saveAccount
    );

  $("cancelAccountEdit")
    ?.addEventListener(
      "click",
      () => {

        $("accountForm")
          .reset();

        $("accountId").value =
          "";
      }
    );

  $("assignmentForm")
    ?.addEventListener(
      "submit",
      assignAccount
    );

  $("logoutButton")
    ?.addEventListener(
      "click",
      logout
    );
}

// ============================================================
// LOAD EVERYTHING
// ============================================================

async function loadDashboard() {

  await checkAdmin();

  setupNavigation();

  setupEvents();

  await Promise.all([
    loadPrices(),
    loadOrders(),
    loadPayments(),
    loadClients(),
    loadSubscriptions(),
    loadAccounts()
  ]);
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
    loadDashboard
  );

} else {

  loadDashboard();
}
