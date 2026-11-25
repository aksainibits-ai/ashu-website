"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {Menu, X, Moon, Sun, MessageCircle} from "lucide-react";
import {copy,navKeys,Lang,profile} from "@/lib/content";
import LegalChatbot from "@/components/LegalChatbot";

const paths:Record<string,string>={home:"",about:"about",experience:"experience",qualifications:"qualifications",practice:"practice-areas",courts:"courts",blog:"blog",contact:"contact",disclaimer:"disclaimer",privacy:"privacy",faqs:"faqs"};

function FirstVisitDisclaimer({lang}:{lang:Lang}){
 const [visible,setVisible]=useState(false);
 const [accepted,setAccepted]=useState(false);
 useEffect(()=>{
  try{if(window.localStorage.getItem("ashu-website-disclaimer-accepted-v1")!=="yes")setVisible(true);}catch{setVisible(true);}
 },[]);
 function accept(){
  if(!accepted)return;
  try{window.localStorage.setItem("ashu-website-disclaimer-accepted-v1","yes");}catch{}
  setVisible(false);
 }
 if(!visible)return null;
 const en=lang==="en";
 return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="first-visit-disclaimer-title">
  <section className="panel w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl">
   <div className="eyebrow mb-3">{en?"Important notice":"महत्वपूर्ण सूचना"}</div>
   <h2 id="first-visit-disclaimer-title" className="serif text-3xl mb-4">{en?"Website disclaimer":"वेबसाइट अस्वीकरण"}</h2>
   {en?<div className="space-y-3 text-sm leading-7 muted">
    <p>The Bar Council of India rules prohibit advocates from advertising or soliciting work. This website is intended only to provide permitted factual professional information and general legal education, subject to applicable professional-conduct rules.</p>
    <p>All material is for general information only. It is not legal advice, does not create an advocate-client relationship, and must not be relied upon for any individual matter. Laws and procedures may change; verify current law from official sources.</p>
    <p>Do not send confidential, privileged, sensitive or case-related information through this website, its chatbot, contact form, WhatsApp or ordinary email. A message or enquiry does not mean that an advocate-client relationship has been accepted or that any deadline is protected.</p>
    <p>The chatbot provides limited automated general information and may be incomplete. It is not a substitute for advice from an advocate.</p>
   </div>:<div className="space-y-3 text-sm leading-7 muted">
    <p>बार काउंसिल ऑफ इंडिया के नियम अधिवक्ताओं द्वारा विज्ञापन या कानूनी कार्य के लिए आग्रह को प्रतिबंधित करते हैं। यह वेबसाइट लागू व्यावसायिक आचरण नियमों के अधीन केवल अनुमत तथ्यात्मक व्यावसायिक जानकारी और सामान्य कानूनी शिक्षा प्रदान करने के उद्देश्य से है।</p>
    <p>यहाँ दी गई सामग्री केवल सामान्य जानकारी है। यह कानूनी सलाह नहीं है, अधिवक्ता-मुवक्किल संबंध नहीं बनाती और किसी व्यक्तिगत मामले में इस पर निर्भर नहीं किया जाना चाहिए। कानून और प्रक्रिया बदल सकते हैं; वर्तमान कानून की आधिकारिक स्रोतों से पुष्टि करें।</p>
    <p>इस वेबसाइट, चैटबॉट, संपर्क फ़ॉर्म, WhatsApp या सामान्य ईमेल के माध्यम से गोपनीय, विशेषाधिकार प्राप्त, संवेदनशील या मामले से संबंधित जानकारी न भेजें। संदेश या पूछताछ भेजने से अधिवक्ता-मुवक्किल संबंध स्वीकार नहीं होता और न ही किसी समय-सीमा की सुरक्षा की पुष्टि होती है।</p>
    <p>चैटबॉट सीमित स्वचालित सामान्य जानकारी देता है और उसमें त्रुटि या अपूर्णता हो सकती है। यह अधिवक्ता की सलाह का विकल्प नहीं है।</p>
   </div>}
   <label className="mt-6 flex items-start gap-3 text-sm"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} className="mt-1 accent-amber-500"/><span>{en?"I have read and understood this notice and wish to continue.":"मैंने यह सूचना पढ़ और समझ ली है तथा आगे बढ़ना चाहता/चाहती हूँ।"}</span></label>
   <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><Link className="text-sm underline gold" href={`/${lang}/disclaimer`}>{en?"Read full disclaimer":"पूरा अस्वीकरण पढ़ें"}</Link><button type="button" className="btn" disabled={!accepted} onClick={accept}>{en?"I understand — Continue":"मैं समझ गया/गई — आगे बढ़ें"}</button></div>
  </section>
 </div>
}

