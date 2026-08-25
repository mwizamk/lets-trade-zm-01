// ============================================================
// LET'S TRADE ZM
// SIGNUP / ORDER CREATION
// ============================================================

import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  doc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ============================================================
// HELPERS
// ============================================================

const $ = (id) =>
  document.getElementById(id);

const params =
  new URLSearchParams(window.location.search);

const productId =
  params.get("product");


// ============================================================
// LOAD SELECTED PRODUCT
// ============================================================

async function loadProduct() {

  if (!productId) {
    return;
  }

  try {

    const productRef =
      doc(
        db,
        "pricelist",
        productId
      );

    const snapshot =
      await getDoc(productRef);

    if (!snapshot.exists()) {

      console.error(
        "Product not found:",
        productId
      );

      return;
    }

    const product =
      snapshot.data();


    // Product information
    if ($("selectedService")) {
      $("selectedService").textContent =
        product.service || "";
    }

    if ($("selectedPackage")) {
      $("selectedPackage").textContent =
        product.package || "";
    }

    if ($("selectedPrice")) {
      $("selectedPrice").textContent =
        `K${Number(product.price || 0).toFixed(2)}`;
    }

    if ($("selectedOwnership")) {
      $("selectedOwnership").textContent =
        product.ownership || "";
    }

    if ($("selectedDuration")) {
      $("selectedDuration").textContent =
        product.duration || "";
    }


    // Hidden fields
    if ($("productId")) {
      $("productId").value =
        productId;
    }

    if ($("service")) {
      $("service").value =
        product.service || "";
    }

    if ($("package")) {
      $("package").value =
        product.package || "";
    }

    if ($("price")) {
      $("price").value =
        Number(product.price || 0);
    }

  } catch (error) {

    console.error(
      "Unable to load product:",
      error
    );

  }

}


// ============================================================
// SUBMIT SIGNUP
// ============================================================

async function submitSignup(event) {

  event.preventDefault();


  const button =
    $("signupButton");

  const message =
    $("signupMessage");


  if (button) {
    button.disabled = true;
    button.textContent =
      "Saving...";
  }


  try {

    // --------------------------------------------------------
    // CUSTOMER INFORMATION
    // --------------------------------------------------------

    const name =
      $("name")?.value.trim();

    const identifier =
      $("identifier")?.value.trim();

    const email =
      $("email")?.value.trim();

    const phone =
      $("phone")?.value.trim();


    if (!name) {

      throw new Error(
        "Please enter your name."
      );

    }


    if (!identifier && !phone && !email) {

      throw new Error(
        "Please enter your phone number or email address."
      );

    }


    // --------------------------------------------------------
    // PRODUCT INFORMATION
    // --------------------------------------------------------

    const selectedProductId =
      $("productId")?.value || productId;

    const service =
      $("service")?.value || "";

    const packageName =
      $("package")?.value || "";

    const price =
      Number(
        $("price")?.value || 0
      );


    if (!selectedProductId) {

      throw new Error(
        "No service has been selected."
      );

    }


    // --------------------------------------------------------
    // CLIENT ID
    // --------------------------------------------------------

    const normalizedIdentifier =
      (
        identifier ||
        phone ||
        email ||
        ""
      )
      .trim()
      .toLowerCase();


    const clientId =
      normalizedIdentifier
        .replace(/[^a-z0-9]/g, "_");


    // --------------------------------------------------------
    // SAVE CLIENT
    // --------------------------------------------------------

    await addDoc(
      collection(
        db,
        "clients"
      ),
      {

        name,

        phone:
          phone || "",

        email:
          email || "",

        identifier:
          normalizedIdentifier,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      }
    );


    // --------------------------------------------------------
    // CREATE ORDER
    // --------------------------------------------------------

    const orderRef =
      await addDoc(
        collection(
          db,
          "orders"
        ),
        {

          clientId,

          customer: {

            name,

            phone:
              phone || "",

            email:
              email || "",

            identifier:
              normalizedIdentifier

          },

          items: [

            {

              priceId:
                selectedProductId,

              service,

              package:
                packageName,

              unitPrice:
                price,

              quantity: 1

            }

          ],

          total:
            price,

          paymentStatus:
            "pending",

          orderStatus:
            "pending",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        }
      );


    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    if (message) {

      message.textContent =
        "Signup saved successfully. Redirecting to payment...";

      message.style.color =
        "green";

    }


    // --------------------------------------------------------
    // PAYMENT
    // --------------------------------------------------------

    setTimeout(() => {

      window.location.href =
        `payment.html?order=${encodeURIComponent(orderRef.id)}`;

    }, 800);


  } catch (error) {

    console.error(
      "Signup error:",
      error
    );


    if (message) {

      message.textContent =
        error.message;

      message.style.color =
        "red";

    }


    if (button) {

      button.disabled =
        false;

      button.textContent =
        "Continue to payment →";

    }

  }

}


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadProduct();

    const form =
      $("signupForm");

    if (form) {

      form.addEventListener(
        "submit",
        submitSignup
      );

    }

  }
);
