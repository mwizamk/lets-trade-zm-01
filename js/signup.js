let currentStep=1,selectedProduct=null;
const signupState={product:null,customer:{},payment:null};

document.addEventListener("DOMContentLoaded",()=>{
renderProducts(); setupFilters(); setupNavigation(); setupURLProduct();
});

function renderProducts(filter="all"){
const c=document.getElementById("signupProducts"); if(!c)return;
let products=PRICE_LIST.filter(p=>p.status==="active");
if(filter!=="all")products=products.filter(p=>p.ownership===filter);
c.innerHTML=products.map(p=>`
<button class="product-card" data-id="${p.id}" type="button">
<div class="product-top"><span>${p.ownership}</span><span>${p.duration}</span></div>
<h3>${p.service}</h3><p>${p.package}</p><strong>K${p.price}</strong>
</button>`).join("");
document.querySelectorAll(".product-card").forEach(card=>card.addEventListener("click",()=>selectProduct(Number(card.dataset.id))));
}
function selectProduct(id){
selectedProduct=PRICE_LIST.find(p=>p.id===id); signupState.product=selectedProduct;
document.querySelectorAll(".product-card").forEach(card=>card.classList.toggle("selected",Number(card.dataset.id)===id));
document.getElementById("serviceNext").disabled=false;
}
function setupFilters(){
document.querySelectorAll(".filter").forEach(b=>b.addEventListener("click",()=>{
document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderProducts(b.dataset.filter);
}));
}
function setupNavigation(){
document.getElementById("serviceNext")?.addEventListener("click",()=>goToStep(2));
document.querySelectorAll("[data-next]").forEach(b=>b.addEventListener("click",()=>goToStep(Number(b.dataset.next))));
document.querySelectorAll("[data-back]").forEach(b=>b.addEventListener("click",()=>goToStep(Number(b.dataset.back))));
document.getElementById("detailsNext")?.addEventListener("click",validateCustomer);
document.getElementById("submitOrder")?.addEventListener("click",submitOrder);
}
function goToStep(step){
if(step===2)renderCart(); if(step===4)renderPaymentSummary();
document.querySelectorAll(".form-step").forEach(s=>s.classList.remove("active"));
document.querySelector(`.form-step[data-step="${step}"]`)?.classList.add("active");
currentStep=step;updateProgress();window.scrollTo({top:0,behavior:"smooth"});
}
function updateProgress(){
const p=document.getElementById("progressBar");if(p)p.style.width=`${((currentStep-1)/4)*100}%`;
document.querySelectorAll(".progress-step").forEach((s,i)=>s.classList.toggle("active",i<currentStep));
}
function renderCart(){
const c=document.getElementById("cartContainer");if(!selectedProduct)return;
c.innerHTML=`<div class="cart-card"><div><span class="cart-label">SELECTED SERVICE</span><h2>${selectedProduct.service}</h2><p>${selectedProduct.package} · ${selectedProduct.ownership}</p></div><div class="cart-price"><span>${selectedProduct.duration}</span><strong>K${selectedProduct.price}</strong></div></div><div class="total-card"><span>Total</span><strong>K${selectedProduct.price}</strong></div>`;
}
function validateCustomer(){
const f=document.getElementById("customerForm");if(!f.checkValidity()){f.reportValidity();return;}
signupState.customer={name:document.getElementById("customerName").value.trim(),phone:document.getElementById("customerPhone").value.trim(),email:document.getElementById("customerEmail").value.trim()};
goToStep(4);
}
function renderPaymentSummary(){
const c=document.getElementById("paymentSummary");if(!selectedProduct)return;
c.innerHTML=`<div class="payment-summary"><div><span>Service</span><strong>${selectedProduct.service}</strong></div><div><span>Package</span><strong>${selectedProduct.package}</strong></div><div><span>Customer</span><strong>${signupState.customer.name}</strong></div><div class="summary-total"><span>Total</span><strong>K${selectedProduct.price}</strong></div></div>`;
}
function submitOrder(){
const payment=document.querySelector('input[name="payment"]:checked');signupState.payment=payment?.value||"mobile_money";
const code=Math.floor(1000+Math.random()*9000).toString();
const order={orderId:"LTZ-"+Date.now(),product:signupState.product,customer:signupState.customer,payment:signupState.payment,customerCode:code,status:"pending",createdAt:new Date().toISOString()};
localStorage.setItem("latestOrder",JSON.stringify(order));localStorage.setItem("customerCode",code);
document.getElementById("generatedCode").textContent=code;goToStep(5);
}
function setupURLProduct(){
const id=Number(new URLSearchParams(location.search).get("product"));if(id&&PRICE_LIST.find(p=>p.id===id))selectProduct(id);
}