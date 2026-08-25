// ============================================================
// LET'S TRADE ZM
// SIGNUP / PRICE LIST / CART / ORDER CREATION
// ============================================================

import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ============================================================
// HELPERS
// ============================================================

const $ = (id) => document.getElementById(id);

let products = [];
let cart = [];


// ============================================================
// LOAD PRICE LIST FROM FIRESTORE
// ============================================================

async function loadPriceList() {

  const status = $("firebaseStatus");
  const priceList = $("priceList");

  if (!priceList) return;

  try {

    if (status) {
      status.textContent = "Loading available services...";
      status.style.color = "";
    }

    const snapshot = await getDocs(
      collection(db, "pricelist")
    );

    products = [];

    snapshot.forEach((docSnap) => {

      const data = docSnap.data();

      products.push({
        id: docSnap.id,
        ...data
      });

    });

    console.log("PriceList products loaded:", products.length);

    if (products.length === 0) {

      priceList.innerHTML = `
        <div class="form-message">
          No services are currently available.
        </div>
      `;

      if (status) {
        status.textContent = "No services available.";
      }

      return;
    }


    // --------------------------------------------------------
    // CREATE FILTERS
    // --------------------------------------------------------

    const filterContainer = document.createElement("div");

    filterContainer.className = "price-filters";

    filterContainer.innerHTML = `
      <button type="button" class="price-filter active" data-filter="all">
        All
      </button>

      <button type="button" class="price-filter" data-filter="shared">
        Shared
      </button>

      <button type="button" class="price-filter" data-filter="private">
        Private
      </button>
    `;

    priceList.parentNode.insertBefore(
      filterContainer,
      priceList
    );


    filterContainer
      .querySelectorAll(".price-filter")
      .forEach((button) => {

        button.addEventListener("click", () => {

          filterContainer
            .querySelectorAll(".price-filter")
            .forEach((btn) => {
              btn.classList.remove("active");
            });

          button.classList.add("active");

          renderProducts(
            button.dataset.filter
          );

        });

      });


    // --------------------------------------------------------
    // SHOW ALL PRODUCTS
    // --------------------------------------------------------

    renderProducts("all");


    if (status) {
      status.textContent =
        `${products.length} services available.`;

      status.style.color = "green";
    }


  } catch (error) {

    console.error(
      "PriceList loading error:",
      error
    );

    if (priceList) {

      priceList.innerHTML = `
        <div class="form-message">
          Unable to load services right now.
          Please refresh the page and try again.
        </div>
      `;

    }

    if (status) {

      status.textContent =
        "Unable to load available services.";

      status.style.color = "red";

    }

  }

}


// ============================================================
// RENDER PRODUCTS
// ============================================================

function renderProducts(filter = "all") {

  const priceList = $("priceList");

  if (!priceList) return;

  let filteredProducts = [...products];


  // ----------------------------------------------------------
  // FILTER OWNERSHIP
  // ----------------------------------------------------------

  if (
    filter === "shared" ||
    filter === "private"
  ) {

    filteredProducts =
      products.filter((product) => {

        const ownership =
          String(
            product.ownership || ""
          )
          .trim()
          .toLowerCase();

        return ownership === filter;

      });

  }


  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  priceList.innerHTML = "";


  if (filteredProducts.length === 0) {

    priceList.innerHTML = `
      <div class="form-message">
        No ${filter} services available.
      </div>
    `;

    return;
  }


  filteredProducts.forEach((product) => {

    const service =
      product.service || "Service";

    const packageName =
      product.package || "Package";

    const ownership =
      product.ownership || "";

    const price =
      Number(product.price || 0);

    const status =
      String(product.sub_status || "")
        .trim()
        .toLowerCase();


    // If a sub_status exists and is inactive,
    // don't show it.
    if (
      status &&
      status !== "active"
    ) {
      return;
    }


    const card =
      document.createElement("article");

    card.className =
      "price-card";


    card.innerHTML = `

      <div class="price-card-content">

        <span class="eyebrow">
          ${escapeHtml(ownership)}
        </span>

        <h3>
          ${escapeHtml(service)}
        </h3>

        <p>
          ${escapeHtml(packageName)}
        </p>

        <strong class="price">
          K${price.toFixed(2)}
        </strong>

        <button
          type="button"
          class="button add-service"
          data-id="${escapeHtml(product.id)}"
        >
          Add to cart
        </button>

      </div>

    `;


    priceList.appendChild(card);

  });


  // ----------------------------------------------------------
  // ADD TO CART EVENTS
  // ----------------------------------------------------------

  priceList
    .querySelectorAll(".add-service")
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          addToCart(
            button.dataset.id
          );

        }
      );

    });

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


