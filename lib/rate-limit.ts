import "server-only";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export function requestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

export async function enforceRateLimit(request: Request, scope: string, limit: number, windowSeconds: number) {
  const ipHash = createHash("sha256").update(requestIp(request)).digest("hex");
  const key = createHash("sha256").update(\`\${scope}:\${ipHash}\`).digest("hex");
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_rate_limit", {
    p_key: key, p_limit: limit, p_window_seconds: windowSeconds,
  });
  if (error) throw new Error("Rate limiting is unavailable; request rejected.");
  return data === true;
}
