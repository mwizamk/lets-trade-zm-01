import { db, auth } from "./firebase.js";
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit }
from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

const form=document.getElementById("signupForm"), message=document.getElementById("signupMessage");
const box=document.getElementById("selectedProduct"), button=document.getElementById("continueButton");
const selected=JSON.parse(sessionStorage.getItem("selectedPrice")||"null");

function msg(t,type="error"){message.textContent=t;message.className=`form-message show ${type}`;}
function phone(v){return String(v||"").trim().replace(/\s+/g,"").replace(/^\+260/,"0");}

if(!selected){box.innerHTML="<strong>No service selected.</strong><p>Return to the PriceList and choose a service.</p>";button.disabled=true;}
else box.innerHTML=`<span class="eyebrow">${selected.ownership||"SERVICE"}</span><h2>${selected.service||"Subscription"}</h2><p>${selected.package||""}</p><strong>K${Number(selected.price||0).toFixed(2)}</strong>`;

form?.addEventListener("submit",async e=>{
 e.preventDefault(); if(!selected)return;
 const name=document.getElementById("name").value.trim(), ph=phone(document.getElementById("phone").value);
 const email=document.getElementById("email").value.trim().toLowerCase();
 if(!name||!ph){msg("Please enter your name and phone number.");return;}
 button.disabled=true;button.textContent="Creating your request...";
 try{
  if(!auth.currentUser)await signInAnonymously(auth);
  const customerUid=auth.currentUser.uid;
  let clientId=null;
  const q=await getDocs(query(collection(db,"clients"),where("customerUid","==",customerUid),limit(1)));
  if(!q.empty)clientId=q.docs[0].id;
  else {const c=await addDoc(collection(db,"clients"),{customerUid,name,phone:ph,email,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});clientId=c.id;}
  const o=await addDoc(collection(db,"orders"),{
   customerUid,clientId,priceListId:selected.id,service:selected.service||"",package:selected.package||"",
   ownership:selected.ownership||"",amount:Number(selected.price||0),paymentStatus:"pending",orderStatus:"pending",createdAt:serverTimestamp()
  });
  sessionStorage.setItem("client",JSON.stringify({id:clientId,customerUid,name,phone:ph,email}));
  sessionStorage.setItem("currentOrder",JSON.stringify({id:o.id,...selected,clientId,customerUid,amount:Number(selected.price||0)}));
  location.href="payment.html";
 }catch(err){console.error(err);msg(err.code==="permission-denied"?"Firebase denied the request. Enable Anonymous Authentication and publish the latest Firestore rules.":"Unable to create your signup. Please try again.");}
 finally{button.disabled=false;button.textContent="Continue to payment";}
});