// ============================================================
// ADD TO CART
// ============================================================

function addToCart(productId) {

  const product =
    products.find(
      (item) => item.id === productId
    );

  if (!product) return;


  const existing =
    cart.find(
      (item) => item.id === productId
    );


  if (existing) {

    existing.quantity += 1;

  } else {

    cart.push({

      id: product.id,

      service:
        product.service || "",

      package:
        product.package || "",

      ownership:
        product.ownership || "",

      price:
        Number(product.price || 0),

      quantity: 1

    });

  }


  renderCart();

}


// ============================================================
// REMOVE FROM CART
// ============================================================

function removeFromCart(productId) {

  cart =
    cart.filter(
      (item) => item.id !== productId
    );

  renderCart();

}


// ============================================================
// RENDER CART
// ============================================================

function renderCart() {

  const cartSection =
    $("cartSection");

  const cartItems =
    $("cartItems");

  const cartCount =
    $("cartCount");

  const cartTotal =
    $("cartTotal");


  if (!cartItems) return;


  // ----------------------------------------------------------
  // COUNT
  // ----------------------------------------------------------

  const totalQuantity =
    cart.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );


  if (cartCount) {
    cartCount.textContent =
      totalQuantity;
  }


  // ----------------------------------------------------------
  // EMPTY CART
  // ----------------------------------------------------------

  if (cart.length === 0) {

    cartItems.innerHTML = "";

    if (cartSection) {
      cartSection.hidden = true;
    }

    if (cartTotal) {
      cartTotal.textContent =
        "K0.00";
    }

    return;

  }


  if (cartSection) {
    cartSection.hidden = false;
  }


  // ----------------------------------------------------------
  // ITEMS
  // ----------------------------------------------------------

  cartItems.innerHTML = "";


  cart.forEach((item) => {

    const itemTotal =
      item.price * item.quantity;


    const row =
      document.createElement("div");

    row.className =
      "cart-item";


    row.innerHTML = `

      <div>

        <strong>
          ${escapeHtml(item.service)}
        </strong>

        <span>
          ${escapeHtml(item.package)}
        </span>

        <small>
          ${escapeHtml(item.ownership)}
        </small>

      </div>

      <div>

        <strong>
          K${itemTotal.toFixed(2)}
        </strong>

        <button
          type="button"
          class="remove-cart-item"
          data-id="${escapeHtml(item.id)}"
        >
          Remove
        </button>

      </div>

    `;


    cartItems.appendChild(row);

  });


  // ----------------------------------------------------------
  // REMOVE BUTTONS
  // ----------------------------------------------------------

  cartItems
    .querySelectorAll(".remove-cart-item")
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          removeFromCart(
            button.dataset.id
          );

        }
      );

    });


  // ----------------------------------------------------------
  // TOTAL
  // ----------------------------------------------------------

  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        item.price *
        item.quantity,
      0
    );


  if (cartTotal) {

    cartTotal.textContent =
      `K${total.toFixed(2)}`;

  }

}


// ============================================================
// CART BUTTON
// ============================================================

