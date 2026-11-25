import {redirect} from "next/navigation";
import {getStaff} from "@/lib/authz";
import {PageTitle} from "@/components/Site";
import AdminAiKnowledge from "@/components/AdminAiKnowledge";
export const dynamic="force-dynamic";
export default async function AdminAiPage({params}:{params:Promise<{lang:string}>}){
 const {lang}=await params;if(lang!=="en"&&lang!=="hi")redirect("/en/");
 const staff=await getStaff();if(!staff)redirect(`/${lang}/admin/login`);
 return <section className="container section"><PageTitle eyebrow="Private administration" title="Ashu AI knowledge training" desc="Manage bilingual, source-backed answers used by the no-API-key legal information engine."/><AdminAiKnowledge role={staff.role}/></section>;
}
