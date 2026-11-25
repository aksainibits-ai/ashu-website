import {NextResponse,type NextRequest} from "next/server";
import {createClient} from "@/lib/supabase/server";
export async function POST(request:NextRequest){
 const origin=request.headers.get("origin");
 if(!origin||new URL(origin).origin!==request.nextUrl.origin)return NextResponse.json({error:"Invalid origin"},{status:403});
 const supabase=await createClient();await supabase.auth.signOut();
 return NextResponse.redirect(new URL("/en/admin/login",request.url),303);
}
