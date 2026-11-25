import { NextResponse } from "next/server";
import { getStaff } from "@/lib/authz";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const supabase = await createClient();
  const { data, error } = await supabase.from("articles")
    .select("id,slug,language,title,category,summary,body_md,status,source_urls,verification_notes,created_at,updated_at,approved_at,published_at,scheduled_for")
    .order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "Could not load articles." }, { status: 500 });
  return NextResponse.json({ articles: data }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.title !== "string" || typeof body.body_md !== "string" ||
      !["en", "hi"].includes(body.language) || typeof body.slug !== "string" || typeof body.category !== "string") {
    return NextResponse.json({ error: "Invalid article fields." }, { status: 400 });
  }
  if (body.title.length > 180 || body.body_md.length > 40000 || body.slug.length > 100 || body.category.length > 80) {
    return NextResponse.json({ error: "Article exceeds allowed length." }, { status: 400 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("articles").insert({
    slug: body.slug, language: body.language, title: body.title, category: body.category,
    summary: typeof body.summary === "string" ? body.summary.slice(0, 500) : null,
    body_md: body.body_md, status: "draft", created_by: staff.userId,
  }).select("id,slug,language,title,status").single();
  if (error) return NextResponse.json({ error: "Could not create draft." }, { status: 400 });
  return NextResponse.json({ article: data }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
