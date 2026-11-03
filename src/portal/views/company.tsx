"use client";

import Link from "@/components/app-link";
import { useState } from "react";
import { usePortal } from "@/portal/store";
import { byline, isExec, companyNames, companySlug, contactGrade, firmGradeSummary, fmtDate, matchCompany, nextStep, outreachStage, pct, threadActivity, uid, firmType, jobsAt, visibleApplications, isShared, appYear, appOutcome, stageRank, batchProgress, logInterview, questionRound, QUESTION_BATCH, MIN_GRADERS, reachedLabel } from "@/portal/logic";
import { AddPersonForm, StageChip, StepPing, myOutreachAt } from "@/portal/outreach";
import { QUESTION_ROUNDS, type ClassLevel, type CompanyType, type InterviewReport, type Job, type PortalData, type QuestionRound, type Stage } from "@/portal/types";
import { PostForm, ThreadRow, useThreadVote } from "@/portal/forum";
import { FirmGrades } from "@/portal/grades";
import { Badge, Button, Card, Check, Drawer, Empty, Field, GradeTile, Input, PageTitle, Select, Stat, StatGroup, Td, Textarea, Th, linkCls, rowCls } from "@/portal/ui";
import { CompanyTypeControl, WorkedHereCard } from "@/portal/jobs";
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

export type CompanyRow = {
  name: string;
  slug: string;
  reports: number;
  applicants: number;
  offers: number;
  latestYear?: number;
  grade: ReturnType<typeof firmGradeSummary>;
  threads: number;
  type?: CompanyType;
  /** Years in school members were in when they worked here. */
  levels: ClassLevel[];
  /** Different members hired at each year in school. */
  hiresByLevel: Partial<Record<ClassLevel, number>>;
};


function hireSummary(jobs: Job[]) {
  const hiresByLevel: Partial<Record<ClassLevel, number>> = {};
  for (const level of new Set(jobs.map((j) => j.classAtTime))) {
    hiresByLevel[level] = new Set(jobs.filter((j) => j.classAtTime === level).map((j) => j.memberId)).size;
  }
  return { levels: Object.keys(hiresByLevel) as ClassLevel[], hiresByLevel };
}

