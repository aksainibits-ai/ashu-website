import type {NextRequest} from "next/server";
import {updateSession} from "@/lib/supabase/middleware";
export async function middleware(request:NextRequest){
 const headers=new Headers(request.headers);
 const firstSegment=request.nextUrl.pathname.split("/")[1];
 headers.set("x-site-language",firstSegment==="hi"?"hi":"en");
 return updateSession(request,headers);
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"]};