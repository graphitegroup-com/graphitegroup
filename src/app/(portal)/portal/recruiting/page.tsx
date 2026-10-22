"use client";

import Link from "@/components/app-link";
import { Fragment, useState } from "react";
import { usePortal } from "@/portal/store";
import { companySlug, fmtDate, uid } from "@/portal/logic";
import { STAGES, type Application, type Stage } from "@/portal/types";
import { Badge, Button, Card, Drawer, Empty, Field, Input, PageTitle, Select, Stat, StatGroup, Td, Textarea, Th, rowCls } from "@/portal/ui";

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
    <div>
      <PageTitle
        title="My recruiting"
        sub="Your applications and coffee chats. Only you and the executive board can see this page."
        actions={<Button onClick={openAdd}>Add application</Button>}
      />

      <StatGroup>
        <Stat label="Active applications" value={active} sub={`${mine.length} tracked in total`} />
        <Stat label="Interviewing" value={interviewing} sub="Assessment, first round or final" />
        <Stat label="Offers" value={offers} />
        <Stat label="Coffee chats logged" value={myOutreach.length} sub={`${myOutreach.filter((o) => o.chatted).length} completed`} />
      </StatGroup>

      <Card title="Applications" className="mt-6" flush>
        {mine.length === 0 ? (
          <Empty>No applications yet. Add the first one to start tracking your recruiting.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
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
                    <tr className="border-b border-edge bg-[#fafbfc]">
                      <td colSpan={6} className="px-4 py-1.5">
                        <Badge tone={stageTone(g.stage)}>{g.stage}</Badge>
                        <span className="ml-2 text-[12px] text-faint tabular-nums">{g.items.length}</span>
                      </td>
                    </tr>
                    {g.items.map((a) => (
                      <tr key={a.id} className={rowCls}>
                        <Td>
                          <Link href={`/portal/companies/${companySlug(a.company)}`} className="font-medium hover:underline">
                            {a.company}
                          </Link>
                        </Td>
                        <Td className="max-w-xs py-2">
                          <span className="block">{a.position}</span>
                          {a.notes && <span className="mt-0.5 block text-[12.5px] whitespace-pre-line text-muted">{a.notes}</span>}
                        </Td>
                        <Td className="text-muted">{a.cycle}</Td>
                        <Td>
                          <select
                            aria-label={`Stage for ${a.company}`}
                            value={a.stage}
                            onChange={(e) => setStage(a.id, e.target.value as Stage)}
                            className="h-7 rounded-md border border-edge bg-white pr-6 pl-2 text-[12.5px] text-ink hover:border-[#cfd4dc] focus:border-sapphire focus:outline-none"
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
                            <span className="inline-flex items-center gap-1 text-[13px]">
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
        className="mt-6"
        flush
        action={
          <Link href="/portal/network" className="hover:text-ink">
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
            <table className="w-full min-w-[720px]">
              <thead>
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
                    <tr key={o.id} className={rowCls}>
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
                          <Link href={`/portal/companies/${companySlug(c.company)}`} className="hover:underline">
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

      <p className="mt-4 text-[13px] text-muted">
        After an interview, add what you learned to the company&apos;s page so the next member is better prepared.
      </p>

      <Drawer open={adding} onClose={() => setAdding(false)} title="Add application">
        <form onSubmit={save} className="space-y-4">
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
