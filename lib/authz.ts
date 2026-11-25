import "server-only";
import { createClient } from "@/lib/supabase/server";

export type StaffRole = "owner" | "advocate" | "editor";
export type StaffContext = { userId: string; email: string | null; role: StaffRole };

export async function getStaff(): Promise<StaffContext | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profileError || !profile || !["owner", "advocate", "editor"].includes(profile.role)) return null;
    return { userId: user.id, email: user.email ?? null, role: profile.role as StaffRole };
  } catch { return null; }
}

export function canApprove(role: StaffRole) {
  return role === "owner" || role === "advocate";
}
