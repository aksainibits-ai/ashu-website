import { NextResponse } from "next/server";
import { getStaff, canApprove } from "@/lib/authz";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };
export async function GET() {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorised" }, { status: 401, headers: noStore });
  if (!canApprove(staff.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStore });
  const admin = await createClient();
  const [slots, appointments] = await Promise.all([
    admin.from("appointment_slots").select("id,starts_at,ends_at,is_available").gte("starts_at", new Date(Date.now()-86400000).toISOString()).order("starts_at").limit(150),
    admin.from("appointments").select("id,slot_id,name,phone,email,consultation_mode,language,status,created_at,retention_until,appointment_slots(starts_at,ends_at)").order("created_at", { ascending: false }).limit(100),
  ]);
  if (slots.error || appointments.error) return NextResponse.json({ error: "Could not load appointment records." }, { status: 500, headers: noStore });
  return NextResponse.json({ slots: slots.data || [], appointments: appointments.data || [] }, { headers: noStore });
}
export async function POST(request: Request) {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorised" }, { status: 401, headers: noStore });
  if (!canApprove(staff.role)) return NextResponse.json({ error: "Only the owner or advocate can manage office availability." }, { status: 403, headers: noStore });
  const origin = request.headers.get("origin");
  try {
    const current = new URL(request.url).origin;
    const canonical = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin : null;
    if (!origin || (origin !== current && origin !== canonical)) return NextResponse.json({ error: "Invalid origin." }, { status: 403, headers: noStore });
  } catch { return NextResponse.json({ error: "Invalid origin." }, { status: 403, headers: noStore }); }
  const body = await request.json().catch(() => null);
  if (!body || typeof body.startsAt !== "string") return NextResponse.json({ error: "Choose a valid start time." }, { status: 400, headers: noStore });
  const startsAt = new Date(body.startsAt);
  if (!Number.isFinite(startsAt.getTime()) || startsAt.getTime() < Date.now() + 10*60000)
    return NextResponse.json({ error: "Choose a future time at least 10 minutes from now." }, { status: 400, headers: noStore });
  const endsAt = new Date(startsAt.getTime() + 30*60000);
  const admin = createAdminClient();
  const { data, error } = await admin.from("appointment_slots").insert({
    starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(), created_by: staff.userId,
  }).select("id,starts_at,ends_at,is_available").single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "A slot already exists at this time." : "Could not create this slot." }, { status: 400, headers: noStore });
  return NextResponse.json({ slot: data }, { status: 201, headers: noStore });
}
