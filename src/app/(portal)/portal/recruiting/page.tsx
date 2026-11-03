"use client";

import Link from "@/components/app-link";
import { Fragment, useEffect, useState } from "react";
import { usePortal } from "@/portal/store";
import { applicationPrompt, byline, companySlug, fmtDate, followUpsDue, isShared, reachedLabel, uid, withStage, type AppPrompt } from "@/portal/logic";
import { GradeForm, ScorePicker } from "@/portal/grades";
import { SimilarMembers } from "@/portal/similar";
import { JobForm } from "@/portal/jobs";
import { MyNetwork, myOutreachAt } from "@/portal/outreach";
import { STAGES, type Application, type Score, type Stage } from "@/portal/types";
import { Badge, Button, Card, Drawer, Empty, Field, Input, PageTitle, Select, Stat, StatGroup, Tabs, Td, Textarea, Th, rowCls } from "@/portal/ui";
import { ReportForm, outcomeTone } from "@/portal/views/company";

type Tab = "applications" | "network" | "interviews" | "similar";
const TAB_HASH: Record<string, Tab> = { "#network": "network", "#interviews": "interviews", "#applications": "applications", "#similar": "similar" };
const tabFromHash = () => (typeof window === "undefined" ? "applications" : (TAB_HASH[window.location.hash] ?? "applications"));

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

type Draft = { company: string; position: string; cycle: string; stage: Stage; notes: string; anonymous: boolean; effort?: Score; fit?: Score };
const emptyDraft: Draft = { company: "", position: "", cycle: "", stage: "Applied", notes: "", anonymous: false };

const EFFORT_HINT = "How much work the application took";
const EFFORT_SCALE = "1 a quick form, 5 essays, tests and video";
const FIT_HINT = "How closely the role matches what you want to do";
const FIT_SCALE = "1 a backup, 5 exactly what you want";

/** The interview round a report most likely covers, from how far the application got. */
const roundFor = (a: Application) => (a.furthest === "First Round" ? "First round" : a.furthest === "Superday / Final" || a.furthest === "Offer" ? "Final round" : "");

