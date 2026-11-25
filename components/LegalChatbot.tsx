"use client";
import {useState} from "react";

type Message={role:"user"|"assistant";text:string};
export default function LegalChatbot({lang,enabled}:{lang:"en"|"hi";enabled:boolean}){
 const [open,setOpen]=useState(false);const [input,setInput]=useState("");const [busy,setBusy]=useState(false);
 const [messages,setMessages]=useState<Message[]>([]);
 if(!enabled)return null;
 const en=lang==="en";
 async function send(e?:React.FormEvent){
  e?.preventDefault();const message=input.trim();if(!message||busy)return;
  setMessages(m=>[...m,{role:"user",text:message}]);setInput("");setBusy(true);
  try{const r=await fetch("/api/chatbot",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message,language:lang})});const data=await r.json();if(!r.ok)throw new Error(data.error||"Unavailable");setMessages(m=>[...m,{role:"assistant",text:data.answer}]);}
  catch(err){setMessages(m=>[...m,{role:"assistant",text:err instanceof Error?err.message:(en?"The assistant is unavailable.":"सहायक अभी उपलब्ध नहीं है।")}]);}
  finally{setBusy(false);}
 }
 return <div className="fixed bottom-5 right-5 z-50">
  {open&&<section className="panel mb-3 flex h-[min(70vh,520px)] w-[min(92vw,380px)] flex-col overflow-hidden shadow-2xl">
   <header className="flex items-center justify-between border-b border-white/10 p-4"><div><strong className="serif">{en?"Legal information assistant":"कानूनी जानकारी सहायक"}</strong><p className="muted text-xs">{en?"General information only":"केवल सामान्य जानकारी"}</p></div><button className="gold" onClick={()=>{setOpen(false);setMessages([]);}} aria-label="Close chat">×</button></header>
   <div className="flex-1 space-y-3 overflow-y-auto p-4" role="log" aria-live="polite">
    <p className="muted text-xs">{en?"Do not share names, phone numbers, case details, documents or confidential information. This is not legal advice and does not create a lawyer-client relationship.":"नाम, फ़ोन नंबर, मामले का विवरण, दस्तावेज़ या गोपनीय जानकारी साझा न करें। यह कानूनी सलाह नहीं है और वकील-मुवक्किल संबंध नहीं बनाता।"}</p>
    {messages.map((m,i)=><div key={i} className={m.role==="user"?"ml-8 rounded-xl bg-white/10 p-3 text-sm":"mr-5 rounded-xl border border-gold/20 p-3 text-sm"}>{m.text}</div>)}
    {busy&&<p className="muted text-sm">{en?"Thinking…":"सोच रहा है…"}</p>}
   </div>
   <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-3"><input className="field min-w-0" value={input} onChange={e=>setInput(e.target.value)} maxLength={1800} placeholder={en?"Ask a general question":"सामान्य प्रश्न पूछें"} aria-label="Your question"/><button className="btn" disabled={busy||!input.trim()}>{en?"Send":"भेजें"}</button></form>
  </section>}
  <button className="btn rounded-full shadow-xl" onClick={()=>setOpen(v=>!v)} aria-expanded={open}>{open?(en?"Close":"बंद करें"):(en?"Legal help":"कानूनी जानकारी")}</button>
 </div>;
}
