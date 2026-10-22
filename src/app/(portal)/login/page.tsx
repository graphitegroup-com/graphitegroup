"use client";

import { Mark } from "@/components/mark";
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
    <div className="portal flex min-h-dvh flex-col items-center justify-center bg-[#fafbfc] px-4 py-16">
      <div className="w-full max-w-[360px]">
        <div className="flex items-center gap-2">
          <Mark className="h-6 w-6" />
          <span className="text-[15px] font-semibold">Graphite Group</span>
        </div>
        <div className="mt-6 rounded-lg border border-edge bg-white p-6">
          <h1 className="text-[18px] font-semibold">Sign in to the member portal</h1>
          <p className="mt-1 text-[13.5px] text-muted">For current members and alumni.</p>
          <button
            type="button"
            onClick={login}
            className="mt-6 flex h-10 w-full items-center justify-center gap-2.5 rounded-md border border-edge bg-white text-[14px] font-medium hover:bg-stone"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
              <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
              <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
              <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
            </svg>
            Continue with Google
          </button>
          <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
            Use your school Google account (@cmc.edu, @pomona.edu, @hmc.edu, @scrippscollege.edu or @pitzer.edu).
          </p>
        </div>
        {STATIC_PREVIEW && (
          <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
            Preview: this signs you in as a sample Managing Director so every page is visible. Data is fictional and stays in your browser.
          </p>
        )}
      </div>
    </div>
  );
}
