import { redirect } from "next/navigation";
import { getStaff } from "@/lib/authz";
import { PageTitle } from "@/components/Site";
import AdminLogin from "@/components/AdminLogin";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (lang !== "en" && lang !== "hi") redirect("/en/");
  if (await getStaff()) redirect(`/${lang}/admin`);
  return <section className="container section">
    <PageTitle eyebrow="Restricted access" title="Administrator sign in" desc="A secure email sign-in link is available only to accounts created and approved by the site owner." />
    <AdminLogin lang={lang} />
  </section>;
}
