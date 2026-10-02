"use client";

import Link from "@/components/app-link";
import { Fragment, useState } from "react";
import { usePortal } from "@/portal/store";
import { companySlug, fmtDate, uid } from "@/portal/logic";
import { STAGES, type Application, type Stage } from "@/portal/types";
import { Badge, Button, Card, Drawer, Empty, Field, Input, PageTitle, Select, Stat, Td, Textarea, Th } from "@/portal/ui";

const INTERVIEW_STAGES: Stage[] = ["Online Assessment", "First Round", "Superday / Final"];
const CLOSED_STAGES: Stage[] = ["Offer", "Rejected", "Withdrew"];

/** Today as a local calendar date, YYYY-MM-DD. */
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function stageTone(s: Stage) {
  if (s === "Offer") return "green" as const;
  if (s === "Rejected") return "red" as const;
  if (s === "Withdrew" || s === "Researching") return "gray" as const;
  if (INTERVIEW_STAGES.includes(s)) return "amber" as const;
  return "blue" as const;
}

type Draft = { company: string; position: string; cycle: string; stage: Stage; notes: string };
const emptyDraft: Draft = { company: "", position: "", cycle: "", stage: "Researching", notes: "" };

export default function RecruitingPage() {
  const { data, me, update } = usePortal();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [confirming, setConfirming] = useState<string | null>(null);

  if (!me) return null;

  const mine = data.applications.filter((a) => a.memberId === me.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const active = mine.filter((a) => !CLOSED_STAGES.includes(a.stage)).length;
  const interviewing = mine.filter((a) => INTERVIEW_STAGES.includes(a.stage)).length;
  const offers = mine.filter((a) => a.stage === "Offer").length;
  const myOutreach = data.outreach.filter((o) => o.memberId === me.id).sort((a, b) => b.date.localeCompare(a.date));
  const grouped = STAGES.map((s) => ({ stage: s, items: mine.filter((a) => a.stage === s) })).filter((g) => g.items.length > 0);

  const setStage = (id: string, stage: Stage) =>
    update((d) => ({
      ...d,
      applications: d.applications.map((a) => (a.id === id ? { ...a, stage, updatedAt: today() } : a)),
    }));

  const remove = (id: string) => {
    update((d) => ({ ...d, applications: d.applications.filter((a) => a.id !== id) }));
    setConfirming(null);
  };

  const openAdd = () => {
    setDraft(emptyDraft);
    setAdding(true);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.company.trim() || !draft.position.trim()) return;
    const app: Application = {
      id: uid(),
      memberId: me.id,
      company: draft.company.trim(),
      position: draft.position.trim(),
      cycle: draft.cycle.trim(),
      stage: draft.stage,
      notes: draft.notes.trim(),
      updatedAt: today(),
    };
    update((d) => ({ ...d, applications: [app, ...d.applications] }));
    setAdding(false);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="My recruiting"
        sub="Your applications and coffee chats. Only you and the executive board can see this page."
        actions={<Button onClick={openAdd}>Add application</Button>}
      />

      <div className="grid grid-cols-2 gap-x-8 gap-y-6 lg:grid-cols-4">
        <Stat label="Active applications" value={active} sub={`${mine.length} tracked in total`} />
        <Stat label="Interviewing" value={interviewing} sub="Assessment, first round or final" />
        <Stat label="Offers" value={offers} />
        <Stat label="Coffee chats logged" value={myOutreach.length} sub={`${myOutreach.filter((o) => o.chatted).length} completed`} />
      </div>

      <Card title="Applications" className="mt-14">
        {mine.length === 0 ? (
          <Empty>No applications yet. Add the first one to start tracking your recruiting.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-line">
                <tr>
                  <Th>Company</Th>
                  <Th>Position</Th>
                  <Th>Cycle</Th>
                  <Th>Stage</Th>
                  <Th>Updated</Th>
                  <Th>
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((g) => (
                  <Fragment key={g.stage}>
                    <tr>
                      <td colSpan={6} className="pt-7 pb-2">
                        <Badge tone={stageTone(g.stage)}>{g.stage}</Badge>
                        <span className="ml-2 text-[0.8125rem] text-muted tabular-nums">{g.items.length}</span>
                      </td>
                    </tr>
                    {g.items.map((a) => (
                      <tr key={a.id} className="border-b border-line">
                        <Td>
                          <Link href={`/portal/companies/${companySlug(a.company)}`} className="display text-[1.25rem] leading-tight hover:underline">
                            {a.company}
                          </Link>
                        </Td>
                        <Td className="max-w-xs">
                          <span className="block">{a.position}</span>
                          {a.notes && <span className="mt-1 block whitespace-pre-line text-muted">{a.notes}</span>}
                        </Td>
                        <Td className="text-muted">{a.cycle}</Td>
                        <Td>
                          <select
                            aria-label={`Stage for ${a.company}`}
                            value={a.stage}
                            onChange={(e) => setStage(a.id, e.target.value as Stage)}
                            className="border border-line bg-paper py-1 pr-1 pl-2 text-[0.8125rem] text-ink hover:border-ink focus:border-ink focus:outline-none"
                          >
                            {STAGES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </Td>
                        <Td className="whitespace-nowrap text-muted">{fmtDate(a.updatedAt)}</Td>
                        <Td className="pr-0 text-right whitespace-nowrap">
                          {confirming === a.id ? (
                            <span className="inline-flex items-center gap-1 text-sm">
                              <span className="text-muted">Remove?</span>
                              <Button variant="danger" onClick={() => remove(a.id)}>
                                Yes
                              </Button>
                              <span className="text-faint">/</span>
                              <Button variant="ghost" onClick={() => setConfirming(null)}>
                                No
                              </Button>
                            </span>
                          ) : (
                            <Button variant="ghost" onClick={() => setConfirming(a.id)} aria-label={`Remove ${a.company} application`}>
                              Remove
                            </Button>
                          )}
                        </Td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title="Coffee chats"
        className="mt-14"
        action={
          <Link href="/portal/network" className="link-u text-ink-2 hover:text-ink">
            Open the network
          </Link>
        }
      >
        {myOutreach.length === 0 ? (
          <Empty>
            No outreach logged yet. Find someone in the{" "}
            <Link href="/portal/network" className="link-u text-ink">
              network
            </Link>{" "}
            and log your first message.
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-line">
                <tr>
                  <Th>Person</Th>
                  <Th>Company</Th>
                  <Th>Date</Th>
                  <Th>Channel</Th>
                  <Th>Response</Th>
                  <Th>Chatted</Th>
                </tr>
              </thead>
              <tbody>
                {myOutreach.map((o) => {
                  const c = data.contacts.find((x) => x.id === o.contactId);
                  return (
                    <tr key={o.id} className="border-b border-line">
                      <Td className="font-medium">
                        {c ? (
                          <Link href={`/portal/network/${c.id}`} className="hover:underline">
                            {c.name}
                          </Link>
                        ) : (
                          <span className="text-muted">Unknown contact</span>
                        )}
                      </Td>
                      <Td>
                        {c?.company ? (
                          <Link href={`/portal/companies/${companySlug(c.company)}`} className="text-ink-2 hover:text-ink hover:underline">
                            {c.company}
                          </Link>
                        ) : null}
                      </Td>
                      <Td className="whitespace-nowrap text-muted">{fmtDate(o.date)}</Td>
                      <Td>{o.channel}</Td>
                      <Td>{o.responded ? <Badge tone="green">Responded</Badge> : <Badge>No reply</Badge>}</Td>
                      <Td>{o.chatted ? "Yes" : "No"}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="mt-10 max-w-[65ch] text-sm text-muted">
        After an interview, add what you learned to the company&apos;s page so the next member is better prepared.
      </p>

      <Drawer open={adding} onClose={() => setAdding(false)} title="Add application">
        <form onSubmit={save} className="space-y-5">
          <Field label="Company">
            <Input required value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} placeholder="e.g. Bain & Company" />
          </Field>
          <Field label="Position">
            <Input required value={draft.position} onChange={(e) => setDraft({ ...draft, position: e.target.value })} placeholder="e.g. Associate Consultant Intern" />
          </Field>
          <Field label="Cycle">
            <Input value={draft.cycle} onChange={(e) => setDraft({ ...draft, cycle: e.target.value })} placeholder="e.g. Summer 2027 Internship" />
          </Field>
          <Field label="Stage">
            <Select options={STAGES} value={draft.stage} onChange={(e) => setDraft({ ...draft, stage: e.target.value as Stage })} />
          </Field>
          <Field label="Notes">
            <Textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Deadlines, contacts, preparation" />
          </Field>
          <div className="flex gap-2 pt-2">
            <Button type="submit">Save application</Button>
            <Button variant="secondary" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
