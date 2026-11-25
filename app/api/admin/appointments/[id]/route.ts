import { NextResponse } from "next/server";
import { getStaff, canApprove } from "@/lib/authz";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };
const allowed = new Set(["confirmed","declined","cancelled","completed"]);
export async function PATCH(request: Request, { params }: { params: Promise<{id:string}> }) {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorised" }, { status: 401, headers: noStore });
  if (!canApprove(staff.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStore });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid appointment." }, { status: 400, headers: noStore });
  const origin = request.headers.get("origin");
  try {
    const current = new URL(request.url).origin;
    const canonical = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin : null;
    if (!origin || (origin !== current && origin !== canonical)) return NextResponse.json({ error: "Invalid origin." }, { status: 403, headers: noStore });
  } catch { return NextResponse.json({ error: "Invalid origin." }, { status: 403, headers: noStore }); }
  const body = await request.json().catch(() => null);
  if (!body || typeof body.status !== "string" || !allowed.has(body.status))
    return NextResponse.json({ error: "Invalid appointment status." }, { status: 400, headers: noStore });
  const admin = await createClient();
  const { data: current, error: readError } = await admin.from("appointments").select("id,slot_id,status").eq("id", id).maybeSingle();
  if (readError || !current) return NextResponse.json({ error: "Appointment not found." }, { status: 404, headers: noStore });
  const transitions: Record<string,string[]> = {
    pending: ["confirmed","declined","cancelled"],
    confirmed: ["cancelled","completed"],
    declined: [], cancelled: [], completed: [],
  };
  if (!transitions[current.status]?.includes(body.status))
    return NextResponse.json({ error: "This status transition is not permitted." }, { status: 409, headers: noStore });
  const { data, error } = await admin.from("appointments").update({ status: body.status, updated_at: new Date().toISOString() })
    .eq("id", id).select("id,status,slot_id").single();
  if (error) return NextResponse.json({ error: "Could not update appointment." }, { status: 500, headers: noStore });
  if (body.status === "declined" || body.status === "cancelled") {
    await admin.from("appointment_slots").update({ is_available: true }).eq("id", current.slot_id).gt("starts_at", new Date().toISOString());
  }
  await admin.from("appointment_events").insert({
    appointment_id: id, actor_id: staff.userId, event_type: "appointment."+body.status,
    metadata: { previous_status: current.status, new_status: body.status },
  });
  return NextResponse.json({ appointment: data }, { headers: noStore });
}
