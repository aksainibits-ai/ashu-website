"use client";
import { useEffect, useState } from "react";

type Client = {
  id: string; enquiry_id: string | null; client_ref: string; name: string; phone: string;
  email: string | null; practice_area: string | null; status: "active" | "on_hold" | "completed" | "closed";
  next_follow_up: string | null; internal_notes: string | null; created_at: string;
};
type Enquiry = { id: string; name: string; phone: string; email: string | null; category: string | null; created_at: string };
const statusLabels: Record<Client["status"], string> = {
  active: "Active", on_hold: "On hold", completed: "Completed", closed: "Closed",
};

export default function ClientCRM() {
  const [clients, setClients] = useState<Client[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch("/api/admin/crm", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load client workspace");
    setClients(data.clients || []); setEnquiries(data.enquiries || []);
  }
  useEffect(() => { load().catch(e => setNotice(e.message)); }, []);

  async function convert(enquiry: Enquiry) {
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/admin/crm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enquiry_id: enquiry.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Conversion failed");
      setNotice(`Enquiry converted to client ${data.client.client_ref}.`);
      await load();
    } catch (e) { setNotice(e instanceof Error ? e.message : "Conversion failed"); }
    finally { setBusy(false); }
  }

  async function save(client: Client) {
    const status = (document.getElementById(`crm-status-${client.id}`) as HTMLSelectElement | null)?.value;
    const followUp = (document.getElementById(`crm-follow-${client.id}`) as HTMLInputElement | null)?.value || null;
    const notes = (document.getElementById(`crm-notes-${client.id}`) as HTMLTextAreaElement | null)?.value || "";
    setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/admin/crm", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: client.id, status, next_follow_up: followUp, internal_notes: notes }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Save failed");
      setNotice(`Saved ${client.client_ref}; activity recorded.`); await load();
    } catch (e) { setNotice(e instanceof Error ? e.message : "Save failed"); }
    finally { setBusy(false); }
  }

  const visible = clients.filter(c => [c.client_ref,c.name,c.phone,c.email || "",c.practice_area || ""]
    .some(v => v.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())));
  const followUps = clients.filter(c => c.next_follow_up && c.next_follow_up <= new Date().toISOString().slice(0,10) && c.status !== "closed" && c.status !== "completed").length;

  return <div className="space-y-8">
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="panel p-5"><p className="muted text-sm">Client records</p><p className="serif text-3xl mt-2">{clients.length}</p></div>
      <div className="panel p-5"><p className="muted text-sm">Unconverted enquiries</p><p className="serif text-3xl mt-2">{enquiries.length}</p></div>
      <div className="panel p-5"><p className="muted text-sm">Follow-ups due</p><p className="serif text-3xl mt-2">{followUps}</p></div>
    </div>
    <section className="space-y-3">
      <div><h2 className="serif text-2xl">Enquiry conversion queue</h2><p className="muted text-sm mt-1">Convert only after the office decides to open a client relationship. Existing enquiry text is not copied into this workspace.</p></div>
      {enquiries.length === 0 && <p className="muted text-sm">No unconverted enquiries.</p>}
      {enquiries.map(e => <article className="panel p-4 flex flex-wrap items-center justify-between gap-3" key={e.id}>
        <div><strong>{e.name}</strong><p className="muted text-sm mt-1">{e.phone} · {e.category || "General enquiry"}</p><p className="muted text-xs mt-1">{new Date(e.created_at).toLocaleDateString()}</p></div>
        <button className="btn" disabled={busy} onClick={() => convert(e)}>Create client record</button>
      </article>)}
    </section>
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="serif text-2xl">Client workspace</h2><p className="muted text-sm mt-1">Internal office records only. Do not enter privileged case narratives or upload sensitive documents here.</p></div>
        <button className="btn btn-outline" disabled={busy} onClick={() => load().catch(e => setNotice(e.message))}>Refresh</button>
      </div>
      <input className="field" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search client ref, name, phone or practice area" aria-label="Search clients" />
      {visible.map(c => <article className="panel p-5 space-y-3" key={c.id}>
        <div className="flex flex-wrap justify-between gap-2"><div><p className="eyebrow">{c.client_ref}</p><h3 className="serif text-xl mt-1">{c.name}</h3><p className="muted text-sm mt-1">{c.phone}{c.email ? ` · ${c.email}` : ""}</p></div><span className="gold text-xs">{statusLabels[c.status]}</span></div>
        <p className="muted text-sm">{c.practice_area || "Practice area not specified"}</p>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">Relationship status<select className="field mt-1" id={`crm-status-${c.id}`} defaultValue={c.status}>{Object.entries(statusLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label className="text-sm">Next follow-up<input className="field mt-1" id={`crm-follow-${c.id}`} type="date" defaultValue={c.next_follow_up || ""} /></label>
          <label className="text-sm md:col-span-1">Internal notes<textarea className="field mt-1 min-h-20" id={`crm-notes-${c.id}`} maxLength={3000} defaultValue={c.internal_notes || ""} placeholder="Minimal administrative note only" /></label>
        </div>
        <div className="flex flex-wrap justify-between items-center gap-2"><span className="muted text-xs">Created {new Date(c.created_at).toLocaleDateString()}</span><button className="btn" disabled={busy} onClick={() => save(c)}>Save client record</button></div>
      </article>)}
      {visible.length === 0 && <p className="muted text-sm">No matching client records.</p>}
    </section>
    <p className="muted text-sm" aria-live="polite">{notice}</p>
  </div>;
}
