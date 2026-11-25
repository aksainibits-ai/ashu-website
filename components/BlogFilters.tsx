"use client";
import Link from "next/link";
import {useMemo,useState} from "react";
type Item={slug:string;title:string;category:string;summary:string|null;published_at:string|null};
export default function BlogFilters({lang,articles}:{lang:"en"|"hi";articles:Item[]}){
 const [query,setQuery]=useState("");const [category,setCategory]=useState("all");
 const categories=["all",...Array.from(new Set(articles.map(a=>a.category)))];
 const filtered=useMemo(()=>articles.filter(a=>(category==="all"||a.category===category)&&`${a.title} ${a.summary||""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())),[articles,category,query]);
 return <><div className="flex flex-col md:flex-row gap-3 mb-7"><input className="field" placeholder={lang==="en"?"Search articles":"लेख खोजें"} value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search articles"/><select className="field md:max-w-xs" value={category} onChange={e=>setCategory(e.target.value)} aria-label="Filter category">{categories.map(c=><option key={c} value={c}>{c==="all"?(lang==="en"?"All categories":"सभी श्रेणियाँ"):c}</option>)}</select></div><div className="card-grid">{filtered.map(a=><article className="panel p-7" key={a.slug}><div className="eyebrow">{a.category}</div><h2 className="serif text-2xl mt-3"><Link href={`/${lang}/blog/${a.slug}`}>{a.title}</Link></h2><p className="muted mt-3 leading-7">{a.summary}</p><span className="text-xs gold block mt-5">{a.published_at?new Date(a.published_at).toLocaleDateString(lang==="hi"?"hi-IN":"en-IN"):""}</span></article>)}</div>{filtered.length===0&&<p className="muted">{lang==="en"?"No published articles match this search.":"इस खोज से मेल खाने वाला कोई प्रकाशित लेख नहीं मिला।"}</p>}</>;
}