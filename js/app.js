import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const priceListElement = document.getElementById("homePriceList");

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function money(value) {
  return `K${Number(value || 0).toFixed(2)}`;
}

async function loadHomePriceList() {
  if (!priceListElement) return;

  try {
    const q = query(
      collection(db, "pricelist"),
      where("sub_status", "==", "active")
    );

    const snapshot = await getDocs(q);

    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (!products.length) {
      priceListElement.innerHTML =
        `<div class="loading-card">No active services are available right now.</div>`;
      return;
    }

    products.sort((a,b) =>
      String(a.service || "").localeCompare(String(b.service || ""))
    );

    priceListElement.innerHTML = products.map(item => `
      <article class="price-card">
        <div class="price-card-top">
          <span class="price-type">${escapeHTML(item.ownership || "shared")}</span>
          <span class="price-status">Available</span>
        </div>
        <h3>${escapeHTML(item.service || "Service")}</h3>
        <p class="package">${escapeHTML(item.package || "")}</p>
        <p class="description">${escapeHTML(item.description || "")}</p>
        <div class="price-row">
          <strong>${money(item.price)}</strong>
          <span>${escapeHTML(item.duration || "Monthly")}</span>
        </div>
        <button class="primary-btn choose-product" data-id="${escapeHTML(item.id)}">
          Choose
        </button>
      </article>
    `).join("");

    document.querySelectorAll(".choose-product").forEach(button => {
      button.addEventListener("click", () => {
        const product = products.find(p => p.id === button.dataset.id);
        if (!product) return;

        sessionStorage.setItem("selectedPrice", JSON.stringify({
          id: product.id,
          service: product.service || "",
          package: product.package || "",
          ownership: product.ownership || "",
          price: Number(product.price || 0),
          duration: product.duration || "Monthly",
          description: product.description || ""
        }));

        window.location.href = "signup.html";
      });
    });

  } catch (error) {
    console.error("PriceList error:", error);
    priceListElement.innerHTML =
      `<div class="loading-card error-card">Unable to load the PriceList. Please try again.</div>`;
  }
}

loadHomePriceList();
