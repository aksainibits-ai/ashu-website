import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };
export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    const requestOrigin = new URL(request.url).origin;
    const canonicalOrigin = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin : null;
    if (!origin || (origin !== requestOrigin && origin !== canonicalOrigin)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers: noStore });
    if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) return NextResponse.json({ error: "JSON requests only." }, { status: 415, headers: noStore });
    const raw = await request.text();
    if (raw.length > 6000) return NextResponse.json({ error: "Request is too large." }, { status: 413, headers: noStore });
    const body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body) || typeof body.slotId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.slotId) || typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 100 || typeof body.phone !== "string" || !/^[+0-9() .-]{7,24}$/.test(body.phone.trim()) || (body.email !== undefined && body.email !== "" && (typeof body.email !== "string" || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))) || !["in_person","online"].includes(body.mode) || !["en","hi"].includes(body.language) || body.consent !== true) return NextResponse.json({ error: "Please check the required fields and consent." }, { status: 400, headers: noStore });
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("request_appointment", {
      p_slot_id: body.slotId, p_name: body.name.trim(), p_phone: body.phone.trim(),
      p_email: typeof body.email === "string" ? body.email.trim() || null : null,
      p_mode: body.mode, p_language: body.language, p_consent: body.consent,
      p_client_key: createHash("sha256").update(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown").digest("hex"),
    });
    if (error) {
      const unavailable = /no longer available|invalid appointment request/i.test(error.message);
      const limited = /request limit reached/i.test(error.message);
      return NextResponse.json({ error: unavailable ? "That slot is no longer available. Please refresh and choose another." : "Appointment requests are temporarily unavailable." }, { status: limited ? 429 : unavailable ? 409 : 503, headers: noStore });
    }
    return NextResponse.json({ ok: true, appointmentId: data, message: "Your request is pending office confirmation." }, { status: 201, headers: noStore });
  } catch { return NextResponse.json({ error: "Appointment requests are temporarily unavailable." }, { status: 503, headers: noStore }); }
}
