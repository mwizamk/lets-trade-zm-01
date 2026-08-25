// ============================================================
// LET'S TRADE ZM
// PRICE LIST FIRESTORE SEEDER
// ============================================================

import { db, auth } from "./firebase.js";

import {
  collection,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

// ============================================================
// PRICE LIST
// Taken from the project's existing data.js
// ============================================================

const PRICE_LIST = [
  {
    id: 1,
    ownership: "shared",
    service: "Netflix",
    package: "Premium",
    price: 65,
    duration: "Monthly",
    description: "Netflix Premium shared slot"
  },
  {
    id: 2,
    ownership: "private",
    service: "Netflix",
    package: "Mobile",
    price: 160,
    duration: "Monthly",
    description: "Private Netflix Mobile"
  },
  {
    id: 3,
    ownership: "private",
    service: "Netflix",
    package: "Basic",
    price: 250,
    duration: "Monthly",
    description: "Private Netflix Basic"
  },
  {
    id: 4,
    ownership: "private",
    service: "Netflix",
    package: "Standard",
    price: 350,
    duration: "Monthly",
    description: "Private Netflix Standard"
  },
  {
    id: 5,
    ownership: "private",
    service: "Netflix",
    package: "Premium",
    price: 399,
    duration: "Monthly",
    description: "Private Netflix Premium"
  },
  {
    id: 6,
    ownership: "shared",
    service: "Prime Video",
    package: "Shared",
    price: 80,
    duration: "Monthly",
    description: "Prime Video shared access"
  },
  {
    id: 7,
    ownership: "private",
    service: "Amazon Prime Video",
    package: "Private",
    price: 250,
    duration: "Monthly",
    description: "Private Amazon Prime Video"
  },
  {
    id: 8,
    ownership: "shared",
    service: "Spotify",
    package: "Individual Slot",
    price: 60,
    duration: "Monthly",
    description: "Spotify shared slot"
  },
  {
    id: 9,
    ownership: "private",
    service: "Spotify",
    package: "Individual",
    price: 150,
    duration: "Monthly",
    description: "Private Spotify Individual"
  },
  {
    id: 10,
    ownership: "private",
    service: "Spotify",
    package: "Family",
    price: 250,
    duration: "Monthly",
    description: "Private Spotify Family"
  },
  {
    id: 11,
    ownership: "shared",
    service: "Apple Music",
    package: "Slot",
    price: 80,
    duration: "Monthly",
    description: "Apple Music shared slot"
  },
  {
    id: 12,
    ownership: "private",
    service: "Apple Music",
    package: "Individual",
    price: 180,
    duration: "Monthly",
    description: "Private Apple Music"
  },
  {
    id: 13,
    ownership: "private",
    service: "Apple Music",
    package: "Family",
    price: 300,
    duration: "Monthly",
    description: "Apple Music Family"
  },
  {
    id: 14,
    ownership: "shared",
    service: "iCloud",
    package: "50GB",
    price: 50,
    duration: "Monthly",
    description: "iCloud 50GB"
  },
  {
    id: 15,
    ownership: "shared",
    service: "iCloud",
    package: "200GB",
    price: 80,
    duration: "Monthly",
    description: "iCloud 200GB"
  },
  {
    id: 16,
    ownership: "private",
    service: "iCloud",
    package: "50GB",
    price: 80,
    duration: "Monthly",
    description: "Private iCloud 50GB"
  },
  {
    id: 17,
    ownership: "private",
    service: "iCloud",
    package: "200GB",
    price: 150,
    duration: "Monthly",
    description: "Private iCloud 200GB"
  },
  {
    id: 18,
    ownership: "private",
    service: "iCloud",
    package: "2TB",
    price: 300,
    duration: "Monthly",
    description: "Private iCloud 2TB"
  },
  {
    id: 19,
    ownership: "shared",
    service: "Gemini AI",
    package: "Plus",
    price: 50,
    duration: "Monthly",
    description: "Gemini AI Plus"
  },
  {
    id: 20,
    ownership: "private",
    service: "Gemini AI",
    package: "Plus",
    price: 100,
    duration: "Monthly",
    description: "Private Gemini AI Plus"
  },
  {
    id: 21,
    ownership: "private",
    service: "Gemini AI",
    package: "Pro",
    price: 150,
    duration: "Monthly",
    description: "Private Gemini AI Pro"
  },
  {
    id: 22,
    ownership: "shared",
    service: "DSTV Stream",
    package: "2 Weeks",
    price: 150,
    duration: "2 Weeks",
    description: "DSTV Stream"
  },
  {
    id: 23,
    ownership: "private",
    service: "DSTV Stream",
    package: "Promo",
    price: 250,
    duration: "Monthly",
    description: "DSTV Stream private promo"
  }
];

// ============================================================
// SEED FUNCTION
// ============================================================

async function seedPriceList() {

  console.log(
    "Starting PriceList import..."
  );

  if (!auth.currentUser) {

    throw new Error(
      "You must be signed in as an administrator."
    );
  }

  let imported = 0;

  for (const product of PRICE_LIST) {

    const documentId =
      `product_${product.id}`;

    const productRef =
      doc(
        db,
        "pricelist",
        documentId
      );

    await setDoc(
      productRef,
      {
        service:
          product.service,

        package:
          product.package,

        ownership:
          product.ownership,

        price:
          Number(product.price),

        duration:
          product.duration,

        description:
          product.description,

        sub_status:
          "active",

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()
      }
    );

    imported++;

    console.log(
      `Imported ${imported}/${PRICE_LIST.length}: ${product.service} - ${product.package}`
    );
  }

  console.log(
    `SUCCESS: ${imported} PriceList products imported.`
  );
}

// ============================================================
// RUN ONLY AFTER ADMIN AUTHENTICATION
// ============================================================

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) {

      console.log(
        "No authenticated user."
      );

      return;
    }

    console.log(
      "Authenticated user:",
      user.email
    );

    try {

      await seedPriceList();

    } catch (error) {

      console.error(
        "PriceList import failed:",
        error
      );

      alert(
        "PriceList import failed:\n\n" +
        error.message
      );
    }
  }
);
