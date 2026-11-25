import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractFeedLinks, generateBilingualDrafts, isAllowedPrimarySource } from "@/lib/blog-generation";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const feeds = (process.env.LEGAL_SOURCE_FEEDS || "").split(",").map(s => s.trim()).filter(Boolean);
  if (!feeds.length) return NextResponse.json({ error: "LEGAL_SOURCE_FEEDS is not configured." }, { status: 503 });

  const admin = createAdminClient();
  const day = new Date().toISOString().slice(0, 10);
  const { data: run, error: lockError } = await admin.from("blog_generation_runs")
    .insert({ run_date: day, status: "running" }).select("run_date").maybeSingle();
  if (lockError || !run) return NextResponse.json({ message: "A daily run already exists or the lock could not be acquired." }, { status: 409 });

  try {
    const urls = new Set<string>();
    for (const feed of feeds.slice(0, 8)) {
      const feedUrl = new URL(feed);
      if (feedUrl.protocol !== "https:" || !isAllowedPrimarySource(feed)) continue;
      const response = await fetch(feed, { redirect: "error", signal: AbortSignal.timeout(8000), cache: "no-store" });
      if (response.ok) for (const link of extractFeedLinks((await response.text()).slice(0, 500000))) urls.add(link);
    }
    const sourceUrls = [...urls].slice(0, 5);
    if (!sourceUrls.length) throw new Error("No approved primary-source articles were found in configured feeds.");
    const articles = await generateBilingualDrafts(sourceUrls, null);
    await admin.from("blog_generation_runs").update({ status: "completed", article_ids: articles.map(a => a.id), completed_at: new Date().toISOString() }).eq("run_date", day);
    return NextResponse.json({ status: "completed", articles });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Daily draft generation failed.";
    await admin.from("blog_generation_runs").update({ status: "failed", error_message: message.slice(0, 500), completed_at: new Date().toISOString() }).eq("run_date", day);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
