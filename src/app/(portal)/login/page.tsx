"use client";

import { useState } from "react";
import { MarkTile } from "@/components/mark";
import { site } from "@/content/site";
import { STATIC_PREVIEW } from "@/lib/preview";
import { useGo } from "@/lib/use-go";
import { fullName, isAlum, memberByEmail } from "@/portal/logic";
import { usePortal } from "@/portal/store";
import { ROLES, SCHOOLS, type Member, type Role, type School, type Term } from "@/portal/types";
import { Field, Input, Select, fieldCls } from "@/portal/ui";

/*
  Invite-only sign-in. Exec adds a member's school and/or personal email in
  Members & roles; only those emails can set up an account, and either one
  signs in afterwards. Production: Supabase email + password auth, with a
  database trigger that rejects any email not on the roster (see
  supabase/schema.sql and docs/PORTAL.md). The preview accepts any password.
*/

type Mode = "signin" | "setup" | "details" | "reset" | "reset-sent";

/** Sample people to try the portal as. Leo was added this fall and hasn't set up his account. */
const PERSONAS = [
  { id: "m1", label: "Managing Director" },
  { id: "m6", label: "Team Lead" },
  { id: "m9", label: "Consultant" },
  { id: "m13", label: "Associate Consultant" },
  { id: "m18", label: "Alum" },
  { id: "m16", label: "New member, not set up" },
] as const;

// Members can't make themselves exec; exec assigns that in Members & roles.
const SETUP_ROLES = ROLES.filter((r) => r !== "Executive Board");

function termOptions() {
  const now = new Date().getFullYear();
  const out: { value: Term; label: string }[] = [];
  for (let y = now + 1; y >= 2018; y--) {
    out.push({ value: `F${y}`, label: `Fall ${y}` }, { value: `S${y}`, label: `Spring ${y}` });
  }
  return out;
}

const primaryBtn =
  "inline-flex h-10 w-full items-center justify-center rounded-[2px] bg-accent px-5 text-[15px] font-medium text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50";

