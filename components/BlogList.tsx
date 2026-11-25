import {PageTitle} from "@/components/Site";
import BlogFilters from "@/components/BlogFilters";
import {createClient} from "@/lib/supabase/server";
import type {Lang} from "@/lib/content";
export const dynamic="force-dynamic";
export default async function BlogList({lang}:{lang:Lang}){
 let articles:{slug:string;title:string;category:string;summary:string|null;published_at:string|null}[]=[];
 try{const supabase=await createClient();const {data}=await supabase.from("articles").select("slug,title,category,summary,published_at").eq("language",lang).eq("status","published").order("published_at",{ascending:false}).limit(100);articles=data||[];}catch{}
 return <section className="container section"><PageTitle eyebrow={lang==="en"?"Legal knowledge library":"कानूनी ज्ञान संग्रह"} title={lang==="en"?"Legal Blog":"कानूनी ब्लॉग"} desc={lang==="en"?"General educational information. Verify current law and consult an appropriately qualified professional about an individual matter.":"यह सामान्य शैक्षिक जानकारी है। वर्तमान कानून की पुष्टि करें और व्यक्तिगत मामले के लिए योग्य अधिवक्ता से सलाह लें।"}/><BlogFilters lang={lang} articles={articles}/><p className="muted text-sm mt-8">{lang==="en"?"Articles are educational material and are published only after advocate review and approval.":"लेख शैक्षिक सामग्री हैं और अधिवक्ता की समीक्षा तथा स्वीकृति के बाद ही प्रकाशित किए जाते हैं।"}</p></section>;
}