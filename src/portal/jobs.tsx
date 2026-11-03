"use client";

import Link from "@/components/app-link";
import { useState } from "react";
import { CompanyOptions } from "./forum";
import { classAtTimeLabel, companySlug, defaultClassAtTime, firmType, fullName, jobsAt, matchCompany, memberLine, uid } from "./logic";
import { usePortal } from "./store";
import { CLASS_LEVELS, COMPANY_TYPES, JOB_KINDS, type ClassLevel, type CompanyType, type Job, type JobKind } from "./types";
import { Badge, Button, Card, Drawer, Empty, Field, Input, Select, linkCls, type Tone } from "./ui";

/** The years people filter on. "Alum" jobs still show on company pages. */
export const HIRE_LEVELS = ["Freshman", "Sophomore", "Junior", "Senior"] as const satisfies readonly ClassLevel[];

const levelTone: Record<ClassLevel, Tone> = { Freshman: "green", Sophomore: "blue", Junior: "amber", Senior: "gray", Alum: "gray" };
const levelShort: Record<ClassLevel, string> = { Freshman: "Fr", Sophomore: "So", Junior: "Jr", Senior: "Sr", Alum: "Alum" };

/** Small year-in-school chips, e.g. for the companies table. */
export function LevelChips({ levels }: { levels: ClassLevel[] }) {
  const shown = CLASS_LEVELS.filter((l) => l !== "Alum" && levels.includes(l));
  if (!shown.length) return <span className="text-faint">None yet</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {shown.map((l) => (
        <span key={l} title={`Hired a ${l.toLowerCase()}`}>
          <Badge tone={levelTone[l]}>{levelShort[l]}</Badge>
        </span>
      ))}
    </span>
  );
}

/** Sets a firm's type. Any member can set or correct it. */
export function useSetFirmType() {
  const { me, update } = usePortal();
  return (company: string, type: CompanyType) =>
    update((d) => {
      const slug = companySlug(company.trim());
      const others = d.firms.filter((f) => companySlug(f.name) !== slug);
      return { ...d, firms: [...others, { name: company.trim(), type, updatedBy: me?.id, updatedAt: new Date().toISOString() }] };
    });
}

/** A firm's type with a way to set or change it, for the company page header. */
export function CompanyTypeControl({ company }: { company: string }) {
  const { data } = usePortal();
  const setType = useSetFirmType();
  const [editing, setEditing] = useState(false);
  const type = firmType(data.firms, company);

  if (editing || !type) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="w-64">
          <Select
            aria-label={`Type of company for ${company}`}
            options={[{ value: "", label: type ? type : "Set the type of company" }, ...COMPANY_TYPES]}
            value=""
            onChange={(e) => {
              if (!e.target.value) return;
              setType(company, e.target.value as CompanyType);
              setEditing(false);
            }}
          />
        </span>
        {type && (
          <Button variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        )}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      <Badge>{type}</Badge>
      <button type="button" onClick={() => setEditing(true)} className="text-[12.5px] text-link hover:underline">
        Change
      </button>
    </span>
  );
}

type JobDraft = { company: string; role: string; kind: JobKind; year: string; classAtTime: ClassLevel; companyType: CompanyType | "" };

/**
 * Add or edit a job on the signed-in member's experience. The year in school
 * is suggested from their graduation year and can be corrected. Mount only
 * while its drawer is open.
 */
