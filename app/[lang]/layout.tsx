import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {Shell} from "@/components/Site";
import {Lang,profile} from "@/lib/content";
import ServiceWorker from "@/components/ServiceWorker";

const siteUrl=process.env.NEXT_PUBLIC_SITE_URL||"https://ashu-website-two.vercel.app";
export async function generateMetadata({params}:{params:Promise<{lang:string}>}):Promise<Metadata>{
 const {lang}=await params;const hindi=lang==="hi";
 return {
  title:hindi?"अधिवक्ता आशुतोष सैनी | कानूनी जानकारी":"Advocate Ashutosh Saini | Legal Information",
  description:hindi?"अधिवक्ता आशुतोष सैनी, रोहिणी, दिल्ली का व्यावसायिक परिचय और सामान्य कानूनी जानकारी।":"Professional profile and general legal information of Advocate Ashutosh Saini, Rohini, Delhi.",
  openGraph:{type:"website",locale:hindi?"hi_IN":"en_IN",siteName:"Advocate Ashutosh Saini",url:siteUrl,title:hindi?"अधिवक्ता आशुतोष सैनी | कानूनी जानकारी":"Advocate Ashutosh Saini | Legal Information"},
 };
}
export default async function LocaleLayout({children,params}:{children:React.ReactNode,params:Promise<{lang:string}>}){
 const {lang}=await params;if(lang!=="en"&&lang!=="hi")notFound();
 const structuredData={"@context":"https://schema.org","@graph":[
  {"@type":"Person","@id":siteUrl+"/#advocate","name":profile.name,"alternateName":"अधिवक्ता आशुतोष सैनी","jobTitle":"Advocate","url":siteUrl,"email":profile.email,"telephone":profile.phone,"address":{"@type":"PostalAddress","addressLocality":"Rohini","addressRegion":"Delhi","addressCountry":"IN"},"knowsAbout":["Indian law","Civil litigation","Criminal litigation","Constitutional law","Legal research"]},
  {"@type":"WebSite","@id":siteUrl+"/#website","name":"Advocate Ashutosh Saini","url":siteUrl,"inLanguage":["en-IN","hi-IN"],"about":{"@id":siteUrl+"/#advocate"}}
 ]};
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData).replace(/</g,"\\u003c")}}/><ServiceWorker/><Shell lang={lang as Lang} chatbotEnabled={process.env.ENABLE_CHATBOT==="true"}>{children}</Shell></>;
}