function setupCartButton() {

  const cartButton =
    $("cartButton");

  if (!cartButton) return;


  cartButton.addEventListener(
    "click",
    () => {

      const cartSection =
        $("cartSection");

      if (!cartSection) return;

      if (cart.length > 0) {

        cartSection.hidden = false;

        cartSection.scrollIntoView({
          behavior: "smooth"
        });

      }

    }
  );

}


// ============================================================
// CHECKOUT
// ============================================================

function setupCheckout() {

  const checkoutButton =
    $("checkoutButton");

  if (!checkoutButton) return;


  checkoutButton.addEventListener(
    "click",
    () => {

      if (cart.length === 0) {

        alert(
          "Please select at least one service."
        );

        return;

      }


      const customerSection =
        $("customerSection");

      if (customerSection) {

        customerSection.hidden =
          false;

        customerSection.scrollIntoView({
          behavior: "smooth"
        });

      }

    }
  );

}


// ============================================================
// SUBMIT ORDER
// ============================================================

async function submitOrder(event) {

  event.preventDefault();


  if (cart.length === 0) {

    alert(
      "Please select at least one service."
    );

    return;

  }


  const button =
    $("submitOrder");

  const message =
    $("orderMessage");


  if (button) {

    button.disabled = true;

    button.textContent =
      "Saving order...";

  }


  try {

    // --------------------------------------------------------
    // CUSTOMER DETAILS
    // --------------------------------------------------------

    const name =
      $("customerName")?.value.trim();

    const identifier =
      $("customerIdentifier")
        ?.value
        .trim();

    const email =
      $("customerEmail")
        ?.value
        .trim();


    if (!name) {

      throw new Error(
        "Please enter your full name."
      );

    }


    if (!identifier) {

      throw new Error(
        "Please enter your phone number or email."
      );

    }


    // --------------------------------------------------------
    // DETERMINE PHONE / EMAIL
    // --------------------------------------------------------

    const isEmail =
      identifier.includes("@");


    const phone =
      isEmail
        ? ""
        : identifier;


    const customerEmail =
      email ||
      (isEmail ? identifier : "");


    const normalizedIdentifier =
      identifier
        .toLowerCase()
        .trim();


    // --------------------------------------------------------
    // CLIENT ID
    // --------------------------------------------------------

    const clientId =
      normalizedIdentifier
        .replace(
          /[^a-z0-9]/g,
          "_"
        );


    // --------------------------------------------------------
    // SAVE CLIENT
    // --------------------------------------------------------

    await addDoc(
      collection(db, "clients"),
      {

        name,

        phone,

        email:
          customerEmail,

        identifier:
          normalizedIdentifier,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      }
    );


    // --------------------------------------------------------
    // ORDER ITEMS
    // --------------------------------------------------------

    const orderItems =
      cart.map((item) => ({

        priceId:
          item.id,

        service:
          item.service,

        package:
          item.package,

        ownership:
          item.ownership,

        unitPrice:
          item.price,

        quantity:
          item.quantity

      }));


    // --------------------------------------------------------
    // TOTAL
    // --------------------------------------------------------

    const total =
      cart.reduce(
        (sum, item) =>
          sum +
          item.price *
          item.quantity,
        0
      );


    // --------------------------------------------------------
    // CREATE ORDER
    // --------------------------------------------------------

    const orderRef =
      await addDoc(
        collection(db, "orders"),
        {

          clientId,

          customer: {

            name,

            phone,

            email:
              customerEmail,

            identifier:
              normalizedIdentifier

          },

          items:
            orderItems,

          total,

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
      "Order submission error:",
      error
    );


    if (message) {

      message.textContent =
        error.message ||
        "Unable to save your order.";

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

    loadPriceList();

    setupCartButton();

    setupCheckout();


    const form =
      $("orderForm");

    if (form) {

      form.addEventListener(
        "submit",
        submitOrder
      );

    }

  }
);
