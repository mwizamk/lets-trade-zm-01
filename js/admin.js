import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

// ============================================================
// ADMIN AUTHORIZATION GUARD
// ============================================================

function requireAdmin() {

  return new Promise((resolve, reject) => {

    onAuthStateChanged(
      auth,
      async (user) => {

        if (!user) {

          window.location.href =
            "admin-login.html";

          return;

        }


        try {

          const adminSnapshot =
            await getDoc(
              doc(
                db,
                "admins",
                user.uid
              )
            );


          if (!adminSnapshot.exists()) {

            await signOut(auth);

            window.location.href =
              "admin-login.html";

            return;

          }


          const admin =
            adminSnapshot.data();


          if (
            admin.role !== "admin" ||
            admin.active !== true
          ) {

            await signOut(auth);

            window.location.href =
              "admin-login.html";

            return;

          }


          const status =
            $("adminStatus");


          if (status) {

            status.textContent =
              `Administrator authenticated: ${user.email}`;

            status.style.color =
              "green";

          }


          resolve(user);

        } catch (error) {

          console.error(
            "Admin authorization error:",
            error
          );


          await signOut(auth);

          window.location.href =
            "admin-login.html";

        }

      }
    );

  });

}

// ============================================================
// LET'S TRADE ZM
// ADMIN PORTAL
// FIREBASE / FIRESTORE
// ============================================================

import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ============================================================
// HELPERS
// ============================================================

const $ = (id) =>
  document.getElementById(id);


function safe(value) {

  return String(value ?? "")
    .replace(
      /[&<>"']/g,
      character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[character])
    );

}


function money(value) {

  return `K${Number(value || 0).toFixed(2)}`;

}


function setMessage(text, type = "info") {

  const message =
    $("adminMessage");

  if (!message) return;

  message.textContent = text;

  message.style.color =
    type === "error"
      ? "red"
      : type === "success"
        ? "green"
        : "";

}


// ============================================================
// FIRESTORE READER
// ============================================================

async function readCollection(name) {

  const snapshot =
    await getDocs(
      collection(db, name)
    );

  return snapshot.docs.map(
    item => ({
      id: item.id,
      ...item.data()
    })
  );

}


// ============================================================
// STATE
// ============================================================

let subscriptions = [];
let accounts = [];
let approvedOrders = [];


// ============================================================
// PRICELIST
// ============================================================

