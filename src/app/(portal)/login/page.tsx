"use client";

import Link from "@/components/app-link";
import { Logo } from "@/components/mark";
import { STATIC_PREVIEW } from "@/lib/preview";
import { useGo } from "@/lib/use-go";
import { usePortal } from "@/portal/store";

/** Sample member the preview signs in as (exec, so every page is visible). */
const PREVIEW_MEMBER = "m1";

export default function LoginPage() {
  const { signIn } = usePortal();
  const go = useGo();

  const login = () => {
    // Production: Supabase Google OAuth restricted to 5C domains (see docs/PORTAL.md).
    signIn(PREVIEW_MEMBER);
    go("/portal");
  };

  return (
    <div className="lines-bg flex min-h-dvh flex-col bg-white">
      <header className="container-gg flex h-[88px] items-center">
        <Link href="/" className="text-ink" aria-label="Graphite Group home">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 pb-24">
        <div className="card-glow w-full max-w-md rounded-[10px] bg-white px-8 py-10 md:px-10">
          <h1 className="grad-title t-h1 pb-1">Log in</h1>
          <p className="mt-4 leading-relaxed text-muted">For current members and alumni of Graphite Group.</p>
          <button type="button" onClick={login} className="pill mt-10 w-full">
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
              <path fill="#fff" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7zM12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24zM5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1zM12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
            </svg>
            Continue with Google
          </button>
          <p className="mt-4 text-sm text-muted">Use your Claremont Colleges email address.</p>
          {STATIC_PREVIEW && (
            <p className="mt-10 border-t border-line pt-4 text-xs leading-relaxed text-muted">
              Preview: this signs you in as a sample Managing Director so every page is visible.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
