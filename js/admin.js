// ============================================================
// LET'S TRADE ZM
// ADMIN PORTAL
// ============================================================

import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ============================================================
// HELPERS
// ============================================================

const $ = id =>
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


async function readCollection(name) {

  const snapshot =
    await getDocs(
      collection(
        db,
        name
      )
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

  try {

    const items =
      await readCollection(
        "pricelist"
      );


    root.innerHTML =
      items.length

        ? items.map(item => `

          <div class="admin-card">

            <div>

              <strong>
                ${safe(item.service)}
              </strong>

              <p>
                ${safe(item.package)}
                · ${safe(item.ownership)}
                · ${money(item.price)}
              </p>

              <small>
                Status:
                ${safe(item.status)}
              </small>

            </div>

          </div>

        `).join("")

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


  try {

    const items =
      await readCollection(
        "orders"
      );


    approvedOrders =
      items.filter(
        item =>
          item.paymentStatus === "approved"
      );


    const select =
      $("subscriptionOrder");


    select.innerHTML = `
      <option value="">
        Select approved order
      </option>
    `;


    approvedOrders.forEach(
      order => {

        const option =
          document.createElement(
            "option"
          );

        option.value =
          order.id;

        option.textContent =
          `${order.orderId || order.id} — ${order.customer?.name || "Customer"} — ${money(order.total)}`;

        select.appendChild(
          option
        );

      }
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
                  order.customer?.name
                )}
              </p>

              <p>
                ${safe(
                  order.customer?.identifier
                )}
              </p>

              <p>
                ${(
                  order.items || []
                ).map(
                  item =>
                    `${safe(item.service)} — ${safe(item.package)}`
                ).join(", ")}
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
                    data-id="${payment.id}"
                    data-order="${payment.orderId}"
                  >
                    Approve
                  </button>

                  <button
                    class="button-small reject-payment"
                    data-id="${payment.id}"
                    data-order="${payment.orderId}"
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
      .forEach(
        button =>
          button.addEventListener(
            "click",
            () =>
              reviewPayment(
                button.dataset.id,
                button.dataset.order,
                "approved"
              )
          )
      );


    document
      .querySelectorAll(
        ".reject-payment"
      )
      .forEach(
        button =>
          button.addEventListener(
            "click",
            () =>
              reviewPayment(
                button.dataset.id,
                button.dataset.order,
                "rejected"
              )
          )
      );


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

    await updateDoc(
      doc(
        db,
        "payments",
        paymentId
      ),
      {

        status,

        reviewedAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      }
    );


    await updateDoc(
      doc(
        db,
        "orders",
        orderId
      ),
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


    await Promise.all([
      loadOrders(),
      loadPayments()
    ]);


  } catch (error) {

    alert(
      `Payment update failed: ${error.message}`
    );

  }

}


// ============================================================
// CUSTOMERS
// ============================================================

async function loadClients() {

  const root =
    $("adminClients");


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
                ${safe(
                  client.phone ||
                  client.email ||
                  client.identifier
                )}
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

async function createSubscription(
  event
) {

  event.preventDefault();


  const message =
    $("subscriptionMessage");


  try {

    const orderId =
      $("subscriptionOrder").value;


    if (!orderId) {

      throw new Error(
        "Select an approved order."
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


    await addDoc(
      collection(
        db,
        "subscriptions"
      ),
      {

        orderId,

        clientId:
          order.clientId || "",

        customerUid:
          $("customerUid").value.trim(),

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


    message.textContent =
      "Subscription created successfully.";

    message.style.color =
      "green";


    $("subscriptionForm").reset();


    await loadSubscriptions();


  } catch (error) {

    message.textContent =
      error.message;

    message.style.color =
      "red";

  }

}


// ============================================================
// SUBSCRIPTIONS
// ============================================================

async function loadSubscriptions() {

  const root =
    $("adminSubscriptions");


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
                Status:
                ${safe(item.status)}
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
                ${safe(
                  account.accountLabel
                )}
              </strong>

              <p>
                Service:
                ${safe(
                  account.service
                )}
              </p>

              <span class="tag">
                ${safe(
                  account.status
                )}
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


  subscriptionSelect.innerHTML = `

    <option value="">
      Select subscription
    </option>

    ${
      subscriptions

        .filter(
          item =>
            !item.accountId &&
            item.status !== "expired"
        )

        .map(
          item => `

            <option
              value="${item.id}"
            >

              ${safe(item.service)}
              —
              ${safe(item.package)}

            </option>

          `
        )

        .join("")
    }

  `;


  accountSelect.innerHTML = `

    <option value="">
      Select available account
    </option>

    ${
      accounts

        .filter(
          account =>
            account.status === "available"
        )

        .map(
          account => `

            <option
              value="${account.id}"
            >

              ${safe(account.service)}
              —
              ${safe(account.accountLabel)}

            </option>

          `
        )

        .join("")
    }

  `;

}


// ============================================================
// CREATE ACCOUNT
// ============================================================

async function createAccount(
  event
) {

  event.preventDefault();


  const message =
    $("accountMessage");


  try {

    const service =
      $("accountService")
        .value
        .trim();


    const accountLabel =
      $("accountLabel")
        .value
        .trim();


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


    message.textContent =
      "Account added successfully.";

    message.style.color =
      "green";


    $("accountForm").reset();


    await loadAccounts();


  } catch (error) {

    message.textContent =
      error.message;

    message.style.color =
      "red";

  }

}


// ============================================================
// ASSIGN ACCOUNT
// ============================================================

async function assignAccount(
  event
) {

  event.preventDefault();


  const message =
    $("assignmentMessage");


  const subscriptionId =
    $("assignmentSubscription").value;


  const accountId =
    $("assignmentAccount").value;


  if (
    !subscriptionId ||
    !accountId
  ) {

    message.textContent =
      "Select both a subscription and an account.";

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


        if (
          !subscription.exists()
        ) {

          throw new Error(
            "Subscription does not exist."
          );

        }


        if (
          !account.exists()
        ) {

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
            "This subscription already has an account."
          );

        }


        if (
          accountData.status !==
          "available"
        ) {

          throw new Error(
            "This account is no longer available."
          );

        }


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


        transaction.update(
          subscriptionRef,
          {

            accountId,

            accountLabel:
              accountData.accountLabel,

            status:
              "active",

            startDate:
              subscriptionData.startDate ||
              new Date()
                .toISOString()
                .slice(0, 10),

            updatedAt:
              serverTimestamp()

          }
        );

      }
    );


    message.textContent =
      "Account assigned successfully. Subscription is now ACTIVE.";

    message.style.color =
      "green";


    $("assignmentForm").reset();


    await Promise.all([
      loadAccounts(),
      loadSubscriptions()
    ]);


  } catch (error) {

    message.textContent =
      error.message;

    message.style.color =
      "red";

  }

}


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    $("subscriptionForm")
      .addEventListener(
        "submit",
        createSubscription
      );


    $("accountForm")
      .addEventListener(
        "submit",
        createAccount
      );


    $("assignmentForm")
      .addEventListener(
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

    ]);

  }
);
