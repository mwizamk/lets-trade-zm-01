document.addEventListener("DOMContentLoaded",()=>{renderAdminPriceList();renderOrders();});
function renderAdminPriceList(){
const c=document.getElementById("adminPriceList");if(!c)return;
c.innerHTML=PRICE_LIST.map(p=>`<div class="admin-product"><div><strong>${p.service}</strong><span>${p.package}</span></div><strong>K${p.price}</strong><span class="${p.status==="active"?"status-active":"status-inactive"}">${p.status}</span><button>Edit</button></div>`).join("");
}
function renderOrders(){
const t=document.getElementById("ordersTable"),o=JSON.parse(localStorage.getItem("latestOrder"));
if(!o){t.innerHTML='<tr><td colspan="6" class="empty">No orders yet.</td></tr>';return;}
t.innerHTML=`<tr><td>${o.orderId}</td><td>${o.customer.name}</td><td>${o.product.service}</td><td>K${o.product.price}</td><td><span class="status-badge">${o.status}</span></td><td><button class="table-btn">Manage</button></td></tr>`;
}