export function companyRows(data: PortalData): CompanyRow[] {
  return companyNames(data)
    .map((name) => {
      const apps = data.applications.filter((a) => a.company.trim() === name);
      const reps = data.reports.filter((r) => r.company.trim() === name);
      const grades = data.grades.filter((g) => g.company.trim() === name);
      const years = [...reps.map((r) => r.year), ...apps.map((a) => Number(a.updatedAt.slice(0, 4))), ...grades.map((g) => Number(g.createdAt.slice(0, 4)))].filter(
        (y) => Number.isFinite(y) && y > 0,
      );
      return {
        name,
        slug: companySlug(name),
        reports: reps.length,
        applicants: new Set(apps.map((a) => a.memberId)).size,
        offers: apps.filter((a) => a.stage === "Offer").length + reps.filter((r) => r.outcome === "Offer").length,
        latestYear: years.length ? Math.max(...years) : undefined,
        grade: firmGradeSummary(grades),
        threads: data.posts.filter((p) => p.company === name).length,
        type: firmType(data.firms, name),
        ...hireSummary(jobsAt(data.jobs, name)),
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
  overview: string;
  tips: string;
  difficulty: string;
  outcome: Outcome;
  anonymous: boolean;
  questions: string;
  /** The broad round the questions are filed under; follows the round above until changed. */
  questionRound?: QuestionRound;
};

const newReportDraft = (company = "", prefill?: ReportPrefill): ReportDraft => ({
  company,
  year: String(prefill?.year ?? new Date().getFullYear()),
  position: prefill?.position ?? "",
  round: prefill?.round ?? "",
  format: "",
  overview: "",
  tips: "",
  difficulty: "3",
  outcome: "Unknown",
  anonymous: false,
  questions: "",
});

export type ReportPrefill = { position?: string; year?: number; round?: string };

/**
 * Log an interview in two parts. The overview (how it went, advice,
 * difficulty) is saved under your name or anonymously, so members know who
 * to talk to. The questions keep only the firm and a broad round, and wait
 * for the firm's next batch (see `logInterview`), so nobody (exec included)
 * can tell who was asked them. With `company` set the firm is fixed. Mount
 * only while open.
 */
export function ReportForm({ company, prefill, onDone }: { company?: string; prefill?: ReportPrefill; onDone: () => void }) {
  const { data, me, update } = usePortal();
  const [draft, setDraft] = useState<ReportDraft>(() => newReportDraft(company, prefill));
  const set = (patch: Partial<ReportDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const questions = draft.questions
    .split("\n")
    .map((q) => q.replace(/^\s*(?:[-*\u2022]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const name = company ?? matchCompany(data, draft.company);
    if (!me || !name || !draft.position.trim()) return;
    const year = Number(draft.year) || new Date().getFullYear();
    const report: InterviewReport = {
      id: uid(),
      company: name,
      memberId: me.id,
      year,
      position: draft.position.trim(),
      round: draft.round.trim(),
      format: draft.format.trim(),
      overview: draft.overview.trim(),
      tips: draft.tips.trim(),
      difficulty: Number(draft.difficulty) as InterviewReport["difficulty"],
      outcome: draft.outcome,
      anonymous: draft.anonymous || undefined,
    };
    const round = draft.questionRound ?? questionRound(report.round);
    update((d) => logInterview(d, report, questions.map((question) => ({ round, question }))));
    onDone();
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="space-y-4">
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
      </div>

      <fieldset className="space-y-4 rounded-[3px] border border-edge p-4">
        <legend className="px-1 text-[13px] font-medium">1. Overview</legend>
        <p className="-mt-1 text-[12.5px] text-muted">Shows on the company page with your name, or as &ldquo;Anonymous member&rdquo;, so people know who to ask.</p>
        <Field label="Format">
          <Input value={draft.format} onChange={(e) => set({ format: e.target.value })} placeholder="e.g. Case and behavioral, 45 minutes" />
        </Field>
        <Field label="How it went" hint="Your general thoughts: tone, what they cared about, what surprised you.">
          <Textarea rows={3} value={draft.overview} onChange={(e) => set({ overview: e.target.value })} />
        </Field>
        <Field label="Advice">
          <Textarea rows={2} value={draft.tips} onChange={(e) => set({ tips: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Difficulty" hint="1 is easy, 5 is very hard">
            <Select options={DIFFICULTIES} value={draft.difficulty} onChange={(e) => set({ difficulty: e.target.value })} />
          </Field>
          <Field label="Outcome">
            <Select options={OUTCOMES} value={draft.outcome} onChange={(e) => set({ outcome: e.target.value as Outcome })} />
          </Field>
        </div>
        <Check
          label="Post the overview anonymously"
          checked={draft.anonymous}
          onChange={(v) => set({ anonymous: v })}
          hint="Other members see “Anonymous member”. You and exec still see your name."
        />
      </fieldset>

      <fieldset className="space-y-3 rounded-[3px] border border-edge p-4">
        <legend className="px-1 text-[13px] font-medium">2. Questions you were asked</legend>
        <p className="-mt-1 text-[12.5px] text-muted">
          One per line. Only the firm and a broad round are kept: no name, year, position or link to your overview. They publish in a batch once{" "}
          {QUESTION_BATCH} members have logged interviews at {company ?? "the firm"} since its last batch, so they can&apos;t be matched to you by timing. Nobody,
          exec included, can see who added them, and you won&apos;t be able to find them as yours later.
        </p>
        <Field label="Filed under">
          <Select
            options={[...QUESTION_ROUNDS]}
            value={draft.questionRound ?? questionRound(draft.round)}
            onChange={(e) => set({ questionRound: e.target.value as QuestionRound })}
          />
        </Field>
        <Textarea
          aria-label="Interview questions, one per line"
          rows={5}
          value={draft.questions}
          onChange={(e) => set({ questions: e.target.value })}
          placeholder={"Walk me through your resume.\nMarket sizing: coffee shops in Los Angeles."}
        />
        {questions.length > 0 && (
          <p className="text-[12.5px] text-muted">
            {questions.length === 1 ? "1 question" : `${questions.length} questions`} will wait for the next batch.
          </p>
        )}
      </fieldset>

      <div className="flex gap-2">
        <Button type="submit">Save interview</Button>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function CompanyView() {
  const slug = useRouteParam("slug");
  const { data, me } = usePortal();
  const vote = useThreadVote();
  const [adding, setAdding] = useState(false);
  const [posting, setPosting] = useState(false);
  const [reaching, setReaching] = useState(false);

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

  const now = new Date();

  const reports = data.reports.filter((r) => r.company.trim() === name);
  const years = [...new Set(reports.map((r) => r.year))].sort((a, b) => b - a);
  const apps = data.applications.filter((a) => a.company.trim() === name).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const applicants = new Set(apps.map((a) => a.memberId)).size;
  // Different members with an offer, whether it came from a tracked application or an interview report.
  const offers = new Set([...apps.filter((a) => a.stage === "Offer").map((a) => a.memberId), ...reports.filter((r) => r.outcome === "Offer").map((r) => r.memberId)]).size;
  // Others see an application once it reaches a first round; exec and the member see all of theirs.
  const shownApps = visibleApplications(apps, me).sort((a, b) => appYear(b) - appYear(a) || stageRank(b.furthest) - stageRank(a.furthest));
  const sharedApps = apps.filter(isShared);
  const offerYears = [...new Set(sharedApps.filter((a) => a.stage === "Offer").map(appYear))].sort();
  const bank = data.questions.filter((q) => companySlug(q.company.trim()) === companySlug(name));
  const batch = batchProgress(data, name);
  const bankGroups = QUESTION_ROUNDS.map((round) => ({ round, items: bank.filter((q) => q.round === round).sort((a, b) => a.question.localeCompare(b.question)) })).filter(
    (g) => g.items.length > 0,
  );
  const avgDifficulty = reports.length ? reports.reduce((s, r) => s + r.difficulty, 0) / reports.length : undefined;
  // Averaged over every application here, shared or not, once three members have rated it.
  const efforts = apps.filter((a) => a.effort != null);
  const effortRaters = new Set(efforts.map((a) => a.memberId)).size;
  const avgEffort = effortRaters >= MIN_GRADERS ? efforts.reduce((s, a) => s + (a.effort ?? 0), 0) / efforts.length : undefined;
  const contacts = data.contacts.filter((c) => c.company.trim() === name).sort((a, b) => a.name.localeCompare(b.name));
  const grade = firmGradeSummary(data.grades.filter((g) => g.company.trim() === name));
  const threads = data.posts.filter((p) => p.company === name).sort((a, b) => threadActivity(b, data.replies).localeCompare(threadActivity(a, data.replies)));

  return (
    <div>
      <PageTitle title={name} back={{ href: "/portal/companies", label: "Companies" }} sub={<CompanyTypeControl company={name} />} />

      <StatGroup className="md:grid-cols-3! lg:grid-cols-6!">
        <Stat label="Grade" value={<GradeTile letter={grade.letter} size="md" className="my-0.5" />} sub={grade.graders ? `${grade.graders} ${grade.graders === 1 ? "member" : "members"}` : "Not graded yet"} />
        <Stat label="Interview reports" value={reports.length} />
        <Stat label="Members applied" value={applicants} />
        <Stat label="Offers" value={offers} />
        <Stat label="Interview difficulty" value={avgDifficulty != null ? avgDifficulty.toFixed(1) : "None"} sub={avgDifficulty != null ? "Out of 5" : undefined} />
        <Stat
          label="Application effort"
          value={avgEffort != null ? avgEffort.toFixed(1) : "None"}
          sub={avgEffort != null ? `Out of 5, ${effortRaters} members` : `Shown once ${MIN_GRADERS} members rate it`}
        />
      </StatGroup>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Firms nobody has graded yet are often early-career employers; lead with who worked there. */}
          {grade.count === 0 && jobsAt(data.jobs, name).length > 0 ? (
            <>
              <WorkedHereCard company={name} />
              <FirmGrades company={name} />
            </>
          ) : (
            <>
              <FirmGrades company={name} />
              <WorkedHereCard company={name} />
            </>
          )}

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
                            {(() => {
                              const by = byline(r.memberId, r.anonymous, me, data.members);
                              return by.note ? `${by.name} (${by.note})` : by.name;
                            })()}
                            <span className="mx-1.5 text-faint">/</span>
                            Difficulty {r.difficulty} of 5
                          </p>
                          {r.overview && (
                            <div className="mt-3">
                              <p className="text-[12px] font-medium text-muted">How it went</p>
                              <p className="mt-0.5 text-[13.5px] leading-relaxed whitespace-pre-line text-ink-2">{r.overview}</p>
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

          <Card
            title="Question bank"
            flush
            action={
              <Button variant="ghost" onClick={() => setAdding(true)}>
                Log an interview
              </Button>
            }
          >
            <p className="border-b border-edge bg-[#fbfbf7] px-4 py-2 text-[12.5px] text-muted">
              No names, years or positions, and no link to any overview. Questions publish in batches once {QUESTION_BATCH} members have logged interviews here since
              the last batch, so none can be traced to one person.{" "}
              <span className="text-ink-2 tabular-nums">
                Next batch: {Math.min(batch.members, QUESTION_BATCH)} of {QUESTION_BATCH} members so far.
              </span>
            </p>
            {bank.length === 0 ? (
              <Empty>No questions published yet.</Empty>
            ) : (
              bankGroups.map((g) => (
                <div key={g.round} className="border-b border-edge last:border-0">
                  <h3 className="px-4 pt-3 text-[12px] font-medium text-muted">{g.round}</h3>
                  <ul className="list-disc space-y-1 px-4 pt-1.5 pb-3 pl-8 text-[13.5px] text-ink-2">
                    {g.items.map((q) => (
                      <li key={q.id}>{q.question}</li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </Card>

          <Card title="Graphite applications" action={isExec(me) ? "Exec sees every application" : undefined} flush>
            <p className="border-b border-edge bg-[#fbfbf7] px-4 py-2 text-[12.5px] text-muted">
              {sharedApps.length
                ? `${new Set(sharedApps.map((a) => a.memberId)).size} ${new Set(sharedApps.map((a) => a.memberId)).size === 1 ? "member has" : "members have"} reached a first round or further here${
                    offerYears.length ? `; offers in ${offerYears.join(", ")}` : ""
                  }.`
                : "No member has reached a first round here yet."}{" "}
              Applications show once they reach a first round, by name or as &ldquo;Anonymous member&rdquo;.
            </p>
            {shownApps.length === 0 ? (
              <Empty>Nothing to show yet.</Empty>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full min-w-[680px]">
                  <thead>
                    <tr>
                      <Th>Member</Th>
                      <Th>Position</Th>
                      <Th>Cycle</Th>
                      <Th>Got to</Th>
                      <Th>Outcome</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {shownApps.map((a) => {
                      const by = byline(a.memberId, a.anonymous, me, data.members);
                      const outcome = appOutcome(a);
                      return (
                        <tr key={a.id} className={rowCls}>
                          <Td>
                            <span className="font-medium">{by.name}</span>
                            {(by.note || !isShared(a)) && (
                              <span className="block text-[12px] text-muted">{!isShared(a) ? "Not shared yet: before a first round" : by.note}</span>
                            )}
                          </Td>
                          <Td>{a.position}</Td>
                          <Td className="text-muted">{a.cycle}</Td>
                          <Td>{reachedLabel(a.furthest)}</Td>
                          <Td>
                            <Badge tone={outcome === "Offer" ? "green" : outcome === "Rejected" ? "red" : outcome === "In process" ? "blue" : "gray"}>
                              {outcome === "Offer" ? `Offer, ${appYear(a)}` : outcome}
                            </Badge>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card
            title="Forum threads"
            flush
            action={
              <Button variant="ghost" onClick={() => setPosting(true)}>
                Start a thread
              </Button>
            }
          >
            {threads.length === 0 ? (
              <Empty>No threads about {name} yet. Ask about timelines, networking or preparation and members will see it in the forum.</Empty>
            ) : (
              <ul className="divide-y divide-edge">
                {threads.map((p) => (
                  <ThreadRow key={p.id} post={p} data={data} me={me} now={now} onVote={() => vote(p.id)} showCompany={false} />
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
        <YourHistory company={name} onReach={() => setReaching(true)} />

        <Card title="People to talk to" flush>
          {contacts.length === 0 ? (
            <Empty>
              No contacts here yet. Add one in the{" "}
              <Link href="/portal/network" className={linkCls}>
                network
              </Link>
              .
            </Empty>
          ) : (
            <ul className="divide-y divide-edge">
              {contacts.map((c) => {
                const s = contactGrade(data.outreach.filter((o) => o.contactId === c.id));
                return (
                  <li key={c.id} className="flex gap-3 px-4 py-2.5">
                    <GradeTile letter={s.letter} />
                    <div className="min-w-0">
                    <Link href={`/portal/network/${c.id}`} className={`font-medium ${linkCls}`}>
                      {c.name}
                    </Link>
                    <p className="mt-0.5 text-[13px] text-ink-2">{c.title}</p>
                    <p className="mt-0.5 text-[12.5px] text-muted">
                      {c.isAlum && <span>Graphite alum{c.alumClass ? `, ${c.alumClass}` : ""}. </span>}
                      {s.total ? `Responded to ${pct(s.rate)} of ${s.total} message${s.total === 1 ? "" : "s"}` : "No outreach logged yet"}
                    </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        </div>
      </div>

      <Drawer open={reaching} onClose={() => setReaching(false)} title={`Reach out to someone at ${name}`}>
        {reaching && <AddPersonForm company={name} onDone={() => setReaching(false)} />}
      </Drawer>
      <Drawer open={adding} onClose={() => setAdding(false)} title="Add interview report">
        {adding && <ReportForm company={name} onDone={() => setAdding(false)} />}
      </Drawer>
      <Drawer open={posting} onClose={() => setPosting(false)} title={`New thread about ${name}`}>
        {posting && <PostForm company={name} onDone={() => setPosting(false)} />}
      </Drawer>
    </div>
  );
}

/** Only you see this: your applications, outreach and interviews at one firm. */
function YourHistory({ company, onReach }: { company: string; onReach: () => void }) {
  const { data, me } = usePortal();
  if (!me) return null;

  const apps = data.applications.filter((a) => a.memberId === me.id && a.company.trim() === company).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const outreach = myOutreachAt(data, me.id, company);
  const reports = data.reports.filter((r) => r.memberId === me.id && r.company.trim() === company).sort((a, b) => b.year - a.year);
  const contact = (id: string) => data.contacts.find((c) => c.id === id);
  const empty = !apps.length && !outreach.length && !reports.length;
  const section = "border-b border-edge bg-[#fbfbf7] px-4 py-1.5 text-[11.5px] font-medium tracking-[0.05em] text-muted uppercase";

  return (
    <Card
      title={`Your history at ${company}`}
      flush
      action={
        <Button variant="ghost" onClick={onReach}>
          Log outreach
        </Button>
      }
    >
      {empty ? (
        <Empty>
          Nothing tracked here yet. Log outreach to someone at {company}, or add an application in{" "}
          <Link href="/portal/recruiting" className={linkCls}>
            My recruiting
          </Link>
          .
        </Empty>
      ) : (
        <>
          {apps.length > 0 && (
            <>
              <p className={section}>Applications</p>
              <ul className="divide-y divide-edge">
                {apps.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                    <span className="min-w-0">
                      <span className="block font-medium">{a.position}</span>
                      <span className="block text-[12.5px] text-muted">{a.cycle || "No cycle set"}</span>
                    </span>
                    <Badge tone={stageTone(a.stage)}>{a.stage}</Badge>
                  </li>
                ))}
              </ul>
            </>
          )}
          {outreach.length > 0 && (
            <>
              <p className={`${section} ${apps.length ? "border-t" : ""}`}>People you reached out to</p>
              <ul className="divide-y divide-edge">
                {outreach.map((o) => {
                  const c = contact(o.contactId);
                  const step = nextStep(o);
                  return (
                    <li key={o.id} className="px-4 py-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          {c ? (
                            <Link href={`/portal/network/${c.id}`} className={`font-medium ${linkCls}`}>
                              {c.name}
                            </Link>
                          ) : (
                            <span className="text-muted">Contact removed</span>
                          )}
                          <span className="block text-[12.5px] text-muted">
                            {c?.title}
                            {c && c.company.trim() !== company && ` (now at ${c.company})`}
                            {c?.title ? ", " : ""}
                            {fmtDate(o.date)}
                          </span>
                        </span>
                        <StageChip stage={outreachStage(o)} />
                      </div>
                      <div className="mt-1 text-[12.5px]">
                        {o.chatted && o.helpfulness != null ? (
                          <span className="text-ink-2">
                            Helpfulness {o.helpfulness} of 5{o.referred ? ", referred you" : ""}
                          </span>
                        ) : (
                          <StepPing step={step} />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          {reports.length > 0 && (
            <>
              <p className={`${section} ${apps.length || outreach.length ? "border-t" : ""}`}>Your interviews</p>
              <ul className="divide-y divide-edge">
                {reports.map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                    <span className="min-w-0">
                      <span className="block font-medium">{[r.position, r.round].filter(Boolean).join(", ")}</span>
                      <span className="block text-[12.5px] text-muted">
                        {r.year}, difficulty {r.difficulty} of 5{r.anonymous ? ", anonymous to others" : ""}
                      </span>
                    </span>
                    <Badge tone={outcomeTone(r.outcome)}>{r.outcome}</Badge>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </Card>
  );
}
