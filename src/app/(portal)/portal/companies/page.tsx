"use client";

import { useState } from "react";
import { usePortal } from "@/portal/store";
import { companySlug, fmtDate, fullName, uid } from "@/portal/logic";
import type { Comment, InterviewReport, PortalData, Stage } from "@/portal/types";
import { Badge, Button, Card, Drawer, Empty, Field, Input, PageTitle, Select, Stat, Td, Textarea, Th } from "@/portal/ui";

type Outcome = InterviewReport["outcome"];
const OUTCOMES: Outcome[] = ["Advanced", "Offer", "Rejected", "Unknown"];
const DIFFICULTIES = ["1", "2", "3", "4", "5"] as const;

const today = () => new Date().toISOString().slice(0, 10);

const outcomeTone = (o: Outcome) => (o === "Offer" ? "green" : o === "Advanced" ? "blue" : o === "Rejected" ? "red" : "gray");

function stageTone(s: Stage) {
  if (s === "Offer") return "green" as const;
  if (s === "Rejected") return "red" as const;
  if (s === "Withdrew" || s === "Researching") return "gray" as const;
  return "blue" as const;
}

type CompanyRow = { name: string; reports: number; applicants: number; offers: number; latestYear?: number };

function companyRows(data: PortalData): CompanyRow[] {
  const names = new Set<string>();
  data.applications.forEach((a) => names.add(a.company.trim()));
  data.reports.forEach((r) => names.add(r.company.trim()));
  data.contacts.forEach((c) => names.add(c.company.trim()));
  names.delete("");
  return [...names]
    .map((name) => {
      const apps = data.applications.filter((a) => a.company.trim() === name);
      const reps = data.reports.filter((r) => r.company.trim() === name);
      const years = [...reps.map((r) => r.year), ...apps.map((a) => Number(a.updatedAt.slice(0, 4)))].filter((y) => Number.isFinite(y) && y > 0);
      return {
        name,
        reports: reps.length,
        applicants: new Set(apps.map((a) => a.memberId)).size,
        offers: apps.filter((a) => a.stage === "Offer").length + reps.filter((r) => r.outcome === "Offer").length,
        latestYear: years.length ? Math.max(...years) : undefined,
      };
    })
    .sort((a, b) => b.reports - a.reports || a.name.localeCompare(b.name));
}

type ReportDraft = {
  year: string;
  position: string;
  round: string;
  format: string;
  questions: string;
  tips: string;
  difficulty: string;
  outcome: Outcome;
};
const newReportDraft = (): ReportDraft => ({
  year: String(new Date().getFullYear()),
  position: "",
  round: "",
  format: "",
  questions: "",
  tips: "",
  difficulty: "3",
  outcome: "Unknown",
});

