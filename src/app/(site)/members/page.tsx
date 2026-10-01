import type { Metadata } from "next";
import { Lattice } from "@/components/lattice";
import { Mark } from "@/components/mark";
import { Reveal } from "@/components/motion";

export const metadata: Metadata = {
  title: "Member Portal",
  description: "Sign in to the Graphite Group member portal.",
  robots: { index: false },
};

const modules = [
  { name: "Home", body: "Your action items: role-specific tasks and the yearly exec calendar, surfaced on time." },
  { name: "Directory", body: "Every member, school, grad year and role. Promotions and alumni status update themselves." },
  { name: "My Recruiting", body: "Every application and every coffee chat, with stage tracking from first round to offer." },
  { name: "Companies", body: "Interview intel by firm and year, from every member who has been through the process." },
  { name: "Network", body: "Alumni and contacts with response rates, preferences and notes on who goes to bat for you." },
  { name: "Projects", body: "Searchable archive of every Graphite engagement, with templates you can start from." },
];

export default function MembersPage() {
  return (
    <section className="grain relative isolate min-h-[100svh] overflow-hidden bg-ink text-paper">
      <Lattice className="absolute inset-0 -z-10 h-full w-full opacity-60" />
      <div className="container-page grid min-h-[100svh] items-center gap-16 pt-32 pb-20 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal>
            <div className="rounded-[28px] border border-paper/10 bg-graphite-950/80 p-8 backdrop-blur-xl md:p-10">
              <Mark assemble className="h-12 w-12 text-paper" />
              <h1 className="mt-8 text-4xl font-semibold tracking-[-0.04em]">
                Member <span className="font-serif font-normal italic">Portal</span>
              </h1>
              <p className="mt-3 leading-relaxed text-paper/60">
                Sign in with your Claremont Colleges email. First time? You&apos;ll set up your profile: school, grad year,
                role and contact details.
              </p>
              <button
                type="button"
                disabled
                className="mt-8 flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-full bg-paper/90 px-6 py-4 text-sm font-medium text-ink opacity-70"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
                  <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
                  <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
                  <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
                </svg>
                Continue with school Google account
              </button>
              <p className="mt-4 text-center text-xs text-graphite-400">
                The portal is being built. Sign-in opens to members first.
              </p>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <p className="eyebrow text-steel">What&apos;s inside</p>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3.5rem)] leading-[1] font-semibold tracking-[-0.04em]">
            Institutional memory that doesn&apos;t <span className="font-serif font-normal italic">graduate.</span>
          </h2>
          <ul className="mt-10 grid gap-px overflow-hidden rounded-[22px] bg-paper/10 ring-1 ring-paper/10 sm:grid-cols-2">
            {modules.map((m, i) => (
              <Reveal as="li" key={m.name} delay={i * 0.06} className="bg-graphite-950/90 p-6">
                <div>
                  <span className="font-mono text-xs text-graphite-400">0{i + 1}</span>
                  <p className="mt-4 text-lg font-semibold tracking-tight">{m.name}</p>
                  <p className="mt-2 text-sm leading-relaxed text-paper/60">{m.body}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
