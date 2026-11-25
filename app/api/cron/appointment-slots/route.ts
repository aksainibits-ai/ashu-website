import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Vercel runs this at 03:00 Asia/Kolkata (21:30 UTC on the previous day).
// Keep a rolling 30-day horizon; the unique starts_at index makes generation idempotent.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const istNow = new Date(now.getTime() + 330 * 60_000);
    const year = istNow.getUTCFullYear();
    const month = istNow.getUTCMonth();
    const day = istNow.getUTCDate();
    const slots: { starts_at: string; ends_at: string }[] = [];

    for (let offset = 0; offset < 30; offset++) {
      // 09:30 UTC is 15:00 IST. Eight half-hour slots end at 19:00 IST.
      const date = new Date(Date.UTC(year, month, day + offset));
      for (let index = 0; index < 8; index++) {
        const starts = new Date(Date.UTC(
          date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
          9, 30 + index * 30
        ));
        const ends = new Date(starts.getTime() + 30 * 60_000);
        if (starts.getTime() > now.getTime()) {
          slots.push({ starts_at: starts.toISOString(), ends_at: ends.toISOString() });
        }
      }
    }

    const admin = createAdminClient();
    const { error } = await admin.from("appointment_slots")
      .upsert(slots, { onConflict: "starts_at", ignoreDuplicates: true });
    if (error) throw error;

    return NextResponse.json({
      ok: true,
      generatedCandidates: slots.length,
      schedule: "Every day, 15:00–19:00 Asia/Kolkata, 30-minute slots",
      horizonDays: 30,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not refresh appointment availability." }, { status: 500 });
  }
}
