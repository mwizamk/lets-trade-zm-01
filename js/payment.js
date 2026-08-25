import { db, auth } from "./firebase.js";
import { collection, addDoc, updateDoc, doc, serverTimestamp }
from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

const order=JSON.parse(sessionStorage.getItem("currentOrder")||"null"),client=JSON.parse(sessionStorage.getItem("client")||"null");
const summary=document.getElementById("paymentSummary"),message=document.getElementById("paymentMessage"),form=document.getElementById("paymentForm"),button=document.getElementById("paymentButton"),amount=document.getElementById("amount");
function msg(t,type="error"){message.textContent=t;message.className=`form-message show ${type}`;}
if(!order||!client){msg("Your signup session has expired. Please start again.");form.style.display="none";}
else{summary.innerHTML=`<span class="eyebrow">${order.ownership||"SERVICE"}</span><h2>${order.service||"Subscription"}</h2><p>${order.package||""}</p><strong>K${Number(order.amount||0).toFixed(2)}</strong>`;amount.value=Number(order.amount||0).toFixed(2);}
form?.addEventListener("submit",async e=>{
 e.preventDefault();if(!order||!client)return;
 const method=document.getElementById("paymentMethod").value,reference=document.getElementById("transactionRef").value.trim(),paid=Number(amount.value);
 if(!method||!reference||!paid){msg("Please complete all payment details.");return;}
 button.disabled=true;button.textContent="Submitting...";
 try{
  if(!auth.currentUser)await signInAnonymously(auth);const customerUid=auth.currentUser.uid;
  const p=await addDoc(collection(db,"payments"),{customerUid,clientId:client.id,orderId:order.id,method,transactionRef:reference,amount:paid,status:"pending",createdAt:serverTimestamp()});
  await updateDoc(doc(db,"orders",order.id),{paymentId:p.id,paymentStatus:"pending",updatedAt:serverTimestamp()});
  sessionStorage.setItem("payment",JSON.stringify({id:p.id,status:"pending",method,transactionRef:reference,amount:paid}));
  form.innerHTML=`<div class="selected-product"><h2>Request submitted</h2><p>Your payment is pending verification by admin.</p><p><strong>Reference:</strong> ${reference}</p></div><a class="primary-btn full-btn" href="login.html">Go to customer login</a>`;
  msg("Payment submitted successfully.","success");
 }catch(err){console.error(err);msg(err.code==="permission-denied"?"Firebase denied the payment. Enable Anonymous Authentication and publish the latest rules.":"Unable to submit payment. Please try again.");}
 finally{button.disabled=false;button.textContent="Submit payment";}
});