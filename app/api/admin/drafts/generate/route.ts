import { NextResponse } from "next/server";
import { getStaff } from "@/lib/authz";
import { generateBilingualDrafts } from "@/lib/blog-generation";
import { enforceRateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const staff = await getStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!(await enforceRateLimit(request, "draft-generation", 5, 3600))) {
    return NextResponse.json({ error: "Draft generation limit reached." }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.sourceUrls) || body.sourceUrls.length < 1 || body.sourceUrls.length > 5 ||
      !body.sourceUrls.every((url: unknown) => typeof url === "string" && url.length <= 2048)) {
    return NextResponse.json({ error: "Provide 1–5 primary-source URLs." }, { status: 400 });
  }
  try {
    const articles = await generateBilingualDrafts(body.sourceUrls, staff.userId);
    return NextResponse.json({ articles }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Draft generation failed.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