export function JobForm({ company, initial, prefill, onDone }: { company?: string; initial?: Job; prefill?: Partial<Pick<Job, "role" | "kind" | "year">>; onDone: () => void }) {
  const { data, me, update } = usePortal();
  const setType = useSetFirmType();
  const thisYear = new Date().getFullYear();
  const [d, setD] = useState<JobDraft>(() => {
    const kind = initial?.kind ?? prefill?.kind ?? "Summer internship";
    const year = initial?.year ?? prefill?.year ?? (new Date().getMonth() >= 8 ? thisYear : thisYear - 1);
    return {
      company: initial?.company ?? company ?? "",
      role: initial?.role ?? prefill?.role ?? "",
      kind,
      year: String(year),
      classAtTime: initial?.classAtTime ?? (me ? defaultClassAtTime(me.gradYear, kind, year) : "Freshman"),
      companyType: "",
    };
  });
  // Keep suggesting the year in school until the member picks one themselves.
  const [pickedLevel, setPickedLevel] = useState(!!initial);

  if (!me) return null;

  const set = (patch: Partial<JobDraft>) =>
    setD((x) => {
      const next = { ...x, ...patch };
      if (!pickedLevel && ("kind" in patch || "year" in patch)) {
        const y = Number(next.year);
        if (y > 1990) next.classAtTime = defaultClassAtTime(me.gradYear, next.kind, y);
      }
      return next;
    });

  const firm = (company ?? d.company).trim();
  const known = firm ? firmType(data.firms, matchCompany(data, firm)) : undefined;
  const year = Number(d.year);
  const valid = !!firm && !!d.role.trim() && year >= 1990 && year <= thisYear + 2;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const name = company ?? matchCompany(data, d.company);
    const job: Job = {
      id: initial?.id ?? uid(),
      memberId: me.id,
      company: name,
      role: d.role.trim(),
      kind: d.kind,
      year,
      classAtTime: d.classAtTime,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    update((x) => ({ ...x, jobs: [job, ...x.jobs.filter((j) => j.id !== job.id)] }));
    if (!known && d.companyType) setType(name, d.companyType);
    onDone();
  };

  const remove = () => {
    if (!initial || !window.confirm(`Remove ${initial.role} at ${initial.company} from your experience?`)) return;
    update((x) => ({ ...x, jobs: x.jobs.filter((j) => j.id !== initial.id) }));
    onDone();
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <p className="text-[13px] text-muted">
        Shared with every member and alum, so younger members can see where Graphite has been hired and in which year.
      </p>
      <Field label="Company">
        {company ? (
          <Input id="job-company" value={company} readOnly />
        ) : (
          <>
            <Input id="job-company" required list="job-companies" value={d.company} onChange={(e) => set({ company: e.target.value })} placeholder="e.g. Kiln Labs" />
            <CompanyOptions id="job-companies" data={data} />
          </>
        )}
      </Field>
      {firm && !known && (
        <Field label="Type of company" hint="Optional. Helps members filter firms and people by area.">
          <Select id="job-company-type" options={[{ value: "", label: "Choose a type" }, ...COMPANY_TYPES]} value={d.companyType} onChange={(e) => set({ companyType: e.target.value as CompanyType | "" })} />
        </Field>
      )}
      <Field label="Role">
        <Input id="job-role" required value={d.role} onChange={(e) => set({ role: e.target.value })} placeholder="e.g. Summer Analyst" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Kind">
          <Select id="job-kind" options={JOB_KINDS} value={d.kind} onChange={(e) => set({ kind: e.target.value as JobKind })} />
        </Field>
        <Field label={d.kind === "Summer internship" ? "Summer of" : "Starting year"}>
          <Input id="job-year" type="number" min={1990} max={thisYear + 2} value={d.year} onChange={(e) => set({ year: e.target.value })} />
        </Field>
      </div>
      <Field label="Your year in school then" hint={d.kind === "Summer internship" ? "For a summer, the year you'd just finished: the summer after sophomore year is a sophomore summer." : undefined}>
        <Select
          id="job-level"
          options={CLASS_LEVELS.map((l) => ({ value: l, label: l === "Alum" ? "Already graduated" : l }))}
          value={d.classAtTime}
          onChange={(e) => {
            setPickedLevel(true);
            set({ classAtTime: e.target.value as ClassLevel });
          }}
        />
      </Field>
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" disabled={!valid}>
          {initial ? "Save" : "Add to my experience"}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        {initial && (
          <Button variant="danger" className="ml-auto" onClick={remove}>
            Remove
          </Button>
        )}
      </div>
    </form>
  );
}

