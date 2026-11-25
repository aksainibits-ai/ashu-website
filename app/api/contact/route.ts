import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (process.env.ENABLE_CONTACT_SUBMISSIONS !== "true") {
    return NextResponse.json({ error: "Contact submissions are not enabled." }, { status: 403 });
  }
  const expectedOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  const origin = request.headers.get("origin");
  try {
    const requestOrigin = new URL(request.url).origin;
    const canonicalOrigin = expectedOrigin ? new URL(expectedOrigin).origin : null;
    if (!origin || (origin !== requestOrigin && origin !== canonicalOrigin)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }
    if (!(await enforceRateLimit(request, "contact", 3, 3600))) {
      return NextResponse.json({ error: "Please try again later." }, { status: 429 });
    }
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
    if (typeof body.website === "string" && body.website.trim()) return NextResponse.json({ ok: true });
    const { name, phone, email, category, message, consent } = body;
    if (typeof name !== "string" || name.trim().length < 2 || name.length > 100 ||
        typeof phone !== "string" || !/^[+0-9() .-]{7,24}$/.test(phone) ||
        typeof message !== "string" || message.trim().length < 10 || message.length > 1500 ||
        consent !== true || (email && (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))) {
      return NextResponse.json({ error: "Please check the required fields and consent." }, { status: 400 });
    }
    const admin = createAdminClient();
    const { error } = await admin.from("enquiries").insert({
      name: name.trim(), phone: phone.trim(), email: email?.trim() || null,
      category: typeof category === "string" ? category.slice(0, 80) : null,
      message: message.trim(), consent_at: new Date().toISOString(),
      retention_until: new Date(Date.now() + 90 * 86400000).toISOString(),
    });
    if (error) throw new Error("Enquiry could not be saved.");
    return NextResponse.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Submissions are temporarily unavailable." }, { status: 503 });
  }
}
