"use client";

import Link from "@/components/app-link";
import { useState } from "react";
import { usePortal } from "@/portal/store";
import { companySlug, fmtDate, fullName, pct, responseStats, uid } from "@/portal/logic";
import type { Comment, InterviewReport, PortalData, Stage } from "@/portal/types";
import { Avatar, Badge, Button, Card, Drawer, Empty, Field, Input, PageTitle, Select, Stat, StatGroup, Td, Textarea, Th, rowCls } from "@/portal/ui";
import { useRouteParam } from "@/lib/use-route-param";

type Outcome = InterviewReport["outcome"];
const OUTCOMES: Outcome[] = ["Advanced", "Offer", "Rejected", "Unknown"];
const DIFFICULTIES = ["1", "2", "3", "4", "5"] as const;

export const outcomeTone = (o: Outcome) => (o === "Offer" ? "green" : o === "Advanced" ? "blue" : o === "Rejected" ? "red" : "gray");

export function stageTone(s: Stage) {
  if (s === "Offer") return "green" as const;
  if (s === "Rejected") return "red" as const;
  if (s === "Withdrew" || s === "Researching") return "gray" as const;
  if (s === "Online Assessment" || s === "First Round" || s === "Superday / Final") return "amber" as const;
  return "blue" as const;
}

export type CompanyRow = { name: string; slug: string; reports: number; applicants: number; offers: number; latestYear?: number };

/** Every company named in applications, interview reports or contacts. */
export function companyNames(data: Pick<PortalData, "applications" | "reports" | "contacts">) {
  const names = new Set<string>();
  data.applications.forEach((a) => names.add(a.company.trim()));
  data.reports.forEach((r) => names.add(r.company.trim()));
  data.contacts.forEach((c) => names.add(c.company.trim()));
  names.delete("");
  return [...names];
}

export function companyRows(data: PortalData): CompanyRow[] {
  return companyNames(data)
    .map((name) => {
      const apps = data.applications.filter((a) => a.company.trim() === name);
      const reps = data.reports.filter((r) => r.company.trim() === name);
      const years = [...reps.map((r) => r.year), ...apps.map((a) => Number(a.updatedAt.slice(0, 4)))].filter((y) => Number.isFinite(y) && y > 0);
      return {
        name,
        slug: companySlug(name),
        reports: reps.length,
        applicants: new Set(apps.map((a) => a.memberId)).size,
        offers: apps.filter((a) => a.stage === "Offer").length + reps.filter((r) => r.outcome === "Offer").length,
        latestYear: years.length ? Math.max(...years) : undefined,
      };
    })
    .sort((a, b) => b.reports - a.reports || a.name.localeCompare(b.name));
}

type ReportDraft = {
  company: string;
  year: string;
  position: string;
  round: string;
  format: string;
  questions: string;
  tips: string;
  difficulty: string;
  outcome: Outcome;
};

const newReportDraft = (company = ""): ReportDraft => ({
  company,
  year: String(new Date().getFullYear()),
  position: "",
  round: "",
  format: "",
  questions: "",
  tips: "",
  difficulty: "3",
  outcome: "Unknown",
});

/**
 * Interview report form. With `company` set the company is fixed; without it
 * the member types the firm name. Mount it only while the drawer is open so
 * each opening starts from a blank draft.
 */
