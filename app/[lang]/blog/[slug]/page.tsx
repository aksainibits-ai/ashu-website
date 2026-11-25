import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {createClient} from "@/lib/supabase/server";
import {PageTitle} from "@/components/Site";
import MarkdownArticle from "@/components/MarkdownArticle";
import {profile,type Lang} from "@/lib/content";
export const dynamic="force-dynamic";
type Props={params:Promise<{lang:string;slug:string}>};
async function getArticle(lang:Lang,slug:string){const supabase=await createClient();const {data}=await supabase.from("articles").select("slug,title,category,summary,body_md,published_at,updated_at,seo_title,seo_description,source_urls").eq("language",lang).eq("slug",slug).eq("status","published").maybeSingle();return data;}
const baseUrl=()=> (process.env.NEXT_PUBLIC_SITE_URL||"https://ashu-website-two.vercel.app").replace(/\/$/,"");
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {lang,slug}=await params;if(lang!=="en"&&lang!=="hi")return {};
 const currentLang=lang as Lang;const article=await getArticle(currentLang,slug);if(!article)return {};
 const otherLang:Lang=currentLang==="en"?"hi":"en";const translated=await getArticle(otherLang,slug);const base=baseUrl();
 const languages:Record<string,string>={[currentLang]:`${base}/${currentLang}/blog/${encodeURIComponent(slug)}`};
 if(translated)languages[otherLang]=`${base}/${otherLang}/blog/${encodeURIComponent(slug)}`;
 return {
  title:article.seo_title||article.title,
  description:article.seo_description||article.summary||undefined,
  alternates:{canonical:`/${currentLang}/blog/${encodeURIComponent(slug)}`,languages},
  openGraph:{type:"article",title:article.seo_title||article.title,description:article.seo_description||article.summary||undefined,locale:currentLang==="hi"?"hi_IN":"en_IN",publishedTime:article.published_at||undefined,modifiedTime:article.updated_at||undefined,authors:[profile.name]},
 };
}
export default async function ArticlePage({params}:Props){
 const {lang,slug}=await params;if(lang!=="en"&&lang!=="hi")notFound();
 const article=await getArticle(lang,slug);if(!article)notFound();
 const structuredData={"@context":"https://schema.org","@type":"Article","headline":article.title,"description":article.summary||undefined,"datePublished":article.published_at||undefined,"dateModified":article.updated_at||article.published_at||undefined,"inLanguage":lang==="hi"?"hi-IN":"en-IN","author":{"@type":"Person","name":profile.name},"publisher":{"@type":"Person","name":profile.name},"mainEntityOfPage":`${baseUrl()}/${lang}/blog/${encodeURIComponent(slug)}`};
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData).replace(/</g,"\\u003c")}}/><article className="container section max-w-4xl"><PageTitle eyebrow={article.category} title={article.title} desc={article.summary||""}/><p className="muted text-sm mb-8">{article.published_at?new Date(article.published_at).toLocaleDateString(lang==="hi"?"hi-IN":"en-IN"):""}</p><MarkdownArticle source={article.body_md}/><section className="panel p-6 mt-12"><p className="muted text-sm">{lang==="en"?"This article is general educational information, not legal advice for an individual matter. Verify current law and consult an appropriately qualified advocate.":"यह लेख सामान्य शैक्षिक जानकारी है, किसी व्यक्तिगत मामले के लिए कानूनी सलाह नहीं। वर्तमान कानून की पुष्टि करें और योग्य अधिवक्ता से सलाह लें।"}</p>{article.source_urls?.length>0&&<div className="mt-4 text-xs muted break-all"><strong>{lang==="en"?"Primary sources:":"प्राथमिक स्रोत:"}</strong> {article.source_urls.join(" · ")}</div>}</section></article></>;
}
