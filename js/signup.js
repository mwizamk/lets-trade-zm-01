let currentStep = 1;

/*
  MULTIPLE PRODUCT CART
*/
let cart = [];

const signupState = {
  products: [],
  customer: {},
  payment: null
};


/*
  START
*/
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  setupFilters();
  setupNavigation();
  setupURLProduct();
  renderSelectionCart();
});


/*
  RENDER PRODUCTS
*/
function renderProducts(filter = "all") {

  const container = document.getElementById("signupProducts");

  if (!container) return;

  let products = Array.isArray(PRICE_LIST)
    ? PRICE_LIST.filter(p => p.status === "active")
    : [];

  if (filter !== "all") {
    products = products.filter(
      p => String(p.ownership).toLowerCase() === filter
    );
  }

  container.innerHTML = products.map(product => {

    const isSelected = cart.some(
      item => Number(item.id) === Number(product.id)
    );

    return `
      <button
        class="product-card ${isSelected ? "selected" : ""}"
        data-id="${product.id}"
        type="button"
      >

        <div class="product-top">
          <span>${product.ownership}</span>
          <span>${product.duration}</span>
        </div>

        <h3>${product.service}</h3>

        <p>${product.package}</p>

        <strong>K${product.price}</strong>

        <span class="cart-button-text">
          ${isSelected ? "✓ Added to Cart" : "＋ Add to Cart"}
        </span>

      </button>
    `;

  }).join("");


  /*
    PRODUCT CLICK
  */
  document
    .querySelectorAll(".product-card")
    .forEach(card => {

      card.addEventListener("click", () => {

        const id = Number(card.dataset.id);

        toggleProduct(id);

      });

    });
}


/*
  ADD / REMOVE PRODUCT
*/
function toggleProduct(id) {

  const existingIndex = cart.findIndex(
    item => Number(item.id) === Number(id)
  );


  /*
    REMOVE IF ALREADY IN CART
  */
  if (existingIndex !== -1) {

    cart.splice(existingIndex, 1);

  }

  /*
    OTHERWISE ADD IT
  */
  else {

    const product = PRICE_LIST.find(
      p => Number(p.id) === Number(id)
    );

    if (!product) return;

    cart.push({
      ...product
    });

  }


  signupState.products = [...cart];

  renderProducts(
    document.querySelector(".filter.active")?.dataset.filter || "all"
  );

  renderSelectionCart();

  updateServiceButton();
}


/*
  UPDATE CONTINUE BUTTON
*/
function updateServiceButton() {

  const button = document.getElementById("serviceNext");

  if (!button) return;

  button.disabled = cart.length === 0;

  if (cart.length > 0) {

    button.textContent =
      `Continue (${cart.length} ${cart.length === 1 ? "item" : "items"})`;

  }

  else {

    button.textContent = "Continue";

  }
}


/*
  CART TOTAL
*/
function getCartTotal() {

  return cart.reduce(
    (total, product) =>
      total + Number(product.price || 0),
    0
  );

}


/*
  STEP 1 CART PREVIEW
*/
function renderSelectionCart() {

  const container = document.getElementById("selectionCart");

  if (!container) return;


  if (cart.length === 0) {

    container.innerHTML = "";

    return;

  }


  container.innerHTML = `

    <div class="cart-card">

      <div>

        <span class="cart-label">
          YOUR CART
        </span>

        <h2>
          ${cart.length}
          ${cart.length === 1 ? "service" : "services"} selected
        </h2>

        <p>
          Total: <strong>K${getCartTotal()}</strong>
        </p>

      </div>

      <div class="cart-price">

        <strong>
          K${getCartTotal()}
        </strong>

      </div>

    </div>

  `;

}


/*
  FILTERS
*/
function setupFilters() {

  document
    .querySelectorAll(".filter")
    .forEach(button => {

      button.addEventListener("click", () => {

        document
          .querySelectorAll(".filter")
          .forEach(item =>
            item.classList.remove("active")
          );

        button.classList.add("active");

        renderProducts(button.dataset.filter);

      });

    });

}


