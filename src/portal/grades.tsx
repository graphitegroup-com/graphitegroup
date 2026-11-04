"use client";

import { useState } from "react";
import { CompanyOptions } from "./forum";
import {
  MIN_GRADERS,
  byline,
  companySlug,
  contactGrade,
  dimensionApplies,
  firmGradeSummary,
  fmtDate,
  gradeScore,
  letterGrade,
  matchCompany,
  pct,
  uid,
  type FirmGradeSummary,
} from "./logic";
import { usePortal } from "./store";
import {
  FIRM_DIMENSIONS,
  GRADE_OUTCOMES,
  STAGES_REACHED,
  type FirmDimension,
  type Application,
  type FirmGrade,
  type GradeOutcome,
  type Outreach,
  type PortalData,
  type Score,
  type Stage,
  type StageReached,
} from "./types";
import { Badge, Button, Card, Check, Drawer, Empty, Field, GradeTile, Input, ScoreBar, Select, Textarea, type Tone } from "./ui";

/** One line under a firm's letter. */
export function gradeStatus(s: FirmGradeSummary) {
  if (s.letter) return `${s.graders} members${s.recommendRate != null ? `, ${pct(s.recommendRate)} recommend applying` : ""}`;
  if (s.graders) return `${s.graders} of ${MIN_GRADERS} members needed for a letter`;
  return "Not graded yet";
}

export const gradeOutcomeTone = (o: GradeOutcome): Tone =>
  o === "Offer" ? "green" : o === "Rejected" || o === "No response" ? "red" : o === "Still in process" ? "blue" : "gray";

/** Whether the grader also tracked an application or wrote an interview report at this firm. */
const tracked = (g: FirmGrade, data: Pick<PortalData, "applications" | "reports">) =>
  // Live data: the database works this out, since other members' applications aren't visible here.
  g.tracked ??
  (data.applications.some((a) => a.memberId === g.memberId && companySlug(a.company) === companySlug(g.company)) ||
    data.reports.some((r) => r.memberId === g.memberId && companySlug(r.company) === companySlug(g.company)));

const stageFromApp = (s: Stage): StageReached =>
  s === "Online Assessment" || s === "First Round" ? s : s === "Superday / Final" || s === "Offer" ? "Superday / Final" : "Applied";
const outcomeFromApp = (s: Stage): GradeOutcome => (s === "Offer" || s === "Rejected" || s === "Withdrew" ? s : "Still in process");

const SCORES: Score[] = [1, 2, 3, 4, 5];

export function ScorePicker({
  name,
  label,
  hint,
  value,
  onChange,
  disabledNote,
  scale = "1 poor, 5 excellent",
}: {
  name: string;
  label: string;
  hint: string;
  value?: Score;
  onChange: (s: Score) => void;
  disabledNote?: string;
  scale?: string;
}) {
  const disabled = !!disabledNote;
  return (
    <fieldset disabled={disabled} className="disabled:opacity-60">
      <legend className="text-[13px] font-medium text-ink-2">{label}</legend>
      <p className="text-[12px] text-muted">{disabledNote ?? hint}</p>
      {!disabled && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <div className="inline-flex shrink-0 overflow-hidden rounded-[3px] border border-[#d6d6cb]">
            {SCORES.map((n) => (
              <label key={n} className="relative border-r border-[#d6d6cb] last:border-r-0">
                <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} className="peer sr-only" />
                <span className="flex h-8 w-9 cursor-pointer items-center justify-center bg-white text-[13px] tabular-nums transition-colors peer-checked:bg-accent peer-checked:font-medium peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40 peer-focus-visible:ring-inset hover:bg-stone peer-checked:hover:bg-accent">
                  {n}
                </span>
              </label>
            ))}
          </div>
          <span className="text-[12px] text-faint">{scale}</span>
        </div>
      )}
    </fieldset>
  );
}

type GradeDraft = {
  company: string;
  cycle: string;
  stageReached: StageReached;
  outcome: GradeOutcome;
  scores: Partial<Record<FirmDimension, Score>>;
  recommend?: boolean;
  review: string;
  anonymous: boolean;
};