/** Company page: every member who worked here, by year in school, so freshmen and sophomores can see what's possible. */
export function WorkedHereCard({ company }: { company: string }) {
  const { data, me } = usePortal();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Job | undefined>();
  if (!me) return null;

  const jobs = jobsAt(data.jobs, company);
  const groups = CLASS_LEVELS.map((level) => ({ level, jobs: jobs.filter((j) => j.classAtTime === level) })).filter((g) => g.jobs.length);

  return (
    <>
      <Card
        title="Where Graphite members worked"
        flush
        action={
          <Button
            variant="ghost"
            onClick={() => {
              setEditing(undefined);
              setOpen(true);
            }}
          >
            Worked here? Add it
          </Button>
        }
      >
        {jobs.length === 0 ? (
          <Empty>No one has added a job at {company} yet. If you worked here, add it so younger members know it&apos;s possible.</Empty>
        ) : (
          groups.map((g) => (
            <div key={g.level} className="border-b border-edge last:border-0">
              <h3 className="border-b border-edge bg-[#fbfbf7] px-4 py-1.5 text-[12px] font-medium text-muted">
                {g.level === "Alum" ? "After graduating" : `As a ${g.level.toLowerCase()}`}
                <span className="ml-1.5 text-faint tabular-nums">{g.jobs.length}</span>
              </h3>
              <ul className="divide-y divide-edge">
                {g.jobs.map((j) => {
                  const m = data.members.find((x) => x.id === j.memberId);
                  return (
                    <li key={j.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="font-medium">{j.role}</p>
                        <p className="text-[12.5px] text-muted">
                          {classAtTimeLabel(j)} {j.year}
                          <span className="mx-1.5 text-faint" aria-hidden>
                            ·
                          </span>
                          {m ? (
                            <>
                              {fullName(m)}, {memberLine(m)}
                            </>
                          ) : (
                            "Former member"
                          )}
                        </p>
                      </div>
                      {j.memberId === me.id && (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditing(j);
                            setOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </Card>
      <Drawer open={open} onClose={() => setOpen(false)} title={editing ? "Edit experience" : `Add a job at ${company}`}>
        {open && <JobForm key={editing?.id ?? "new"} company={company} initial={editing} onDone={() => setOpen(false)} />}
      </Drawer>
    </>
  );
}

/** Profile: the member's own experience. */
export function ExperienceCard() {
  const { data, me } = usePortal();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Job | undefined>();
  if (!me) return null;
  const mine = data.jobs.filter((j) => j.memberId === me.id).sort((a, b) => b.year - a.year);

  return (
    <>
      <Card
        title="Experience"
        flush
        action={
          <Button
            variant="ghost"
            onClick={() => {
              setEditing(undefined);
              setOpen(true);
            }}
          >
            Add a job
          </Button>
        }
      >
        {mine.length === 0 ? (
          <Empty>Add internships and jobs, including summers before Graphite. Younger members use these to find where freshmen and sophomores get hired.</Empty>
        ) : (
          <ul className="divide-y divide-edge">
            {mine.map((j) => (
              <li key={j.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p>
                    <span className="font-medium">{j.role}</span>
                    {" at "}
                    <Link href={`/portal/companies/${companySlug(j.company)}`} className={linkCls}>
                      {j.company}
                    </Link>
                  </p>
                  <p className="text-[12.5px] text-muted">
                    {classAtTimeLabel(j)} {j.year}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditing(j);
                    setOpen(true);
                  }}
                >
                  Edit
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Drawer open={open} onClose={() => setOpen(false)} title={editing ? "Edit experience" : "Add a job"}>
        {open && <JobForm key={editing?.id ?? "new"} initial={editing} onDone={() => setOpen(false)} />}
      </Drawer>
    </>
  );
}
