"use client";

import { useState } from "react";
import Link from "@/components/app-link";
import { useRouteParam } from "@/lib/use-route-param";
import { usePortal } from "@/portal/store";
import { byline, companySlug, fmtDate, fullName, localToday, outreachStage, pct, responseStats, uid } from "@/portal/logic";
import { ContactGradeCard } from "@/portal/grades";
import { MoveContactForm, StageChip } from "@/portal/outreach";
import type { Comment, Outreach } from "@/portal/types";
import { Avatar, Button, Card, Check, Drawer, Empty, Field, Input, PageTitle, Select, Stat, StatGroup, Td, Textarea, Th, linkCls, rowCls, PRIVATE_HINT, PrivateNote } from "@/portal/ui";

const CHANNELS: Outreach["channel"][] = ["Email", "LinkedIn", "Referral", "In person"];
const RATINGS = ["Not rated", "1", "2", "3", "4", "5"] as const;

const today = () => localToday();
const days = (d: number) => `${d} ${d === 1 ? "day" : "days"}`;

type OutreachDraft = {
  date: string;
  channel: Outreach["channel"];
  responded: boolean;
  responseDays: string;
  chatted: boolean;
  helpfulness: string;
  referred: boolean;
  notes: string;
  privateNotes: string;
  anonymous: boolean;
};
const newOutreachDraft = (): OutreachDraft => ({
  date: today(),
  channel: "Email",
  responded: false,
  responseDays: "",
  chatted: false,
  helpfulness: "Not rated",
  referred: false,
  notes: "",
  privateNotes: "",
  anonymous: false,
});

