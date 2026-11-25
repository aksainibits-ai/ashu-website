import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
export const dynamic = "force-dynamic";
export async function GET(request:Request) {
 const secret=process.env.CRON_SECRET;
 if(!secret||request.headers.get("authorization")!==\`Bearer \${secret}\`) return NextResponse.json({error:"Unauthorised"},{status:401});
 const admin=createAdminClient();
 const {data,error}=await admin.from("enquiries").delete().lte("retention_until",new Date().toISOString()).select("id");
 if(error)return NextResponse.json({error:"Retention cleanup failed."},{status:500});
 return NextResponse.json({deleted:data?.length||0},{headers:{"Cache-Control":"no-store"}});
}