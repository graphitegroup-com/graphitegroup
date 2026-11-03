"use client";

/*
  Networking: each member's own log of outreach and coffee chats. Every row is
  an Outreach record, the same records the Network grades are computed from,
  so logging here feeds the shared contact grades with no extra step.
*/

import Link from "@/components/app-link";
import { useState } from "react";
import {
  FOLLOW_UP_DAYS,
  MAX_FOLLOW_UPS,
  companyNames,
  companySlug,
  findContact,
  fmtDate,
  isLinkedInUrl,
  lastActivity,
  localToday,
  matchCompany,
  movedContact,
  nextStep,
  outreachStage,
  uid,
  withProtocol,
  withReply,
  type NextStep,
  type OutreachStage,
} from "./logic";
import { usePortal } from "./store";
import type { Contact, Outreach, PortalData } from "./types";
import { Badge, Button, Card, Check, Drawer, Empty, Field, Input, Select, Td, Textarea, Th, rowCls, type Tone } from "./ui";

export const CHANNELS: Outreach["channel"][] = ["Email", "LinkedIn", "Referral", "In person"];
export const OUTREACH_STAGES: OutreachStage[] = ["Reached out", "Followed up", "Replied", "Chatted"];

const stageTones: Record<OutreachStage, Tone> = { "Reached out": "gray", "Followed up": "amber", Replied: "blue", Chatted: "green" };

export function StageChip({ stage }: { stage: OutreachStage }) {
  return <Badge tone={stageTones[stage]}>{stage}</Badge>;
}

/** The next step, styled by urgency: an action to take now, a waiting note, a stop, or done. */
export function StepPing({ step }: { step: NextStep }) {
  if (step.due) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-[2px] bg-[#fbf1da] px-1.5 py-0.5 text-[12.5px] font-medium text-[#7f5300]">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#c98a00]" />
        {step.label}
      </span>
    );
  }
  if (step.kind === "move-on") return <span className="text-[12.5px] text-[#a8261b]">{step.label}</span>;
  if (step.kind === "done") return <span className="text-[12.5px] text-[#1d6b37]">Done</span>;
  return <span className="text-[12.5px] text-muted">{step.label}</span>;
}

/** A datalist of firm names for type-ahead inputs. */
export function FirmOptions({ id, names }: { id: string; names: string[] }) {
  return (
    <datalist id={id}>
      {[...new Set(names)].sort((a, b) => a.localeCompare(b)).map((n) => (
        <option key={n} value={n} />
      ))}
    </datalist>
  );
}

/** One-click updates to an outreach row. */
export function useOutreachActions() {
  const { update } = usePortal();
  const patch = (id: string, fn: (o: Outreach) => Outreach) => update((d) => ({ ...d, outreach: d.outreach.map((o) => (o.id === id ? fn(o) : o)) }));
  return {
    followedUp: (o: Outreach) => patch(o.id, (x) => ({ ...x, followUps: [...(x.followUps ?? []), localToday()] })),
    gotReply: (o: Outreach) => patch(o.id, (x) => withReply(x, localToday())),
    // A chat implies a reply; record one today if it wasn't logged.
    chatted: (o: Outreach) => patch(o.id, (x) => ({ ...(x.responded ? x : withReply(x, localToday())), chatted: true })),
    thanked: (o: Outreach) => patch(o.id, (x) => ({ ...x, thanked: true })),
    rate: (o: Outreach, n: NonNullable<Outreach["helpfulness"]>) => patch(o.id, (x) => ({ ...x, helpfulness: n })),
    referred: (o: Outreach, v: boolean) => patch(o.id, (x) => ({ ...x, referred: v })),
    save: (o: Outreach) => patch(o.id, () => o),
    remove: (o: Outreach) => update((d) => ({ ...d, outreach: d.outreach.filter((x) => x.id !== o.id) })),
  };
}

type PersonDraft = { name: string; linkedin: string; company: string; title: string; channel: Outreach["channel"]; date: string; notes: string; anonymous: boolean };

/**
 * Add someone you reached out to. Links to their existing Network record when
 * there is one (same LinkedIn, or same name at the same firm) and updates it if
 * they've moved; otherwise adds them to the Network. Mount only while open.
 */
