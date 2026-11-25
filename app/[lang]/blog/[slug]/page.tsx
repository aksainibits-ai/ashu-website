import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {createClient} from "@/lib/supabase/server";
import {PageTitle} from "@/components/Site";
import MarkdownArticle from "@/components/MarkdownArticle";
import type {Lang} from "@/lib/content";
export const dynamic="force-dynamic";
type Props={params:Promise<{lang:string;slug:string}>};
async function getArticle(lang:Lang,slug:string){const supabase=await createClient();const {data}=await supabase.from("articles").select("slug,title,category,summary,body_md,published_at,seo_title,seo_description,source_urls").eq("language",lang).eq("slug",slug).eq("status","published").maybeSingle();return data;}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {lang,slug}=await params;if(lang!=="en"&&lang!=="hi")return {};const a=await getArticle(lang,slug);return a?{title:a.seo_title||a.title,description:a.seo_description||a.summary||undefined}:{};}
export default async function ArticlePage({params}:Props){const {lang,slug}=await params;if(lang!=="en"&&lang!=="hi")notFound();const a=await getArticle(lang,slug);if(!a)notFound();return <article className="container section max-w-4xl"><PageTitle eyebrow={a.category} title={a.title} desc={a.summary||""}/><p className="muted text-sm mb-8">{a.published_at?new Date(a.published_at).toLocaleDateString(lang==="hi"?"hi-IN":"en-IN"):""}</p><MarkdownArticle source={a.body_md}/><section className="panel p-6 mt-12"><p className="muted text-sm">{lang==="en"?"This article is general educational information, not legal advice for an individual matter. Verify current law and consult an appropriately qualified advocate.":"यह लेख सामान्य शैक्षिक जानकारी है, किसी व्यक्तिगत मामले के लिए कानूनी सलाह नहीं। वर्तमान कानून की पुष्टि करें और योग्य अधिवक्ता से सलाह लें।"}</p>{a.source_urls?.length>0&&<div className="mt-4 text-xs muted break-all"><strong>Primary sources:</strong> {a.source_urls.join(" · ")}</div>}</section></article>;}