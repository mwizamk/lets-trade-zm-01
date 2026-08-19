document.getElementById("loginForm")?.addEventListener("submit",e=>{
e.preventDefault();
const identifier=document.getElementById("loginIdentifier").value.trim();
const code=document.getElementById("loginCode").value.trim();
const msg=document.getElementById("loginMessage");
const order=JSON.parse(localStorage.getItem("latestOrder"));
if(!order){msg.textContent="Customer account not found.";msg.className="login-message error";return;}
const validId=identifier===order.customer.phone||identifier.toLowerCase()===order.customer.email.toLowerCase();
if(validId&&code===order.customerCode){localStorage.setItem("loggedInCustomer",JSON.stringify(order.customer));location.href="dashboard.html";}
else{msg.textContent="Incorrect login details.";msg.className="login-message error";}
});