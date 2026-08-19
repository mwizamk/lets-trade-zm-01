document.addEventListener("DOMContentLoaded",()=>{
const order=JSON.parse(localStorage.getItem("latestOrder"));
const customer=JSON.parse(localStorage.getItem("loggedInCustomer"));
if(!order||!customer){location.href="login.html";return;}
document.getElementById("customerName").textContent=customer.name;
document.getElementById("serviceName").textContent=order.product.service;
document.getElementById("packageName").textContent=order.product.package;
document.getElementById("subscriptionStatus").textContent=order.status;
document.getElementById("orderNumber").textContent=order.orderId;
document.getElementById("amount").textContent=`K${order.product.price}`;
document.getElementById("infoName").textContent=customer.name;
document.getElementById("infoPhone").textContent=customer.phone;
document.getElementById("infoEmail").textContent=customer.email;
document.getElementById("logoutBtn").addEventListener("click",()=>{localStorage.removeItem("loggedInCustomer");location.href="login.html";});
});