export default function LoginPage() {
  const { data, signIn, update } = usePortal();
  const go = useGo();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [setupId, setSetupId] = useState<string | null>(null);

  const switchTo = (m: Mode) => {
    setMode(m);
    setError(null);
    setPassword("");
    setConfirm("");
  };

  const notOnRoster = "That email isn't on the Graphite roster. Ask the executive board to add it in Members & roles.";

  const submitSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const m = memberByEmail(data.members, email);
    if (!m) return setError(notOnRoster);
    if (!data.accounts[m.id]) return setError("You haven't set up your account yet. Choose “Set up your account” below.");
    if (!password) return setError("Enter your password.");
    signIn(m.id);
    go("/portal");
  };

  const submitSetup = (e: React.FormEvent) => {
    e.preventDefault();
    const m = memberByEmail(data.members, email);
    if (!m) return setError(notOnRoster);
    if (data.accounts[m.id]) return setError("This account is already set up. Sign in, or reset your password if you've forgotten it.");
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    if (password !== confirm) return setError("The two passwords don't match.");
    // Production: Supabase sends a confirmation link to this email before the account works.
    setSetupId(m.id);
    switchTo("details");
  };

  const finishSetup = (details: Member) => {
    update((d) => ({
      ...d,
      members: d.members.map((x) => (x.id === details.id ? details : x)),
      accounts: { ...d.accounts, [details.id]: new Date().toISOString() },
    }));
    signIn(details.id);
    go("/portal");
  };

  const setupMember = data.members.find((m) => m.id === setupId);

  return (
    <div className="portal min-h-dvh bg-white px-4 py-14 sm:px-8 md:py-24">
      <div className="mx-auto grid max-w-[1160px] grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_440px] lg:gap-24">
        <div className="max-w-[460px] min-w-0">
          <h1 className="flex items-center gap-3 text-[clamp(1.75rem,4vw,2.1rem)] leading-tight font-light">
            <MarkTile size={32} />
            Welcome to the Graphite portal.
          </h1>
          <p className="mt-4 text-[14.5px]">The Graphite portal is a private community for Graphite Group members and alumni.</p>

          {mode === "signin" && (
            <form onSubmit={submitSignIn} className="mt-7 space-y-4" noValidate>
              <Field label="Email" hint="Your school or personal email, whichever the executive board added.">
                <Input id="signin-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>
              <Field label="Password">
                <Input id="signin-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </Field>
              {error && <FormError>{error}</FormError>}
              <button type="submit" className={primaryBtn}>
                Sign in
              </button>
              <div className="flex flex-wrap justify-between gap-2 text-[13px]">
                <button type="button" className="text-link hover:underline" onClick={() => switchTo("setup")}>
                  Set up your account
                </button>
                <button type="button" className="text-link hover:underline" onClick={() => switchTo("reset")}>
                  Forgot your password?
                </button>
              </div>
            </form>
          )}

          {mode === "setup" && (
            <form onSubmit={submitSetup} className="mt-7 space-y-4" noValidate>
              <p className="text-[13.5px] text-ink-2">
                First time here? Use the email the executive board added for you. You&apos;ll be able to sign in with either your school or personal email
                afterwards.
              </p>
              <Field label="Email">
                <Input id="setup-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>
              <Field label="Create a password" hint="At least 8 characters.">
                <Input id="setup-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </Field>
              <Field label="Confirm password">
                <Input id="setup-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </Field>
              {error && <FormError>{error}</FormError>}
              <button type="submit" className={primaryBtn}>
                Continue
              </button>
              <button type="button" className="text-[13px] text-link hover:underline" onClick={() => switchTo("signin")}>
                Back to sign in
              </button>
            </form>
          )}

          {mode === "details" && setupMember && <DetailsForm key={setupMember.id} member={setupMember} onDone={finishSetup} />}

          {mode === "reset" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!email.includes("@")) return setError("Enter the email you sign in with.");
                switchTo("reset-sent");
              }}
              className="mt-7 space-y-4"
              noValidate
            >
              <Field label="Email" hint="We'll email a link to set a new password.">
                <Input id="reset-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>
              {error && <FormError>{error}</FormError>}
              <button type="submit" className={primaryBtn}>
                Send reset link
              </button>
              <button type="button" className="text-[13px] text-link hover:underline" onClick={() => switchTo("signin")}>
                Back to sign in
              </button>
            </form>
          )}

          {mode === "reset-sent" && (
            <div className="mt-7 space-y-4">
              <p role="status" className="rounded-[3px] border border-edge bg-stone px-3 py-3 text-[13.5px]">
                If {email.trim()} has a Graphite account, a link to set a new password is on its way. It expires in an hour.
                {STATIC_PREVIEW && " (This preview doesn't send email.)"}
              </p>
              <button type="button" className="text-[13px] text-link hover:underline" onClick={() => switchTo("signin")}>
                Back to sign in
              </button>
            </div>
          )}

          <p className="mt-10 text-[13px] leading-relaxed text-ink-2">
            The portal is where members help each other get hired: a forum for recruiting questions, grades for every firm members have interviewed with,
            your own outreach tracker, and the alumni and contacts who reply. Nothing here is visible outside Graphite.
          </p>
          <p className="mt-6 text-[13px]">
            <a href={site.url} className="text-link hover:underline">
              {site.url.replace(/^https?:\/\//, "")}
            </a>
          </p>
        </div>

        <div className="space-y-6">
          {STATIC_PREVIEW && (
            <section className="rounded-[2px] border border-[#ecd9a8] bg-[#fbf1da] px-3 py-3 text-[#5c4300]">
              <p className="text-[11.5px] tracking-[0.04em] uppercase">Preview: try it as</p>
              <p className="mt-1 text-[12.5px]">Fictional sample people. Any password works here, and data stays in this browser.</p>
              <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {PERSONAS.map((p) => {
                  const m = data.members.find((x) => x.id === p.id);
                  if (!m) return null;
                  const ready = !!data.accounts[m.id];
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (ready) {
                            signIn(m.id);
                            go("/portal");
                          } else {
                            setEmail(m.schoolEmail || m.personalEmail);
                            switchTo("setup");
                          }
                        }}
                        className="flex w-full flex-col items-start rounded-[2px] border border-[#ecd9a8] bg-white px-2.5 py-1.5 text-left text-[#3d2d00] hover:bg-[#fffaf0]"
                      >
                        <span className="text-[13px] font-medium">{p.label}</span>
                        <span className="text-[12px] text-[#7f5300]">
                          {fullName(m)}
                          {isAlum(m) ? `, class of ${m.gradYear}` : ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <aside className="rounded-[2px] bg-[#f1f1ec] px-3 py-3">
            <p className="text-[11.5px] tracking-[0.04em] text-muted uppercase">Hiring at your firm?</p>
            <p className="mt-3 text-[14.5px] leading-relaxed">
              Graphite alumni can post open roles and referrals in the forum&apos;s Opportunities channel once they sign in. Recruiters outside Graphite
              can reach the team through the main site.
            </p>
            <a
              href={site.url}
              className="mt-3 inline-flex h-9 items-center rounded-[2px] border border-[#cfcfc4] bg-white px-3 text-[14px] font-medium hover:bg-stone"
            >
              Contact Graphite
            </a>
          </aside>
        </div>
      </div>
    </div>
  );
}

function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-[3px] border border-[#f0c9c5] bg-[#fbe9e8] px-3 py-2 text-[13px] text-[#a8261b]">
      {children}
    </p>
  );
}

/** Last setup step: the member confirms what exec entered and adds what only they know. */
function DetailsForm({ member, onDone }: { member: Member; onDone: (m: Member) => void }) {
  const [f, setF] = useState<Member>(() => ({ ...member }));
  const set = <K extends keyof Member>(k: K, v: Member[K]) => setF((x) => ({ ...x, [k]: v }));
  const exec = member.role === "Executive Board";
  const valid = f.firstName.trim() && f.lastName.trim() && (f.personalEmail.trim() || f.schoolEmail.trim());

  return (
    <form
      className="mt-7 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onDone({ ...f, firstName: f.firstName.trim(), lastName: f.lastName.trim(), personalEmail: f.personalEmail.trim(), schoolEmail: f.schoolEmail.trim() });
      }}
    >
      <p className="text-[13.5px] text-ink-2">
        Hi {member.firstName}. Check your details; you can change most of them later in your profile.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name">
          <Input id="d-first" value={f.firstName} onChange={(e) => set("firstName", e.target.value)} required />
        </Field>
        <Field label="Last name">
          <Input id="d-last" value={f.lastName} onChange={(e) => set("lastName", e.target.value)} required />
        </Field>
      </div>
      <Field label="Personal email" hint="Keeps you signed in after your school email closes.">
        <Input id="d-personal" type="email" value={f.personalEmail} onChange={(e) => set("personalEmail", e.target.value)} />
      </Field>
      <Field label="School email">
        <Input id="d-school-email" type="email" value={f.schoolEmail} onChange={(e) => set("schoolEmail", e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="School">
          <Select id="d-school" options={SCHOOLS} value={f.school} onChange={(e) => set("school", e.target.value as School)} />
        </Field>
        <Field label="Graduation year">
          <Input id="d-year" type="number" min={2015} max={2100} value={f.gradYear} onChange={(e) => set("gradYear", Number(e.target.value) || f.gradYear)} />
        </Field>
        <Field label="Joined Graphite">
          <Select id="d-joined" options={termOptions()} value={f.joinedTerm} onChange={(e) => set("joinedTerm", e.target.value as Term)} />
        </Field>
        <Field label="Practice">
          <Select id="d-practice" options={["Strategy", "Digital"]} value={f.practice} onChange={(e) => set("practice", e.target.value as Member["practice"])} />
        </Field>
      </div>
      <Field label="Current role" hint={exec ? "Set by the executive board." : "Executive Board roles are assigned by exec."}>
        {exec ? (
          <input id="d-role" className={`${fieldCls} h-8 bg-stone text-muted`} value="Executive Board" readOnly />
        ) : (
          <Select id="d-role" options={SETUP_ROLES} value={f.role} onChange={(e) => set("role", e.target.value as Role)} />
        )}
      </Field>
      <Field label="Phone" hint="Optional. Only you and the executive board can see it.">
        <Input id="d-phone" type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
      </Field>
      <button type="submit" disabled={!valid} className={primaryBtn}>
        Finish and open the portal
      </button>
    </form>
  );
}
