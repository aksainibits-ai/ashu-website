"use client";
import { useEffect, useState } from "react";
type Slot={id:string;starts_at:string;ends_at:string;is_available:boolean};
type Appointment={id:string;slot_id:string;name:string;phone:string;email:string|null;consultation_mode:string;language:string;status:string;created_at:string;appointment_slots:{starts_at:string;ends_at:string}|null};
export default function AppointmentManager({lang}:{lang:"en"|"hi"}) {
 const en=lang==="en"; const [slots,setSlots]=useState<Slot[]>([]); const [items,setItems]=useState<Appointment[]>([]);
 const [start,setStart]=useState(""); const [notice,setNotice]=useState(""); const [busy,setBusy]=useState(false);
 async function load(){const r=await fetch("/api/admin/appointments",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load appointments");setSlots(d.slots||[]);setItems(d.appointments||[]);}
 useEffect(()=>{load().catch(e=>setNotice(e.message));},[]);
 function fmt(v:string){return new Intl.DateTimeFormat(en?"en-IN":"hi-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(new Date(v));}
 async function createSlot(e:React.FormEvent){e.preventDefault();setBusy(true);setNotice("");try{
   const iso=new Date(start+"+05:30").toISOString();
   const r=await fetch("/api/admin/appointments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({startsAt:iso})});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not create slot");setStart("");setNotice(en?"30-minute office slot created.":"30 मिनट का समय उपलब्ध कराया गया।");await load();
 }catch(e){setNotice(e instanceof Error?e.message:"Could not create slot");}finally{setBusy(false);}}
 async function change(a:Appointment,status:string){setBusy(true);setNotice("");try{
   const r=await fetch("/api/admin/appointments/"+a.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Update failed");setNotice(en?"Appointment updated.":"अपॉइंटमेंट अपडेट किया गया।");await load();
 }catch(e){setNotice(e instanceof Error?e.message:"Update failed");}finally{setBusy(false);}}
 const pending=items.filter(a=>a.status==="pending").length;
 return <div className="space-y-8">
  <div className="grid gap-3 sm:grid-cols-3"><div className="panel p-5"><p className="muted text-sm">{en?"Pending requests":"लंबित अनुरोध"}</p><p className="serif text-3xl mt-2">{pending}</p></div><div className="panel p-5"><p className="muted text-sm">{en?"Available slots":"उपलब्ध समय"}</p><p className="serif text-3xl mt-2">{slots.filter(s=>s.is_available&&new Date(s.starts_at)>new Date()).length}</p></div><div className="panel p-5"><p className="muted text-sm">{en?"Total requests":"कुल अनुरोध"}</p><p className="serif text-3xl mt-2">{items.length}</p></div></div>
  <section className="panel p-6 space-y-4"><div><div className="eyebrow">{en?"Daily office availability":"दैनिक कार्यालय उपलब्धता"}</div><h2 className="serif text-2xl mt-2">{en?"Every day · 3:00 PM–7:00 PM":"प्रतिदिन · दोपहर 3:00–शाम 7:00 बजे"}</h2><p className="muted text-sm mt-2">{en?"Eight 30-minute appointment slots are generated automatically for a rolling 30-day period. Times are India Standard Time. The office retains control over confirmation.":"30 दिनों की आगामी अवधि के लिए प्रतिदिन आठ 30-मिनट के स्लॉट अपने-आप बनाए जाते हैं। समय भारतीय मानक समय के अनुसार है। पुष्टि का नियंत्रण कार्यालय के पास रहेगा।"}</p></div>
   <div className="space-y-2">{slots.slice(0,16).map(s=><div key={s.id} className="flex flex-wrap justify-between gap-2 border-b border-white/10 py-2 text-sm"><span>{fmt(s.starts_at)} – {fmt(s.ends_at)}</span><span className={s.is_available?"gold":"muted"}>{s.is_available?(en?"Available":"उपलब्ध"):(en?"Reserved":"आरक्षित")}</span></div>)}</div>
  </section>
  <section className="panel p-6 space-y-4"><div><div className="eyebrow">{en?"Additional office slot":"अतिरिक्त कार्यालय स्लॉट"}</div><h2 className="serif text-2xl mt-2">{en?"Publish an extra 30-minute slot":"अतिरिक्त 30-मिनट का स्लॉट प्रकाशित करें"}</h2></div>
   <form onSubmit={createSlot} className="flex flex-col sm:flex-row gap-3"><input className="field" type="datetime-local" required value={start} onChange={e=>setStart(e.target.value)}/><button className="btn" disabled={busy||!start}>{en?"Publish extra slot":"अतिरिक्त स्लॉट प्रकाशित करें"}</button></form>
  </section>
  <section className="space-y-4"><div className="flex justify-between items-center gap-3"><h2 className="serif text-2xl">{en?"Appointment requests":"अपॉइंटमेंट अनुरोध"}</h2><button className="btn btn-outline" disabled={busy} onClick={()=>load().catch(e=>setNotice(e.message))}>{en?"Refresh":"रीफ़्रेश"}</button></div>
   {!items.length&&<p className="muted">{en?"No appointment requests yet.":"अभी कोई अनुरोध नहीं है।"}</p>}
   {items.map(a=><article className="panel p-5 space-y-3" key={a.id}>
    <div className="flex flex-wrap justify-between gap-2"><strong>{a.name}</strong><span className="eyebrow">{a.status.toUpperCase()}</span></div>
    <p className="muted text-sm">{a.appointment_slots?fmt(a.appointment_slots.starts_at):"Slot unavailable"} · {a.consultation_mode==="online"?(en?"Online":"ऑनलाइन"):(en?"In person":"व्यक्तिगत")} · {a.language.toUpperCase()}</p>
    <p className="text-sm">{a.phone}{a.email?" · "+a.email:""}</p>
    <div className="flex flex-wrap gap-3 text-sm"><a className="gold underline" href={"https://wa.me/"+a.phone.replace(/\D/g,"")} target="_blank" rel="noopener noreferrer">WhatsApp</a><a className="gold underline" href={"tel:"+a.phone}>Call</a>{a.email&&<a className="gold underline" href={"mailto:"+a.email}>Email</a>}</div>
    {a.status==="pending"&&<div className="flex flex-wrap gap-2"><button className="btn" disabled={busy} onClick={()=>change(a,"confirmed")}>{en?"Confirm":"पुष्टि करें"}</button><button className="btn btn-outline" disabled={busy} onClick={()=>change(a,"declined")}>{en?"Decline & release slot":"अस्वीकार करें"}</button></div>}
    {a.status==="confirmed"&&<div className="flex flex-wrap gap-2"><button className="btn btn-outline" disabled={busy} onClick={()=>change(a,"completed")}>{en?"Mark completed":"पूर्ण चिह्नित करें"}</button><button className="btn btn-outline" disabled={busy} onClick={()=>change(a,"cancelled")}>{en?"Cancel & release slot":"रद्द करें"}</button></div>}
   </article>)}
  </section>
  <p className="muted text-sm" aria-live="polite">{notice}</p>
 </div>;
}