export function AddPersonForm({ company, onDone }: { company?: string; onDone: () => void }) {
  const { data, me, update } = usePortal();
  const [d, setD] = useState<PersonDraft>({ name: "", linkedin: "", company: company ?? "", title: "", channel: "Email", date: localToday(), notes: "", anonymous: false });
  const [error, setError] = useState("");
  const set = (patch: Partial<PersonDraft>) => setD((x) => ({ ...x, ...patch }));

  if (!me) return null;

  const firm = d.company.trim() ? matchCompany(data, d.company) : "";
  const existing = d.name.trim() && (d.linkedin.trim() || firm) ? findContact(data.contacts, { name: d.name, linkedin: d.linkedin, company: firm }) : undefined;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLinkedInUrl(d.linkedin)) {
      setError("Paste their LinkedIn profile link, for example linkedin.com/in/their-name.");
      return;
    }
    const linkedin = withProtocol(d.linkedin);
    let contact: Contact;
    if (existing) {
      contact = movedContact({ ...existing, linkedin: existing.linkedin || linkedin }, { company: firm, title: d.title }, me.id);
    } else {
      contact = { id: uid(), name: d.name.trim(), company: firm, title: d.title.trim(), email: "", linkedin, isAlum: false, preferences: "", addedBy: me.id };
    }
    const o: Outreach = {
      id: uid(),
      contactId: contact.id,
      memberId: me.id,
      date: d.date || localToday(),
      channel: d.channel,
      responded: false,
      chatted: false,
      referred: false,
      notes: d.notes.trim(),
      anonymous: d.anonymous || undefined,
    };
    update((x) => ({
      ...x,
      contacts: existing ? x.contacts.map((c) => (c.id === contact.id ? contact : c)) : [...x.contacts, contact],
      outreach: [...x.outreach, o],
    }));
    onDone();
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <Field label="Name">
        <Input required value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Alexandra Mills" />
      </Field>
      <Field label="LinkedIn profile" hint="Used to match them with anyone else in Graphite who's reached out.">
        <Input
          required
          inputMode="url"
          value={d.linkedin}
          onChange={(e) => {
            set({ linkedin: e.target.value });
            setError("");
          }}
          placeholder="linkedin.com/in/their-name"
          aria-invalid={!!error}
        />
      </Field>
      {error && (
        <p role="alert" className="-mt-2 text-[12.5px] text-[#a8261b]">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Company">
          <Input required list="person-firms" value={d.company} onChange={(e) => set({ company: e.target.value })} placeholder="e.g. Bain & Company" />
          <FirmOptions id="person-firms" names={companyNames(data)} />
        </Field>
        <Field label="Title">
          <Input required value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Associate Consultant" />
        </Field>
      </div>
      {existing && (
        <p role="status" className="-mt-1 rounded-[3px] border border-edge bg-[#fbfbf7] px-3 py-2 text-[12.5px] text-ink-2">
          {existing.name} is already in the Network
          {existing.company ? ` (${[existing.title, existing.company].filter(Boolean).join(" at ")})` : ""}. Your outreach will be added to their record
          {firm && (companySlug(firm) !== companySlug(existing.company) || d.title.trim() !== existing.title.trim()) && d.title.trim()
            ? ", and their company and title will update to what you entered."
            : "."}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="First message">
          <Input type="date" required value={d.date} onChange={(e) => set({ date: e.target.value })} />
        </Field>
        <Field label="Channel">
          <Select options={CHANNELS} value={d.channel} onChange={(e) => set({ channel: e.target.value as Outreach["channel"] })} />
        </Field>
      </div>
      <Field label="Notes" hint="What you asked for, how you know them, anything you'll want later.">
        <Textarea value={d.notes} onChange={(e) => set({ notes: e.target.value })} />
      </Field>
      <Check
        label="Log anonymously"
        checked={d.anonymous}
        onChange={(v) => set({ anonymous: v })}
        hint="Still counts toward their grade. Other members see “Anonymous member”; you and exec see your name."
      />
      <div className="flex gap-2 pt-1">
        <Button type="submit">Add person</Button>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

const RATINGS = [1, 2, 3, 4, 5] as const;

/** Full edit of one outreach row, for corrections and notes. Mount only while open. */
export function EditOutreachForm({ outreach, contact, onDone }: { outreach: Outreach; contact?: Contact; onDone: () => void }) {
  const act = useOutreachActions();
  const [o, setO] = useState<Outreach>(outreach);
  const [confirming, setConfirming] = useState(false);
  const set = (patch: Partial<Outreach>) => setO((x) => ({ ...x, ...patch }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    let next: Outreach = { ...o, notes: o.notes.trim(), followUps: (o.followUps ?? []).filter(Boolean).sort() };
    if (next.responded) next = withReply(next, next.respondedOn || localToday());
    else next = { ...next, respondedOn: undefined, responseDays: undefined, chatted: false };
    if (!next.chatted) next = { ...next, thanked: false, helpfulness: undefined };
    act.save(next);
    onDone();
  };

  return (
    <form onSubmit={save} className="space-y-4">
      {contact && (
        <p className="text-[13px] text-muted">
          {contact.name}
          {contact.company ? `, ${[contact.title, contact.company].filter(Boolean).join(" at ")}` : ""}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="First message">
          <Input type="date" required value={o.date} onChange={(e) => set({ date: e.target.value })} />
        </Field>
        <Field label="Channel">
          <Select options={CHANNELS} value={o.channel} onChange={(e) => set({ channel: e.target.value as Outreach["channel"] })} />
        </Field>
      </div>
      <fieldset className="space-y-2">
        <legend className="mb-1 text-[13px] font-medium text-ink-2">Follow-ups sent</legend>
        {(o.followUps ?? []).length === 0 && <p className="text-[12.5px] text-muted">None yet.</p>}
        {(o.followUps ?? []).map((f, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              type="date"
              aria-label={`Follow-up ${i + 1} date`}
              value={f}
              onChange={(e) => set({ followUps: (o.followUps ?? []).map((x, j) => (j === i ? e.target.value : x)) })}
              className="max-w-[12rem]"
            />
            <Button variant="ghost" onClick={() => set({ followUps: (o.followUps ?? []).filter((_, j) => j !== i) })} aria-label={`Remove follow-up ${i + 1}`}>
              Remove
            </Button>
          </div>
        ))}
        <Button variant="secondary" onClick={() => set({ followUps: [...(o.followUps ?? []), localToday()] })}>
          Add a follow-up
        </Button>
      </fieldset>
      <div className="grid grid-cols-2 items-end gap-3">
        <Check label="They replied" checked={o.responded} onChange={(v) => set({ responded: v, respondedOn: v ? o.respondedOn || localToday() : undefined })} />
        <Field label="Reply date">
          <Input type="date" disabled={!o.responded} value={o.respondedOn ?? ""} onChange={(e) => set({ respondedOn: e.target.value })} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Check label="We chatted" checked={o.chatted} onChange={(v) => set({ chatted: v, responded: v ? true : o.responded, respondedOn: v ? o.respondedOn || localToday() : o.respondedOn })} />
        <Check label="Sent a thank-you" checked={!!o.thanked} onChange={(v) => set({ thanked: v })} />
        <Check label="Referred me" checked={o.referred} onChange={(v) => set({ referred: v })} />
      </div>
      <Field label="How helpful was the chat?">
        <Select
          disabled={!o.chatted}
          options={[{ value: "", label: "Not rated" }, ...RATINGS.map((n) => ({ value: String(n), label: `${n} of 5` }))]}
          value={o.helpfulness ? String(o.helpfulness) : ""}
          onChange={(e) => set({ helpfulness: e.target.value ? (Number(e.target.value) as Outreach["helpfulness"]) : undefined })}
        />
      </Field>
      <Field label="Notes">
        <Textarea rows={4} value={o.notes} onChange={(e) => set({ notes: e.target.value })} />
      </Field>
      <Check label="Log anonymously" checked={!!o.anonymous} onChange={(v) => set({ anonymous: v || undefined })} hint="Other members see “Anonymous member”; you and exec see your name." />
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button type="submit">Save changes</Button>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        {confirming ? (
          <span className="ml-auto inline-flex items-center gap-1 text-[13px]">
            <span className="text-muted">Remove from your log?</span>
            <Button
              variant="danger"
              onClick={() => {
                act.remove(outreach);
                onDone();
              }}
            >
              Remove
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Keep
            </Button>
          </span>
        ) : (
          <Button variant="danger" className="ml-auto" onClick={() => setConfirming(true)}>
            Remove
          </Button>
        )}
      </div>
    </form>
  );
}

/** Inline 1 to 5 helpfulness buttons, shown once a chat is logged and not yet rated. */
function RateInline({ onRate, name }: { onRate: (n: NonNullable<Outreach["helpfulness"]>) => void; name: string }) {
  return (
    <span role="group" aria-label={`How helpful was ${name}?`} className="inline-flex items-center gap-1.5">
      <span className="text-[12px] text-muted">Helpful?</span>
      <span className="inline-flex overflow-hidden rounded-[3px] border border-[#d6d6cb]">
        {RATINGS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onRate(n)}
            aria-label={`${n} of 5`}
            className="h-7 w-7 border-r border-[#d6d6cb] bg-white text-[12.5px] tabular-nums last:border-r-0 hover:bg-accent hover:text-white focus-visible:relative focus-visible:z-10"
          >
            {n}
          </button>
        ))}
      </span>
    </span>
  );
}

/** The actions that fit where an outreach stands, as one-click buttons. */
export function RowActions({ o, name }: { o: Outreach; name: string }) {
  const act = useOutreachActions();
  const step = nextStep(o);
  const sent = o.followUps?.length ?? 0;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {!o.responded && (
        <>
          {sent < MAX_FOLLOW_UPS && step.kind !== "move-on" && (
            <Button variant="secondary" className="!h-7 !px-2" onClick={() => act.followedUp(o)}>
              Followed up
            </Button>
          )}
          <Button variant="secondary" className="!h-7 !px-2" onClick={() => act.gotReply(o)}>
            Got a reply
          </Button>
        </>
      )}
      {o.responded && !o.chatted && (
        <Button variant="secondary" className="!h-7 !px-2" onClick={() => act.chatted(o)}>
          We chatted
        </Button>
      )}
      {o.chatted && o.helpfulness == null && <RateInline name={name} onRate={(n) => act.rate(o, n)} />}
      {o.chatted && !o.thanked && (
        <Button variant="secondary" className="!h-7 !px-2" onClick={() => act.thanked(o)}>
          Sent thank-you
        </Button>
      )}
      {o.responded && (
        <label className="flex items-center gap-1.5 px-1 text-[12.5px] text-ink-2">
          <input type="checkbox" className="h-3.5 w-3.5 accent-[var(--color-accent)]" checked={o.referred} onChange={(e) => act.referred(o, e.target.checked)} />
          Referred me
        </label>
      )}
    </div>
  );
}

/** What each stage and ping means. */
export function HowItWorks() {
  return (
    <details className="group rounded-[3px] border border-edge bg-white text-[13px]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 font-medium text-ink-2 hover:bg-[#fbfbf7] [&::-webkit-details-marker]:hidden">
        How this works
        <svg viewBox="0 0 12 12" className="h-3 w-3 text-muted transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </summary>
      <div className="grid gap-4 border-t border-edge px-4 py-3 text-ink-2 md:grid-cols-2">
        <div>
          <p className="mb-1.5 text-[11.5px] font-medium tracking-[0.06em] text-muted uppercase">Stages</p>
          <dl className="space-y-1.5">
            <div>
              <dt className="inline font-medium">Reached out.</dt> <dd className="inline">You sent the first message.</dd>
            </div>
            <div>
              <dt className="inline font-medium">Followed up.</dt> <dd className="inline">You sent at least one nudge and haven&apos;t heard back.</dd>
            </div>
            <div>
              <dt className="inline font-medium">Replied.</dt> <dd className="inline">They wrote back. Reply time is counted from your first message.</dd>
            </div>
            <div>
              <dt className="inline font-medium">Chatted.</dt> <dd className="inline">You had the call or coffee.</dd>
            </div>
          </dl>
        </div>
        <div>
          <p className="mb-1.5 text-[11.5px] font-medium tracking-[0.06em] text-muted uppercase">Reminders</p>
          <ul className="list-disc space-y-1.5 pl-4">
            <li>
              No reply after {FOLLOW_UP_DAYS} days: follow up. You&apos;re reminded up to {MAX_FOLLOW_UPS} times, then told to try someone else.
            </li>
            <li>They replied: schedule the chat.</li>
            <li>After the chat: send a thank-you note, then rate how helpful it was.</li>
            <li>Due reminders also show on your Home page.</li>
          </ul>
        </div>
        <p className="text-[12.5px] text-muted md:col-span-2">
          Adding a person also adds them to the shared Network, or links to them if someone already has. Every update here feeds their Network grade
          (response rate, reply speed, helpfulness). Logging anonymously hides your name from other members; you and exec still see it.
        </p>
      </div>
    </details>
  );
}

type StageFilter = "all" | "due" | OutreachStage;

/** The My network tab: the member's own outreach as a spreadsheet with reminders. */
export function MyNetwork({ adding, setAdding }: { adding: boolean; setAdding: (v: boolean) => void }) {
  const { data, me } = usePortal();
  const [firm, setFirm] = useState("");
  const [stage, setStage] = useState<StageFilter>("all");
  const [editing, setEditing] = useState<Outreach | null>(null);

  if (!me) return null;

  const now = new Date();
  const contact = (id: string) => data.contacts.find((c) => c.id === id);
  const all = data.outreach
    .filter((o) => o.memberId === me.id)
    .map((o) => ({ o, c: contact(o.contactId), stage: outreachStage(o), step: nextStep(o, now) }));
  const due = all.filter((x) => x.step.due).length;
  const people = new Set(all.map((x) => x.o.contactId)).size;
  const myFirms = [...new Set(all.map((x) => x.c?.company ?? "").filter(Boolean))];
  const f = firm.trim().toLowerCase();
  const rows = all
    .filter((x) => !f || (x.c?.company ?? "").toLowerCase().includes(f))
    .filter((x) => stage === "all" || (stage === "due" ? x.step.due : x.stage === stage))
    .sort((a, b) => Number(b.step.due) - Number(a.step.due) || lastActivity(b.o).localeCompare(lastActivity(a.o)));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="w-full sm:max-w-[16rem]">
          <Input type="search" list="my-firms" placeholder="Filter by company" value={firm} onChange={(e) => setFirm(e.target.value)} aria-label="Filter by company" />
          <FirmOptions id="my-firms" names={myFirms} />
        </div>
        <div className="w-full sm:w-48">
          <Select
            aria-label="Filter by stage"
            value={stage}
            onChange={(e) => setStage(e.target.value as StageFilter)}
            options={[{ value: "all", label: "All stages" }, { value: "due", label: "Needs a follow-up" }, ...OUTREACH_STAGES]}
          />
        </div>
        <p className="text-[13px] text-muted sm:ml-auto">
          {due ? (
            <button type="button" onClick={() => setStage("due")} className="font-medium text-[#7f5300] hover:underline">
              {due} {due === 1 ? "person needs" : "people need"} a follow-up
            </button>
          ) : (
            "Nothing to follow up on today"
          )}
          <span className="mx-1.5 text-faint" aria-hidden>
            ·
          </span>
          {people} {people === 1 ? "person" : "people"}
          {all.length > people && `, ${all.length} conversations`}
        </p>
      </div>

      <HowItWorks />

      <Card flush>
        {rows.length === 0 ? (
          <Empty>
            {all.length === 0 ? (
              <>
                <span className="mb-3 block">No one yet. Add the first person you reach out to; they&apos;ll also join the shared Network.</span>
                <Button onClick={() => setAdding(true)}>Add a person</Button>
              </>
            ) : (
              "No one matches these filters."
            )}
          </Empty>
        ) : (
          <>
          {/* Phones: one card per person, so updating after a coffee chat is one tap with no sideways scrolling. */}
          <ul className="divide-y divide-edge md:hidden">
            {rows.map(({ o, c, stage: st, step }) => (
              <li key={o.id} className="space-y-2 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {c ? (
                      <>
                        <Link href={`/portal/network/${c.id}`} className="font-medium hover:underline">
                          {c.name}
                        </Link>
                        <span className="mt-0.5 block text-[12.5px] text-muted">
                          {[c.title, c.company].filter(Boolean).join(" at ")}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted">Contact removed</span>
                    )}
                  </div>
                  <StageChip stage={st} />
                </div>
                <StepPing step={step} />
                <p className="text-[12.5px] text-muted">
                  First message {fmtDate(o.date)} {o.channel === "In person" ? "in person" : `by ${o.channel === "LinkedIn" ? "LinkedIn" : o.channel.toLowerCase()}`}
                  {o.responded && o.responseDays != null && `, replied in ${o.responseDays} ${o.responseDays === 1 ? "day" : "days"}`}
                  {o.chatted && o.helpfulness != null && `, rated ${o.helpfulness} of 5`}
                </p>
                {o.notes && <p className="text-[12.5px] whitespace-pre-line text-ink-2">{o.notes}</p>}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <RowActions o={o} name={c?.name ?? "them"} />
                  <Button variant="ghost" onClick={() => setEditing(o)} aria-label={`Edit outreach to ${c?.name ?? "contact"}`}>
                    Edit
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="relative hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1040px]">
              <thead>
                <tr>
                  <Th>Person</Th>
                  <Th>First message</Th>
                  <Th>Stage</Th>
                  <Th>Next step</Th>
                  <Th>Update</Th>
                  <Th>
                    <span className="sr-only">Edit</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ o, c, stage: st, step }) => (
                  <tr key={o.id} className={`${rowCls} align-top`}>
                    <Td className="max-w-[17rem] py-3 align-top">
                      {c ? (
                        <>
                          <Link href={`/portal/network/${c.id}`} className="font-medium hover:underline">
                            {c.name}
                          </Link>
                          <span className="mt-0.5 block text-[12.5px] text-muted">
                            {c.title}
                            {c.title && c.company && " at "}
                            {c.company && (
                              <Link href={`/portal/companies/${companySlug(c.company)}`} className="text-link hover:underline">
                                {c.company}
                              </Link>
                            )}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted">Contact removed</span>
                      )}
                      {o.notes && <span className="mt-1 block text-[12.5px] whitespace-pre-line text-ink-2">{o.notes}</span>}
                    </Td>
                    <Td className="py-3 align-top whitespace-nowrap">
                      <span className="block tabular-nums">{fmtDate(o.date)}</span>
                      <span className="block text-[12.5px] text-muted">{o.channel}</span>
                    </Td>
                    <Td className="py-3 align-top">
                      <StageChip stage={st} />
                      <span className="mt-1 block text-[12px] text-muted">
                        {o.responded && o.responseDays != null
                          ? `Replied in ${o.responseDays} ${o.responseDays === 1 ? "day" : "days"}`
                          : o.followUps?.length
                            ? `${o.followUps.length} ${o.followUps.length === 1 ? "follow-up" : "follow-ups"}`
                            : null}
                        {o.chatted && o.helpfulness != null && `, ${o.helpfulness} of 5`}
                        {o.referred && ", referred you"}
                      </span>
                    </Td>
                    <Td className="py-3 align-top">
                      <StepPing step={step} />
                    </Td>
                    <Td className="py-3 align-top">
                      <RowActions o={o} name={c?.name ?? "them"} />
                    </Td>
                    <Td className="py-3 text-right align-top">
                      <Button variant="ghost" onClick={() => setEditing(o)} aria-label={`Edit outreach to ${c?.name ?? "contact"}`}>
                        Edit
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </Card>

      <Drawer open={adding} onClose={() => setAdding(false)} title="Add a person">
        {adding && <AddPersonForm onDone={() => setAdding(false)} />}
      </Drawer>
      <Drawer open={!!editing} onClose={() => setEditing(null)} title="Edit outreach">
        {editing && <EditOutreachForm key={editing.id} outreach={editing} contact={contact(editing.contactId)} onDone={() => setEditing(null)} />}
      </Drawer>
    </div>
  );
}

/** Update a contact who has moved firms or changed title. Mount only while open. */
export function MoveContactForm({ contact, onDone }: { contact: Contact; onDone: () => void }) {
  const { data, me, update } = usePortal();
  const [company, setCompany] = useState(contact.company);
  const [title, setTitle] = useState(contact.title);
  if (!me) return null;

  const firm = company.trim() ? matchCompany(data, company) : "";
  const changed = companySlug(firm) !== companySlug(contact.company.trim()) || title.trim() !== contact.title.trim();

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changed) return onDone();
    const next = movedContact(contact, { company: firm, title }, me.id);
    update((d) => ({ ...d, contacts: d.contacts.map((c) => (c.id === contact.id ? next : c)) }));
    onDone();
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <p className="text-[13px] text-muted">
        Currently {[contact.title, contact.company].filter(Boolean).join(" at ") || "no role recorded"}. Their old role is kept under
        &ldquo;Previously&rdquo;, and their outreach history and grade stay with them.
      </p>
      <Field label="Company">
        <Input required list="move-firms" value={company} onChange={(e) => setCompany(e.target.value)} />
        <FirmOptions id="move-firms" names={companyNames(data)} />
      </Field>
      <Field label="Title">
        <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={!changed || !firm || !title.trim()}>
          Save new role
        </Button>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** A member's outreach to anyone at one firm, newest first. */
export function myOutreachAt(data: Pick<PortalData, "outreach" | "contacts">, memberId: string, company: string) {
  const ids = new Set(data.contacts.filter((c) => c.company.trim() === company || c.history?.some((h) => h.company.trim() === company)).map((c) => c.id));
  return data.outreach.filter((o) => o.memberId === memberId && ids.has(o.contactId)).sort((a, b) => b.date.localeCompare(a.date));
}
