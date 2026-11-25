import { NextResponse } from "next/server";
import { canApprove, getStaff } from "@/lib/authz";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const statuses = new Set(["active", "on_hold", "completed", "closed"]);

async function staffFor(request: Request) {
  const staff = await getStaff();
  if (!staff) return { staff: null, response: NextResponse.json({ error: "Unauthorised" }, { status: 401, headers }) };
  if (!canApprove(staff.role)) return { staff: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403, headers }) };
  if (request.method !== "GET") {
    const origin = request.headers.get("origin");
    const current = new URL(request.url).origin;
    const canonical = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin : null;
    if (!origin || (origin !== current && origin !== canonical))
      return { staff: null, response: NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers }) };
  }
  return { staff, response: null };
}

export async function GET(request: Request) {
  const auth = await staffFor(request);
  if (auth.response) return auth.response;
  const db = createAdminClient();
  const [clients, enquiries] = await Promise.all([
    db.from("client_records").select("id,enquiry_id,client_ref,name,phone,email,practice_area,status,next_follow_up,internal_notes,created_at,updated_at").order("updated_at", { ascending: false }).limit(200),
    db.from("enquiries").select("id,name,phone,email,category,created_at,status").order("created_at", { ascending: false }).limit(150),
  ]);
  if (clients.error || enquiries.error) return NextResponse.json({ error: "Could not load the client workspace." }, { status: 500, headers });
  const converted = new Set((clients.data || []).map((c) => c.enquiry_id).filter(Boolean));
  return NextResponse.json({
    clients: clients.data || [],
    enquiries: (enquiries.data || []).filter((e) => !converted.has(e.id)),
  }, { headers });
}

export async function POST(request: Request) {
  const auth = await staffFor(request);
  if (auth.response) return auth.response;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.enquiry_id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.enquiry_id))
    return NextResponse.json({ error: "Choose a valid enquiry." }, { status: 400, headers });
  const db = createAdminClient();
  const { data: enquiry, error: enquiryError } = await db.from("enquiries")
    .select("id,name,phone,email,category").eq("id", body.enquiry_id).maybeSingle();
  if (enquiryError || !enquiry) return NextResponse.json({ error: "Enquiry not found." }, { status: 404, headers });
  const { data, error } = await db.from("client_records").insert({
    enquiry_id: enquiry.id, name: enquiry.name, phone: enquiry.phone, email: enquiry.email,
    practice_area: enquiry.category, created_by: auth.staff!.userId,
  }).select("id,client_ref,name,status").single();
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "This enquiry is already in the client workspace." }, { status: 409, headers });
    return NextResponse.json({ error: "Could not convert this enquiry." }, { status: 500, headers });
  }
  await db.from("admin_audit_log").insert({
    actor_id: auth.staff!.userId, action: "client.created_from_enquiry", entity_type: "client",
    entity_id: data.id, metadata: { source: "enquiry_conversion" },
  });
  return NextResponse.json({ client: data }, { status: 201, headers });
}

export async function PATCH(request: Request) {
  const auth = await staffFor(request);
  if (auth.response) return auth.response;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id))
    return NextResponse.json({ error: "Invalid client record." }, { status: 400, headers });
  if (body.status !== undefined && (typeof body.status !== "string" || !statuses.has(body.status)))
    return NextResponse.json({ error: "Invalid client status." }, { status: 400, headers });
  if (body.internal_notes !== undefined && (typeof body.internal_notes !== "string" || body.internal_notes.length > 3000))
    return NextResponse.json({ error: "Notes must be 3,000 characters or fewer." }, { status: 400, headers });
  if (body.next_follow_up !== undefined && body.next_follow_up !== null &&
      (typeof body.next_follow_up !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.next_follow_up)))
    return NextResponse.json({ error: "Choose a valid follow-up date." }, { status: 400, headers });
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status !== undefined) patch.status = body.status;
  if (body.internal_notes !== undefined) patch.internal_notes = body.internal_notes.trim() || null;
  if (body.next_follow_up !== undefined) patch.next_follow_up = body.next_follow_up || null;
  if (Object.keys(patch).length === 1) return NextResponse.json({ error: "No changes supplied." }, { status: 400, headers });
  const db = createAdminClient();
  const { data, error } = await db.from("client_records").update(patch).eq("id", body.id)
    .select("id,client_ref,status,next_follow_up,updated_at").maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Could not update this client record." }, { status: 404, headers });
  await db.from("admin_audit_log").insert({
    actor_id: auth.staff!.userId, action: "client.updated", entity_type: "client",
    entity_id: body.id, metadata: { status: data.status, follow_up_set: Boolean(data.next_follow_up) },
  });
  return NextResponse.json({ client: data }, { headers });
}