function WhatsAppFloat(){
 return <a href={`https://wa.me/${profile.phone.replace(/[^0-9]/g,"")}`} target="_blank" rel="noopener noreferrer" aria-label="Open WhatsApp" className="whatsapp-float fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 font-semibold text-white shadow-xl hover:brightness-110">
  <MessageCircle size={21}/><span className="text-sm">WhatsApp</span>
 </a>
}

export function Header({lang}:{lang:Lang}){const t=copy[lang];const [open,setOpen]=useState(false);const [light,setLight]=useState(false);useEffect(()=>{document.body.classList.toggle("light",light);},[light]);return <header className="border-b border-white/10"><div className="container flex min-h-20 items-center justify-between gap-4"><Link href={`/${lang}`} className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full border border-gold text-xl serif gold">A</span><span><strong className="serif block">{t.brand}</strong><small className="muted">{t.tag}</small></span></Link><nav className="hidden lg:flex items-center gap-5 text-sm">{navKeys.slice(0,8).map(k=><Link key={k} className="hover:text-gold" href={`/${lang}/${paths[k]}`}>{t[k]}</Link>)}</nav><div className="flex items-center gap-2"><Link className="text-sm gold" href={`/${lang==="en"?"hi":"en"}`}>{lang==="en"?"हिन्दी":"English"}</Link><button aria-label="Toggle colour theme" className="p-2" onClick={()=>setLight(!light)}>{light?<Moon size={18}/>:<Sun size={18}/>}</button><button aria-label="Open navigation" className="lg:hidden p-2" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div></div>{open&&<nav className="container grid grid-cols-2 gap-3 pb-5 lg:hidden">{navKeys.map(k=><Link onClick={()=>setOpen(false)} key={k} href={`/${lang}/${paths[k]}`} className="py-1">{t[k]}</Link>)}</nav>}</header>}
export function Footer({lang}:{lang:Lang}){const t=copy[lang];return <footer className="border-t border-white/10 py-9"><div className="container flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><div className="serif text-lg">{t.brand}</div><p className="muted text-sm max-w-2xl">{t.footer}</p></div><div className="flex gap-4 text-sm"><Link href={`/${lang}/disclaimer`}>{t.disclaimer}</Link><Link href={`/${lang}/privacy`}>{t.privacy}</Link></div></div></footer>}
export function Shell({lang,children,chatbotEnabled=false}:{lang:Lang,children:React.ReactNode,chatbotEnabled?:boolean}){return <><a className="skip" href="#main">Skip to content</a><Header lang={lang}/><main id="main">{children}</main><Footer lang={lang}/><WhatsAppFloat/><LegalChatbot lang={lang} enabled={chatbotEnabled}/><FirstVisitDisclaimer lang={lang}/></>}
export function PageTitle({eyebrow,title,desc}:{eyebrow:string,title:string,desc?:string}){return <div className="mb-10"><div className="eyebrow mb-3">{eyebrow}</div><h1 className="serif text-4xl md:text-5xl mb-4">{title}</h1>{desc&&<p className="muted max-w-3xl leading-7">{desc}</p>}</div>}
