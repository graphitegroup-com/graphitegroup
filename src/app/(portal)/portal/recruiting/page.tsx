"use client";

import Link from "@/components/app-link";
import { useState } from "react";
import { usePortal } from "@/portal/store";
import { fmtDate, uid } from "@/portal/logic";
import { STAGES, type Application, type Stage } from "@/portal/types";
import { Badge, Button, Card, Drawer, Empty, Field, Input, PageTitle, Select, Stat, Td, Textarea, Th } from "@/portal/ui";

const INTERVIEW_STAGES: Stage[] = ["Online Assessment", "First Round", "Superday / Final"];
const CLOSED_STAGES: Stage[] = ["Offer", "Rejected", "Withdrew"];

const today = () => new Date().toISOString().slice(0, 10);

function stageTone(s: Stage) {
  if (s === "Offer") return "green" as const;
  if (s === "Rejected") return "red" as const;
  if (s === "Withdrew") return "gray" as const;
  if (INTERVIEW_STAGES.includes(s)) return "amber" as const;
  return "blue" as const;
}

type Draft = { company: string; position: string; cycle: string; stage: Stage; notes: string };
const emptyDraft: Draft = { company: "", position: "", cycle: "", stage: "Researching", notes: "" };

export default function RecruitingPage() {
  const { data, me, update } = usePortal();
  const [view, setView] = useState<"board" | "table">("board");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  if (!me) return null;

  const mine = data.applications
    .filter((a) => a.memberId === me.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const active = mine.filter((a) => !CLOSED_STAGES.includes(a.stage)).length;
  const interviewing = mine.filter((a) => INTERVIEW_STAGES.includes(a.stage)).length;
  const offers = mine.filter((a) => a.stage === "Offer").length;
  const myOutreach = data.outreach
    .filter((o) => o.memberId === me.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const setStage = (id: string, stage: Stage) =>
    update((d) => ({
      ...d,
      applications: d.applications.map((a) => (a.id === id ? { ...a, stage, updatedAt: today() } : a)),
    }));

  const remove = (app: Application) => {
    if (!window.confirm(`Delete your ${app.company} application?`)) return;
    update((d) => ({ ...d, applications: d.applications.filter((a) => a.id !== app.id) }));
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
    setDraft(emptyDraft);
    setAdding(false);
  };

  const grouped = STAGES.map((s) => ({ stage: s, items: mine.filter((a) => a.stage === s) })).filter((g) => g.items.length > 0);

  return (
    <div>
      <PageTitle
        title="My Recruiting"
        sub="Track your applications and coffee chats in one place. Only you and the executive board see your pipeline."
        actions={<Button onClick={() => setAdding(true)}>Add application</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Active applications" value={active} />
        <Stat label="Interviews in progress" value={interviewing} sub="Assessment, first round or final" />
        <Stat label="Offers" value={offers} />
        <Stat label="Coffee chats logged" value={myOutreach.length} />
      </div>

      <p className="mt-6 border border-line bg-white px-5 py-3 text-sm text-slate">
        Finished an interview? Add your questions and tips to{" "}
        <Link href="/portal/companies" className="font-semibold text-accent hover:underline">
          Companies
        </Link>{" "}
        so the next member is better prepared.
      </p>

      <div className="mt-8 mb-4 flex items-center justify-between">
        <h2 className="font-serif text-2xl">Pipeline</h2>
        <div className="flex border border-line bg-white">
          {(["board", "table"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm font-medium ${view === v ? "bg-ink text-white" : "text-slate hover:bg-cloud"}`}
            >
              {v === "board" ? "By stage" : "Table"}
            </button>
          ))}
        </div>
      </div>

      {mine.length === 0 ? (
        <Card>
          <Empty>No applications yet. Add the first one to start tracking your pipeline.</Empty>
        </Card>
      ) : view === "board" ? (
        <div className="space-y-6">
          {grouped.map((g) => (
            <section key={g.stage}>
              <div className="mb-2 flex items-center gap-2">
                <Badge tone={stageTone(g.stage)}>{g.stage}</Badge>
                <span className="text-xs text-slate">{g.items.length}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {g.items.map((a) => (
                  <Card key={a.id} className="flex flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-serif text-lg">{a.company}</h3>
                        <p className="text-sm">{a.position}</p>
                        {a.cycle && <p className="text-xs text-slate">{a.cycle}</p>}
                      </div>
                      <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => remove(a)} aria-label={`Delete ${a.company} application`}>
                        Delete
                      </Button>
                    </div>
                    {a.notes && <p className="mt-3 text-sm whitespace-pre-line text-slate">{a.notes}</p>}
                    <div className="mt-auto pt-4">
                      <Select
                        aria-label="Stage"
                        options={STAGES}
                        value={a.stage}
                        onChange={(e) => setStage(a.id, e.target.value as Stage)}
                      />
                      <p className="mt-2 text-xs text-slate">Updated {fmtDate(a.updatedAt)}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-line bg-cloud">
                <tr>
                  <Th>Company</Th>
                  <Th>Position</Th>
                  <Th>Cycle</Th>
                  <Th>Stage</Th>
                  <Th>Updated</Th>
                  <Th>Notes</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {mine.map((a) => (
                  <tr key={a.id} className="border-b border-line last:border-0">
                    <Td className="font-medium">{a.company}</Td>
                    <Td>{a.position}</Td>
                    <Td className="text-slate">{a.cycle}</Td>
                    <Td>
                      <Select aria-label="Stage" options={STAGES} value={a.stage} onChange={(e) => setStage(a.id, e.target.value as Stage)} className="min-w-40" />
                    </Td>
                    <Td className="whitespace-nowrap text-slate">{fmtDate(a.updatedAt)}</Td>
                    <Td className="max-w-xs text-slate">{a.notes}</Td>
                    <Td>
                      <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => remove(a)}>
                        Delete
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card
        className="mt-10"
        title="My coffee chats"
        action={
          <Link href="/portal/network" className="text-sm font-semibold text-accent hover:underline">
            Open network
          </Link>
        }
      >
        {myOutreach.length === 0 ? (
          <Empty>
            No outreach logged yet. Find a contact in the <Link href="/portal/network" className="text-accent hover:underline">Network</Link> and log
            your first message.
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-line bg-cloud">
                <tr>
                  <Th>Contact</Th>
                  <Th>Company</Th>
                  <Th>Date</Th>
                  <Th>Channel</Th>
                  <Th>Response</Th>
                  <Th>Chatted</Th>
                  <Th>Helpfulness</Th>
                </tr>
              </thead>
              <tbody>
                {myOutreach.map((o) => {
                  const c = data.contacts.find((x) => x.id === o.contactId);
                  return (
                    <tr key={o.id} className="border-b border-line last:border-0">
                      <Td className="font-medium">{c?.name ?? "Unknown contact"}</Td>
                      <Td className="text-slate">{c?.company ?? ""}</Td>
                      <Td className="whitespace-nowrap text-slate">{fmtDate(o.date)}</Td>
                      <Td>{o.channel}</Td>
                      <Td>{o.responded ? <Badge tone="green">Responded</Badge> : <Badge>No response</Badge>}</Td>
                      <Td>{o.chatted ? "Yes" : "No"}</Td>
                      <Td>{o.helpfulness != null ? `${o.helpfulness}/5` : "Not rated"}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
            <Textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Deadlines, contacts, prep to do" />
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
