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

const status = $("setupStatus");


// ============================================================
// SHOW FIREBASE PROJECT
// ============================================================

$("projectStatus").textContent =
  "Firebase JavaScript SDK loaded successfully.";

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
// INITIAL DATABASE STRUCTURE
// ============================================================

const structure = {

  system: {
    id: "config",

    data: {
      projectName: "Let's Trade ZM",
      version: "1.0",
      setupComplete: true,
      createdAt: "server"
    }
  },


  pricelist: {
    id: "setup-example",

    data: {
      service: "SETUP EXAMPLE - DELETE ME",
      package: "Example",
      ownership: "shared",
      price: 0,
      duration: 30,
      description: "Temporary setup document",
      status: "inactive",
      createdAt: "server"
    }
  },


  clients: {
    id: "setup-example",

    data: {
      name: "Setup Example",
      phone: "",
      email: "",
      identifier: "",
      createdAt: "server"
    }
  },


  orders: {
    id: "setup-example",

    data: {
      orderId: "SETUP-EXAMPLE",
      clientId: "setup-example",
      items: [],
      total: 0,
      paymentStatus: "pending",
      orderStatus: "pending",
      createdAt: "server"
    }
  },


  payments: {
    id: "setup-example",

    data: {
      orderId: "setup-example",
      method: "",
      amount: 0,
      reference: "",
      status: "pending",
      createdAt: "server"
    }
  },


  subscriptions: {
    id: "setup-example",

    data: {
      orderId: "setup-example",
      clientId: "setup-example",
      customerUid: "",
      service: "Setup Example",
      package: "Example",
      startDate: "",
      expiryDate: "",
      status: "pending",
      accountId: "",
      accountLabel: "",
      createdAt: "server"
    }
  },


  accounts: {
    id: "setup-example",

    data: {
      service: "Setup Example",
      accountLabel: "Setup Example",
      status: "available",
      subscriptionId: "",
      createdAt: "server"
    }
  }

};


// ============================================================
// CREATE COLLECTION/DOCUMENT
// ============================================================

async function createDocument(
  collectionName,
  documentId,
  data
) {

  const documentReference =
    doc(
      db,
      collectionName,
      documentId
    );

  const finalData = {
    ...data
  };


  if (finalData.createdAt === "server") {
    finalData.createdAt = serverTimestamp();
  }


  await setDoc(
    documentReference,
    finalData,
    {
      merge: true
    }
  );


  return documentReference;
}


// ============================================================
// RUN SETUP
// ============================================================

async function runSetup() {

  $("setupButton").disabled = true;

  status.textContent =
    "Creating Firebase database structure...";


  $("results").style.display = "block";


  const resultList =
    $("resultList");


  resultList.innerHTML = "";


  try {

    for (
      const [collectionName, config]
      of Object.entries(structure)
    ) {

      await createDocument(
        collectionName,
        config.id,
        config.data
      );


      resultList.innerHTML += `
        <p>
          ✅
          <strong>${collectionName}</strong>
          created successfully.
        </p>
      `;
    }


    status.textContent =
      "Database setup completed successfully.";

    status.style.color = "green";


  } catch (error) {

    console.error(
      "Firebase setup error:",
      error
    );


    status.textContent =
      "Setup failed: " + error.message;

    status.style.color = "red";


    resultList.innerHTML += `
      <p>
        ❌
        <strong>Firebase error</strong>
      </p>

      <p>
        ${error.message}
      </p>
    `;


    $("setupButton").disabled = false;
  }

}


$("setupButton")
  .addEventListener(
    "click",
    runSetup
  );
