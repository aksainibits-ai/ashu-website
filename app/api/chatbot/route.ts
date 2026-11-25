import { NextResponse } from "next/server";
import OpenAI from "openai";
import { enforceRateLimit } from "@/lib/rate-limit";
import { profile } from "@/lib/content";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  if (process.env.ENABLE_CHATBOT !== "true") return NextResponse.json({ error: "The chatbot is currently disabled." }, { status: 403 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "AI service is not configured." }, { status: 503 });
  try {
    const origin = request.headers.get("origin");
    const expected = process.env.NEXT_PUBLIC_SITE_URL;
    if (!origin || !expected || new URL(origin).origin !== new URL(expected).origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    if (!(await enforceRateLimit(request, "chatbot", 15, 3600))) return NextResponse.json({ error: "Please try again later." }, { status: 429 });
    const body = await request.json().catch(() => null);
    if (!body || typeof body.message !== "string" || body.message.trim().length < 2 || body.message.length > 1800) {
      return NextResponse.json({ error: "Enter a general question of up to 1,800 characters." }, { status: 400 });
    }
    const message = body.message.trim();
    if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(message) || /(?:\+?91[- ]?)?[6-9]\d{9}/.test(message)) {
      return NextResponse.json({ error: "Please remove personal contact details and ask only a general legal question." }, { status: 400 });
    }
    const language = body.language === "hi" ? "Hindi" : "English";
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 20_000, maxRetries: 0 });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini", temperature: 0.2, max_tokens: 550,
      messages: [
        { role: "system", content: [
          "You are a bilingual legal-information assistant for an Indian advocate's informational website.",
          "Provide general legal education only, never individualized legal advice, representation, case strategy or predictions of outcomes.",
          "Do not request or retain names, phone numbers, email addresses, case facts, documents, addresses or sensitive information. If a visitor shares them, tell them not to.",
          "Do not claim to be an advocate or speak on behalf of Advocate Ashutosh Saini. Do not create a client relationship.",
          "Do not invent judgments, citations, dates, statutory text or current legal updates. State uncertainty and recommend official primary sources.",
          "Do not solicit engagements, promise contact or offer outcome guarantees.",
          \`Public profile facts, only if asked: \${profile.name}, \${profile.title}, \${profile.location}, phone \${profile.phone}, email \${profile.email}.\`,
          \`Reply in \${language}. Keep concise and include a brief general-information disclaimer.\`
        ].join(" ") },
        { role: "user", content: message },
      ],
    });
    const answer = completion.choices[0]?.message?.content?.trim();
    if (!answer) throw new Error("Empty AI response");
    return NextResponse.json({ answer }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The assistant is temporarily unavailable." }, { status: 503 });
  }
}
