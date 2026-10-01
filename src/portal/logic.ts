/**
 * The automation rules, as pure functions so the same logic can run in the
 * browser preview and in a nightly database job.
 */

import type { Audience, Member, Outreach, PortalData, Role, TaskTemplate, Term } from "./types";

/** Academic years roll over on July 1. Returns the starting calendar year. */
export function academicYear(now = new Date()) {
  return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
}

export function academicYearLabel(start = academicYear()) {
  return `${start}-${String(start + 1).slice(2)}`;
}

export function currentTerm(now = new Date()): Term {
  const m = now.getMonth();
  // Aug-Dec is fall; Jan-Jul belongs to spring.
  return m >= 7 ? `F${now.getFullYear()}` : `S${now.getFullYear()}`;
}

/** Members become alumni after commencement (June 1 of their grad year). */
export function isAlum(m: Pick<Member, "gradYear">, now = new Date()) {
  return now >= new Date(m.gradYear, 5, 1);
}

export function classStanding(gradYear: number, now = new Date()) {
  if (isAlum({ gradYear }, now)) return "Alumni";
  const yearsLeft = gradYear - (academicYear(now) + 1);
  return ["Senior", "Junior", "Sophomore", "First-year"][yearsLeft] ?? "Incoming";
}

/** Number of full semesters completed since joining, as of now. */
export function semestersCompleted(joined: Term, now = new Date()) {
  const toIndex = (t: Term) => Number(t.slice(1)) * 2 + (t[0] === "F" ? 1 : 0);
  return Math.max(0, toIndex(currentTerm(now)) - toIndex(joined));
}

export type Promotion = { member: Member; to: Role; reason: string };

/**
 * Proposed promotions for exec to approve. Nothing changes without approval.
 *  Associate Consultant -> Consultant after one completed semester.
 *  Consultant -> eligible for Team Lead after two completed semesters (flag only).
 */
export function promotionSuggestions(members: Member[], now = new Date()): Promotion[] {
  const out: Promotion[] = [];
  for (const m of members) {
    if (isAlum(m, now)) continue;
    const sem = semestersCompleted(m.joinedTerm, now);
    if (m.role === "Associate Consultant" && sem >= 1) {
      out.push({ member: m, to: "Consultant", reason: `${sem} semester${sem > 1 ? "s" : ""} completed` });
    } else if (m.role === "Consultant" && sem >= 2) {
      out.push({ member: m, to: "Team Lead", reason: `Eligible to lead: ${sem} semesters completed` });
    }
  }
  return out;
}

export function matchesAudience(a: Audience, m: Member) {
  if (a.kind === "all") return true;
  if (a.kind === "role") return m.role === a.role;
  return m.execTitle === a.title;
}

export function audienceLabel(a: Audience) {
  if (a.kind === "all") return "All members";
  if (a.kind === "role") return `All ${a.role}s`;
  return a.title;
}

export type TaskInstance = {
  key: string;
  template: TaskTemplate;
  due: Date;
  done?: string;
};

/** Generates this academic year's tasks for a member from the recurring templates. */
export function tasksFor(member: Member, data: Pick<PortalData, "taskTemplates" | "taskDone">, now = new Date()) {
  const year = academicYear(now);
  return data.taskTemplates
    .filter((t) => matchesAudience(t.audience, member))
    .map<TaskInstance>((t) => {
      const calYear = t.month >= 7 ? year : year + 1;
      const key = `${t.id}:${year}:${member.id}`;
      return { key, template: t, due: new Date(calYear, t.month - 1, t.day), done: data.taskDone[key] };
    })
    .sort((a, b) => a.due.getTime() - b.due.getTime());
}

export function responseStats(items: Outreach[]) {
  const total = items.length;
  const responded = items.filter((o) => o.responded).length;
  const chats = items.filter((o) => o.chatted).length;
  const days = items.filter((o) => o.responseDays != null).map((o) => o.responseDays!);
  const ratings = items.filter((o) => o.helpfulness != null).map((o) => o.helpfulness!);
  return {
    total,
    responded,
    rate: total ? responded / total : 0,
    chats,
    medianDays: days.length ? days.sort((a, b) => a - b)[Math.floor(days.length / 2)] : undefined,
    avgHelpfulness: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : undefined,
    referrals: items.filter((o) => o.referred).length,
  };
}

export const fullName = (m: Pick<Member, "firstName" | "lastName">) => `${m.firstName} ${m.lastName}`;

export const isExec = (m?: Member) => m?.role === "Executive Board";

export const pct = (n: number) => `${Math.round(n * 100)}%`;

/** Plain "YYYY-MM-DD" strings are calendar dates, so read them in local time (not UTC). */
export const toDate = (d: Date | string) =>
  typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T00:00:00`) : new Date(d);

export const fmtDate = (d: Date | string) =>
  toDate(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const uid = () => Math.random().toString(36).slice(2, 10);

export const companySlug = (c: string) => c.toLowerCase().replace(/[^a-z0-9]+/g, "-");