async function loadPrices() {

  const root =
    $("adminPrices");

  if (!root) return;

  try {

    const items =
      await readCollection(
        "pricelist"
      );


    root.innerHTML =
      items.length

        ? items.map(item => {

            const status =
              item.sub_status ??
              item.status ??
              "active";


            return `

              <div class="admin-card">

                <div>

                  <strong>
                    ${safe(item.service)}
                  </strong>

                  <p>
                    ${safe(item.package)}
                    ·
                    ${safe(item.ownership)}
                    ·
                    ${money(item.price)}
                  </p>

                  <small>
                    Status:
                    ${safe(status)}
                  </small>

                </div>

              </div>

            `;

          }).join("")

        : "<p>No PriceList products found.</p>";


  } catch (error) {

    root.innerHTML =
      `<p>Unable to load PriceList: ${safe(error.message)}</p>`;

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

    const items =
      await readCollection(
        "orders"
      );


    approvedOrders =
      items.filter(
        item =>
          item.paymentStatus ===
          "approved"
      );


    root.innerHTML =
      items.length

        ? items.map(order => `

          <div class="admin-card">

            <div>

              <strong>
                ${safe(
                  order.orderId ||
                  order.id
                )}
              </strong>

              <p>
                Customer:
                ${safe(
                  order.customer?.name ||
                  "Unknown"
                )}
              </p>

              <p>
                ${safe(
                  order.customer?.identifier ||
                  ""
                )}
              </p>

              <p>
                ${
                  (order.items || [])
                    .map(
                      item =>
                        `${safe(item.service)}
                         — ${safe(item.package)}`
                    )
                    .join(", ")
                }
              </p>

              <strong>
                ${money(order.total)}
              </strong>

            </div>

            <span class="tag">

              ${safe(
                order.paymentStatus ||
                "pending"
              )}

            </span>

          </div>

        `).join("")

        : "<p>No orders found.</p>";


  } catch (error) {

    root.innerHTML =
      `<p>Unable to load orders: ${safe(error.message)}</p>`;

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

    const items =
      await readCollection(
        "payments"
      );


    root.innerHTML =
      items.length

        ? items.map(payment => `

          <div class="admin-card">

            <div>

              <strong>
                ${safe(payment.method)}
              </strong>

              <p>
                Amount:
                ${money(payment.amount)}
              </p>

              <p>
                Reference:
                ${safe(payment.reference)}
              </p>

              <p>
                Order:
                ${safe(payment.orderId)}
              </p>

              <p>
                Customer:
                ${safe(payment.identifier)}
              </p>

            </div>


            <div>

              <span class="tag">
                ${safe(payment.status)}
              </span>


              ${
                payment.status === "pending"

                ? `

                  <button
                    class="button-small approve-payment"
                    data-id="${safe(payment.id)}"
                    data-order="${safe(payment.orderId)}"
                  >
                    Approve
                  </button>

                  <button
                    class="button-small reject-payment"
                    data-id="${safe(payment.id)}"
                    data-order="${safe(payment.orderId)}"
                  >
                    Reject
                  </button>

                `

                : ""
              }

            </div>

          </div>

        `).join("")

        : "<p>No payments found.</p>";


    document
      .querySelectorAll(
        ".approve-payment"
      )
      .forEach(button => {

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
      .forEach(button => {

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
      `<p>Unable to load payments: ${safe(error.message)}</p>`;

  }

}


// ============================================================
// REVIEW PAYMENT
// ============================================================

async function reviewPayment(
  paymentId,
  orderId,
  status
) {

  try {

    const paymentRef =
      doc(
        db,
        "payments",
        paymentId
      );


    const orderRef =
      doc(
        db,
        "orders",
        orderId
      );


    await updateDoc(
      paymentRef,
      {

        status,

        reviewedAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      }
    );


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


    setMessage(
      status === "approved"
        ? "Payment approved successfully."
        : "Payment rejected.",
      status === "approved"
        ? "success"
        : "error"
    );


    await Promise.all([
      loadOrders(),
      loadPayments()
    ]);


  } catch (error) {

    console.error(
      "Payment review error:",
      error
    );

    setMessage(
      `Payment update failed: ${error.message}`,
      "error"
    );

  }

}


// ============================================================
// CUSTOMERS
// ============================================================

async function loadClients() {

  const root =
    $("adminClients");

  if (!root) return;


  try {

    const items =
      await readCollection(
        "clients"
      );


    root.innerHTML =
      items.length

        ? items.map(client => `

          <div class="admin-card">

            <div>

              <strong>
                ${safe(client.name)}
              </strong>

              <p>
                Phone:
                ${safe(client.phone)}
              </p>

              <p>
                Email:
                ${safe(client.email)}
              </p>

              <p>
                Identifier:
                ${safe(client.identifier)}
              </p>

            </div>

          </div>

        `).join("")

        : "<p>No customers found.</p>";


  } catch (error) {

    root.innerHTML =
      `<p>Unable to load customers: ${safe(error.message)}</p>`;

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


    if (!orderId) {

      throw new Error(
        "Enter a Firestore Order ID."
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
        "This order cannot be fulfilled until its payment is approved."
      );

    }


    const service =
      $("subscriptionService")
        .value
        .trim();


    const packageName =
      $("subscriptionPackage")
        .value
        .trim();


    const startDate =
      $("startDate").value;


    const expiryDate =
      $("expiryDate").value;


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
      new Date(expiryDate) <
      new Date(startDate)
    ) {

      throw new Error(
        "Expiry date cannot be before the start date."
      );

    }


    const customerUid =
      $("subscriptionCustomerUid")
        ?.value
        .trim() || "";


    await addDoc(
      collection(
        db,
        "subscriptions"
      ),
      {

        orderId,

        clientId:
          order.clientId || "",

        customerUid,

        service,

        package:
          packageName,

        startDate,

        expiryDate,

        status:
          "pending",

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


    setMessage(
      "Subscription created successfully.",
      "success"
    );


    $("subscriptionForm").reset();


    await loadSubscriptions();


  } catch (error) {

    setMessage(
      error.message,
      "error"
    );

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

    subscriptions =
      await readCollection(
        "subscriptions"
      );


    root.innerHTML =
      subscriptions.length

        ? subscriptions.map(item => `

          <div class="admin-card">

            <div>

              <strong>
                ${safe(item.service)}
                —
                ${safe(item.package)}
              </strong>

              <p>
                Order:
                ${safe(item.orderId)}
              </p>

              <p>
                Status:
                ${safe(item.status)}
              </p>

              <p>
                Start:
                ${safe(item.startDate)}
              </p>

              <p>
                Expiry:
                ${safe(item.expiryDate)}
              </p>

              <p>
                Account:
                ${safe(
                  item.accountLabel ||
                  "Not assigned"
                )}
              </p>

            </div>

          </div>

        `).join("")

        : "<p>No subscriptions found.</p>";


    refreshAssignmentChoices();


  } catch (error) {

    root.innerHTML =
      `<p>Unable to load subscriptions: ${safe(error.message)}</p>`;

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

    accounts =
      await readCollection(
        "accounts"
      );


    root.innerHTML =
      accounts.length

        ? accounts.map(account => `

          <div class="admin-card">

            <div>

              <strong>
                ${safe(account.accountLabel)}
              </strong>

              <p>
                Service:
                ${safe(account.service)}
              </p>

              <span class="tag">
                ${safe(account.status)}
              </span>

            </div>

          </div>

        `).join("")

        : "<p>No accounts found.</p>";


    refreshAssignmentChoices();


  } catch (error) {

    root.innerHTML =
      `<p>Unable to load accounts: ${safe(error.message)}</p>`;

  }

}


// ============================================================
// ASSIGNMENT OPTIONS
// ============================================================

function refreshAssignmentChoices() {

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
        .filter(item =>
          !item.accountId &&
          item.status !== "expired"
        )
        .map(item => `

          <option value="${safe(item.id)}">

            ${safe(item.service)}
            —
            ${safe(item.package)}
            —
            ${safe(item.orderId)}

          </option>

        `)
        .join("")
    }

  `;


  accountSelect.innerHTML = `

    <option value="">
      Choose account
    </option>

    ${
      accounts
        .filter(account =>
          account.status === "available"
        )
        .map(account => `

          <option value="${safe(account.id)}">

            ${safe(account.service)}
            —
            ${safe(account.accountLabel)}

          </option>

        `)
        .join("")
    }

  `;

}


// ============================================================
// CREATE ACCOUNT
// ============================================================

async function createAccount(event) {

  event.preventDefault();


  try {

    const service =
      $("accountService")
        .value
        .trim();


    const accountLabel =
      $("accountLabel")
        .value
        .trim();


    if (!service) {

      throw new Error(
        "Enter the service."
      );

    }


    if (!accountLabel) {

      throw new Error(
        "Enter an account label."
      );

    }


    await addDoc(
      collection(
        db,
        "accounts"
      ),
      {

        service,

        accountLabel,

        status:
          "available",

        subscriptionId:
          "",

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      }
    );


    setMessage(
      "Account added successfully.",
      "success"
    );


    $("accountForm").reset();


    await loadAccounts();


  } catch (error) {

    setMessage(
      error.message,
      "error"
    );

  }

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

    setMessage(
      "Choose both a subscription and an available account.",
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


        const subscription =
          await transaction.get(
            subscriptionRef
          );


        const account =
          await transaction.get(
            accountRef
          );


        if (!subscription.exists()) {

          throw new Error(
            "Subscription does not exist."
          );

        }


        if (!account.exists()) {

          throw new Error(
            "Account does not exist."
          );

        }


        const subscriptionData =
          subscription.data();


        const accountData =
          account.data();


        if (
          subscriptionData.accountId
        ) {

          throw new Error(
            "Subscription already has an account."
          );

        }


        if (
          accountData.status !==
          "available"
        ) {

          throw new Error(
            "Account is no longer available."
          );

        }


        // ----------------------------------------------------
        // IMPORTANT:
        // Only assign an account to an approved order.
        // ----------------------------------------------------

        const orderId =
          subscriptionData.orderId;


        if (orderId) {

          const orderRef =
            doc(
              db,
              "orders",
              orderId
            );


          const order =
            await transaction.get(
              orderRef
            );


          if (!order.exists()) {

            throw new Error(
              "Related order does not exist."
            );

          }


          const orderData =
            order.data();


          if (
            orderData.paymentStatus !==
            "approved"
          ) {

            throw new Error(
              "Payment for this order has not been approved."
            );

          }

        }


        // ----------------------------------------------------
        // ACCOUNT → ASSIGNED
        // ----------------------------------------------------

        transaction.update(
          accountRef,
          {

            status:
              "assigned",

            subscriptionId,

            assignedAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp()

          }
        );


        // ----------------------------------------------------
        // SUBSCRIPTION → ACTIVE
        // ----------------------------------------------------

        transaction.update(
          subscriptionRef,
          {

            accountId,

            accountLabel:
              accountData.accountLabel,

            status:
              "active",

            updatedAt:
              serverTimestamp()

          }
        );

      }
    );


    setMessage(
      "Account assigned successfully. Subscription is now ACTIVE.",
      "success"
    );


    $("assignmentForm").reset();


    await Promise.all([
      loadAccounts(),
      loadSubscriptions()
    ]);


  } catch (error) {

    console.error(
      "Assignment error:",
      error
    );


    setMessage(
      error.message,
      "error"
    );

  }

}


// ============================================================
// REFRESH BUTTONS
// ============================================================

function setupRefreshButtons() {

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

}


// ============================================================
// LOGOUT BUTTON
// ============================================================

function setupLogout() {

  const button =
    $("logoutButton");


  if (!button) return;


  button.addEventListener(
    "click",
    () => {

      // Authentication logout will be connected
      // once Firebase Authentication is enabled
      // for the admin account.

      window.location.href =
        "index.html";

    }
  );

}


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupRefreshButtons();

    setupLogout();


    $("subscriptionForm")
      ?.addEventListener(
        "submit",
        createSubscription
      );


    $("accountForm")
      ?.addEventListener(
        "submit",
        createAccount
      );


    $("assignmentForm")
      ?.addEventListener(
        "submit",
        assignAccount
      );


    Promise.all([

      loadPrices(),

      loadOrders(),

      loadPayments(),

      loadClients(),

      loadSubscriptions(),

      loadAccounts()

    ])
    .catch(error => {

      console.error(
        "Admin initialization error:",
        error
      );

    });

  }
);
