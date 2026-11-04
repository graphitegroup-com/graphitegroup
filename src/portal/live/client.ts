import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { STATIC_PREVIEW } from "@/lib/preview";

/*
  Live mode: the build sets these two from the repo's GitHub Variables (see
  .github/workflows/deploy.yml). Both are safe to publish; the publishable key
  can only do what the database's access rules allow. Without them the portal
  runs on sample data in the browser, which is what the preview uses.
*/
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const LIVE = !!(URL && KEY);

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!LIVE) throw new Error("Supabase isn't configured for this build");
  // Implicit flow: confirmation and reset links carry the session themselves, so they work when opened on another device.
  client ??= createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" } });
  return client;
}

/** Where emailed links (confirm, reset) send people back to: the sign-in page next to whatever page is open. */
export function loginUrl() {
  const { origin, pathname } = window.location;
  // The static build (GitHub Pages) names pages login.html, in whatever folder the site lives in; a dev server serves /login.
  return STATIC_PREVIEW ? `${origin}${pathname.replace(/[^/]*$/, "")}login.html` : `${origin}/login`;
}
