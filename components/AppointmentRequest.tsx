"use client";
import { useEffect, useState } from "react";
type Slot = { id: string; starts_at: string; ends_at: string };
export default function AppointmentRequest({lang}:{lang:"en"|"hi"}) {
  const en = lang === "en";
  const [slots,setSlots] = useState<Slot[]>([]);
  const [slotId,setSlotId] = useState("");
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState("");
  const [error,setError] = useState(false);
  async function load() {
    const r = await fetch("/api/appointments/slots",{cache:"no-store"});
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Availability unavailable");
    setSlots(d.slots || []);
    setSlotId(d.slots?.[0]?.id || "");
  }
  useEffect(()=>{ load().catch(e=>{setError(true);setNotice(e.message);}); },[]);
  function format(value:string) {
    return new Intl.DateTimeFormat(en?"en-IN":"hi-IN",{timeZone:"Asia/Kolkata",weekday:"short",day:"numeric",month:"short",year:"numeric",hour:"numeric",minute:"2-digit",hour12:true}).format(new Date(value));
  }
  async function submit(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setNotice(""); setError(false);
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      const r = await fetch("/api/appointments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        slotId, name:String(fd.get("name")||""), phone:String(fd.get("phone")||""),
        email:String(fd.get("email")||""), mode:String(fd.get("mode")||""),
        language:lang, consent:fd.get("consent")==="on"
      })});
      const d = await r.json();
      if(!r.ok) throw new Error(d.error || "Could not submit request");
      setNotice(en?"Your request has been received. The office will contact you to confirm it. The slot is not confirmed yet.":"आपका अनुरोध प्राप्त हुआ है। कार्यालय पुष्टि के लिए आपसे संपर्क करेगा। अभी समय की पुष्टि नहीं हुई है।");
      form.reset(); await load();
    } catch(e) { setError(true); setNotice(e instanceof Error?e.message:"Submission unavailable."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="panel p-6 md:p-8 space-y-5">
    <div><div className="eyebrow">{en?"30-minute consultation request":"30 मिनट का परामर्श अनुरोध"}</div>
      <h2 className="serif text-3xl mt-2">{en?"Request an appointment":"अपॉइंटमेंट का अनुरोध करें"}</h2>
      <p className="muted text-sm mt-3 leading-6">{en?"Choose an office-published time and a consultation format. All requests remain pending until the office confirms them.":"कार्यालय द्वारा उपलब्ध कराया गया समय और परामर्श का माध्यम चुनें। कार्यालय की पुष्टि तक सभी अनुरोध लंबित रहेंगे।"}</p>
    </div>
    <label className="block text-sm">{en?"Available office slots (India time)":"उपलब्ध समय (भारतीय समय)"}
      <select className="field mt-1" required value={slotId} onChange={e=>setSlotId(e.target.value)} disabled={!slots.length}>
        {!slots.length && <option value="">{en?"No slots currently available":"फिलहाल कोई समय उपलब्ध नहीं"}</option>}
        {slots.map(s=><option key={s.id} value={s.id}>{format(s.starts_at)}</option>)}
      </select>
    </label>
    <label className="block text-sm">{en?"Consultation format":"परामर्श का माध्यम"}
      <select className="field mt-1" name="mode" required defaultValue="in_person">
        <option value="in_person">{en?"In person":"व्यक्तिगत रूप से"}</option>
        <option value="online">{en?"Online":"ऑनलाइन"}</option>
      </select>
    </label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm">{en?"Name":"नाम"}<input className="field mt-1" name="name" required minLength={2} maxLength={100}/></label>
      <label className="block text-sm">{en?"Phone":"फ़ोन"}<input className="field mt-1" name="phone" type="tel" required maxLength={24}/></label>
    </div>
    <label className="block text-sm">{en?"Email (optional)":"ईमेल (वैकल्पिक)"}<input className="field mt-1" name="email" type="email" maxLength={254}/></label>
    <p className="rounded-xl border border-gold/20 p-4 text-xs muted leading-6">{en?"Please do not include case facts, documents, identity numbers or confidential information. This form only requests a time; it does not create an advocate-client relationship or confirm acceptance of instructions.":"कृपया मामले के तथ्य, दस्तावेज़, पहचान संख्या या गोपनीय जानकारी न दें। यह फ़ॉर्म केवल समय का अनुरोध करता है; इससे अधिवक्ता-मुवक्किल संबंध या निर्देश स्वीकार होने की पुष्टि नहीं होती।"}</p>
    <label className="flex gap-3 items-start text-sm"><input className="mt-1" type="checkbox" name="consent" required/><span>{en?"I consent to the use of these details to respond to this appointment request and have read the Privacy Policy.":"मैं इस अपॉइंटमेंट अनुरोध का उत्तर देने हेतु इन विवरणों के उपयोग की सहमति देता/देती हूँ और गोपनीयता नीति पढ़ी है।"} <a className="gold underline" href={"/"+lang+"/privacy"}>{en?"Privacy Policy":"गोपनीयता नीति"}</a></span></label>
    <button className="btn" disabled={busy||!slotId}>{busy?(en?"Submitting…":"भेजा जा रहा है…"):(en?"Request this appointment":"अपॉइंटमेंट अनुरोध भेजें")}</button>
    <button type="button" className="text-sm gold underline" onClick={()=>load().catch(e=>{setError(true);setNotice(e.message);})}>{en?"Refresh availability":"उपलब्धता रीफ़्रेश करें"}</button>
    <p className={"text-sm "+(error?"text-red-400":"muted")} aria-live="polite">{notice}</p>
  </form>;
}
