import { NextResponse } from "next/server";
import { getStaff } from "@/lib/authz";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };
const validStatuses = new Set(["new", "reviewing", "responded", "closed"]);

export async function GET() {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorised" }, { status: 401, headers: noStore });
  if (staff.role !== "owner" && staff.role !== "advocate") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStore });
  }

  const admin = createAdminClient();
  const [enquiryResult, auditResult] = await Promise.all([
    admin.from("enquiries")
      .select("id,name,phone,email,category,message,status,internal_notes,created_at,updated_at,retention_until")
      .order("created_at", { ascending: false }).limit(100),
    admin.from("admin_audit_log")
      .select("id,actor_id,action,entity_type,entity_id,metadata,created_at")
      .order("created_at", { ascending: false }).limit(30),
  ]);

  if (enquiryResult.error) return NextResponse.json({ error: "Could not load enquiries." }, { status: 500, headers: noStore });
  return NextResponse.json({
    enquiries: enquiryResult.data || [],
    activity: auditResult.error ? [] : auditResult.data || [],
  }, { headers: noStore });
}

export async function PATCH(request: Request) {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorised" }, { status: 401, headers: noStore });
  if (staff.role !== "owner" && staff.role !== "advocate") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStore });
  }

  const expectedOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  const origin = request.headers.get("origin");
  try {
    if (!expectedOrigin || !origin || new URL(origin).origin !== new URL(expectedOrigin).origin) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers: noStore });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers: noStore });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id)) {
    return NextResponse.json({ error: "Invalid enquiry." }, { status: 400, headers: noStore });
  }
  if (body.status !== undefined && (typeof body.status !== "string" || !validStatuses.has(body.status))) {
    return NextResponse.json({ error: "Invalid enquiry status." }, { status: 400, headers: noStore });
  }
  if (body.internal_notes !== undefined &&
      (typeof body.internal_notes !== "string" || body.internal_notes.length > 3000)) {
    return NextResponse.json({ error: "Internal notes must be 3,000 characters or fewer." }, { status: 400, headers: noStore });
  }
  if (body.status === undefined && body.internal_notes === undefined) {
    return NextResponse.json({ error: "No changes supplied." }, { status: 400, headers: noStore });
  }

  const admin = createAdminClient();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status !== undefined) update.status = body.status;
  if (body.internal_notes !== undefined) update.internal_notes = body.internal_notes.trim() || null;

  const { data, error } = await admin.from("enquiries").update(update).eq("id", body.id)
    .select("id,status,internal_notes,updated_at").maybeSingle();
  if (error) return NextResponse.json({ error: "Could not update this enquiry." }, { status: 500, headers: noStore });
  if (!data) return NextResponse.json({ error: "Enquiry not found." }, { status: 404, headers: noStore });

  await admin.from("admin_audit_log").insert({
    actor_id: staff.userId,
    action: body.status !== undefined ? "enquiry.updated" : "enquiry.notes_updated",
    entity_type: "enquiry",
    entity_id: body.id,
    metadata: { status: data.status },
  });

  return NextResponse.json({ enquiry: data }, { headers: noStore });
}
