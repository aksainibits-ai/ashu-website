import { redirect, notFound } from "next/navigation";
import { getStaff, canApprove } from "@/lib/authz";
import { PageTitle } from "@/components/Site";
import AppointmentManager from "@/components/AppointmentManager";
export const dynamic = "force-dynamic";
export default async function AdminAppointments({params}:{params:Promise<{lang:string}>}) {
 const {lang}=await params;if(lang!=="en"&&lang!=="hi")notFound();
 const staff=await getStaff();if(!staff)redirect("/"+lang+"/admin/login");
 if(!canApprove(staff.role))redirect("/"+lang+"/admin");
 return <section className="container section">
  <PageTitle eyebrow="Private administration" title={lang==="en"?"Appointment management":"अपॉइंटमेंट प्रबंधन"} desc={lang==="en"?"Publish office availability, review requests and confirm appointments. Each appointment is 30 minutes.":"कार्यालय की उपलब्धता प्रकाशित करें, अनुरोधों की समीक्षा करें और अपॉइंटमेंट की पुष्टि करें। प्रत्येक अपॉइंटमेंट 30 मिनट का है।"}/>
  <div className="mb-6"><a className="gold underline text-sm" href={"/"+lang+"/admin"}>← {lang==="en"?"Back to admin dashboard":"एडमिन डैशबोर्ड पर वापस जाएँ"}</a></div>
  <AppointmentManager lang={lang}/>
 </section>;
}
