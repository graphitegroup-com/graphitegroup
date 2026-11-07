"use client";

import { useEffect, useMemo, useState } from "react";
import { MarkTile } from "@/components/mark";
import { STATIC_PREVIEW } from "@/lib/preview";
import { useGo } from "@/lib/use-go";
import { fullName, inviteFor, isAlum, memberByEmail, memberFromInvite } from "@/portal/logic";
import { usePortal } from "@/portal/store";
import { ROLES, SCHOOLS, type Member, type Role, type School, type Term } from "@/portal/types";
import { Field, Input, Select, fieldCls } from "@/portal/ui";

/*
  Invite-only sign-in. Exec adds a member's school and/or personal email in
  Members and roles; only those emails can set up an account, and either one
  signs in afterwards.
  Live: Supabase email + password. Setting up takes two steps, because the
  account can't save anything until its email is confirmed: (1) email and
  password, then Supabase emails a confirmation link; (2) after the link,
  the member fills in their details. A database trigger rejects any email
  that isn't on the roster.
  Demo: any password works, and the sample people are listed to try.
*/

type Mode = "signin" | "setup" | "check-email" | "details" | "reset" | "reset-sent";

/** Sample people to try the portal as. Leo was added this fall and hasn't set up his account. */
const PERSONAS = [
  { id: "m1", label: "Managing Director" },
  { id: "m6", label: "Team Lead" },
  { id: "m9", label: "Consultant" },
  { id: "m13", label: "Associate Consultant" },
  { id: "m18", label: "Alum" },
  { id: "m16", label: "New member, not set up" },
] as const;

// Members can't make themselves exec; exec assigns that in Members and roles.
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
const linkBtn = "text-[13px] text-link hover:underline";

