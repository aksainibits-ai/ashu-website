import { NextResponse } from "next/server";
import { getStaff } from "@/lib/authz";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (staff.role !== "owner" && staff.role !== "advocate") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = createAdminClient();
  const { data, error } = await admin.from("enquiries")
    .select("id,name,phone,email,category,message,created_at,retention_until")
    .order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "Could not load enquiries." }, { status: 500 });
  return NextResponse.json({ enquiries: data }, { headers: { "Cache-Control": "private, no-store" } });
}