export default function ContactView() {
  const id = useRouteParam("id");
  const { data, me, update } = usePortal();
  const [logging, setLogging] = useState(false);
  const [moving, setMoving] = useState(false);
  const [draft, setDraft] = useState<OutreachDraft>(newOutreachDraft);
  const [comment, setComment] = useState("");

  if (!me) return null;

  const c = data.contacts.find((x) => x.id === id);
  if (!c) {
    return (
      <div>
        <PageTitle title="Contact not found" back={{ href: "/portal/network", label: "Network" }} />
        <p className="text-[13.5px] text-muted">
          This contact may have been removed, or the link is incomplete.{" "}
          <Link href="/portal/network" className={linkCls}>
            Return to the network
          </Link>
          .
        </p>
      </div>
    );
  }

  const log = data.outreach.filter((o) => o.contactId === c.id).sort((a, b) => b.date.localeCompare(a.date));
  const s = responseStats(log);
  const subject = `contact:${c.id}`;
  const comments = data.comments.filter((x) => x.subject === subject).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const member = (mid: string) => data.members.find((x) => x.id === mid);
  const memberName = (mid: string) => {
    const m = member(mid);
    return m ? fullName(m) : "Former member";
  };

  const saveOutreach = (e: React.FormEvent) => {
    e.preventDefault();
    const n = draft.responseDays.trim() === "" ? undefined : Math.max(0, Number(draft.responseDays));
    const o: Outreach = {
      id: uid(),
      contactId: c.id,
      memberId: me.id,
      date: draft.date || today(),
      channel: draft.channel,
      responded: draft.responded,
      responseDays: draft.responded && n != null && Number.isFinite(n) ? n : undefined,
      chatted: draft.chatted,
      helpfulness: draft.helpfulness === "Not rated" ? undefined : (Number(draft.helpfulness) as Outreach["helpfulness"]),
      referred: draft.referred,
      notes: draft.notes.trim(),
      privateNotes: draft.privateNotes.trim() || undefined,
      anonymous: draft.anonymous || undefined,
    };
    update((d) => ({ ...d, outreach: [...d.outreach, o] }));
    setDraft(newOutreachDraft());
    setLogging(false);
  };

  const postComment = (e: React.FormEvent) => {
    e.preventDefault();
    const body = comment.trim();
    if (!body) return;
    const x: Comment = { id: uid(), subject, memberId: me.id, body, createdAt: new Date().toISOString() };
    update((d) => ({ ...d, comments: [...d.comments, x] }));
    setComment("");
  };

  const role = [c.title, c.company].filter(Boolean);
  const updatedBy = c.updatedBy ? member(c.updatedBy) : undefined;

  return (
    <div>
      <PageTitle
        back={{ href: "/portal/network", label: "Network" }}
        title={c.name}
        actions={
          <Button variant="secondary" onClick={() => setMoving(true)}>
            Update role or company
          </Button>
        }
        sub={
          <>
            {role.length > 0 && (
              <p>
                {c.title}
                {c.title && c.company && " at "}
                {c.company && (
                  <Link href={`/portal/companies/${companySlug(c.company)}`} className={linkCls}>
                    {c.company}
                  </Link>
                )}
              </p>
            )}
            {c.isAlum && <p>{c.alumClass ? `Graphite alum, class of ${c.alumClass}` : "Graphite alum"}</p>}
            {c.isSchoolAlum && (
              <p>
                {c.alumSchool ?? "Claremont Colleges"} alum{c.schoolClass ? `, class of ${c.schoolClass}` : ""}
              </p>
            )}
          </>
        }
      />

      <StatGroup className="md:grid-cols-5!">
        <Stat label="Outreach" value={s.total} />
        <Stat label="Response rate" value={s.total ? pct(s.rate) : "None"} />
        <Stat label="Median reply" value={s.medianDays ?? "None"} sub={s.medianDays != null ? "Days" : undefined} />
        <Stat label="Avg helpfulness" value={s.avgHelpfulness != null ? s.avgHelpfulness.toFixed(1) : "None"} sub={s.avgHelpfulness != null ? "Out of 5" : undefined} />
        <Stat label="Referrals" value={s.referrals} />
      </StatGroup>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card
            title="Outreach log"
            flush
            action={
              <Button variant="secondary" onClick={() => setLogging(true)}>
                Log outreach
              </Button>
            }
          >
            {log.length === 0 ? (
              <Empty>
                No outreach logged yet. Be the first to record how it went, or track it with reminders in{" "}
                <Link href="/portal/recruiting#network" className={linkCls}>
                  My network
                </Link>
                .
              </Empty>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr>
                      <Th>Member</Th>
                      <Th>Date</Th>
                      <Th>Channel</Th>
                      <Th>Stage</Th>
                      <Th>Reply time</Th>
                      <Th>Helpfulness</Th>
                      <Th>Referred</Th>
                      <Th>Notes</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.map((o) => {
                      const by = byline(o.memberId, o.anonymous, me, data.members);
                      return (
                      <tr key={o.id} className={rowCls}>
                        <Td className="whitespace-nowrap">
                          <span className="font-medium">{by.name}</span>
                          {by.note && <span className="block text-[12px] text-muted">{by.note}</span>}
                        </Td>
                        <Td className="whitespace-nowrap text-muted tabular-nums">{fmtDate(o.date)}</Td>
                        <Td className="whitespace-nowrap">{o.channel}</Td>
                        <Td>
                          <StageChip stage={outreachStage(o)} />
                        </Td>
                        <Td className="whitespace-nowrap tabular-nums">{o.responseDays != null ? days(o.responseDays) : <span className="text-faint">None</span>}</Td>
                        <Td className="tabular-nums">{o.helpfulness != null ? `${o.helpfulness} of 5` : <span className="text-faint">None</span>}</Td>
                        <Td>{o.referred ? "Yes" : "No"}</Td>
                        <Td className="max-w-[28ch] text-[13px] text-muted">
                          {o.notes}
                          {o.memberId === me.id && <PrivateNote text={o.privateNotes} />}
                        </Td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title="Notes from members" flush>
            {comments.length === 0 ? (
              <Empty>No notes yet. Share context or advice for the next member.</Empty>
            ) : (
              <ul className="divide-y divide-edge">
                {comments.map((x) => {
                  const author = member(x.memberId);
                  const name = author ? fullName(author) : "Former member";
                  return (
                    <li key={x.id} className="flex gap-3 px-4 py-3">
                      <Avatar name={name} photo={author?.photo} size={24} />
                      <div className="min-w-0">
                        <p className="flex items-baseline gap-2">
                          <span className="text-[13px] font-medium">{name}</span>
                          <span className="text-[12px] text-faint">{fmtDate(x.createdAt)}</span>
                        </p>
                        <p className="mt-0.5 text-[13.5px] leading-relaxed whitespace-pre-line text-ink-2">{x.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <form onSubmit={postComment} className="border-t border-edge bg-stone px-4 py-3">
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share context or advice about this contact" aria-label="New note" />
              <div className="mt-2 flex justify-end">
                <Button type="submit" disabled={!comment.trim()}>
                  Post
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <ContactGradeCard items={log} />

          <Card title="How to approach">
            <p className="py-3 text-[13.5px] leading-relaxed whitespace-pre-line text-ink-2">
              {c.preferences || <span className="text-muted">No guidance yet. If you reach out, add what you learn to the notes.</span>}
            </p>
          </Card>

          {(c.history?.length ?? 0) > 0 && (
            <Card title="Previously" flush>
              <ul className="divide-y divide-edge text-[13px]">
                {c.history!.map((h, i) => (
                  <li key={`${h.company}-${h.until}-${i}`} className="px-4 py-2.5">
                    <span className="block text-ink-2">
                      {h.title}
                      {h.title && h.company && " at "}
                      {h.company && (
                        <Link href={`/portal/companies/${companySlug(h.company)}`} className={linkCls}>
                          {h.company}
                        </Link>
                      )}
                    </span>
                    <span className="block text-[12px] text-muted">Until {fmtDate(h.until)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card title="Details" flush>
            <dl className="divide-y divide-edge text-[13px]">
              {c.email && (
                <div className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                  <dt className="shrink-0 text-muted">Email</dt>
                  <dd className="min-w-0 text-right">
                    <a href={`mailto:${c.email}`} className="break-all hover:underline">
                      {c.email}
                    </a>
                  </dd>
                </div>
              )}
              {c.linkedin && (
                <div className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                  <dt className="shrink-0 text-muted">LinkedIn</dt>
                  <dd className="min-w-0 text-right">
                    <a href={c.linkedin} target="_blank" rel="noreferrer" className="break-all hover:underline">
                      {c.linkedin.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  </dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                <dt className="shrink-0 text-muted">Added by</dt>
                <dd className="min-w-0 text-right">{memberName(c.addedBy)}</dd>
              </div>
              {c.updatedAt && (
                <div className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                  <dt className="shrink-0 text-muted">Role updated</dt>
                  <dd className="min-w-0 text-right">
                    {fmtDate(c.updatedAt)}
                    {updatedBy ? `, by ${fullName(updatedBy)}` : ""}
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        </div>
      </div>

      <Drawer open={moving} onClose={() => setMoving(false)} title={`Update ${c.name}'s role`}>
        {moving && <MoveContactForm contact={c} onDone={() => setMoving(false)} />}
      </Drawer>
      <Drawer open={logging} onClose={() => setLogging(false)} title="Log outreach">
        <form onSubmit={saveOutreach} className="space-y-4">
          <p className="text-[13px] text-muted">
            Logged as {fullName(me)}, for {c.name}. Each outreach feeds this contact&apos;s grade.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <Input type="date" required value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            </Field>
            <Field label="Channel">
              <Select options={CHANNELS} value={draft.channel} onChange={(e) => setDraft({ ...draft, channel: e.target.value as Outreach["channel"] })} />
            </Field>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Check label="Responded" checked={draft.responded} onChange={(v) => setDraft({ ...draft, responded: v })} />
            <Check label="Chatted" checked={draft.chatted} onChange={(v) => setDraft({ ...draft, chatted: v })} />
            <Check label="Referred me" checked={draft.referred} onChange={(v) => setDraft({ ...draft, referred: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Days to reply">
              <Input type="number" min={0} disabled={!draft.responded} value={draft.responseDays} onChange={(e) => setDraft({ ...draft, responseDays: e.target.value })} placeholder="For example, 3" />
            </Field>
            <Field label="Helpfulness">
              <Select options={RATINGS} value={draft.helpfulness} onChange={(e) => setDraft({ ...draft, helpfulness: e.target.value })} />
            </Field>
          </div>
          <Field label="Public notes" hint="Shown in the log above. Your name shows unless you log anonymously.">
            <Textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </Field>
          <Field label="Private notes" hint={PRIVATE_HINT}>
            <Textarea value={draft.privateNotes} onChange={(e) => setDraft({ ...draft, privateNotes: e.target.value })} />
          </Field>
          <Check
            label="Log anonymously"
            checked={draft.anonymous}
            onChange={(v) => setDraft({ ...draft, anonymous: v })}
            hint="Your outreach still counts toward the grade. Other members see “Anonymous member”; you and exec see your name."
          />
          <div className="flex gap-2 pt-2">
            <Button type="submit">Save outreach</Button>
            <Button variant="secondary" onClick={() => setLogging(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
