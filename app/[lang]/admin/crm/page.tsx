import { redirect } from "next/navigation";
import Link from "next/link";
import { getStaff, canApprove } from "@/lib/authz";
import { PageTitle } from "@/components/Site";
import ClientCRM from "@/components/ClientCRM";

export const dynamic = "force-dynamic";
export default async function AdminCRM({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "en" && lang !== "hi") redirect("/en/");
  const staff = await getStaff();
  if (!staff) redirect(`/${lang}/admin/login`);
  if (!canApprove(staff.role)) redirect(`/${lang}/admin`);
  return <section className="container section">
    <PageTitle eyebrow="Private administration" title="Client relationship workspace" desc="Convert selected enquiries into internal client records, track administrative follow-ups and keep a minimal activity trail." />
    <div className="flex flex-wrap gap-3 mb-6"><Link className="btn btn-outline" href={`/${lang}/admin`}>Back to dashboard</Link><Link className="btn btn-outline" href={`/${lang}/admin/insights`}>Business insights</Link></div>
    <ClientCRM />
  </section>;
}
