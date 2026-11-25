import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };
const reply = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers: noStore });

export async function POST(request: Request) {
  if (process.env.ENABLE_CONTACT_SUBMISSIONS !== "true") {
    return reply({ error: "Contact submissions are not enabled." }, 403);
  }

  try {
    const origin = request.headers.get("origin");
    const requestOrigin = new URL(request.url).origin;
    const canonicalOrigin = process.env.NEXT_PUBLIC_SITE_URL
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin
      : null;
    if (!origin || (origin !== requestOrigin && origin !== canonicalOrigin)) {
      return reply({ error: "Invalid request origin." }, 403);
    }

    if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
      return reply({ error: "JSON requests only." }, 415);
    }
    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (declaredLength > 12000) return reply({ error: "Submission is too large." }, 413);

    const raw = await request.text();
    if (raw.length > 12000) return reply({ error: "Submission is too large." }, 413);
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return reply({ error: "Invalid submission." }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return reply({ error: "Invalid submission." }, 400);
    }

    const input = body as Record<string, unknown>;
    // Silently accept honeypot submissions without storing them.
    if (typeof input.website === "string" && input.website.trim()) return reply({ ok: true });

    if (!(await enforceRateLimit(request, "contact", 3, 3600))) {
      return reply({ error: "Please try again later." }, 429);
    }

    const { name, phone, email, category, message, consent } = input;
    const validEmail = email === undefined || email === null || email === "" ||
      (typeof email === "string" && email.length <= 254 &&
       /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    const validCategory = category === undefined || category === null ||
      (typeof category === "string" && category.length <= 80);

    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100 ||
        typeof phone !== "string" || !/^[+0-9() .-]{7,24}$/.test(phone.trim()) ||
        typeof message !== "string" || message.trim().length < 10 || message.trim().length > 1500 ||
        consent !== true || !validEmail || !validCategory) {
      return reply({ error: "Please check the required fields and consent." }, 400);
    }

    const admin = createAdminClient();
    const { error } = await admin.from("enquiries").insert({
      name: name.trim(),
      phone: phone.trim(),
      email: typeof email === "string" ? email.trim() || null : null,
      category: typeof category === "string" ? category.trim() || null : null,
      message: message.trim(),
      consent_at: new Date().toISOString(),
      retention_until: new Date(Date.now() + 90 * 86400000).toISOString(),
    });
    if (error) return reply({ error: "Submissions are temporarily unavailable." }, 503);
    return reply({ ok: true }, 201);
  } catch {
    return reply({ error: "Submissions are temporarily unavailable." }, 503);
  }
}