export default function RecruitingPage() {
  const { data, me, update } = usePortal();
  // The portal shell renders pages only after mounting, so reading the hash here can't cause a hydration mismatch.
  const [tab, setTabState] = useState<Tab>(tabFromHash);
  const [adding, setAdding] = useState(false);
  const [addingPerson, setAddingPerson] = useState(false);
  const [addingInterview, setAddingInterview] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [addingJob, setAddingJob] = useState<Application | null>(null);
  const [rating, setRating] = useState<Application | null>(null);
  const [logging, setLogging] = useState<Application | null>(null);
  const [grading, setGrading] = useState<Application | null>(null);

  // Links like /portal/recruiting#network open the right tab, including from the same page.
  useEffect(() => {
    const onHash = () => setTabState(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const setTab = (t: Tab) => {
    setTabState(t);
    try {
      history.replaceState(history.state, "", t === "applications" ? window.location.pathname + window.location.search : `#${t}`);
    } catch {}
  };

  if (!me) return null;

  const mine = data.applications.filter((a) => a.memberId === me.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const active = mine.filter((a) => !CLOSED_STAGES.includes(a.stage)).length;
  const interviewing = mine.filter((a) => INTERVIEW_STAGES.includes(a.stage)).length;
  const offers = mine.filter((a) => a.stage === "Offer").length;
  const myOutreach = data.outreach.filter((o) => o.memberId === me.id);
  const due = followUpsDue(me.id, data.outreach).length;
  const myReports = data.reports.filter((r) => r.memberId === me.id);
  const grouped = STAGES.map((s) => ({ stage: s, items: mine.filter((a) => a.stage === s) })).filter((g) => g.items.length > 0);

  const setStage = (id: string, stage: Stage) =>
    update((d) => ({
      ...d,
      applications: d.applications.map((a) => (a.id === id ? withStage(a, stage, today()) : a)),
    }));
  const setApp = (id: string, patch: Partial<Application>) =>
    update((d) => ({ ...d, applications: d.applications.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  const allAnonymous = mine.length > 0 && mine.every((a) => a.anonymous);
  const setAllAnonymous = (anonymous: boolean) =>
    update((d) => ({ ...d, applications: d.applications.map((a) => (a.memberId === me.id ? { ...a, anonymous } : a)) }));
  const openPrompt = (a: Application, p: AppPrompt) => {
    if (p.kind === "rate") setRating(a);
    else if (p.kind === "interview") setLogging(a);
    else if (p.kind === "grade") setGrading(a);
    else setAddingJob(a);
  };

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
      // A rejection or withdrawal logged straight away still counts as an application sent.
      furthest: draft.stage === "Rejected" || draft.stage === "Withdrew" ? "Applied" : draft.stage,
      anonymous: draft.anonymous,
      effort: draft.effort,
      fit: draft.fit,
      notes: draft.notes.trim(),
      updatedAt: today(),
    };
    update((d) => ({ ...d, applications: [app, ...d.applications] }));
    setAdding(false);
  };

  const action =
    tab === "applications" ? (
      <Button onClick={openAdd}>Add application</Button>
    ) : tab === "network" ? (
      <Button onClick={() => setAddingPerson(true)}>Add a person</Button>
    ) : tab === "interviews" ? (
      <Button onClick={() => setAddingInterview(true)}>Add interview</Button>
    ) : undefined;

  return (
    <div>
      <PageTitle
        title="My recruiting"
        sub="Your applications, the people you reach out to and your interviews. An application stays private until you reach a first round. From then on members see it on the firm's page, with your name or anonymously, so they know who to ask."
        actions={action}
      />

      <StatGroup>
        <Stat label="Active applications" value={active} sub={`${mine.length} tracked in total`} />
        <Stat label="Interviewing" value={interviewing} sub={offers ? `${offers} ${offers === 1 ? "offer" : "offers"}` : "Assessment, first round or final"} />
        <Stat
          label="People reached"
          value={new Set(myOutreach.map((o) => o.contactId)).size}
          sub={`${myOutreach.filter((o) => o.responded).length} replied, ${myOutreach.filter((o) => o.chatted).length} ${myOutreach.filter((o) => o.chatted).length === 1 ? "chat" : "chats"}`}
        />
        <Stat label="Follow-ups due" value={due} sub={due ? "See My network" : "You're all caught up"} />
      </StatGroup>

      <div className="mt-6">
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { value: "applications", label: "Applications", count: mine.length },
            { value: "network", label: "My network", count: new Set(myOutreach.map((o) => o.contactId)).size },
            { value: "interviews", label: "My interviews", count: myReports.length },
            { value: "similar", label: "Similar members" },
          ]}
        />
      </div>

      {tab === "network" && <MyNetwork adding={addingPerson} setAdding={setAddingPerson} />}
      {tab === "interviews" && <MyInterviews onAdd={() => setAddingInterview(true)} />}
      {tab === "similar" && <SimilarMembers />}

      {tab === "applications" && (
      <Card
        title="Applications"
        flush
        action={
          mine.length > 0 && (
            <Button variant="ghost" onClick={() => setAllAnonymous(!allAnonymous)}>
              {allAnonymous ? "Show my name on all" : "Make all anonymous"}
            </Button>
          )
        }
      >
        <p className="border-b border-edge bg-[#fbfbf7] px-4 py-2 text-[12.5px] text-muted">
          Only you and exec see an application until it reaches a first round. Then members see the firm, position, cycle, how far you got and the outcome, with
          your name or as &ldquo;Anonymous member&rdquo;. Your notes stay private.
        </p>
        {mine.length === 0 ? (
          <Empty>No applications yet. Add the first one to start tracking your recruiting.</Empty>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[1040px]">
              <thead>
                <tr>
                  <Th>Company</Th>
                  <Th>Position</Th>
                  <Th>Cycle</Th>
                  <Th>Stage</Th>
                  <Th>Shared</Th>
                  <Th>Next step</Th>
                  <Th>Updated</Th>
                  <Th>
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((g) => (
                  <Fragment key={g.stage}>
                    <tr className="border-b border-edge bg-[#fbfbf7]">
                      <td colSpan={8} className="px-4 py-1.5">
                        <Badge tone={stageTone(g.stage)}>{g.stage}</Badge>
                        <span className="ml-2 text-[12px] text-faint tabular-nums">{g.items.length}</span>
                      </td>
                    </tr>
                    {g.items.map((a) => {
                      const prompt = applicationPrompt(a, data);
                      return (
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
                            className="h-7 rounded-[3px] border border-edge bg-white pr-6 pl-2 text-[12.5px] text-ink hover:border-[#cfcfc4] focus:border-accent focus:outline-none"
                          >
                            {STAGES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          {a.furthest !== a.stage && <span className="mt-1 block text-[12px] text-muted">Got to {reachedLabel(a.furthest).toLowerCase()}</span>}
                        </Td>
                        <Td className="py-2">
                          <span className="block text-[13px]">{isShared(a) ? (a.anonymous ? "Anonymously" : "With your name") : "Not yet"}</span>
                          <span className="block text-[12px] text-muted">
                            {isShared(a) ? "" : `From a first round, ${a.anonymous ? "anonymously" : "with your name"}. `}
                            <button
                              type="button"
                              onClick={() => setApp(a.id, { anonymous: !a.anonymous })}
                              aria-label={`${a.company}: ${a.anonymous ? "show your name" : "make anonymous"}`}
                              className="text-link hover:underline"
                            >
                              {a.anonymous ? "Show my name" : "Make anonymous"}
                            </button>
                          </span>
                        </Td>
                        <Td>
                          {prompt ? (
                            <Button variant="secondary" onClick={() => openPrompt(a, prompt)} aria-label={`${prompt.label}: ${a.company}`}>
                              {prompt.label}
                            </Button>
                          ) : (
                            <span className="text-[12.5px] text-faint">Nothing due</span>
                          )}
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
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      )}

      <Drawer open={!!addingJob} onClose={() => setAddingJob(null)} title="Add to my experience">
        {addingJob && (
          <JobForm
            company={addingJob.company}
            prefill={{
              role: addingJob.position,
              kind: /full[- ]?time/i.test(addingJob.cycle) ? "Full-time" : "Summer internship",
              year: Number(addingJob.cycle.match(/\d{4}/)?.[0]) || undefined,
            }}
            onDone={() => setAddingJob(null)}
          />
        )}
      </Drawer>
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
          {draft.stage !== "Researching" && (
            <>
              <ScorePicker name="new-effort" label="How hard was the application?" hint={EFFORT_HINT} scale={EFFORT_SCALE} value={draft.effort} onChange={(effort) => setDraft({ ...draft, effort })} />
              <ScorePicker name="new-fit" label="How well does it fit your interests?" hint={FIT_HINT} scale={FIT_SCALE} value={draft.fit} onChange={(fit) => setDraft({ ...draft, fit })} />
            </>
          )}
          <Field label="Once you reach a first round, show it" hint="Before a first round, only you and exec can see it.">
            <Select
              options={[
                { value: "named", label: "With my name" },
                { value: "anonymous", label: "Anonymously" },
              ]}
              value={draft.anonymous ? "anonymous" : "named"}
              onChange={(e) => setDraft({ ...draft, anonymous: e.target.value === "anonymous" })}
            />
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
      <Drawer open={addingInterview} onClose={() => setAddingInterview(false)} title="Add interview">
        {addingInterview && <ReportForm onDone={() => setAddingInterview(false)} />}
      </Drawer>
      <Drawer open={!!rating} onClose={() => setRating(null)} title={rating ? `Rate your ${rating.company} application` : "Rate the application"}>
        {rating && (
          <RateApplication
            app={rating}
            onSave={(patch) => {
              setApp(rating.id, patch);
              setRating(null);
            }}
            onCancel={() => setRating(null)}
          />
        )}
      </Drawer>
      <Drawer open={!!logging} onClose={() => setLogging(null)} title={logging ? `Log your ${logging.company} interview` : "Log the interview"}>
        {logging && (
          <ReportForm company={logging.company} prefill={{ position: logging.position, year: Number(logging.updatedAt.slice(0, 4)), round: roundFor(logging) }} onDone={() => setLogging(null)} />
        )}
      </Drawer>
      <Drawer open={!!grading} onClose={() => setGrading(null)} title={grading ? `Grade ${grading.company}` : "Grade the process"}>
        {grading && <GradeForm company={grading.company.trim()} fromApp={grading} onDone={() => setGrading(null)} />}
      </Drawer>
    </div>
  );
}

/** Your interview reports, grouped by firm, with what else you've done there. */
function MyInterviews({ onAdd }: { onAdd: () => void }) {
  const { data, me } = usePortal();
  if (!me) return null;

  const mine = data.reports.filter((r) => r.memberId === me.id).sort((a, b) => b.year - a.year);
  const firms = [...new Set(mine.map((r) => r.company.trim()))].sort((a, b) => a.localeCompare(b));

  if (mine.length === 0) {
    return (
      <Card flush>
        <Empty>
          <span className="mb-3 block">
            No interviews logged yet. After each round, add how it went and the questions you were asked. The overview shows on the firm&apos;s page; the
            questions go into its question bank with no name or date attached.
          </span>
          <Button onClick={onAdd}>Add interview</Button>
        </Empty>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {firms.map((firm) => {
        const reports = mine.filter((r) => r.company.trim() === firm);
        const people = myOutreachAt(data, me.id, firm);
        const app = data.applications.find((a) => a.memberId === me.id && a.company.trim() === firm);
        return (
          <Card
            key={firm}
            title={firm}
            flush
            action={
              <Link href={`/portal/companies/${companySlug(firm)}`} className="text-link hover:underline">
                Your history at {firm}
              </Link>
            }
          >
            <ul className="divide-y divide-edge">
              {reports.map((r) => {
                const by = byline(r.memberId, r.anonymous, me, data.members);
                return (
                  <li key={r.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <p className="font-medium">{[r.position, r.round].filter(Boolean).join(", ")}</p>
                      <span className="flex items-center gap-1.5">
                        {r.anonymous && <Badge>Anonymous to others</Badge>}
                        <Badge tone={outcomeTone(r.outcome)}>{r.outcome}</Badge>
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-muted">
                      {r.year}
                      {r.format && `, ${r.format}`}
                      <span className="mx-1.5 text-faint" aria-hidden>
                        ·
                      </span>
                      Difficulty {r.difficulty} of 5
                      {by.note && (
                        <>
                          <span className="mx-1.5 text-faint" aria-hidden>
                            ·
                          </span>
                          {by.note}
                        </>
                      )}
                    </p>
                    {r.overview && <p className="mt-2 text-[13px] whitespace-pre-line text-ink-2">{r.overview}</p>}
                    {r.tips && <p className="mt-1.5 text-[13px] whitespace-pre-line text-muted">Advice: {r.tips}</p>}
                  </li>
                );
              })}
            </ul>
            <p className="border-t border-edge bg-[#fbfbf7] px-4 py-2 text-[12.5px] text-muted">
              Questions you added are in the firm&apos;s question bank without your name, so they aren&apos;t listed here.{" "}
              {app ? `Application: ${app.position}, ${app.stage}. ` : ""}
              {people.length ? `You've reached out to ${people.length} ${people.length === 1 ? "person" : "people"} here.` : "You haven't logged outreach to anyone here yet."}
            </p>
          </Card>
        );
      })}
    </div>
  );
}

/** The two ratings asked for once you apply. Effort tells the next member what they're in for; fit feeds Similar members. */
function RateApplication({ app, onSave, onCancel }: { app: Application; onSave: (patch: Pick<Application, "effort" | "fit">) => void; onCancel: () => void }) {
  const [effort, setEffort] = useState<Score | undefined>(app.effort);
  const [fit, setFit] = useState<Score | undefined>(app.fit);
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ effort, fit });
      }}
    >
      <p className="text-[13px] text-muted">
        {[app.position, app.cycle].filter(Boolean).join(", ")}. Effort is shown on the firm&apos;s page as an average once three members have rated it. Fit is
        only used to find members with interests like yours.
      </p>
      <ScorePicker name="rate-effort" label="How hard was the application?" hint={EFFORT_HINT} scale={EFFORT_SCALE} value={effort} onChange={setEffort} />
      <ScorePicker name="rate-fit" label="How well does it fit your interests?" hint={FIT_HINT} scale={FIT_SCALE} value={fit} onChange={setFit} />
      <div className="flex gap-2">
        <Button type="submit" disabled={effort == null || fit == null}>
          Save ratings
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
