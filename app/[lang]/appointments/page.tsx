import { notFound } from "next/navigation";
import { PageTitle } from "@/components/Site";
import AppointmentRequest from "@/components/AppointmentRequest";
export const dynamic = "force-dynamic";
export default async function Appointments({params}:{params:Promise<{lang:string}>}) {
 const {lang}=await params;if(lang!=="en"&&lang!=="hi")notFound();
 const en=lang==="en";
 return <section className="container section">
  <PageTitle eyebrow={en?"Office appointment requests":"कार्यालय अपॉइंटमेंट अनुरोध"} title={en?"Request a consultation":"परामर्श का अनुरोध करें"} desc={en?"Thirty-minute appointments are offered in person or online, subject to office-published availability and confirmation.":"कार्यालय द्वारा प्रकाशित उपलब्धता और पुष्टि के अधीन 30 मिनट का परामर्श व्यक्तिगत या ऑनलाइन माध्यम से अनुरोध किया जा सकता है।"}/>
  <div className="mx-auto max-w-3xl"><AppointmentRequest lang={lang}/></div>
 </section>;
}
