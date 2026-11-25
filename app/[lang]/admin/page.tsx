import { redirect } from "next/navigation";
import { getStaff } from "@/lib/authz";
import { PageTitle } from "@/components/Site";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function Admin({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "en" && lang !== "hi") redirect("/en/");
  const staff = await getStaff();
  if (!staff) redirect(`/${lang}/admin/login`);
  return <section className="container section">
    <PageTitle eyebrow="Private administration" title="Admin dashboard" desc={`Signed in as ${staff.email || "administrator"} · Role: ${staff.role}. All actions are checked again on the server.`} />
    <div className="flex justify-end mb-6"><form action="/api/auth/signout" method="post"><button className="btn btn-outline" type="submit">Sign out</button></form></div><AdminDashboard role={staff.role} />
  </section>;
}
