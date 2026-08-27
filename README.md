# Let's Trade ZM

## Independent Subscription Service Platform

Let's Trade ZM is a mobile-first subscription service platform designed for customers to browse available services, select multiple subscriptions, submit an order, make a payment, and later manage their active subscriptions.

The project uses:

- GitHub Pages for static web hosting
- HTML
- CSS
- JavaScript ES modules
- Firebase Authentication
- Cloud Firestore
- Firebase Security Rules

No traditional backend server is required for the initial implementation.

---

# 1. Project Goal

The application provides a simple customer journey:

Choose
↓
Select services
↓
Review basket
↓
Submit customer details
↓
Submit payment details
↓
Admin verifies payment
↓
Admin assigns an available account
↓
Subscription becomes active
↓
Customer accesses dashboard

The main priority is a fast, simple and mobile-friendly customer experience.

---

# 2. Frontend Principle

The existing Let's Trade ZM reference website is the frontend foundation.

The existing UI should not be replaced unnecessarily.

The project should preserve:

- Existing landing page
- Existing PriceList design
- Existing service cards
- Existing multiple-service selection experience
- Existing signup experience
- Existing visual design
- Existing mobile layout

Firebase is being added to provide dynamic data and backend functionality.

---

# 3. Hosting

The website is hosted using GitHub Pages.

GitHub Pages publishes static HTML, CSS and JavaScript files from a GitHub repository.

Repository:

https://github.com/mwizamk/lets-trade-zm-static-github

---

# 4. Firebase Project

Firebase project:

lets-trade-zm-488d9

Firebase is used for:

- Firestore database
- Authentication
- Customer identity
- Subscription records
- PriceList records
- Orders
- Payments
- Accounts
- Admin authorization

Firebase Web configuration is stored in:

js/firebase.js

The Firebase Web API key is not treated as a secret.

Security must be enforced using Firebase Authentication and Firestore Security Rules.

---

# 5. Technology Architecture

Customer Browser
        |
        v
GitHub Pages
        |
        +---- HTML
        |
        +---- CSS
        |
        +---- JavaScript
        |
        v
Firebase Web SDK
        |
        +---- Firebase Authentication
        |
        +---- Cloud Firestore
        |
        v
Firebase Security Rules

There is no Firebase Admin SDK service-account credential in this repository.

---

# 6. Repository Structure

Recommended structure:

/
│
├── index.html
├── signup.html
├── dashboard.html
├── admin.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── app.js
│   ├── signup.js
│   ├── dashboard.js
│   ├── admin.js
│   ├── firebase.js
│   └── pricelist.js
│
├── firestore.rules
├── firebase.json
└── README.md

Files may be added as the project grows.

Existing reference-site files should be preserved unless there is a clear reason to change them.

---

# 7. Customer Pages

## index.html

Main landing page.

Responsibilities:

- Explain Let's Trade ZM
- Display navigation
- Display PriceList preview
- Provide Get Started button
- Provide PriceList access
- Explain the subscription process

---

## signup.html

Customer selection and checkout page.

Responsibilities:

- Receive selected PriceList service
- Allow multiple services
- Display selected services
- Calculate total
- Collect customer information
- Create customer record
- Create order

---

## dashboard.html

Customer subscription dashboard.

Responsibilities:

- Authenticate customer
- Identify authenticated Firebase user
- Retrieve only subscriptions belonging to the authenticated customer
- Display active subscriptions
- Display subscription expiry
- Display account assignment status

---

## admin.html

Administration portal.

Responsibilities:

- Manage PriceList
- Review orders
- Review payments
- Manage customers
- Create subscriptions
- Manage available accounts
- Assign accounts
- Activate subscriptions

Admin access must be protected using Firebase Authentication and Firestore Security Rules.

---

# 8. JavaScript Structure

## firebase.js

Central Firebase initialization.

Exports:

- app
- db
- auth

All application JavaScript should use this Firebase instance.

---

## app.js

Controls the public landing page and PriceList.

Responsibilities:

- Read active PriceList records
- Render service cards
- Preserve existing PriceList UI
- Link selected services to signup

The public PriceList must not create or modify PriceList records.

---

## signup.js

Controls customer signup and order creation.

