// ============================================================
// LET'S TRADE ZM
// PAYMENT
// ============================================================

import { db } from "./firebase.js";

import {
  doc,
  getDoc,
  addDoc,
  collection,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ============================================================
// HELPERS
// ============================================================

const $ = (id) =>
  document.getElementById(id);


const params =
  new URLSearchParams(
    window.location.search
  );


const orderId =
  params.get("order");


// ============================================================
// SAFE HTML
// ============================================================

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


// ============================================================
// ORDER
// ============================================================

let orderData = null;


// ============================================================
// LOAD ORDER
// ============================================================

async function loadOrder() {

  const summary =
    $("orderSummary");


  if (!orderId) {

    summary.innerHTML = `
      <p class="form-message">
        No order was provided.
      </p>
    `;

    $("paymentForm").style.display =
      "none";

    return;

  }


  try {

    const orderReference =
      doc(
        db,
        "orders",
        orderId
      );


    const snapshot =
      await getDoc(
        orderReference
      );


    if (!snapshot.exists()) {

      throw new Error(
        "Order could not be found."
      );

    }


    orderData =
      snapshot.data();


    const items =
      orderData.items || [];


    summary.innerHTML = `

      <p>
        <strong>Order:</strong>
        ${safe(orderData.orderId || orderId)}
      </p>

      <div>

        ${
          items.map(item => `

            <div
              class="cart-item"
              style="margin:10px 0;"
            >

              <div>

                <strong>
                  ${safe(item.service)}
                </strong>

                <p>
                  ${safe(item.package || "")}
                </p>

              </div>

              <strong>
                K${Number(
                  item.unitPrice || 0
                ).toFixed(2)}
              </strong>

            </div>

          `).join("")
        }

      </div>

      <hr>

      <p>

        <strong>
          Total:
        </strong>

        K${Number(
          orderData.total || 0
        ).toFixed(2)}

      </p>

    `;


    $("paymentAmount").value =
      Number(
        orderData.total || 0
      ).toFixed(2);


    if (
      orderData.customer?.identifier
    ) {

      $("paymentIdentifier").value =
        orderData.customer.identifier;

    }


  } catch (error) {

    console.error(
      error
    );

    summary.innerHTML = `
      <p class="form-message">
        ${safe(error.message)}
      </p>
    `;

  }

}


// ============================================================
// SUBMIT PAYMENT
// ============================================================

async function submitPayment(event) {

  event.preventDefault();


  const button =
    $("paymentButton");

  const message =
    $("paymentMessage");


  if (!orderId || !orderData) {

    message.textContent =
      "Order information is unavailable.";

    return;

  }


  button.disabled =
    true;

  button.textContent =
    "Submitting...";


  try {

    const method =
      $("paymentMethod").value;

    const amount =
      Number(
        $("paymentAmount").value
      );

    const reference =
      $("paymentReference")
        .value
        .trim();

    const identifier =
      $("paymentIdentifier")
        .value
        .trim();


    if (!method) {

      throw new Error(
        "Please select a payment method."
      );

    }


    if (!amount || amount <= 0) {

      throw new Error(
        "Enter a valid amount."
      );

    }


    if (!reference) {

      throw new Error(
        "Enter your transaction reference."
      );

    }


    if (!identifier) {

      throw new Error(
        "Enter your phone number or email."
      );

    }


    // --------------------------------------------------------
    // SAVE PAYMENT
    // --------------------------------------------------------

    const payment =
      await addDoc(
        collection(
          db,
          "payments"
        ),
        {

          orderId,

          method,

          amount,

          reference,

          identifier,

          status:
            "pending",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        }
      );


    // --------------------------------------------------------
    // UPDATE ORDER
    // --------------------------------------------------------

    await updateDoc(
      doc(
        db,
        "orders",
        orderId
      ),
      {

        paymentStatus:
          "pending_verification",

        orderStatus:
          "awaiting_payment_verification",

        paymentId:
          payment.id,

        updatedAt:
          serverTimestamp()

      }
    );


    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    $("paymentForm").style.display =
      "none";

    $("paymentSuccess").style.display =
      "block";

    $("successOrder").textContent =
      orderData.orderId || orderId;


  } catch (error) {

    console.error(
      "Payment error:",
      error
    );


    message.textContent =
      error.message;


    button.disabled =
      false;

    button.textContent =
      "Submit payment";

  }

}


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadOrder();

    $("paymentForm")
      .addEventListener(
        "submit",
        submitPayment
      );

  }
);
