import {NextResponse} from "next/server";
import {getStaff,canApprove} from "@/lib/authz";
import {createAdminClient} from "@/lib/supabase/admin";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store"};
async function authorised(request:Request){
 const staff=await getStaff();if(!staff)return {error:NextResponse.json({error:"Unauthorised"},{status:401,headers:noStore}),staff:null};
 const origin=request.headers.get("origin");const current=new URL(request.url).origin;
 const canonical=process.env.NEXT_PUBLIC_SITE_URL?new URL(process.env.NEXT_PUBLIC_SITE_URL).origin:null;
 if(request.method!=="GET"&&(!origin||(origin!==current&&origin!==canonical)))return {error:NextResponse.json({error:"Invalid request origin."},{status:403,headers:noStore}),staff:null};
 return {error:null,staff};
}
export async function GET(request:Request){
 const auth=await authorised(request);if(auth.error)return auth.error;
 const db=createAdminClient();const {data,error}=await db.from("ai_knowledge_entries").select("id,language,title,question_patterns,answer,source_urls,category,status,review_note,updated_at").order("updated_at",{ascending:false}).limit(200);
 if(error)return NextResponse.json({error:"Could not load the knowledge library."},{status:500,headers:noStore});
 return NextResponse.json({entries:data||[]},{headers:noStore});
}
export async function POST(request:Request){
 const auth=await authorised(request);if(auth.error)return auth.error;const body=await request.json().catch(()=>null);
 if(!body||!["en","hi"].includes(body.language)||typeof body.title!=="string"||typeof body.answer!=="string"||typeof body.category!=="string"||!Array.isArray(body.question_patterns)||!Array.isArray(body.source_urls))return NextResponse.json({error:"Invalid knowledge entry."},{status:400,headers:noStore});
 if(body.title.length<3||body.title.length>180||body.answer.length<20||body.answer.length>5000||body.question_patterns.length>30||body.source_urls.length>10)return NextResponse.json({error:"Entry exceeds allowed limits."},{status:400,headers:noStore});
 const patterns=body.question_patterns.filter((v:unknown)=>typeof v==="string"&&v.trim().length>1&&v.length<=160).map((v:string)=>v.trim());
 const urls=body.source_urls.filter((v:unknown)=>typeof v==="string"&&v.length<=500&&/^https:\/\//i.test(v));
 const db=createAdminClient();const {data,error}=await db.from("ai_knowledge_entries").insert({language:body.language,title:body.title.trim(),question_patterns:patterns,answer:body.answer.trim(),source_urls:urls,category:body.category.slice(0,60),status:"draft",created_by:auth.staff!.userId,updated_by:auth.staff!.userId}).select("id,title,status").single();
 if(error)return NextResponse.json({error:"Could not save the draft."},{status:500,headers:noStore});
 return NextResponse.json({entry:data},{status:201,headers:noStore});
}
export async function PATCH(request:Request){
 const auth=await authorised(request);if(auth.error)return auth.error;const body=await request.json().catch(()=>null);
 if(!body||typeof body.id!=="string"||!/^([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(body.id)||!["approved","draft","archived"].includes(body.status))return NextResponse.json({error:"Invalid update."},{status:400,headers:noStore});
 if(body.status==="approved"&&!canApprove(auth.staff!.role))return NextResponse.json({error:"Only an owner or advocate can approve knowledge."},{status:403,headers:noStore});
 const db=createAdminClient();const {data,error}=await db.from("ai_knowledge_entries").update({status:body.status,review_note:typeof body.review_note==="string"?body.review_note.slice(0,1000):null,updated_by:auth.staff!.userId,updated_at:new Date().toISOString()}).eq("id",body.id).select("id,status").maybeSingle();
 if(error||!data)return NextResponse.json({error:"Could not update this entry."},{status:500,headers:noStore});
 return NextResponse.json({entry:data},{headers:noStore});
}
