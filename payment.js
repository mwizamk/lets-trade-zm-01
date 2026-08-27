<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Payment | Let's Trade ZM</title>

  <link rel="stylesheet" href="css/style.css">

  <style>
    .payment-page {
      min-height: calc(100vh - 140px);
      padding: 40px 20px;
    }

    .payment-container {
      max-width: 650px;
      margin: 0 auto;
    }

    .payment-card {
      background: #fff;
      border-radius: 14px;
      padding: 28px;
      box-shadow: 0 4px 20px rgba(0,0,0,.08);
    }

    .payment-header {
      text-align: center;
      margin-bottom: 25px;
    }

    .payment-header h1 {
      margin-bottom: 8px;
    }

    .payment-header p {
      margin: 0;
      opacity: .75;
    }

    .order-summary {
      padding: 18px;
      margin-bottom: 25px;
      border-radius: 10px;
      background: #f5f5f5;
    }

    .order-row {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      padding: 8px 0;
    }

    .order-row.total {
      margin-top: 10px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      font-size: 1.15rem;
      font-weight: 700;
    }

    .payment-methods {
      display: grid;
      gap: 12px;
      margin-bottom: 25px;
    }

    .payment-method {
      border: 1px solid #ddd;
      border-radius: 10px;
      padding: 15px;
      cursor: pointer;
    }

    .payment-method:hover {
      border-color: #333;
    }

    .payment-method input {
      margin-right: 8px;
    }

    .payment-details {
      padding: 18px;
      margin-bottom: 20px;
      border-radius: 10px;
      background: #fafafa;
    }

    .payment-details h3 {
      margin-top: 0;
    }

    .form-group {
      margin-bottom: 18px;
    }

    .form-group label {
      display: block;
      margin-bottom: 7px;
      font-weight: 600;
    }

    .form-group input,
    .form-group textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 12px;
      border: 1px solid #ccc;
      border-radius: 8px;
      font-size: 16px;
    }

    .form-group textarea {
      min-height: 90px;
      resize: vertical;
    }

    .payment-message {
      margin: 15px 0;
      padding: 12px;
      border-radius: 8px;
      display: none;
    }

    .payment-message.show {
      display: block;
    }

    .primary-button {
      width: 100%;
      padding: 14px;
      border: 0;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 700;
    }

    .primary-button:disabled {
      opacity: .6;
      cursor: not-allowed;
    }

    .back-link {
      display: block;
      text-align: center;
      margin-top: 20px;
    }

    .loading {
      text-align: center;
      padding: 20px;
    }
  </style>
</head>

<body>

  <header class="site-header">
    <div class="container header-inner">

      <a href="index.html" class="logo">
        Let's Trade ZM
      </a>

      <nav>
        <a href="index.html">PriceList</a>
        <a href="login.html">Sign In</a>
        <a href="admin-login.html">Admin</a>
      </nav>

    </div>
  </header>


  <main class="payment-page">

    <div class="payment-container">

      <div class="payment-card">

        <div class="payment-header">
          <h1>Complete Your Payment</h1>
          <p>Review your order and submit your payment details.</p>
        </div>


        <!-- ORDER SUMMARY -->
        <section class="order-summary">

          <div class="order-row">
            <span>Service</span>
            <strong id="serviceName">Loading...</strong>
          </div>

          <div class="order-row">
            <span>Plan</span>
            <strong id="planName">Loading...</strong>
          </div>

          <div class="order-row total">
            <span>Total</span>
            <strong id="orderTotal">K0</strong>
          </div>

        </section>


        <!-- PAYMENT FORM -->
        <form id="paymentForm">

          <h2>Payment Method</h2>

          <div class="payment-methods">

            <label class="payment-method">
              <input
                type="radio"
                name="paymentMethod"
                value="Airtel Money"
                required
              >
              <strong>Airtel Money</strong>
            </label>

            <label class="payment-method">
              <input
                type="radio"
                name="paymentMethod"
                value="MTN Money"
              >
              <strong>MTN Money</strong>
            </label>

            <label class="payment-method">
              <input
                type="radio"
                name="paymentMethod"
                value="Bank Transfer"
              >
              <strong>Bank Transfer</strong>
            </label>

          </div>


          <!-- PAYMENT DETAILS -->
          <div class="payment-details">

            <h3>Payment Information</h3>

            <div class="form-group">

              <label for="payerPhone">
                Phone Number Used for Payment
              </label>

              <input
                type="tel"
                id="payerPhone"
                name="payerPhone"
                placeholder="e.g. 0971234567"
                required
              >

            </div>


            <div class="form-group">

              <label for="transactionReference">
                Transaction / Payment Reference
              </label>

              <input
                type="text"
                id="transactionReference"
                name="transactionReference"
                placeholder="Enter transaction reference"
                required
              >

            </div>


            <div class="form-group">

              <label for="paymentNote">
                Additional Note (Optional)
              </label>

              <textarea
                id="paymentNote"
                name="paymentNote"
                placeholder="Anything we should know about your payment?"
              ></textarea>

            </div>

          </div>


          <!-- STATUS MESSAGE -->
          <div
            id="paymentMessage"
            class="payment-message"
            role="alert"
            aria-live="polite"
          ></div>


          <button
            type="submit"
            id="submitPaymentButton"
            class="primary-button"
          >
            Submit Payment
          </button>

        </form>


        <a href="index.html" class="back-link">
          ← Back to PriceList
        </a>

      </div>

    </div>

  </main>


  <footer class="site-footer">

    <p>
      © 2026 Let's Trade ZM. All rights reserved.
    </p>

  </footer>


  <!-- IMPORTANT:
       Keep payment.js as a module because it communicates
       with Firebase/Firestore.
  -->
  <script type="module" src="js/payment.js"></script>

</body>
</html>