export function ReportForm({ company, onDone }: { company?: string; onDone: () => void }) {
  const { me, update } = usePortal();
  const [draft, setDraft] = useState<ReportDraft>(() => newReportDraft(company));
  const set = (patch: Partial<ReportDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const name = (company ?? draft.company).trim();
    if (!me || !name || !draft.position.trim()) return;
    const report: InterviewReport = {
      id: uid(),
      company: name,
      memberId: me.id,
      year: Number(draft.year) || new Date().getFullYear(),
      position: draft.position.trim(),
      round: draft.round.trim(),
      format: draft.format.trim(),
      questions: draft.questions.trim(),
      tips: draft.tips.trim(),
      difficulty: Number(draft.difficulty) as InterviewReport["difficulty"],
      outcome: draft.outcome,
    };
    update((d) => ({ ...d, reports: [report, ...d.reports] }));
    onDone();
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <Field label="Company">
        {company ? (
          <Input value={company} readOnly />
        ) : (
          <Input required value={draft.company} onChange={(e) => set({ company: e.target.value })} placeholder="e.g. Bain & Company" />
        )}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Year">
          <Input type="number" min={2000} max={2100} value={draft.year} onChange={(e) => set({ year: e.target.value })} />
        </Field>
        <Field label="Round">
          <Input value={draft.round} onChange={(e) => set({ round: e.target.value })} placeholder="e.g. First round" />
        </Field>
      </div>
      <Field label="Position">
        <Input required value={draft.position} onChange={(e) => set({ position: e.target.value })} placeholder="e.g. Summer Analyst" />
      </Field>
      <Field label="Format">
        <Input value={draft.format} onChange={(e) => set({ format: e.target.value })} placeholder="e.g. Case and behavioral, 45 minutes" />
      </Field>
      <Field label="Questions">
        <Textarea rows={4} value={draft.questions} onChange={(e) => set({ questions: e.target.value })} />
      </Field>
      <Field label="Advice">
        <Textarea rows={3} value={draft.tips} onChange={(e) => set({ tips: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Difficulty" hint="1 is easy, 5 is very hard">
          <Select options={DIFFICULTIES} value={draft.difficulty} onChange={(e) => set({ difficulty: e.target.value })} />
        </Field>
        <Field label="Outcome">
          <Select options={OUTCOMES} value={draft.outcome} onChange={(e) => set({ outcome: e.target.value as Outcome })} />
        </Field>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit">Save report</Button>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function CompanyView() {
  const slug = useRouteParam("slug");
  const { data, me, update } = usePortal();
  const [adding, setAdding] = useState(false);
  const [comment, setComment] = useState("");

  if (!me) return null;

  const name = companyNames(data).find((n) => companySlug(n) === slug);

  if (!name) {
    return (
      <div>
        <PageTitle title="Company not found" back={{ href: "/portal/companies", label: "Companies" }} />
        <p className="text-[13.5px] text-muted">
          No member has recorded anything about this company yet.{" "}
          <Link href="/portal/companies" className="text-ink hover:underline">
            Return to the company list
          </Link>
          .
        </p>
      </div>
    );
  }

  const memberName = (id: string) => {
    const m = data.members.find((x) => x.id === id);
    return m ? fullName(m) : "Former member";
  };
  const member = (id: string) => data.members.find((x) => x.id === id);

  const reports = data.reports.filter((r) => r.company.trim() === name);
  const years = [...new Set(reports.map((r) => r.year))].sort((a, b) => b - a);
  const apps = data.applications.filter((a) => a.company.trim() === name).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const applicants = new Set(apps.map((a) => a.memberId)).size;
  const offers = apps.filter((a) => a.stage === "Offer").length + reports.filter((r) => r.outcome === "Offer").length;
  const avgDifficulty = reports.length ? reports.reduce((s, r) => s + r.difficulty, 0) / reports.length : undefined;
  const contacts = data.contacts.filter((c) => c.company.trim() === name).sort((a, b) => a.name.localeCompare(b.name));
  const subject = `company:${slug}`;
  const comments = data.comments.filter((c) => c.subject === subject).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const post = (e: React.FormEvent) => {
    e.preventDefault();
    const body = comment.trim();
    if (!body) return;
    const c: Comment = { id: uid(), subject, memberId: me.id, body, createdAt: new Date().toISOString() };
    update((d) => ({ ...d, comments: [...d.comments, c] }));
    setComment("");
  };

  return (
    <div>
      <PageTitle title={name} back={{ href: "/portal/companies", label: "Companies" }} />

      <StatGroup>
        <Stat label="Interview reports" value={reports.length} />
        <Stat label="Members applied" value={applicants} />
        <Stat label="Offers" value={offers} />
        <Stat label="Average difficulty" value={avgDifficulty != null ? avgDifficulty.toFixed(1) : "None"} sub={avgDifficulty != null ? "Out of 5" : undefined} />
      </StatGroup>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card
            title="Interview reports"
            flush
            action={
              <Button variant="ghost" onClick={() => setAdding(true)}>
                Add a report
              </Button>
            }
          >
            {reports.length === 0 ? (
              <Empty>No interview reports yet. If you interviewed here, add one so the next member is better prepared.</Empty>
            ) : (
              years.map((y) => (
                <div key={y} className="border-b border-edge last:border-0">
                  <h3 className="border-b border-edge bg-stone px-4 py-1.5 text-[12px] font-medium text-muted tabular-nums">{y}</h3>
                  <div className="divide-y divide-edge">
                    {reports
                      .filter((r) => r.year === y)
                      .map((r) => (
                        <article key={r.id} className="px-4 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                            <p className="font-medium">{[r.position, r.round].filter(Boolean).join(", ")}</p>
                            <Badge tone={outcomeTone(r.outcome)}>{r.outcome}</Badge>
                          </div>
                          {r.format && <p className="mt-0.5 text-[13px] text-ink-2">{r.format}</p>}
                          <p className="mt-0.5 text-[12.5px] text-muted">
                            {memberName(r.memberId)}
                            <span className="mx-1.5 text-faint">/</span>
                            Difficulty {r.difficulty} of 5
                          </p>
                          {r.questions && (
                            <div className="mt-3">
                              <p className="text-[12px] font-medium text-muted">Questions</p>
                              <p className="mt-0.5 text-[13.5px] leading-relaxed whitespace-pre-line text-ink-2">{r.questions}</p>
                            </div>
                          )}
                          {r.tips && (
                            <div className="mt-3">
                              <p className="text-[12px] font-medium text-muted">Advice</p>
                              <p className="mt-0.5 text-[13.5px] leading-relaxed whitespace-pre-line text-ink-2">{r.tips}</p>
                            </div>
                          )}
                        </article>
                      ))}
                  </div>
                </div>
              ))
            )}
          </Card>

          <Card title="Graphite applications" flush>
            {apps.length === 0 ? (
              <Empty>No members have tracked an application here yet.</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px]">
                  <thead>
                    <tr>
                      <Th>Member</Th>
                      <Th>Position</Th>
                      <Th>Cycle</Th>
                      <Th>Stage</Th>
                      <Th>Last updated</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((a) => (
                      <tr key={a.id} className={rowCls}>
                        <Td className="font-medium">{memberName(a.memberId)}</Td>
                        <Td>{a.position}</Td>
                        <Td className="text-muted">{a.cycle}</Td>
                        <Td>
                          <Badge tone={stageTone(a.stage)}>{a.stage}</Badge>
                        </Td>
                        <Td className="whitespace-nowrap text-muted">{fmtDate(a.updatedAt)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title="Discussion" flush>
            {comments.length === 0 ? (
              <Empty>No discussion yet. Share what you know about timelines, networking or preparation.</Empty>
            ) : (
              <ul className="divide-y divide-edge">
                {comments.map((c) => {
                  const m = member(c.memberId);
                  const who = m ? fullName(m) : "Former member";
                  return (
                    <li key={c.id} className="flex gap-3 px-4 py-3">
                      <Avatar name={who} photo={m?.photo} size={24} />
                      <div className="min-w-0">
                        <p className="flex items-baseline gap-2">
                          <span className="text-[13px] font-medium">{who}</span>
                          <span className="text-[12px] text-faint">{fmtDate(c.createdAt)}</span>
                        </p>
                        <p className="mt-0.5 text-[13.5px] leading-relaxed whitespace-pre-line text-ink-2">{c.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <form onSubmit={post} className="border-t border-edge bg-stone px-4 py-3">
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={`Add a note about ${name}`} aria-label="New comment" />
              <div className="mt-2 flex justify-end">
                <Button type="submit" disabled={!comment.trim()}>
                  Post
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <Card title="People to talk to" flush>
          {contacts.length === 0 ? (
            <Empty>
              No contacts here yet. Add one in the{" "}
              <Link href="/portal/network" className="text-ink hover:underline">
                network
              </Link>
              .
            </Empty>
          ) : (
            <ul className="divide-y divide-edge">
              {contacts.map((c) => {
                const s = responseStats(data.outreach.filter((o) => o.contactId === c.id));
                return (
                  <li key={c.id} className="px-4 py-2.5">
                    <Link href={`/portal/network/${c.id}`} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                    <p className="mt-0.5 text-[13px] text-ink-2">{c.title}</p>
                    <p className="mt-0.5 text-[12.5px] text-muted">
                      {c.isAlum && <span>Graphite alum{c.alumClass ? `, ${c.alumClass}` : ""}. </span>}
                      {s.total ? `Responded to ${pct(s.rate)} of ${s.total} message${s.total === 1 ? "" : "s"}` : "No outreach logged yet"}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Drawer open={adding} onClose={() => setAdding(false)} title="Add interview report">
        {adding && <ReportForm company={name} onDone={() => setAdding(false)} />}
      </Drawer>
    </div>
  );
}
