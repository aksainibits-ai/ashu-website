import {NextResponse} from "next/server";
import {createAdminClient} from "@/lib/supabase/admin";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET;if(!secret||request.headers.get("authorization")!==`Bearer ${secret}`)return NextResponse.json({error:"Unauthorised"},{status:401});
 const admin=createAdminClient();const now=new Date().toISOString();
 const {data,error}=await admin.from("articles").update({status:"published",published_at:now,updated_at:now}).eq("status","approved").not("approved_by","is",null).not("approved_at","is",null).lte("scheduled_for",now).select("id,slug,language,title");
 if(error)return NextResponse.json({error:"Scheduled publication failed."},{status:500});
 return NextResponse.json({published:data?.length||0,articles:data||[]},{headers:{"Cache-Control":"no-store"}});
}