/**
 * Grade a firm's recruiting process for one cycle. Saving replaces any earlier
 * grade by the same member for the same firm and cycle. Mount it only while
 * its drawer is open.
 */
export function GradeForm({ company, existing, fromApp, onDone }: { company?: string; existing?: FirmGrade; fromApp?: Application; onDone: () => void }) {
  const { data, me, update } = usePortal();
  const [draft, setDraft] = useState<GradeDraft>(() => {
    if (existing) {
      const { company: c, cycle, stageReached, outcome, scores, recommend, review, anonymous } = existing;
      return { company: c, cycle, stageReached, outcome, scores, recommend, review, anonymous };
    }
    // Start from the member's latest tracked application at this firm that they haven't graded yet.
    const graded = new Set(data.grades.filter((g) => g.memberId === me?.id && g.company.trim() === company).map((g) => g.cycle.trim().toLowerCase()));
    const app = fromApp ?? (me && company
      ? data.applications
          .filter((a) => a.memberId === me.id && a.company.trim() === company && !graded.has(a.cycle.trim().toLowerCase()))
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
      : undefined);
    return {
      company: company ?? "",
      cycle: app?.cycle ?? "",
      stageReached: app ? stageFromApp(app.furthest) : "Applied",
      outcome: app ? outcomeFromApp(app.stage) : "Still in process",
      scores: {},
      review: "",
      anonymous: false,
    };
  });
  const set = (patch: Partial<GradeDraft>) => setDraft((d) => ({ ...d, ...patch }));

  if (!me) return null;

  const applicable = FIRM_DIMENSIONS.filter((d) => dimensionApplies(d, draft.stageReached));
  const missing = applicable.filter((d) => !draft.scores[d.key]);
  const firm = (company ?? draft.company).trim();
  const ready = !!firm && !!draft.cycle.trim() && missing.length === 0 && draft.recommend !== undefined;
  const cycles = [...new Set([...data.applications.filter((a) => a.memberId === me.id).map((a) => a.cycle), ...data.grades.map((g) => g.cycle)])].sort();
  // Saving over another of the member's grades for this firm and cycle replaces it; say so before they do.
  const replaces = data.grades.find(
    (g) => g.id !== existing?.id && g.memberId === me.id && !!firm && companySlug(g.company) === companySlug(firm) && g.cycle.trim().toLowerCase() === draft.cycle.trim().toLowerCase(),
  );

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    const name = company ?? matchCompany(data, draft.company);
    const scores: FirmGrade["scores"] = {};
    for (const d of applicable) scores[d.key] = draft.scores[d.key];
    const grade: FirmGrade = {
      id: existing?.id ?? uid(),
      company: name,
      memberId: me.id,
      cycle: draft.cycle.trim(),
      stageReached: draft.stageReached,
      outcome: draft.outcome,
      scores,
      recommend: draft.recommend!,
      review: draft.review.trim(),
      anonymous: draft.anonymous,
      createdAt: new Date().toISOString(),
    };
    const sameCycle = (g: FirmGrade) => g.memberId === me.id && companySlug(g.company) === companySlug(name) && g.cycle.trim().toLowerCase() === grade.cycle.toLowerCase();
    update((d) => ({ ...d, grades: [grade, ...d.grades.filter((g) => g.id !== grade.id && !sameCycle(g))] }));
    onDone();
  };

  const remove = () => {
    if (!existing || !window.confirm("Delete your grade?")) return;
    update((d) => ({ ...d, grades: d.grades.filter((g) => g.id !== existing.id) }));
    onDone();
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <Field label="Company">
        {company ? (
          <Input value={company} readOnly />
        ) : (
          <>
            <Input required list="grade-companies" value={draft.company} onChange={(e) => set({ company: e.target.value })} placeholder="e.g. Bain & Company" />
            <CompanyOptions id="grade-companies" data={data} />
          </>
        )}
      </Field>
      <Field label="Recruiting cycle" hint="One grade per firm and cycle.">
        <Input required list="grade-cycles" value={draft.cycle} onChange={(e) => set({ cycle: e.target.value })} placeholder="e.g. Summer 2027 Internship" />
        <datalist id="grade-cycles">
          {cycles.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>
      {replaces && (
        <p role="status" className="-mt-3 rounded-[3px] border border-[#ecd9a8] bg-[#fbf1da] px-3 py-2 text-[12.5px] text-[#5c4300]">
          You already graded {firm} for {replaces.cycle} on {fmtDate(replaces.createdAt)}. Saving replaces that grade.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Furthest stage">
          <Select options={STAGES_REACHED} value={draft.stageReached} onChange={(e) => set({ stageReached: e.target.value as StageReached })} />
        </Field>
        <Field label="Outcome">
          <Select options={GRADE_OUTCOMES} value={draft.outcome} onChange={(e) => set({ outcome: e.target.value as GradeOutcome })} />
        </Field>
      </div>

      <div className="space-y-4 rounded-[3px] border border-edge bg-[#fbfbf7] p-4">
        {FIRM_DIMENSIONS.map((d) => (
          <ScorePicker
            key={d.key}
            name={`score-${d.key}`}
            label={d.label}
            hint={d.hint}
            value={draft.scores[d.key]}
            onChange={(s) => set({ scores: { ...draft.scores, [d.key]: s } })}
            disabledNote={dimensionApplies(d, draft.stageReached) ? undefined : `Applies once you reach ${d.from === "First Round" ? "a first round" : "an online assessment"}.`}
          />
        ))}
      </div>

      <fieldset>
        <legend className="text-[13px] font-medium text-ink-2">Would you tell another member to apply?</legend>
        <div className="mt-1.5 flex gap-4">
          {[
            { v: true, label: "Yes" },
            { v: false, label: "No" },
          ].map((o) => (
            <label key={o.label} className="flex items-center gap-2 text-[13.5px]">
              <input type="radio" name="recommend" checked={draft.recommend === o.v} onChange={() => set({ recommend: o.v })} className="h-4 w-4 accent-[var(--color-accent)]" />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="What should the next member know?" hint="Optional. Timelines, who to talk to, what surprised you.">
        <Textarea rows={4} value={draft.review} onChange={(e) => set({ review: e.target.value })} />
      </Field>

      <Check
        label="Post anonymously"
        checked={draft.anonymous}
        onChange={(v) => set({ anonymous: v })}
        hint="Other members see “Anonymous member”. You and exec still see your name. If only a few members applied here, people may still guess."
      />

      {!ready && (
        <p className="text-[12.5px] text-muted">
          {!firm || !draft.cycle.trim()
            ? "Add the company and cycle."
            : missing.length
              ? `Score ${missing.map((d) => d.label.toLowerCase()).join(", ")}.`
              : "Answer whether you'd recommend applying."}
        </p>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" disabled={!ready}>
          {existing ? "Save grade" : "Submit grade"}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        {existing && (
          <Button variant="danger" className="ml-auto" onClick={remove}>
            Delete grade
          </Button>
        )}
      </div>
    </form>
  );
}

/** The grades panel on a company page: the letter, averages and every member's grade. */
export function FirmGrades({ company }: { company: string }) {
  const { data, me } = usePortal();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FirmGrade | undefined>();

  if (!me) return null;

  const grades = data.grades.filter((g) => g.company.trim() === company).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const s = firmGradeSummary(grades);
  const startNew = () => {
    setEditing(undefined);
    setOpen(true);
  };

  return (
    <>
      <Card
        title="Recruiting grade"
        flush
        action={
          <Button variant="ghost" onClick={startNew}>
            {grades.some((g) => g.memberId === me.id) ? "Grade another cycle" : "Grade this firm"}
          </Button>
        }
      >
        <div className="grid gap-x-6 gap-y-4 border-b border-edge px-4 py-4 sm:grid-cols-[9rem_1fr]">
          <div className="flex items-center gap-3 sm:flex-col sm:items-start">
            <GradeTile letter={s.letter} size="lg" />
            <p className="text-[12.5px] text-muted">{gradeStatus(s)}</p>
          </div>
          {s.count ? (
            <div className="space-y-2 self-center">
              {FIRM_DIMENSIONS.map((d) => (
                <ScoreBar key={d.key} label={d.label} value={s.dims[d.key]} />
              ))}
            </div>
          ) : (
            <p className="self-center text-[13px] text-muted">
              No grades yet. If you went through {company}&apos;s process, grade it so the next member knows what they&apos;re walking into.
            </p>
          )}
        </div>
        {grades.length === 0 ? (
          <Empty>
            <Button onClick={startNew}>Grade {company}</Button>
          </Empty>
        ) : (
          <ul className="divide-y divide-edge">
            {grades.map((g) => {
              const by = byline(g.memberId, g.anonymous, me, data.members);
              const scored = FIRM_DIMENSIONS.filter((d) => g.scores[d.key] != null);
              return (
                <li key={g.id} className="flex gap-3 px-4 py-3.5">
                  <GradeTile letter={letterGrade(gradeScore(g))} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-3">
                      <p className="text-[13.5px]">
                        <span className="font-medium">{by.name}</span>
                        {by.note && <span className="text-muted"> ({by.note})</span>}
                      </p>
                      {g.memberId === me.id && (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditing(g);
                            setOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                    <p className="text-[12.5px] text-muted">
                      {g.cycle}
                      <span className="mx-1.5 text-faint" aria-hidden>
                        ·
                      </span>
                      {g.stageReached === "Applied" ? "Application only, no interview" : `Reached ${g.stageReached}`}
                      <span className="mx-1.5 text-faint" aria-hidden>
                        ·
                      </span>
                      {fmtDate(g.createdAt)}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Badge tone={gradeOutcomeTone(g.outcome)}>{g.outcome}</Badge>
                      <Badge tone={g.recommend ? "green" : "red"}>{g.recommend ? "Recommends applying" : "Would not recommend"}</Badge>
                      {tracked(g, data) && <Badge tone="blue">Tracked in the portal</Badge>}
                    </div>
                    <p className="mt-2 text-[12.5px] text-muted tabular-nums">
                      {scored.map((d, i) => (
                        <span key={d.key}>
                          {i > 0 && (
                            <span className="mx-1.5 text-faint" aria-hidden>
                              ·
                            </span>
                          )}
                          {d.label} <span className="font-medium text-ink-2">{g.scores[d.key]}</span>
                        </span>
                      ))}
                    </p>
                    {g.review && <p className="prose-portal mt-2">{g.review}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <Drawer open={open} onClose={() => setOpen(false)} title={editing ? "Edit your grade" : `Grade ${company}`}>
        {open && <GradeForm key={editing?.id ?? "new"} company={company} existing={editing} onDone={() => setOpen(false)} />}
      </Drawer>
    </>
  );
}

const days = (d: number) => `${d} ${d === 1 ? "day" : "days"}`;

/** A contact's outreach grade, computed from the outreach log. */
export function ContactGradeCard({ items }: { items: Outreach[] }) {
  const g = contactGrade(items);
  return (
    <Card title="Outreach grade">
      <div className="flex items-center gap-3 py-3">
        <GradeTile letter={g.letter} size="md" />
        <p className="text-[12.5px] text-muted">
          {g.letter ? `From ${g.graders} members' outreach` : g.graders ? `${g.graders} of ${MIN_GRADERS} members needed for a letter` : "No outreach logged yet"}
        </p>
      </div>
      {g.total > 0 && (
        <div className="space-y-2 border-t border-edge py-3">
          <ScoreBar label="Responds" value={g.responsiveness} display={`${pct(g.rate)} of ${g.total}`} />
          <ScoreBar label="Reply speed" value={g.speed} display={g.medianDays != null ? days(g.medianDays) : "None"} />
          <ScoreBar label="Helpfulness" value={g.avgHelpfulness} display={g.avgHelpfulness != null ? `${g.avgHelpfulness.toFixed(1)} of 5` : "None"} />
        </div>
      )}
      <p className="border-t border-edge py-3 text-[12px] text-muted">
        Every logged outreach counts: how often they reply, how fast, and how helpful members found them. A letter needs {MIN_GRADERS} different members.
      </p>
    </Card>
  );
}
