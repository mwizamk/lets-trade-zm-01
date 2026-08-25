// ============================================================
// LET'S TRADE ZM
// LANDING PAGE PRICE LIST
// ============================================================

import { db } from "./firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ============================================================
// HELPERS
// ============================================================

const $ = (id) =>
  document.getElementById(id);


function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


// ============================================================
// LOAD PRICE LIST
// ============================================================

async function loadHomePriceList() {

  const container =
    $("homePriceList");

  if (!container) return;


  try {

    container.innerHTML = `
      <div class="form-message">
        Loading available services...
      </div>
    `;


    const snapshot =
      await getDocs(
        collection(
          db,
          "pricelist"
        )
      );


    const products = [];


    snapshot.forEach((docSnap) => {

      const data =
        docSnap.data();


      const status =
        String(
          data.sub_status ??
          data.status ??
          "active"
        )
        .trim()
        .toLowerCase();


      // Only show active products
      if (
        status === "active"
      ) {

        products.push({

          id:
            docSnap.id,

          ...data

        });

      }

    });


    console.log(
      "Landing PriceList loaded:",
      products.length
    );


    if (products.length === 0) {

      container.innerHTML = `
        <div class="form-message">
          No services are currently available.
        </div>
      `;

      return;

    }


    // ========================================================
    // RENDER
    // ========================================================

    container.innerHTML =
      products
        .map((product) => {

          const price =
            Number(
              product.price || 0
            );


          return `

            <div class="price-card">

              <div class="price-top">

                <span>
                  ${escapeHtml(
                    product.ownership || ""
                  )}
                </span>

                <span>
                  ${escapeHtml(
                    product.duration || ""
                  )}
                </span>

              </div>


              <h3>
                ${escapeHtml(
                  product.service || ""
                )}
              </h3>


              <p>
                ${escapeHtml(
                  product.package || ""
                )}
              </p>


              <div class="price">
                K${price.toFixed(2)}
              </div>


              <a
                href="signup.html"
                class="card-btn"
              >
                Select
              </a>

            </div>

          `;

        })
        .join("");


  } catch (error) {

    console.error(
      "Landing PriceList error:",
      error
    );


    container.innerHTML = `
      <div class="form-message">
        Unable to load the Price List.
        Please refresh the page.
      </div>
    `;

  }

}


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  loadHomePriceList
);
