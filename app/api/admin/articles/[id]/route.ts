import { NextResponse } from "next/server";
import { canApprove, getStaff } from "@/lib/authz";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid article ID." }, { status: 400 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const supabase = await createClient();
  const { data: current, error: readError } = await supabase.from("articles").select("id,status")
    .eq("id", id).maybeSingle();
  if (readError || !current) return NextResponse.json({ error: "Article not found." }, { status: 404 });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.title === "string" && body.title.length >= 3 && body.title.length <= 180) update.title = body.title;
  if (typeof body.summary === "string" && body.summary.length <= 500) update.summary = body.summary;
  if (typeof body.body_md === "string" && body.body_md.length <= 40000) update.body_md = body.body_md;
  if (typeof body.category === "string" && body.category.length <= 80) update.category = body.category;

  if (body.scheduled_for !== undefined) {
    if (!canApprove(staff.role) || current.status !== "approved" || typeof body.scheduled_for !== "string") {
      return NextResponse.json({ error: "Only an advocate can schedule an approved article." }, { status: 403 });
    }
    const date = new Date(body.scheduled_for);
    if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) {
      return NextResponse.json({ error: "Choose a future publication time." }, { status: 400 });
    }
    update.scheduled_for = date.toISOString();
  }

  if (body.status !== undefined) {
    if (!["draft", "review", "approved", "published", "archived"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid article status." }, { status: 400 });
    }
    if (["approved", "published", "archived"].includes(body.status) && !canApprove(staff.role)) {
      return NextResponse.json({ error: "Only the advocate or owner can approve or publish." }, { status: 403 });
    }
    if (body.status === "published" && current.status !== "approved") {
      return NextResponse.json({ error: "An article must be approved before publication." }, { status: 409 });
    }
    if (body.status === "approved") {
      update.approved_by = staff.userId;
      update.approved_at = new Date().toISOString();
    }
    if (body.status === "published") {
      update.published_at = new Date().toISOString();
      update.scheduled_for = null;
    }
    if (body.status === "archived") {
      update.published_at = null;
      update.scheduled_for = null;
    }
    update.status = body.status;
  }
  const { data, error } = await supabase.from("articles").update(update).eq("id", id)
    .select("id,slug,language,title,status,approved_at,published_at,scheduled_for").single();
  if (error) return NextResponse.json({ error: "Update failed. Check role permissions and database policies." }, { status: 400 });
  return NextResponse.json({ article: data }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!canApprove(staff.role)) return NextResponse.json({ error: "Only advocate/owner can delete articles." }, { status: 403 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid article ID." }, { status: 400 });
  const supabase = await createClient();
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Delete failed." }, { status: 400 });
  return NextResponse.json({ deleted: true }, { headers: { "Cache-Control": "private, no-store" } });
}
