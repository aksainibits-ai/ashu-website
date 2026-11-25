"use client";
import {useState} from "react";

export default function ContactForm({enabled,lang}:{enabled:boolean;lang:"en"|"hi"}) {
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 const en=lang==="en";
 if(!enabled)return <div className="panel p-6"><h2 className="serif text-2xl">{en?"Enquiry form":"पूछताछ फ़ॉर्म"}</h2><p className="muted mt-3">{en?"Online submissions are currently disabled while privacy, security and professional-conduct review is completed. Public contact details remain available above.":"गोपनीयता, सुरक्षा और व्यावसायिक आचरण की समीक्षा पूरी होने तक ऑनलाइन संदेश भेजना बंद है। ऊपर सार्वजनिक संपर्क जानकारी उपलब्ध है।"}</p></div>;
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage("");
  const form=e.currentTarget;const fd=new FormData(form);
  const payload={name:String(fd.get("name")||""),phone:String(fd.get("phone")||""),email:String(fd.get("email")||""),category:String(fd.get("category")||""),message:String(fd.get("message")||""),consent:fd.get("consent")==="on",website:String(fd.get("website")||"")};
  try{const r=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const data=await r.json();if(!r.ok)throw new Error(data.error||"Could not submit");form.reset();setMessage(en?"Your message was submitted. Do not treat this as confirmation of representation.":"आपका संदेश भेज दिया गया है। इसे प्रतिनिधित्व की पुष्टि न मानें।");}
  catch(err){setMessage(err instanceof Error?err.message:"Submission unavailable.");}
  finally{setBusy(false);}
 }
 return <form onSubmit={submit} className="panel p-6 space-y-4">
  <h2 className="serif text-2xl">{en?"General enquiry":"सामान्य पूछताछ"}</h2>
  <p className="muted text-sm">{en?"Please share only basic contact details and a brief general category. Do not send confidential case facts, documents, identity numbers or sensitive information.":"केवल सामान्य संपर्क विवरण और संक्षिप्त श्रेणी दें। गोपनीय मामले के तथ्य, दस्तावेज़, पहचान संख्या या संवेदनशील जानकारी न भेजें।"}</p>
  <label className="block text-sm">{en?"Name":"नाम"}<input className="field mt-1" name="name" required minLength={2} maxLength={100}/></label>
  <label className="block text-sm">{en?"Phone":"फ़ोन"}<input className="field mt-1" name="phone" type="tel" required maxLength={24}/></label>
  <label className="block text-sm">{en?"Email (optional)":"ईमेल (वैकल्पिक)"}<input className="field mt-1" name="email" type="email" maxLength={254}/></label>
  <label className="block text-sm">{en?"General category":"सामान्य श्रेणी"}<select className="field mt-1" name="category"><option value="General">{en?"General":"सामान्य"}</option><option value="Civil">{en?"Civil":"दीवानी"}</option><option value="Criminal">{en?"Criminal":"आपराधिक"}</option><option value="Property">{en?"Property":"संपत्ति"}</option><option value="Commercial">{en?"Commercial":"व्यावसायिक"}</option><option value="Other">{en?"Other":"अन्य"}</option></select></label>
  <label className="block text-sm">{en?"Brief message":"संक्षिप्त संदेश"}<textarea className="field mt-1 min-h-28" name="message" required minLength={10} maxLength={1500}/></label>
  <label className="hidden" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
  <label className="flex gap-3 text-sm items-start"><input type="checkbox" name="consent" required className="mt-1"/><span>{en?"I consent to this information being used only to respond to this enquiry, subject to the Privacy Policy.":"मैं इस जानकारी के उपयोग की सहमति देता/देती हूँ, केवल इस पूछताछ का उत्तर देने के लिए और गोपनीयता नीति के अधीन।"}</span></label>
  <button className="btn" disabled={busy}>{busy?(en?"Sending…":"भेजा जा रहा है…"):(en?"Submit enquiry":"पूछताछ भेजें")}</button>
  <p className="muted text-sm" aria-live="polite">{message}</p>
 </form>;
}
