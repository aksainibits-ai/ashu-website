import { redirect } from "next/navigation";
import Link from "next/link";
import { getStaff, canApprove } from "@/lib/authz";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageTitle } from "@/components/Site";

export const dynamic = "force-dynamic";
async function count(db: ReturnType<typeof createAdminClient>, table: string, filters?: [string,string][]) {
  let query = db.from(table).select("id", { count: "exact", head: true });
  for (const [column,value] of filters || []) query = query.eq(column,value);
  const result = await query;
  if (result.error) return null;
  return result.count ?? 0;
}
export default async function AdminInsights({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "en" && lang !== "hi") redirect("/en/");
  const staff = await getStaff();
  if (!staff) redirect(`/${lang}/admin/login`);
  if (!canApprove(staff.role)) redirect(`/${lang}/admin`);
  const db = createAdminClient();
  const [allEnquiries,newEnquiries,reviewing,responded,allAppointments,pendingAppointments,confirmedAppointments,allClients,activeClients,followUps,articlesPublished] = await Promise.all([
    count(db,"enquiries"),count(db,"enquiries",[["status","new"]]),count(db,"enquiries",[["status","reviewing"]]),count(db,"enquiries",[["status","responded"]]),
    count(db,"appointments"),count(db,"appointments",[["status","pending"]]),count(db,"appointments",[["status","confirmed"]]),
    count(db,"client_records"),count(db,"client_records",[["status","active"]]),
    (async()=>{const r=await db.from("client_records").select("id",{count:"exact",head:true}).not("next_follow_up","is",null).lte("next_follow_up",new Date().toISOString().slice(0,10)).not("status","in",'("closed","completed")');return r.error?null:r.count??0;})(),
    count(db,"articles",[["status","published"]]),
  ]);
  const metrics = [
    ["Total enquiries",allEnquiries,"New",newEnquiries],["In review",reviewing,"Responded",responded],
    ["Appointments",allAppointments,"Awaiting confirmation",pendingAppointments],["Confirmed appointments",confirmedAppointments,"",null],
    ["Client records",allClients,"Active clients",activeClients],["Follow-ups due",followUps,"Published articles",articlesPublished],
  ] as const;
  return <section className="container section">
    <PageTitle eyebrow="Private administration" title="Business insights" desc="Live operational counts from the website database. This is an internal workflow dashboard, not a marketing or success-rate report." />
    <div className="flex flex-wrap gap-3 mb-6"><Link className="btn btn-outline" href={`/${lang}/admin`}>Back to dashboard</Link><Link className="btn btn-outline" href={`/${lang}/admin/crm`}>Open client workspace</Link></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(([label,value,subLabel,subValue])=><article className="panel p-5" key={label}><p className="muted text-sm">{label}</p><p className="serif text-3xl mt-2">{value===null?"—":value}</p>{subLabel&&<p className="muted text-xs mt-3">{subLabel}: {subValue===null?"—":subValue}</p>}</article>)}</div>
    <p className="muted text-sm mt-6">Counts are read live when this page loads. A dash indicates that the database did not return a count; it is not interpreted as zero. No client message content or personal contact details are shown here.</p>
  </section>;
}
