document.addEventListener("DOMContentLoaded",()=>{
const c=document.getElementById("homePriceList"); if(!c)return;
c.innerHTML=PRICE_LIST.filter(p=>p.status==="active").map(p=>`
<div class="price-card">
<div class="price-top"><span>${p.ownership}</span><span>${p.duration}</span></div>
<h3>${p.service}</h3><p>${p.package}</p><div class="price">K${p.price}</div>
<a href="signup.html?product=${p.id}" class="card-btn">Select</a>
</div>`).join("");
});