export default function CompaniesPage() {
  const { data, me, update } = usePortal();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<ReportDraft>(newReportDraft);
  const [comment, setComment] = useState("");

  if (!me) return null;

  const rows = companyRows(data);
  const q = query.trim().toLowerCase();
  const filtered = q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows;
  const current = rows.find((r) => r.name === selected) ?? null;

  const memberName = (id: string) => {
    const m = data.members.find((x) => x.id === id);
    return m ? fullName(m) : "Former member";
  };

  const openAdd = () => {
    setDraft(newReportDraft());
    setAdding(true);
  };

  const saveReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || !draft.position.trim()) return;
    const report: InterviewReport = {
      id: uid(),
      company: current.name,
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
    setAdding(false);
  };

  const postComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || !comment.trim()) return;
    const c: Comment = { id: uid(), subject: `company:${companySlug(current.name)}`, memberId: me.id, body: comment.trim(), createdAt: today() };
    update((d) => ({ ...d, comments: [...d.comments, c] }));
    setComment("");
  };

  return (
    <div>
      <PageTitle
        title="Companies"
        sub="Interview reports, member outcomes and discussion for every firm Graphite members recruit with. Search for a company and select it to see the details."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div>
          <Input type="search" placeholder="Search companies" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search companies" />
          <Card className="mt-3">
            {filtered.length === 0 ? (
              <Empty>No companies match your search.</Empty>
            ) : (
              <ul className="max-h-[70vh] overflow-y-auto">
                {filtered.map((r) => {
                  const active = r.name === selected;
                  return (
                    <li key={r.name} className="border-b border-line last:border-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(r.name);
                          setComment("");
                        }}
                        className={`block w-full px-4 py-3 text-left ${active ? "bg-cloud" : "hover:bg-cloud"}`}
                        aria-current={active ? "true" : undefined}
                      >
                        <span className={`block text-sm font-semibold ${active ? "text-accent" : ""}`}>{r.name}</span>
                        <span className="mt-0.5 block text-xs text-slate">
                          {r.reports} report{r.reports === 1 ? "" : "s"} · {r.applicants} applied · {r.offers} offer{r.offers === 1 ? "" : "s"}
                          {r.latestYear ? ` · ${r.latestYear}` : ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div>
          {!current ? (
            <Card>
              <Empty>Select a company to see interview reports, member outcomes and discussion.</Empty>
            </Card>
          ) : (
            <CompanyDetail
              key={current.name}
              row={current}
              data={data}
              memberName={memberName}
              onAdd={openAdd}
              comment={comment}
              setComment={setComment}
              onPost={postComment}
            />
          )}
        </div>
      </div>

      <Drawer open={adding} onClose={() => setAdding(false)} title="Add interview report">
        <form onSubmit={saveReport} className="space-y-4">
          <Field label="Company">
            <Input value={current?.name ?? ""} readOnly />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Year">
              <Input type="number" min={2000} max={2100} value={draft.year} onChange={(e) => setDraft({ ...draft, year: e.target.value })} />
            </Field>
            <Field label="Round">
              <Input value={draft.round} onChange={(e) => setDraft({ ...draft, round: e.target.value })} placeholder="e.g. First Round" />
            </Field>
          </div>
          <Field label="Position">
            <Input required value={draft.position} onChange={(e) => setDraft({ ...draft, position: e.target.value })} placeholder="e.g. Summer Analyst" />
          </Field>
          <Field label="Format">
            <Input value={draft.format} onChange={(e) => setDraft({ ...draft, format: e.target.value })} placeholder="e.g. Case + behavioral, 45 minutes" />
          </Field>
          <Field label="Questions">
            <Textarea rows={4} value={draft.questions} onChange={(e) => setDraft({ ...draft, questions: e.target.value })} />
          </Field>
          <Field label="Tips">
            <Textarea rows={3} value={draft.tips} onChange={(e) => setDraft({ ...draft, tips: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Difficulty" hint="1 is easy, 5 is very hard">
              <Select options={DIFFICULTIES} value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value })} />
            </Field>
            <Field label="Outcome">
              <Select options={OUTCOMES} value={draft.outcome} onChange={(e) => setDraft({ ...draft, outcome: e.target.value as Outcome })} />
            </Field>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit">Save report</Button>
            <Button variant="secondary" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

function CompanyDetail({
  row,
  data,
  memberName,
  onAdd,
  comment,
  setComment,
  onPost,
}: {
  row: CompanyRow;
  data: PortalData;
  memberName: (id: string) => string;
  onAdd: () => void;
  comment: string;
  setComment: (v: string) => void;
  onPost: (e: React.FormEvent) => void;
}) {
  const reports = data.reports.filter((r) => r.company.trim() === row.name);
  const years = [...new Set(reports.map((r) => r.year))].sort((a, b) => b - a);
  const apps = data.applications.filter((a) => a.company.trim() === row.name).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const subject = `company:${companySlug(row.name)}`;
  const comments = data.comments.filter((c) => c.subject === subject).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const avgDifficulty = reports.length ? reports.reduce((s, r) => s + r.difficulty, 0) / reports.length : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <h2 className="font-serif text-3xl">{row.name}</h2>
        <Button onClick={onAdd}>Add interview report</Button>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="Interview reports" value={row.reports} sub={avgDifficulty != null ? `Avg difficulty ${avgDifficulty.toFixed(1)}/5` : undefined} />
        <Stat label="Members applied" value={row.applicants} />
        <Stat label="Offers" value={row.offers} />
        <Stat label="Latest year" value={row.latestYear ?? "None"} />
      </div>

      <Card title="Interview reports">
        {reports.length === 0 ? (
          <Empty>No interview reports yet. If you interviewed here, add one to help the next member prepare.</Empty>
        ) : (
          <div className="divide-y divide-line">
            {years.map((y) => (
              <div key={y} className="px-5 py-4">
                <h3 className="mb-3 text-xs font-semibold tracking-[0.08em] text-slate uppercase">{y}</h3>
                <div className="space-y-4">
                  {reports
                    .filter((r) => r.year === y)
                    .map((r) => (
                      <article key={r.id} className="border border-line p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">{r.position}</p>
                            <p className="text-sm text-slate">
                              {[r.round, r.format].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge>Difficulty {r.difficulty}/5</Badge>
                            <Badge tone={outcomeTone(r.outcome)}>{r.outcome}</Badge>
                          </div>
                        </div>
                        {r.questions && (
                          <div className="mt-3 text-sm">
                            <p className="text-xs font-semibold text-slate uppercase">Questions</p>
                            <p className="mt-1 whitespace-pre-line">{r.questions}</p>
                          </div>
                        )}
                        {r.tips && (
                          <div className="mt-3 text-sm">
                            <p className="text-xs font-semibold text-slate uppercase">Tips</p>
                            <p className="mt-1 whitespace-pre-line">{r.tips}</p>
                          </div>
                        )}
                        <p className="mt-3 text-xs text-slate">Shared by {memberName(r.memberId)}</p>
                      </article>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Member applications">
        {apps.length === 0 ? (
          <Empty>No members have tracked an application here yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-line bg-cloud">
                <tr>
                  <Th>Member</Th>
                  <Th>Position</Th>
                  <Th>Cycle</Th>
                  <Th>Stage</Th>
                </tr>
              </thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.id} className="border-b border-line last:border-0">
                    <Td className="font-medium">{memberName(a.memberId)}</Td>
                    <Td>{a.position}</Td>
                    <Td className="text-slate">{a.cycle}</Td>
                    <Td>
                      <Badge tone={stageTone(a.stage)}>{a.stage}</Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Discussion">
        {comments.length === 0 ? (
          <Empty>No discussion yet. Share advice on timelines, networking or prep.</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {comments.map((c) => (
              <li key={c.id} className="px-5 py-4">
                <p className="text-xs text-slate">
                  <span className="font-semibold text-ink">{memberName(c.memberId)}</span> · {fmtDate(c.createdAt)}
                </p>
                <p className="mt-1 text-sm whitespace-pre-line">{c.body}</p>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={onPost} className="border-t border-line px-5 py-4">
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={`Add a note about ${row.name}`} aria-label="New comment" />
          <div className="mt-2 flex justify-end">
            <Button type="submit" disabled={!comment.trim()}>
              Post
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
