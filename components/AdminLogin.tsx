"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function AdminLogin({ lang }: { lang: "en" | "hi" }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) throw new Error("Administrator sign-in is not configured.");
      const supabase = createBrowserClient(url, key);
      const redirectTo = `${window.location.origin}/auth/callback?next=/${lang}/admin`;
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo, shouldCreateUser: false } });
      if (error) throw error;
      setMessage("If this email belongs to an invited administrator, a secure sign-in link has been sent.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in could not be started.");
    } finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="panel p-6 max-w-md w-full space-y-4">
    <label className="block text-sm">Administrator email
      <input className="field mt-2" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} />
    </label>
    <button className="btn" disabled={busy}>{busy ? "Sending…" : "Send secure sign-in link"}</button>
    <p className="muted text-sm" aria-live="polite">{message}</p>
    <p className="muted text-xs">Only pre-created administrator accounts can sign in. New public registrations are disabled.</p>
  </form>;
}
