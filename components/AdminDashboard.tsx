"use client";
import { useEffect, useState } from "react";

type Article = { id: string; slug: string; language: string; title: string; category: string; summary: string | null; body_md: string; status: string; source_urls: string[]; verification_notes: string[]; created_at: string; scheduled_for: string | null };
type Enquiry = { id: string; name: string; phone: string; email: string | null; category: string | null; message: string; created_at: string };

export default function AdminDashboard({ role }: { role: "owner" | "advocate" | "editor" }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [sources, setSources] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const mayApprove = role === "owner" || role === "advocate";

  async function load() {
    const response = await fetch("/api/admin/articles", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load articles");
    setArticles(data.articles || []);
  }
  async function loadEnquiries() {
    if (!mayApprove) return;
    const response = await fetch("/api/admin/enquiries", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load enquiries");
    setEnquiries(data.enquiries || []);
  }
  useEffect(() => { load().catch(e => setNotice(e.message)); loadEnquiries().catch(e => setNotice(e.message)); }, []);

  async function generate() {
    setBusy(true); setNotice("");
    try {
      const sourceUrls = sources.split("\n").map(s => s.trim()).filter(Boolean);
      const response = await fetch("/api/admin/drafts/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceUrls }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Draft generation failed");
      setNotice("English and Hindi drafts created. Both remain unpublished for review.");
      await load();
    } catch (e) { setNotice(e instanceof Error ? e.message : "Draft generation failed"); }
    finally { setBusy(false); }
  }

  async function updateArticle(article: Article, patch: Record<string, unknown>) {
    setBusy(true); setNotice("");
    try {
      const response = await fetch(`/api/admin/articles/${article.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Update failed");
      setNotice("Article saved."); await load();
    } catch (e) { setNotice(e instanceof Error ? e.message : "Update failed"); }
    finally { setBusy(false); }
  }

  async function changeStatus(article: Article, status: string) {
    if (status === "published" && !window.confirm("Publish this advocate-approved article?")) return;
    await updateArticle(article, { status });
  }

  return <div className="space-y-10">
    <section className="panel p-6 space-y-4">
      <div><p className="eyebrow">Research-assisted workflow</p><h2 className="serif text-2xl mt-2">Create bilingual drafts</h2><p className="muted text-sm mt-2">Paste official primary-source URLs, one per line. The system retrieves those pages and prepares English and Hindi drafts. It does not publish them.</p></div>
      <textarea className="field min-h-28" value={sources} onChange={e => setSources(e.target.value)} placeholder="https://… official judgment / legislation source" />
      <button className="btn" disabled={busy} onClick={generate}>{busy ? "Working…" : "Generate English + Hindi drafts"}</button>
    </section>
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4"><h2 className="serif text-2xl">Article review queue</h2><button className="btn btn-outline" onClick={() => load().catch(e => setNotice(e.message))}>Refresh</button></div>
      {articles.length === 0 && <p className="muted">No articles yet.</p>}
      {articles.map(article => <article className="panel p-5 space-y-3" key={article.id}>
        <div className="flex flex-wrap justify-between gap-2"><span className="eyebrow">{article.language.toUpperCase()} · {article.category}</span><span className="text-xs gold">{article.status.toUpperCase()}</span></div>
        <label className="block text-sm">Title<input className="field mt-1" maxLength={180} defaultValue={article.title} id={`title-${article.id}`} /></label>
        <label className="block text-sm">Article body (Markdown)<textarea className="field mt-1 min-h-56" maxLength={40000} defaultValue={article.body_md} id={`body-${article.id}`} /></label>
        <p className="muted text-xs">Slug: {article.slug} · {new Date(article.created_at).toLocaleString()}</p>
        {article.source_urls?.length > 0 && <div className="text-xs muted break-all">Sources: {article.source_urls.join(" · ")}</div>}
        {article.verification_notes?.length > 0 && <p className="text-sm gold">Verification notes: {article.verification_notes.join(" ")}</p>}
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-outline" disabled={busy} onClick={() => updateArticle(article, {
            title: (document.getElementById(`title-${article.id}`) as HTMLInputElement)?.value,
            body_md: (document.getElementById(`body-${article.id}`) as HTMLTextAreaElement)?.value
          })}>Save edits</button>
          {article.status === "draft" && <button className="btn btn-outline" disabled={busy} onClick={() => changeStatus(article, "review")}>Send to review</button>}
          {mayApprove && article.status === "review" && <button className="btn" disabled={busy} onClick={() => changeStatus(article, "approved")}>Approve</button>}
          {mayApprove && article.status === "approved" && <><button className="btn" disabled={busy} onClick={() => changeStatus(article, "published")}>Publish now</button><input className="field max-w-xs" type="datetime-local" id={`schedule-${article.id}`} aria-label="Scheduled publication time"/><button className="btn btn-outline" disabled={busy} onClick={() => { const v=(document.getElementById(`schedule-${article.id}`) as HTMLInputElement)?.value; if(v) updateArticle(article,{scheduled_for:new Date(v).toISOString()}); }}>Schedule</button></>}
          {mayApprove && article.status !== "archived" && <><button className="btn btn-outline" disabled={busy} onClick={() => changeStatus(article, "archived")}>Archive</button><button className="btn btn-outline" disabled={busy} onClick={async()=>{if(window.confirm("Permanently delete this article?")){setBusy(true);const r=await fetch(`/api/admin/articles/${article.id}`,{method:"DELETE"});setBusy(false);if(r.ok){setNotice("Article deleted.");await load();}else setNotice("Delete failed.");}}}>Delete</button></>}
        </div>
      </article>)}
    </section>
    {mayApprove && <section className="space-y-4">
      <div className="flex justify-between items-center"><h2 className="serif text-2xl">Private enquiries</h2><button className="btn btn-outline" onClick={() => loadEnquiries().catch(e => setNotice(e.message))}>Refresh</button></div>
      <p className="muted text-sm">Restricted to advocate/owner accounts. Handle enquiries confidentially and delete them according to the approved retention policy.</p>
      {enquiries.length === 0 && <p className="muted">No stored enquiries or submissions are disabled.</p>}
      {enquiries.map(item => <article className="panel p-5 space-y-2" key={item.id}>
        <div className="flex flex-wrap justify-between gap-2"><strong>{item.name}</strong><span className="muted text-xs">{new Date(item.created_at).toLocaleString()}</span></div>
        <p className="text-sm">{item.phone} {item.email ? `· ${item.email}` : ""}</p>
        <p className="muted text-sm">{item.category || "General"} · {item.message}</p>
      </article>)}
    </section>}
    <p className="muted text-sm" aria-live="polite">{notice}</p>
  </div>;
}
