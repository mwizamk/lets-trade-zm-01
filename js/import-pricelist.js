import {
  db
} from "./firebase.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
  PRICE_LIST
} from "./data.js";


const button =
  document.getElementById("importButton");

const status =
  document.getElementById("status");

const results =
  document.getElementById("results");


button.addEventListener("click", async () => {

  button.disabled = true;

  status.textContent =
    "Importing PriceList...";

  results.innerHTML = "";


  try {

    for (const product of PRICE_LIST) {

      const documentId =
        `product_${product.id}`;


      await setDoc(
        doc(
          db,
          "pricelist",
          documentId
        ),
        {
          id: product.id,

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

          status:
            product.status,

          updatedAt:
            serverTimestamp(),

          importedAt:
            serverTimestamp()
        },
        {
          merge: true
        }
      );


      results.innerHTML += `
        <p>
          ✅ ${product.service}
          — ${product.package}
        </p>
      `;
    }


    status.textContent =
      `Successfully imported ${PRICE_LIST.length} PriceList products.`;

  } catch (error) {

    console.error(error);

    status.textContent =
      "Import failed.";

    results.innerHTML += `
      <p>
        ❌ ${error.message}
      </p>
    `;

    button.disabled = false;

  }

});