export default function LoginPage() {
  const { data, me, ready, live, auth, needsSetup, recovering, signIn, signOut, update, error: loadError, invite, joinFromInvite } = usePortal();
  const go = useGo();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [setupId, setSetupId] = useState<string | null>(null);
  // Sign-in failed because the email was never confirmed: offer to send the link again.
  const [unconfirmed, setUnconfirmed] = useState(false);
  // Demo: setting up from an invite rather than an existing roster entry.
  const [setupInvite, setSetupInvite] = useState<string | null>(null);

  // Live: once signed in and set up, the portal is the next stop.
  const done = live && ready && !!me && !needsSetup && !recovering;
  useEffect(() => {
    if (done) go("/portal", { replace: true });
  }, [done, go]);

  const switchTo = (m: Mode) => {
    setMode(m);
    setError(null);
    setUnconfirmed(false);
    setPassword("");
    setConfirm("");
  };

  const notOnRoster = "That email isn't on the Graphite roster. Ask the executive board to add it in Members and roles.";
  const passwordProblem = () => (password.length < 8 ? "Use at least 8 characters for your password." : password !== confirm ? "The two passwords don't match." : null);

  const submitSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return setError("Enter the email you sign in with.");
    if (!password) return setError("Enter your password.");
    if (live && auth) {
      setBusy(true);
      const err = await auth.signIn(email, password);
      setBusy(false);
      setError(err);
      setUnconfirmed(!!err && /confirm your email/i.test(err));
      return;
    }
    const m = memberByEmail(data.members, email);
    if (!m) return setError(notOnRoster);
    if (!data.accounts[m.id]) return setError("You haven't set up your account yet. Choose “Set up your account” below.");
    signIn(m.id);
    go("/portal");
  };

  const submitSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return setError("Enter the email the executive board added for you.");
    const problem = passwordProblem();
    if (problem) return setError(problem);
    if (live && auth) {
      setBusy(true);
      const r = await auth.signUp(email, password);
      setBusy(false);
      if (r.error) return setError(r.error);
      if (r.confirm) switchTo("check-email");
      return;
    }
    const m = memberByEmail(data.members, email);
    if (!m) {
      const inv = inviteFor(data.invites, email);
      if (!inv) return setError(notOnRoster);
      setSetupInvite(inv.email);
      setSetupId(null);
      return switchTo("details");
    }
    if (data.accounts[m.id]) return setError("This account is already set up. Sign in, or reset your password if you've forgotten it.");
    setSetupId(m.id);
    setSetupInvite(null);
    switchTo("details");
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return setError("Enter the email you sign in with.");
    if (live && auth) {
      setBusy(true);
      const err = await auth.sendReset(email);
      setBusy(false);
      if (err) return setError(err);
    }
    switchTo("reset-sent");
  };

  // A new member built from an invite, kept stable so the form doesn't reset while typing.
  const inviteEmail = live ? invite?.email : setupInvite;
  const invitedMember = useMemo(() => {
    const inv = live ? invite : setupInvite ? inviteFor(data.invites, setupInvite) : undefined;
    return inv ? memberFromInvite(inv) : undefined;
    // Rebuild only when a different invite is being set up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteEmail]);

  const finishSetup = async (details: Member): Promise<string | null> => {
    const isNew = !data.members.some((x) => x.id === details.id);
    if (isNew && live) {
      // Invited, not a member yet: the database creates the member and removes the invite.
      const err = await joinFromInvite?.(details);
      if (err) return err;
      go("/portal");
      return null;
    }
    const emails = [details.schoolEmail, details.personalEmail].map((e) => e.trim().toLowerCase()).filter(Boolean);
    update((d) => ({
      ...d,
      members: isNew ? [...d.members, details] : d.members.map((x) => (x.id === details.id ? details : x)),
      accounts: { ...d.accounts, [details.id]: new Date().toISOString() },
      invites: d.invites.filter((i) => !emails.includes(i.email)),
    }));
    if (!live) signIn(details.id);
    go("/portal");
    return null;
  };

  // Live: signed in but not set up yet, either as a member or from an invite.
  const liveDetails = live && ready ? (me && needsSetup ? me : !me && invite ? invitedMember : undefined) : undefined;
  const demoDetails = !live && mode === "details" ? (setupInvite ? invitedMember : data.members.find((m) => m.id === setupId)) : undefined;
  const setupMember = liveDetails ?? demoDetails;
  // Signed in, but no member came back: either loading failed, or the roster no longer has this email.
  const noMember = live && ready && !!auth?.email && !me && !invite;
  const loadFailed = noMember && !!loadError;
  const orphaned = noMember && !loadError;

  let body: React.ReactNode;
  if (!ready && live) {
    body = <p className="text-center text-[13.5px] text-muted">Loading</p>;
  } else if (live && recovering) {
    body = <NewPasswordForm onSave={(p) => auth!.setPassword(p)} />;
  } else if (loadFailed) {
    body = (
      <div className="space-y-4 text-[13.5px]">
        <p role="alert" className="rounded-[3px] border border-[#f0c9c5] bg-[#fbe9e8] px-3 py-2 text-[#a8261b]">
          You&apos;re signed in as {auth?.email}, but the portal couldn&apos;t load. {loadError}
        </p>
        <div className="flex gap-4">
          <button type="button" className={linkBtn} onClick={() => window.location.reload()}>
            Try again
          </button>
          <button type="button" className={linkBtn} onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    );
  } else if (orphaned) {
    body = (
      <div className="space-y-4 text-[13.5px]">
        <p role="alert" className="rounded-[3px] border border-[#f0c9c5] bg-[#fbe9e8] px-3 py-2 text-[#a8261b]">
          {auth?.email} isn&apos;t on the Graphite roster anymore. Ask the executive board to add it in Members and roles.
        </p>
        <button type="button" className={linkBtn} onClick={signOut}>
          Sign out
        </button>
      </div>
    );
  } else if (setupMember) {
    body = <DetailsForm key={setupMember.id} member={setupMember} lockedEmail={live ? auth?.email : undefined} onDone={finishSetup} />;
  } else if (mode === "setup") {
    body = (
      <form onSubmit={submitSetup} className="space-y-4" noValidate>
        <p className="text-[13.5px] text-ink-2">
          Step 1 of 2. Use the email the executive board added for you, usually your school email. You&apos;ll add your personal email next, and either one signs
          in after that.
        </p>
        <Field label="School email">
          <Input id="setup-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Create a password" hint="At least 8 characters.">
          <Input id="setup-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <Field label="Confirm password">
          <Input id="setup-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </Field>
        {error && <FormError>{error}</FormError>}
        <button type="submit" className={primaryBtn} disabled={busy}>
          {busy ? "Setting up" : "Continue"}
        </button>
        <BackLink onClick={() => switchTo("signin")} />
      </form>
    );
  } else if (mode === "check-email") {
    body = (
      <div className="space-y-4">
        <p role="status" className="rounded-[3px] border border-edge bg-stone px-3 py-3 text-[13.5px]">
          Check your inbox. We sent a link to <span className="font-medium">{email.trim()}</span>. Open it on any device to confirm your email, then finish setting up
          your details. It can take a few minutes, and sometimes lands in spam.
        </p>
        <ResendConfirmation email={email} send={live && auth ? auth.resendConfirmation : undefined} />
        <BackLink onClick={() => switchTo("signin")} />
      </div>
    );
  } else if (mode === "reset") {
    body = (
      <form onSubmit={submitReset} className="space-y-4" noValidate>
        <Field label="Email" hint="We'll email you a link to choose a new password.">
          <Input id="reset-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        {error && <FormError>{error}</FormError>}
        <button type="submit" className={primaryBtn} disabled={busy}>
          Send reset link
        </button>
        <BackLink onClick={() => switchTo("signin")} />
      </form>
    );
  } else if (mode === "reset-sent") {
    body = (
      <div className="space-y-4">
        <p role="status" className="rounded-[3px] border border-edge bg-stone px-3 py-3 text-[13.5px]">
          If {email.trim()} has a Graphite account, a link to choose a new password is on its way.
          {!live && " (The preview doesn't send email.)"}
        </p>
        <BackLink onClick={() => switchTo("signin")} />
      </div>
    );
  } else {
    body = (
      <form onSubmit={submitSignIn} className="space-y-4" noValidate>
        <Field label="Email">
          <Input id="signin-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password">
          <Input id="signin-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {error && <FormError>{error}</FormError>}
        {unconfirmed && <ResendConfirmation email={email} send={auth?.resendConfirmation} />}
        <button type="submit" className={primaryBtn} disabled={busy}>
          {busy ? "Signing in" : "Sign in"}
        </button>
        <div className="flex flex-wrap justify-between gap-2">
          <button type="button" className={linkBtn} onClick={() => switchTo("setup")}>
            Set up your account
          </button>
          <button type="button" className={linkBtn} onClick={() => switchTo("reset")}>
            Forgot password?
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="portal flex min-h-dvh flex-col items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <MarkTile size={40} />
          <h1 className="text-[clamp(1.6rem,5vw,2rem)] leading-tight font-light">Welcome to the Graphite portal</h1>
        </div>
        {body}

        {!live && STATIC_PREVIEW && mode === "signin" && (
          <section className="mt-10 rounded-[2px] border border-[#ecd9a8] bg-[#fbf1da] px-3 py-3 text-[#5c4300]">
            <p className="text-[11.5px] tracking-[0.04em] uppercase">Preview: try it as</p>
            <p className="mt-1 text-[12.5px]">Fictional sample people. Any password works here, and data stays in this browser.</p>
            <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {PERSONAS.map((p) => {
                const m = data.members.find((x) => x.id === p.id);
                if (!m) return null;
                const set = !!data.accounts[m.id];
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (set) {
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
      </div>
    </div>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={linkBtn} onClick={onClick}>
      Back to sign in
    </button>
  );
}

function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-[3px] border border-[#f0c9c5] bg-[#fbe9e8] px-3 py-2 text-[13px] text-[#a8261b]">
      {children}
    </p>
  );
}

/** From a password-reset link: choose the new password. */
function NewPasswordForm({ onSave }: { onSave: (password: string) => Promise<string | null> }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (password.length < 8) return setError("Use at least 8 characters for your password.");
        if (password !== confirm) return setError("The two passwords don't match.");
        setBusy(true);
        setError(await onSave(password));
        setBusy(false);
      }}
    >
      <p className="text-[13.5px] text-ink-2">Choose a new password.</p>
      <Field label="New password" hint="At least 8 characters.">
        <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </Field>
      <Field label="Confirm password">
        <Input id="new-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </Field>
      {error && <FormError>{error}</FormError>}
      <button type="submit" className={primaryBtn} disabled={busy}>
        Save password
      </button>
    </form>
  );
}

/**
 * Step 2 of setup: the member confirms what exec entered and adds what only
 * they know. The email they signed in with can't be changed here, or the
 * account would lose its link to the roster.
 */
function DetailsForm({ member, lockedEmail, onDone }: { member: Member; lockedEmail?: string; onDone: (m: Member) => Promise<string | null> }) {
  const [f, setF] = useState<Member>(() => ({ ...member }));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Member>(k: K, v: Member[K]) => setF((x) => ({ ...x, [k]: v }));
  const exec = member.role === "Executive Board";
  const lockSchool = !!lockedEmail && lockedEmail.trim().toLowerCase() === member.schoolEmail.trim().toLowerCase();
  const lockPersonal = !!lockedEmail && !lockSchool;
  const valid = f.firstName.trim() && f.lastName.trim() && f.personalEmail.trim() && f.gradYear >= 2015;

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        setBusy(true);
        setError(await onDone({ ...f, firstName: f.firstName.trim(), lastName: f.lastName.trim(), personalEmail: f.personalEmail.trim(), schoolEmail: f.schoolEmail.trim() }));
        setBusy(false);
      }}
    >
      <p className="text-[13.5px] text-ink-2">
        {lockedEmail ? "Step 2 of 2. " : ""}
        {member.firstName ? `Hi ${member.firstName}. Check your details; you can change most of them later in your profile.` : "Welcome to Graphite. Tell us who you are; you can change most of this later in your profile."}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name">
          <Input id="d-first" value={f.firstName} onChange={(e) => set("firstName", e.target.value)} required />
        </Field>
        <Field label="Last name">
          <Input id="d-last" value={f.lastName} onChange={(e) => set("lastName", e.target.value)} required />
        </Field>
      </div>
      <Field label="School email">
        <Input id="d-school-email" type="email" value={f.schoolEmail} readOnly={lockSchool} onChange={(e) => set("schoolEmail", e.target.value)} />
      </Field>
      <Field label="Personal email" hint="Keeps you signed in after your school email closes. Either email signs in.">
        <Input id="d-personal" type="email" required value={f.personalEmail} readOnly={lockPersonal} onChange={(e) => set("personalEmail", e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="School">
          <Select id="d-school" options={SCHOOLS} value={f.school} onChange={(e) => set("school", e.target.value as School)} />
        </Field>
        <Field label="Graduation year">
          <Input id="d-year" type="number" min={2015} max={2100} placeholder="e.g. 2029" value={f.gradYear || ""} onChange={(e) => set("gradYear", Number(e.target.value) || 0)} />
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
      {error && <FormError>{error}</FormError>}
      <button type="submit" disabled={!valid || busy} className={primaryBtn}>
        {busy ? "Saving" : "Finish and open the portal"}
      </button>
    </form>
  );
}

/** "Didn't get it?" Sends the confirmation link again, at most once a minute. */
function ResendConfirmation({ email, send }: { email: string; send?: (email: string) => Promise<string | null> }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(0);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);
  return (
    <div className="text-[13px]">
      <button
        type="button"
        className={`${linkBtn} disabled:cursor-not-allowed disabled:text-faint disabled:no-underline`}
        disabled={state === "sending" || wait > 0 || !email.includes("@")}
        onClick={async () => {
          setState("sending");
          setError(null);
          const err = send ? await send(email) : null;
          if (err) {
            setError(err);
            setState("idle");
          } else {
            setState("sent");
            setWait(60);
          }
        }}
      >
        {wait > 0 ? `Sent. You can send another in ${wait}s` : state === "sending" ? "Sending" : "Didn't get it? Send the confirmation email again"}
      </button>
      {state === "sent" && wait === 0 && <span className="ml-1 text-muted">Sent.</span>}
      {!send && state === "sent" && <p className="mt-1 text-[12.5px] text-muted">(The preview doesn&apos;t send email.)</p>}
      {error && <p className="mt-1 text-[12.5px] text-[#a8261b]">{error}</p>}
    </div>
  );
}
