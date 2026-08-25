import { db, auth } from "./firebase.js";
import { collection,getDocs,query,where } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

const client=JSON.parse(sessionStorage.getItem("client")||"null"),list=document.getElementById("subscriptionsList"),msg=document.getElementById("dashboardMessage");
const status=s=>String(s.status||s.sub_status||"pending").toLowerCase().replace(/\s+/g,"_");
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
async function start(){
 if(!client){location.href="login.html";return;}
 try{
  if(!auth.currentUser)await signInAnonymously(auth);
  document.getElementById("customerName").textContent=client.name||"Customer";
  document.getElementById("welcomeName").textContent=client.name||"Customer";
  document.getElementById("detailName").textContent=client.name||"—";
  document.getElementById("detailPhone").textContent=client.phone||"—";
  document.getElementById("detailEmail").textContent=client.email||"—";
  const snap=await getDocs(query(collection(db,"subscriptions"),where("customerUid","==",auth.currentUser.uid)));
  const subs=snap.docs.map(d=>({id:d.id,...d.data()}));
  document.getElementById("subscriptionCount").textContent=subs.length;
  document.getElementById("activeCount").textContent=subs.filter(s=>["active","pending_expiry"].includes(status(s))).length;
  if(!subs.length){list.innerHTML='<div class="loading-card">No subscriptions found yet. Payment verification is handled by admin.</div>';return;}
  list.innerHTML=subs.map(s=>`<article class="subscription-card"><div class="subscription-title"><span class="service-badge">${esc(s.service||"Service")}</span><h3>${esc(s.package||"Subscription")}</h3></div><div class="subscription-details"><div><span>Status</span><strong>${esc(status(s).replaceAll("_"," "))}</strong></div><div><span>Start</span><strong>${esc(s.startDate||s.sub_start||"—")}</strong></div><div><span>Expiry</span><strong>${esc(s.expiryDate||s.sub_expiry||"—")}</strong></div><div><span>Account</span><strong>${s.accountId?"Assigned":"Pending assignment"}</strong></div></div></article>`).join("");
 }catch(e){console.error(e);msg.textContent="Unable to load your dashboard.";msg.className="form-message show";}
}
document.getElementById("logoutButton")?.addEventListener("click",()=>{sessionStorage.clear();location.href="login.html";});
start();