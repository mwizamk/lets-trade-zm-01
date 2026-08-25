// ============================================================
// LET'S TRADE ZM
// Signup / PriceList / Cart / Order
// ============================================================

import {
  db
} from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  setDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ============================================================
// HELPERS
// ============================================================

const $ = (id) =>
  document.getElementById(id);


const money = (amount) =>
  `K${Number(amount || 0).toFixed(2)}`;


const safe = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]
  );


const isEmail = value =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);


const normalize =
  value => value.trim().toLowerCase();


// ============================================================
// CART
// ============================================================

let cart = [];

try {

  cart =
    JSON.parse(
      localStorage.getItem("ltz_cart") || "[]"
    );

} catch {

  cart = [];

}


function saveCart() {

  localStorage.setItem(
    "ltz_cart",
    JSON.stringify(cart)
  );

}


function totalCart() {

  return cart.reduce(
    (total, item) =>
      total +
      Number(item.price || 0),

    0
  );

}


// ============================================================
// FIREBASE PRICE LIST
// ============================================================

async function loadPriceList() {

  const container =
    $("priceList");

  const status =
    $("firebaseStatus");


  try {

    const priceQuery =
      query(
        collection(db, "pricelist"),
        where("status", "==", "active")
      );


    const snapshot =
      await getDocs(priceQuery);


    const products =
      snapshot.docs
        .map(document => ({
          firestoreId: document.id,
          ...document.data()
        }))
        .sort(
          (a, b) =>
            Number(a.id || 0) -
            Number(b.id || 0)
        );


    if (!products.length) {

      container.innerHTML =
        `<p class="empty">
          No services are currently available.
        </p>`;

      status.textContent =
        "No active services found.";

      return;

    }


    container.innerHTML =
      products.map(product => `

        <article class="price-card">

          <div class="price-top">

            <span>
              ${safe(product.ownership)}
            </span>

            <span>
              ${safe(product.duration)}
            </span>

          </div>


          <h3>
            ${safe(product.service)}
          </h3>


          <p>
            ${safe(product.package)}
          </p>


          <div class="price">
            ${money(product.price)}
          </div>


          <p class="description">
            ${safe(product.description)}
          </p>


          <button
            type="button"
            class="card-btn add-service"
            data-id="${safe(product.firestoreId)}"
          >
            Select
          </button>

        </article>

      `).join("");


    container
      .querySelectorAll(".add-service")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            const product =
              products.find(
                item =>
                  item.firestoreId ===
                  button.dataset.id
              );


            if (!product) return;


            addToCart(
              product
            );


            button.textContent =
              "Selected ✓";

          }
        );

      });


    status.textContent =
      `${products.length} services available.`;

  } catch (error) {

    console.error(
      "PriceList error:",
      error
    );


    status.textContent =
      "Unable to load the PriceList from Firebase.";

    container.innerHTML =
      `<p class="empty">
        Unable to load services.
        Please try again.
      </p>`;

  }

}


// ============================================================
// ADD TO CART
// ============================================================

function addToCart(product) {

  const exists =
    cart.some(
      item =>
        item.priceId ===
        product.firestoreId
    );


  if (exists) {

    return;

  }


  cart.push({

    priceId:
      product.firestoreId,

    productId:
      product.id,

    ownership:
      product.ownership,

    service:
      product.service,

    package:
      product.package,

    price:
      Number(product.price),

    duration:
      product.duration,

    description:
      product.description || "",

    quantity:
      1

  });


  saveCart();

  renderCart();

}


// ============================================================
// RENDER CART
// ============================================================

function renderCart() {

  const section =
    $("cartSection");

  const container =
    $("cartItems");

  const count =
    $("cartCount");

  const total =
    $("cartTotal");


  count.textContent =
    cart.length;


  total.textContent =
    money(totalCart());


  if (!cart.length) {

    section.hidden = true;

    container.innerHTML = "";

    return;

  }


  section.hidden = false;


  container.innerHTML =
    cart.map((item, index) => `

      <article class="cart-item">

        <div>

          <h3>
            ${safe(item.service)}
            —
            ${safe(item.package)}
          </h3>

          <p>
            ${safe(item.ownership)}
            ·
            ${safe(item.duration)}
          </p>

        </div>


        <div>

          <strong>
            ${money(item.price)}
          </strong>


          <button
            type="button"
            class="remove"
            data-index="${index}"
          >
            Remove
          </button>

        </div>

      </article>

    `).join("");


  container
    .querySelectorAll(".remove")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          cart.splice(
            Number(button.dataset.index),
            1
          );

          saveCart();

          renderCart();

        }
      );

    });

}


