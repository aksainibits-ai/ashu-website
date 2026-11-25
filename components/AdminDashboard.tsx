"use client";
import { useEffect, useState } from "react";

type Article = {
  id: string; slug: string; language: string; title: string; category: string;
  summary: string | null; body_md: string; status: string; source_urls: string[];
  verification_notes: string[]; created_at: string; scheduled_for: string | null;
};
type Enquiry = {
  id: string; name: string; phone: string; email: string | null; category: string | null;
  message: string; status: "new" | "reviewing" | "responded" | "closed";
  internal_notes: string | null; created_at: string; updated_at: string;
};
type Activity = {
  id: string; action: string; entity_type: string; entity_id: string | null;
  metadata: { status?: string }; created_at: string;
};

const enquiryStatuses = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Under review" },
  { value: "responded", label: "Responded" },
  { value: "closed", label: "Closed" },
] as const;

export default function AdminDashboard({ role }: { role: "owner" | "advocate" | "editor" }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [enquiryFilter, setEnquiryFilter] = useState("all");
  const [enquirySearch, setEnquirySearch] = useState("");
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
    setActivity(data.activity || []);
  }

  useEffect(() => {
    load().catch(e => setNotice(e.message));
    loadEnquiries().catch(e => setNotice(e.message));
  }, []);

  async function generate() {
    setBusy(true); setNotice("");
    try {
      const sourceUrls = sources.split("\n").map(s => s.trim()).filter(Boolean);
      const response = await fetch("/api/admin/drafts/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrls }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Draft generation failed");
      setNotice("English and Hindi drafts created. Both remain unpublished for review.");
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Draft generation failed");
    } finally { setBusy(false); }
  }

  async function updateArticle(article: Article, patch: Record<string, unknown>) {
    setBusy(true); setNotice("");
    try {
      const response = await fetch(`/api/admin/articles/${article.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Update failed");
      setNotice("Article saved."); await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Update failed");
    } finally { setBusy(false); }
  }

  async function changeStatus(article: Article, status: string) {
    if (status === "published" && !window.confirm("Publish this advocate-approved article?")) return;
    await updateArticle(article, { status });
  }

  async function updateEnquiry(enquiry: Enquiry) {
    const status = (document.getElementById(`enquiry-status-${enquiry.id}`) as HTMLSelectElement | null)?.value;
    const internal_notes = (document.getElementById(`enquiry-notes-${enquiry.id}`) as HTMLTextAreaElement | null)?.value ?? "";
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/admin/enquiries", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: enquiry.id, status, internal_notes }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update enquiry");
      setNotice("Enquiry updated and activity recorded.");
      await loadEnquiries();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not update enquiry");
    } finally { setBusy(false); }
  }

  const articleCounts = {
    drafts: articles.filter(a => a.status === "draft").length,
    review: articles.filter(a => a.status === "review").length,
    approved: articles.filter(a => a.status === "approved").length,
    published: articles.filter(a => a.status === "published").length,
  };
  const openEnquiries = enquiries.filter(e => e.status !== "closed").length;
  const newEnquiries = enquiries.filter(e => e.status === "new").length;
  const reviewingEnquiries = enquiries.filter(e => e.status === "reviewing").length;
  const respondedEnquiries = enquiries.filter(e => e.status === "responded").length;
  const visibleEnquiries = enquiries.filter(item => {
    const statusMatch = enquiryFilter === "all" || item.status === enquiryFilter;
    const query = enquirySearch.trim().toLocaleLowerCase();
    const searchMatch = !query || [item.name, item.phone, item.email || "", item.category || "", item.message]
      .some(value => value.toLocaleLowerCase().includes(query));
    return statusMatch && searchMatch;
  });

  return <div className="space-y-10">
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Website content overview">
      {[
        ["Drafts", articleCounts.drafts], ["Awaiting review", articleCounts.review],
        ["Approved", articleCounts.approved], ["Published", articleCounts.published],
      ].map(([label, value]) => <div className="panel p-5" key={label}>
        <p className="muted text-sm">{label}</p><p className="serif text-3xl mt-2">{value}</p>
      </div>)}
    </section>

    <section className="panel p-6 space-y-4">
      <div>
        <p className="eyebrow">Research-assisted workflow</p>
        <h2 className="serif text-2xl mt-2">Create bilingual drafts</h2>
        <p className="muted text-sm mt-2">Paste official primary-source URLs, one per line. The system retrieves those pages and prepares English and Hindi drafts. It does not publish them. Draft generation requires the server-side OpenAI API key.</p>
      </div>
      <textarea className="field min-h-28" value={sources} onChange={e => setSources(e.target.value)} placeholder="https://… official judgment / legislation source" />
      <button className="btn" disabled={busy || !sources.trim()} onClick={generate}>{busy ? "Working…" : "Generate English + Hindi drafts"}</button>
    </section>

    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="serif text-2xl">Article review queue</h2>
        <button className="btn btn-outline" disabled={busy} onClick={() => load().catch(e => setNotice(e.message))}>Refresh</button>
      </div>
      {articles.length === 0 && <p className="muted">No articles yet.</p>}
      {articles.map(article => <article className="panel p-5 space-y-3" key={article.id}>
        <div className="flex flex-wrap justify-between gap-2">
          <span className="eyebrow">{article.language.toUpperCase()} · {article.category}</span>
          <span className="text-xs gold">{article.status.toUpperCase()}</span>
        </div>
        <label className="block text-sm">Title
          <input className="field mt-1" maxLength={180} defaultValue={article.title} id={`title-${article.id}`} />
        </label>
        <label className="block text-sm">Article body (Markdown)
          <textarea className="field mt-1 min-h-56" maxLength={40000} defaultValue={article.body_md} id={`body-${article.id}`} />
        </label>
        <p className="muted text-xs">Slug: {article.slug} · {new Date(article.created_at).toLocaleString()}</p>
        {article.source_urls?.length > 0 && <div className="text-xs muted break-all">Sources: {article.source_urls.join(" · ")}</div>}
        {article.verification_notes?.length > 0 && <p className="text-sm gold">Verification notes: {article.verification_notes.join(" ")}</p>}
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-outline" disabled={busy} onClick={() => updateArticle(article, {
            title: (document.getElementById(`title-${article.id}`) as HTMLInputElement)?.value,
            body_md: (document.getElementById(`body-${article.id}`) as HTMLTextAreaElement)?.value,
          })}>Save edits</button>
          {article.status === "draft" && <button className="btn btn-outline" disabled={busy} onClick={() => changeStatus(article, "review")}>Send to review</button>}
          {mayApprove && article.status === "review" && <button className="btn" disabled={busy} onClick={() => changeStatus(article, "approved")}>Approve</button>}
          {mayApprove && article.status === "approved" && <>
            <button className="btn" disabled={busy} onClick={() => changeStatus(article, "published")}>Publish now</button>
            <input className="field max-w-xs" type="datetime-local" id={`schedule-${article.id}`} aria-label="Scheduled publication time" />
            <button className="btn btn-outline" disabled={busy} onClick={() => {
              const value = (document.getElementById(`schedule-${article.id}`) as HTMLInputElement)?.value;
              if (value) updateArticle(article, { scheduled_for: new Date(value).toISOString() });
            }}>Schedule</button>
          </>}
          {mayApprove && article.status !== "archived" && <>
            <button className="btn btn-outline" disabled={busy} onClick={() => changeStatus(article, "archived")}>Archive</button>
            <button className="btn btn-outline" disabled={busy} onClick={async () => {
              if (!window.confirm("Permanently delete this article?")) return;
              setBusy(true);
              const response = await fetch(`/api/admin/articles/${article.id}`, { method: "DELETE" });
              setBusy(false);
              if (response.ok) { setNotice("Article deleted."); await load(); }
              else setNotice("Delete failed.");
            }}>Delete</button>
          </>}
        </div>
      </article>)}
    </section>

    {mayApprove && <section className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div><h2 className="serif text-2xl">Private enquiries</h2><p className="muted text-sm mt-1">{openEnquiries} open · {enquiries.length} total · {visibleEnquiries.length} matching</p></div>
        <button className="btn btn-outline" disabled={busy} onClick={() => loadEnquiries().catch(e => setNotice(e.message))}>Refresh</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="panel p-4"><p className="muted text-xs">New enquiries</p><p className="serif mt-1 text-2xl">{newEnquiries}</p></div>
        <div className="panel p-4"><p className="muted text-xs">Under review</p><p className="serif mt-1 text-2xl">{reviewingEnquiries}</p></div>
        <div className="panel p-4"><p className="muted text-xs">Responded</p><p className="serif mt-1 text-2xl">{respondedEnquiries}</p></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
        <input className="field" value={enquirySearch} onChange={e => setEnquirySearch(e.target.value)} placeholder="Search name, phone, email or enquiry text" aria-label="Search private enquiries" />
        <select className="field" value={enquiryFilter} onChange={e => setEnquiryFilter(e.target.value)} aria-label="Filter enquiries by status">
          <option value="all">All statuses</option>{enquiryStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <p className="muted text-sm">Restricted to advocate/owner accounts. Status changes and internal-note updates are recorded in the private activity log. Handle enquiries confidentially and delete them according to the approved retention policy.</p>
      {enquiries.length === 0 && <p className="muted">No stored enquiries or submissions are disabled.</p>}
      {visibleEnquiries.map(item => <article className="panel p-5 space-y-3" key={item.id}>
        <div className="flex flex-wrap justify-between gap-2">
          <strong>{item.name}</strong><span className="muted text-xs">{new Date(item.created_at).toLocaleString()}</span>
        </div>
        <p className="text-sm">{item.phone} {item.email ? `· ${item.email}` : ""}</p>
        <div className="flex flex-wrap gap-2">
          <a className="btn btn-outline" href={`https://wa.me/${item.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hello " + item.name + ", thank you for your general enquiry. We are following up on your message.")}`} target="_blank" rel="noopener noreferrer">WhatsApp follow-up</a>
          <a className="btn btn-outline" href={`tel:${item.phone.replace(/[^+0-9]/g, "")}`}>Call</a>
          {item.email && <a className="btn btn-outline" href={`mailto:${item.email}?subject=${encodeURIComponent("Follow-up to your general enquiry")}`}>Email</a>}
        </div>
        <p className="muted text-sm">{item.category || "General"} · {item.message}</p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm">Status
            <select className="field mt-1" id={`enquiry-status-${item.id}`} defaultValue={item.status || "new"}>
              {enquiryStatuses.map(s => <option value={s.value} key={s.value}>{s.label}</option>)}
            </select>
          </label>
          <label className="block text-sm">Private internal notes
            <textarea className="field mt-1 min-h-20" id={`enquiry-notes-${item.id}`} maxLength={3000} defaultValue={item.internal_notes || ""} placeholder="Internal follow-up notes — never visible to the visitor" />
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="muted text-xs">Last updated: {new Date(item.updated_at || item.created_at).toLocaleString()}</span>
          <button className="btn" disabled={busy} onClick={() => updateEnquiry(item)}>Save enquiry</button>
        </div>
      </article>)}
    </section>}

    {mayApprove && <section className="space-y-3">
      <h2 className="serif text-2xl">Private admin activity</h2>
      <p className="muted text-sm">Recent enquiry workflow changes. This log stores action metadata, not message contents or contact details.</p>
      {activity.length === 0 && <p className="muted text-sm">No recorded activity yet.</p>}
      <div className="panel divide-y divide-white/10">
        {activity.map(item => <div className="p-4 flex flex-wrap justify-between gap-2" key={item.id}>
          <div><p className="text-sm">{item.action.replaceAll(".", " ")}</p><p className="muted text-xs mt-1">{item.entity_type}{item.metadata?.status ? ` · ${item.metadata.status}` : ""}</p></div>
          <time className="muted text-xs">{new Date(item.created_at).toLocaleString()}</time>
        </div>)}
      </div>
    </section>}

    <p className="muted text-sm" aria-live="polite">{notice}</p>
  </div>;
}
