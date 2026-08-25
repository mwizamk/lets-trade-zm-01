import { db } from "./firebase.js";

import {
  collection,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const status = document.getElementById("status");
const button = document.getElementById("runSetup");

const starterPriceList = [
  {
    id: "netflix_shared",
    service: "Netflix",
    package: "Shared",
    ownership: "shared",
    price: 65,
    duration: 30,
    status: "active",
    description: "Netflix shared subscription."
  },
  {
    id: "prime_shared",
    service: "Prime Video",
    package: "Shared",
    ownership: "shared",
    price: 80,
    duration: 30,
    status: "active",
    description: "Prime Video shared subscription."
  },
  {
    id: "spotify_shared",
    service: "Spotify",
    package: "Shared",
    ownership: "shared",
    price: 65,
    duration: 30,
    status: "active",
    description: "Spotify shared subscription."
  }
];

async function setupDatabase() {
  button.disabled = true;
  status.textContent = "Creating Firestore structure...";

  try {

    /*
     * PRICE LIST
     *
     * These IDs are deterministic.
     * Running setup again will update the same documents
     * instead of creating duplicates.
     */

    for (const item of starterPriceList) {

      await setDoc(
        doc(db, "pricelist", item.id),
        {
          service: item.service,
          package: item.package,
          ownership: item.ownership,
          price: item.price,
          duration: item.duration,
          status: item.status,
          description: item.description,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

    }

    /*
     * Create one system document.
     *
     * This causes Firestore to create the system collection.
     */

    await setDoc(
      doc(db, "system", "store"),
      {
        name: "Let's Trade ZM",
        version: 1,
        initializedAt: serverTimestamp()
      },
      { merge: true }
    );

    /*
     * The other collections will be created naturally
     * when the application receives its first real record.
     */

    status.textContent =
      "Firebase setup completed successfully.";

    button.textContent = "Setup completed";

  } catch (error) {

    console.error(error);

    status.textContent =
      "Setup failed: " + error.message;

    button.disabled = false;
  }
}

button.addEventListener("click", setupDatabase);