// ============================================================
// CHECKOUT
// ============================================================

$("checkoutButton")
  .addEventListener(
    "click",
    () => {

      if (!cart.length) {

        return;

      }


      $("customerSection").hidden =
        false;


      $("customerSection")
        .scrollIntoView({
          behavior: "smooth"
        });

    }
  );


// ============================================================
// CREATE CLIENT ID
// ============================================================

function clientIdFor(
  identifier
) {

  const value =
    normalize(identifier);


  if (isEmail(value)) {

    return (
      "email_" +
      value.replace(
        /[^a-z0-9]/g,
        "_"
      )
    );

  }


  return (
    "phone_" +
    value.replace(
      /[^a-z0-9]/g,
      ""
    )
  );

}


// ============================================================
// SUBMIT ORDER
// ============================================================

$("orderForm")
  .addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const name =
        $("customerName")
          .value
          .trim();


      const identifier =
        normalize(
          $("customerIdentifier")
            .value
        );


      const email =
        $("customerEmail")
          .value
          .trim();


      const message =
        $("orderMessage");


      const button =
        $("submitOrder");


      if (!cart.length) {

        message.textContent =
          "Please select at least one service.";

        return;

      }


      if (!name || !identifier) {

        message.textContent =
          "Please enter your name and phone number or email.";

        return;

      }


      if (
        identifier.includes("@") &&
        !isEmail(identifier)
      ) {

        message.textContent =
          "Please enter a valid email address.";

        return;

      }


      button.disabled = true;

      button.textContent =
        "Creating order...";


      try {

        const clientId =
          clientIdFor(
            identifier
          );


        const customerEmail =
          isEmail(identifier)
            ? identifier
            : email;


        const phone =
          isEmail(identifier)
            ? ""
            : identifier.replace(
                /\s+/g,
                ""
              );


        // ----------------------------------------------------
        // CUSTOMER
        // ----------------------------------------------------

        await setDoc(
          doc(
            db,
            "clients",
            clientId
          ),
          {

            name,

            phone,

            email:
              customerEmail,

            identifier,

            updatedAt:
              serverTimestamp(),

            createdAt:
              serverTimestamp()

          },
          {
            merge: true
          }
        );


        // ----------------------------------------------------
        // ORDER
        // ----------------------------------------------------

        const order =
          await addDoc(
            collection(
              db,
              "orders"
            ),
            {

              clientId,

              customer: {

                name,

                phone,

                email:
                  customerEmail,

                identifier

              },


              items:
                cart.map(
                  item => ({

                    priceId:
                      item.priceId,

                    service:
                      item.service,

                    package:
                      item.package,

                    ownership:
                      item.ownership,

                    price:
                      item.price,

                    duration:
                      item.duration,

                    quantity:
                      1

                  })
                ),


              total:
                totalCart(),


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


        // ----------------------------------------------------
        // CLEAR CART
        // ----------------------------------------------------

        cart = [];

        saveCart();


        // ----------------------------------------------------
        // NEXT STEP
        // ----------------------------------------------------

        message.textContent =
          "Order created successfully.";


        button.textContent =
          "Order created ✓";


        // Temporary destination.
        // We will replace this with the real payment
        // workflow in the next stage.

        setTimeout(
          () => {

            window.location.href =
              `index.html?order=${encodeURIComponent(order.id)}`;

          },
          1000
        );


      } catch (error) {

        console.error(
          "Order creation error:",
          error
        );


        message.textContent =
          "Unable to create your order: " +
          error.message;


        button.disabled = false;

        button.textContent =
          "Continue to payment →";

      }

    }
  );


// ============================================================
// START
// ============================================================

renderCart();

loadPriceList();
