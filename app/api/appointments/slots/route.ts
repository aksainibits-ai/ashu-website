import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("appointment_slots")
      .select("id,starts_at,ends_at").eq("is_available", true)
      .gt("starts_at", new Date().toISOString()).order("starts_at").limit(100);
    if (error) return NextResponse.json({ error: "Appointment availability is temporarily unavailable." }, { status: 503 });
    return NextResponse.json({ slots: data || [] }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Appointment availability is temporarily unavailable." }, { status: 503 });
  }
}
