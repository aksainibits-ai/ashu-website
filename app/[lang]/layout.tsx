import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {Shell} from "@/components/Site";
import {Lang} from "@/lib/content";
import ServiceWorker from "@/components/ServiceWorker";
export async function generateMetadata({params}:{params:Promise<{lang:string}>}):Promise<Metadata>{
 const {lang}=await params;const hindi=lang==="hi";
 return {title:hindi?"अधिवक्ता आशुतोष सैनी | कानूनी जानकारी":"Advocate Ashutosh Saini | Legal Information",description:hindi?"अधिवक्ता आशुतोष सैनी, रोहिणी, दिल्ली का व्यावसायिक परिचय और सामान्य कानूनी जानकारी।":"Professional profile and general legal information of Advocate Ashutosh Saini, Rohini, Delhi.",alternates:{languages:{en:"/en",hi:"/hi"}},openGraph:{type:"website",locale:hindi?"hi_IN":"en_IN",siteName:"Advocate Ashutosh Saini"}};
}
export default async function LocaleLayout({children,params}:{children:React.ReactNode,params:Promise<{lang:string}>}){
 const {lang}=await params;if(lang!=="en"&&lang!=="hi")notFound();
 return <><ServiceWorker/><Shell lang={lang as Lang} chatbotEnabled={process.env.ENABLE_CHATBOT==="true"}>{children}</Shell></>;
}