Responsibilities:

- Read selected products
- Maintain selected services
- Calculate total
- Collect customer details
- Create/update customer record
- Create order
- Redirect to payment flow

---

## dashboard.js

Controls customer dashboard.

Responsibilities:

- Authenticate customer
- Retrieve subscriptions using authenticated Firebase UID
- Display active subscriptions
- Display expiry dates
- Display assigned account status

The dashboard must never download all customer subscriptions and filter them in JavaScript.

---

## admin.js

Controls the administration portal.

Responsibilities:

- PriceList CRUD
- Order management
- Payment review
- Customer records
- Subscription creation
- Account management
- Account assignment

Account assignment must use a Firestore transaction so that two administrators cannot assign the same available account simultaneously.

---

# 9. Firestore Collections

The application uses these main collections:

pricelist
clients
orders
payments
subscriptions
accounts
admins

---

# 10. PriceList

Collection:

pricelist

Fields:

service
package
ownership
price
duration
durationDays
description
status
createdAt
updatedAt

Example:

{
  "service": "Netflix",
  "package": "Standard",
  "ownership": "shared",
  "price": 65,
  "duration": "30 days",
  "durationDays": 30,
  "description": "Netflix Standard subscription",
  "status": "active"
}

Only active PriceList records appear to customers.

Administrators can:

- Create
- Edit
- Activate
- Deactivate
- Delete

PriceList items.

---

# 11. Customers

Collection:

clients

Fields:

name
phone
email
customerUid
createdAt
updatedAt

A customer may be identified using:

- Phone number
- Email address

The identifier is not itself sufficient authorization.

Firebase Authentication provides the actual authenticated identity.

---

# 12. Orders

Collection:

orders

An order contains all services selected during one checkout.

Example:

{
  "orderNumber": "LTZ-20260825-001",
  "clientId": "phone_26097XXXXXXX",
  "items": [
    {
      "priceId": "netflix_standard",
      "service": "Netflix",
      "package": "Standard",
      "price": 65
    },
    {
      "priceId": "spotify",
      "service": "Spotify",
      "package": "Premium",
      "price": 65
    }
  ],
  "total": 130,
  "paymentStatus": "pending",
  "orderStatus": "pending"
}

---

# 13. Payments

Collection:

payments

Fields:

orderId
method
amount
reference
status
createdAt
reviewedAt

Payment statuses:

pending
approved
rejected

Admin verifies payment before fulfillment.

---

# 14. Subscriptions

Collection:

subscriptions

Fields:

orderId
clientId
customerUid
service
package
accountId
accountLabel
startDate
expiryDate
status
createdAt
updatedAt

Subscription statuses:

pending
active
pending_expiry
expired

---

# 15. Accounts

Collection:

accounts

Fields:

service
package
accountLabel
status
subscriptionId
assignedAt
createdAt
updatedAt

Account statuses:

available
assigned
disabled

The customer should not receive unrestricted access to internal account records.

Account credentials must not be exposed through public Firestore queries.

---

# 16. Admins

Collection:

admins

Document ID:

Firebase Authentication UID

Example:

{
  "role": "admin",
  "active": true
}

An administrator is authorized when:

- Firebase Authentication confirms identity
- The authenticated UID has an active document in admins

---

# 17. Customer Workflow

1. Customer opens the website.
2. Customer views active PriceList services.
3. Customer selects a service.
4. Customer can continue selecting additional services.
5. Selected services are maintained as one basket.
6. Customer reviews total.
7. Customer enters name.
8. Customer enters phone number or email.
9. Customer submits order.
10. Order is saved in Firestore.
11. Customer submits payment details.
12. Payment is saved in Firestore.
13. Administrator reviews payment.
14. Administrator approves or rejects payment.
15. Approved order becomes ready for fulfillment.
16. Administrator creates subscription.
17. Administrator assigns an available account.
18. Subscription becomes active.
19. Customer authenticates.
20. Customer opens dashboard.
21. Dashboard displays the customer's subscriptions.

---

# 18. Account Assignment Workflow

Payment approved
        ↓
Order ready
        ↓
Admin creates subscription
        ↓
Admin selects subscription
        ↓
Admin selects available account
        ↓
