import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** Privileged client. Import only from server-only route handlers. Never expose its key to a browser. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) throw new Error("Supabase server secret is not configured.");
  return createSupabaseClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { "X-Client-Info": "ashu-website-server" } },
  });
}
