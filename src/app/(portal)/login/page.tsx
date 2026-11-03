"use client";

import Link from "@/components/app-link";
import { MarkTile } from "@/components/mark";
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
    <div className="portal min-h-dvh bg-stone px-4 py-14 sm:px-8 md:py-24">
      <div className="mx-auto grid max-w-[1160px] items-start gap-10 lg:grid-cols-[1fr_480px] lg:gap-24">
        <div className="max-w-[560px]">
          <h1 className="flex items-center gap-3 text-[clamp(1.75rem,4vw,2.1rem)] leading-tight font-light">
            <MarkTile size={32} />
            Welcome to the Graphite portal.
          </h1>
          <p className="mt-4 text-[14.5px]">The Graphite portal is a private community for Graphite Group members and alumni.</p>
          <button
            type="button"
            onClick={login}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2.5 rounded-[2px] bg-accent px-5 text-[16px] font-medium text-white hover:bg-accent-hover"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-white">
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
                <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
                <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
                <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
              </svg>
            </span>
            Log in with Google
          </button>
          <p className="mt-3 text-[12.5px] text-muted">
            Use your school account (@cmc.edu, @pomona.edu, @hmc.edu, @scrippscollege.edu or @pitzer.edu). Alumni sign in with the email on file.
          </p>
          <p className="mt-10 text-[13px] leading-relaxed text-ink-2">
            The portal is where members help each other get hired: a forum for recruiting questions, grades for every firm members have
            interviewed with, interview reports, and the alumni and contacts who reply. Nothing here is visible outside Graphite.
          </p>
          <p className="mt-6 text-[13px]">
            <Link href="/" className="text-link hover:underline">
              Graphite Group
            </Link>
            <span className="mx-2 text-faint" aria-hidden>
              |
            </span>
            <Link href="/students" className="text-link hover:underline">
              Join Graphite
            </Link>
          </p>
          {STATIC_PREVIEW && (
            <p className="mt-6 max-w-md rounded-[3px] border border-[#ecd9a8] bg-[#fbf1da] px-3 py-2 text-[12.5px] leading-relaxed text-[#5c4300]">
              Preview: this signs you in as a sample Managing Director so every page is visible. Data is fictional and stays in your browser.
            </p>
          )}
        </div>

        <aside className="rounded-[2px] bg-[#ecece4] px-3 py-3">
          <p className="text-[11.5px] tracking-[0.04em] text-muted uppercase">Hiring at your firm?</p>
          <p className="mt-3 text-[14.5px] leading-relaxed">
            Graphite alumni and recruiters share open roles, referrals and coffee chats with members. Tell us what you&apos;re hiring for and
            we&apos;ll post it to the forum.
          </p>
          <Link
            href="/contact"
            className="mt-3 inline-flex h-9 items-center rounded-[2px] border border-[#cfcfc4] bg-white px-3 text-[14px] font-medium hover:bg-stone"
          >
            Share an opportunity
          </Link>
        </aside>
      </div>
    </div>
  );
}