Firestore transaction
        ↓
Account marked assigned
        ↓
Subscription receives accountId
        ↓
Subscription becomes active

Account assignment must be transactional.

An account must never be assigned to two subscriptions.

---

# 19. Customer Authentication

The application should support:

- Phone authentication
- Email authentication

The customer's phone number or email is used as the human-friendly identifier.

Firebase Authentication provides the authenticated UID.

Subscriptions are linked using:

customerUid

The dashboard queries:

subscriptions

where:

customerUid == authenticated user's UID

---

# 20. Security

Firebase Authentication and Firestore Security Rules are mandatory before production launch.

The frontend must never be trusted to enforce authorization.

Examples:

Customers:

- Can read their own subscription records
- Cannot modify subscriptions
- Cannot modify PriceList
- Cannot modify accounts
- Cannot modify payments

Administrators:

- Can manage PriceList
- Can review orders
- Can review payments
- Can create subscriptions
- Can manage accounts
- Can assign accounts

---

# 21. Firebase Security Rules

Security rules should be stored in:

firestore.rules

The Firebase Console can also be used during development.

Rules should be tested before production.

Never use:

allow read, write: if true;

for production customer data.

---

# 22. Firebase Configuration

Firebase Web configuration belongs in:

js/firebase.js

Example:

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

The Firebase Web API configuration is public client configuration.

Do not put:

- Firebase Admin SDK credentials
- service-account JSON
- private keys
- server secrets

inside the GitHub repository.

---

# 23. GitHub Pages

The application is designed to run directly from GitHub Pages.

All local files should use relative paths.

Example:

./js/firebase.js

not:

/js/firebase.js

This allows the project to work under:

/lets-trade-zm-static-github/

---

# 24. Development Stages

## Stage 1

Preserve existing reference website.

## Stage 2

Organize project files without changing the visual design.

## Stage 3

Connect Firebase.

## Stage 4

Move PriceList from JavaScript into Firestore.

## Stage 5

Connect signup and multi-service orders.

## Stage 6

Connect payment records.

## Stage 7

Create secure Admin Portal.

## Stage 8

Create account assignment workflow.

## Stage 9

Create authenticated customer dashboard.

## Stage 10

Apply production Security Rules, test, and deploy.

---

# 25. Important Development Rule

Do not replace the existing customer interface simply to implement Firebase.

Firebase is the backend/data layer.

The existing reference website remains the frontend foundation.

Only modify the UI when a new feature genuinely requires it.

---

# 26. Current Priority

The immediate implementation priority is:

1. Preserve reference UI.
2. Add firebase.js.
3. Create Firestore database.
4. Create PriceList collection through admin/data setup.
5. Connect existing PriceList to Firestore.
6. Preserve multiple-service selection.
7. Preserve signup flow.
8. Store orders.
9. Build payment verification.
10. Build admin portal.
11. Build account assignment.
12. Build customer authentication.
13. Build dashboard.
14. Secure Firestore.
15. Deploy.

---

# 27. Production Principle

The application should remain:

- Fast
- Mobile-first
- Simple
- Professional
- Easy to maintain
- Firebase-backed
- GitHub Pages compatible

The customer should not need to understand Firebase.

The customer experience should remain:

Choose
→
Submit
→
Activate
→
Manage

---

# 28. Do Not Add Yet

The following should not be added unless specifically required:

- Node.js backend
- Flask backend
- Express server
- MySQL
- Supabase
- Firebase Admin SDK
- Service account credentials
- Firebase Storage
- Screenshot upload system
- Complex build system
- npm dependency management

The initial system is intentionally browser-native and serverless.

---

# 29. Final Architecture

Customer

    ↓

GitHub Pages

    ↓

HTML / CSS / JavaScript

    ↓

Firebase Web SDK

    ↓

Firebase Authentication

    ↓

Cloud Firestore

    ↓

Firestore Security Rules

    ↓

PriceList
Orders
Payments
Customers
Subscriptions
Accounts
Admins

---

# 30. Project Status

Current phase:

Reference-site preservation and Firebase integration.

The reference site is the visual source of truth.

Firebase is the data and authorization layer.

Future development should extend the reference site rather than replace it.