/*
  NAVIGATION
*/
function setupNavigation() {

  /*
    STEP 1 -> STEP 2
  */
  document
    .getElementById("serviceNext")
    ?.addEventListener("click", () => {

      if (cart.length === 0) return;

      signupState.products = [...cart];

      goToStep(2);

    });


  /*
    NEXT BUTTONS
  */
  document
    .querySelectorAll("[data-next]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const nextStep =
          Number(button.dataset.next);

        /*
          Don't allow empty cart
        */
        if (nextStep === 3 && cart.length === 0) {

          alert("Please add at least one service to your cart.");

          goToStep(1);

          return;

        }

        goToStep(nextStep);

      });

    });


  /*
    BACK BUTTONS
  */
  document
    .querySelectorAll("[data-back]")
    .forEach(button => {

      button.addEventListener("click", () => {

        goToStep(
          Number(button.dataset.back)
        );

      });

    });


  /*
    CUSTOMER DETAILS
  */
  document
    .getElementById("detailsNext")
    ?.addEventListener(
      "click",
      validateCustomer
    );


  /*
    SUBMIT
  */
  document
    .getElementById("submitOrder")
    ?.addEventListener(
      "click",
      submitOrder
    );

}


/*
  CHANGE STEP
*/
function goToStep(step) {

  /*
    Cart
  */
  if (step === 2) {

    renderCart();

  }


  /*
    Payment summary
  */
  if (step === 4) {

    renderPaymentSummary();

  }


  document
    .querySelectorAll(".form-step")
    .forEach(section =>
      section.classList.remove("active")
    );


  document
    .querySelector(
      `.form-step[data-step="${step}"]`
    )
    ?.classList.add("active");


  currentStep = step;

  updateProgress();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/*
  PROGRESS BAR
*/
function updateProgress() {

  const progress =
    document.getElementById("progressBar");

  if (progress) {

    progress.style.width =
      `${((currentStep - 1) / 4) * 100}%`;

  }


  document
    .querySelectorAll(".progress-step")
    .forEach((step, index) => {

      step.classList.toggle(
        "active",
        index < currentStep
      );

    });

}


/*
  FULL CART - STEP 2
*/
function renderCart() {

  const container =
    document.getElementById("cartContainer");

  if (!container) return;


  if (cart.length === 0) {

    container.innerHTML = `

      <div class="cart-card">

        <h2>Your cart is empty</h2>

        <p>
          Please go back and select a service.
        </p>

      </div>

    `;

    return;

  }


  const items = cart.map(product => `

    <div
      class="cart-card"
      data-cart-id="${product.id}"
    >

      <div>

        <span class="cart-label">
          SELECTED SERVICE
        </span>

        <h2>
          ${product.service}
        </h2>

        <p>
          ${product.package}
          ·
          ${product.ownership}
        </p>

      </div>


      <div class="cart-price">

        <span>
          ${product.duration}
        </span>

        <strong>
          K${product.price}
        </strong>

        <button
          type="button"
          class="remove-cart-item"
          data-remove-id="${product.id}"
        >
          Remove
        </button>

      </div>

    </div>

  `).join("");


  container.innerHTML = `

    ${items}

    <div class="total-card">

      <span>
        Total
      </span>

      <strong>
        K${getCartTotal()}
      </strong>

    </div>

  `;


  /*
    REMOVE BUTTONS
  */
  container
    .querySelectorAll(".remove-cart-item")
    .forEach(button => {

      button.addEventListener("click", () => {

        const id =
          Number(button.dataset.removeId);

        removeFromCart(id);

      });

    });

}


/*
  REMOVE FROM CART
*/
function removeFromCart(id) {

  cart = cart.filter(
    product =>
      Number(product.id) !== Number(id)
  );


  signupState.products = [...cart];


  renderCart();

  renderProducts(
    document.querySelector(".filter.active")?.dataset.filter || "all"
  );

  renderSelectionCart();

  updateServiceButton();


  /*
    If cart becomes empty,
    return customer to Step 1
  */
  if (cart.length === 0) {

    goToStep(1);

  }

}


/*
  CUSTOMER VALIDATION
*/
function validateCustomer() {

  const form =
    document.getElementById("customerForm");


  if (!form.checkValidity()) {

    form.reportValidity();

    return;

  }


  signupState.customer = {

    name:
      document
        .getElementById("customerName")
        .value
        .trim(),

    phone:
      document
        .getElementById("customerPhone")
        .value
        .trim(),

    email:
      document
        .getElementById("customerEmail")
        .value
        .trim()

  };


  goToStep(4);

}


/*
  PAYMENT SUMMARY
*/
function renderPaymentSummary() {

  const container =
    document.getElementById("paymentSummary");

  if (!container) return;


  const productsHTML =
    cart.map(product => `

      <div>

        <span>
          ${product.service}
          -
          ${product.package}
        </span>

        <strong>
          K${product.price}
        </strong>

      </div>

    `).join("");


  container.innerHTML = `

    <div class="payment-summary">

      <div>
        <span>Selected services</span>
        <strong>${cart.length}</strong>
      </div>

      ${productsHTML}

      <div>
        <span>Customer</span>
        <strong>
          ${signupState.customer.name}
        </strong>
      </div>

      <div class="summary-total">

        <span>Total</span>

        <strong>
          K${getCartTotal()}
        </strong>

      </div>

    </div>

  `;

}


/*
  SUBMIT ORDER
*/
function submitOrder() {

  if (cart.length === 0) {

    alert(
      "Your cart is empty. Please select at least one service."
    );

    goToStep(1);

    return;

  }


  const payment =
    document.querySelector(
      'input[name="payment"]:checked'
    );


  signupState.payment =
    payment?.value || "mobile_money";


  /*
    Generate customer code
  */
  const code =
    Math.floor(
      1000 + Math.random() * 9000
    ).toString();


  /*
    MULTI-PRODUCT ORDER
  */
  const order = {

    orderId:
      "LTZ-" + Date.now(),

    products:
      cart.map(product => ({
        id: product.id,
        service: product.service,
        package: product.package,
        ownership: product.ownership,
        price: Number(product.price),
        duration: product.duration
      })),

    total:
      getCartTotal(),

    customer:
      signupState.customer,

    payment:
      signupState.payment,

    customerCode:
      code,

    status:
      "pending",

    createdAt:
      new Date().toISOString()

  };


  /*
    Keep the latest order
  */
  localStorage.setItem(
    "latestOrder",
    JSON.stringify(order)
  );


  localStorage.setItem(
    "customerCode",
    code
  );


  /*
    Display code
  */
  const generatedCode =
    document.getElementById("generatedCode");

  if (generatedCode) {

    generatedCode.textContent = code;

  }


  /*
    Go to success page
  */
  goToStep(5);

}


/*
  URL PRODUCT SUPPORT
  Example:
  signup.html?product=1
*/
function setupURLProduct() {

  const id =
    Number(
      new URLSearchParams(location.search)
        .get("product")
    );


  if (!id) return;


  const product =
    PRICE_LIST.find(
      p => Number(p.id) === id
    );


  if (!product) return;


  /*
    Automatically add URL product
    to the cart instead of replacing it.
  */
  if (
    !cart.some(
      item => Number(item.id) === id
    )
  ) {

    cart.push({
      ...product
    });

  }


  signupState.products = [...cart];


  renderProducts(
    document.querySelector(".filter.active")?.dataset.filter || "all"
  );

  renderSelectionCart();

  updateServiceButton();

}
