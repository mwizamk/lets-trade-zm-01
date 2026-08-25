// ============================================================
// LET'S TRADE ZM
// FIRESTORE DATABASE SETUP
// ============================================================

import {
  db,
  firebaseProjectId,
  firebaseAppId
} from "./firebase.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ============================================================
// HELPERS
// ============================================================

const $ = (id) => document.getElementById(id);

const setupStatus = $("setupStatus");


// ============================================================
// DISPLAY FIREBASE CONNECTION
// ============================================================

$("projectStatus").innerHTML =
  "✅ Firebase JavaScript SDK loaded successfully.";

$("projectInfo").innerHTML = `
  <p>
    <strong>Project ID:</strong>
    ${firebaseProjectId}
  </p>

  <p>
    <strong>Firebase App ID:</strong>
    ${firebaseAppId}
  </p>
`;


// ============================================================
// DATABASE COLLECTIONS
// ============================================================

const collections = {

  system: {
    documentId: "config",

    data: {
      projectName: "Let's Trade ZM",
      version: "1.0",
      setupComplete: true,
      createdAt: "SERVER_TIMESTAMP",
      updatedAt: "SERVER_TIMESTAMP"
    }
  },


  pricelist: {
    documentId: "setup",

    data: {
      service: "Setup Example",
      package: "Example",
      ownership: "shared",
      price: 0,
      duration: 30,
      description: "Initial database setup document.",
      status: "inactive",
      createdAt: "SERVER_TIMESTAMP",
      updatedAt: "SERVER_TIMESTAMP"
    }
  },


  clients: {
    documentId: "setup",

    data: {
      name: "Setup Example",
      phone: "",
      email: "",
      identifier: "",
      createdAt: "SERVER_TIMESTAMP",
      updatedAt: "SERVER_TIMESTAMP"
    }
  },


  orders: {
    documentId: "setup",

    data: {
      orderId: "SETUP",
      clientId: "setup",
      items: [],
      total: 0,
      paymentStatus: "pending",
      orderStatus: "pending",
      createdAt: "SERVER_TIMESTAMP",
      updatedAt: "SERVER_TIMESTAMP"
    }
  },


  payments: {
    documentId: "setup",

    data: {
      orderId: "setup",
      method: "",
      amount: 0,
      reference: "",
      status: "pending",
      createdAt: "SERVER_TIMESTAMP",
      updatedAt: "SERVER_TIMESTAMP"
    }
  },


  subscriptions: {
    documentId: "setup",

    data: {
      orderId: "setup",
      clientId: "setup",
      customerUid: "",
      service: "Setup Example",
      package: "Example",
      startDate: "",
      expiryDate: "",
      status: "pending",
      accountId: "",
      accountLabel: "",
      createdAt: "SERVER_TIMESTAMP",
      updatedAt: "SERVER_TIMESTAMP"
    }
  },


  accounts: {
    documentId: "setup",

    data: {
      service: "Setup Example",
      accountLabel: "Setup Example",
      status: "available",
      subscriptionId: "",
      createdAt: "SERVER_TIMESTAMP",
      updatedAt: "SERVER_TIMESTAMP"
    }
  }

};


// ============================================================
// PREPARE FIRESTORE DATA
// ============================================================

function prepareData(data) {

  const output = {};

  for (const [key, value] of Object.entries(data)) {

    if (value === "SERVER_TIMESTAMP") {
      output[key] = serverTimestamp();
    } else {
      output[key] = value;
    }

  }

  return output;
}


// ============================================================
// CREATE ONE DOCUMENT
// ============================================================

async function createCollectionDocument(
  collectionName,
  documentId,
  data
) {

  const reference =
    doc(
      db,
      collectionName,
      documentId
    );

  await setDoc(
    reference,
    prepareData(data),
    {
      merge: true
    }
  );

  return reference;
}


// ============================================================
// RUN DATABASE SETUP
// ============================================================

async function runSetup() {

  const button = $("setupButton");
  const results = $("results");
  const resultList = $("resultList");

  button.disabled = true;

  setupStatus.textContent =
    "Connecting to Firestore...";

  setupStatus.style.color = "";

  results.style.display = "block";

  resultList.innerHTML = "";


  try {

    const collectionNames =
      Object.keys(collections);


    for (const collectionName of collectionNames) {

      const configuration =
        collections[collectionName];


      await createCollectionDocument(
        collectionName,
        configuration.documentId,
        configuration.data
      );


      resultList.innerHTML += `
        <p>
          ✅
          <strong>${collectionName}</strong>
          collection created/updated.
        </p>
      `;

    }


    setupStatus.textContent =
      "✅ Database setup completed successfully.";

    setupStatus.style.color = "green";


    resultList.innerHTML += `
      <hr>

      <p>
        <strong>Firebase project:</strong>
        ${firebaseProjectId}
      </p>

      <p>
        Your Firestore structure is now ready.
      </p>
    `;


  } catch (error) {

    console.error(
      "Firestore setup error:",
      error
    );


    setupStatus.textContent =
      "❌ Database setup failed.";

    setupStatus.style.color = "red";


    resultList.innerHTML += `
      <hr>

      <p>
        <strong>Error:</strong>
        ${error.message}
      </p>

      <p>
        Check your Firestore database and security rules.
      </p>
    `;


    button.disabled = false;

  }

}


// ============================================================
// BUTTON
// ============================================================

$("setupButton")
  .addEventListener(
    "click",
    runSetup
  );
