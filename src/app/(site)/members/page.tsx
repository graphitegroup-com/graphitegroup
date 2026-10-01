import type { Metadata } from "next";
import { Mark } from "@/components/mark";

export const metadata: Metadata = {
  title: "Member Login",
  description: "Sign in to the Graphite Group member portal.",
  robots: { index: false },
};

const modules = [
  ["Home", "Your action items, by role and time of year"],
  ["Directory", "Every member, school, class year and role"],
  ["My Recruiting", "Applications and coffee chats, tracked by stage"],
  ["Companies", "Interview experiences by firm and year"],
  ["Network", "Alumni and contacts, with response history"],
  ["Projects", "Searchable archive of past engagements and templates"],
];

export default function MembersPage() {
  return (
    <section className="bg-cloud py-16 md:py-24">
      <div className="wrap grid gap-12 lg:grid-cols-12">
        <div className="border-t-[3px] border-accent bg-white p-8 shadow-[0_1px_3px_rgba(20,24,29,0.06)] md:p-10 lg:col-span-5">
          <Mark className="h-10 w-10 text-ink" />
          <h1 className="mt-6 font-serif text-4xl">Member login</h1>
          <p className="mt-3 leading-relaxed text-slate">
            Sign in with your Claremont Colleges Google account. New members will be asked to complete a short profile.
          </p>
          <button
            type="button"
            disabled
            className="mt-8 flex w-full cursor-not-allowed items-center justify-center gap-3 border border-line bg-white px-6 py-3.5 text-sm font-semibold text-ink opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
              <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
              <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
              <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
            </svg>
            Sign in with Google
          </button>
          <p className="mt-4 text-sm text-slate">The member portal is in development and will open to current members first.</p>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <p className="label label-rule">Member portal</p>
          <h2 className="h-section">Everything a member needs, kept year to year</h2>
          <ul className="mt-8 border-t border-line">
            {modules.map(([name, body]) => (
              <li key={name} className="grid gap-1 border-b border-line py-4 sm:grid-cols-3">
                <span className="font-semibold">{name}</span>
                <span className="text-slate sm:col-span-2">{body}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
