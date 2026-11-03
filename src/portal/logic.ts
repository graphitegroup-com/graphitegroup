/**
 * The automation rules, as pure functions so the same logic can run in the
 * browser preview and in a nightly database job.
 */

import { FIRM_DIMENSIONS, STAGES_REACHED, type StageReached, type Audience, type FirmDimension, type FirmGrade, type ForumPost, type ForumReply, type Member, type Outreach, type PortalData, type Role, type TaskTemplate, type Term } from "./types";

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

/* ---------------------------------------------------------------- grades */

/**
 * A letter needs this many different members behind it. Below that, one
 * member's bad week would define a firm, and an "anonymous" grade would be
 * easy to trace back to the only person who applied.
 */
export const MIN_GRADERS = 3;

const LETTERS: [number, string][] = [
  [4.5, "A"],
  [4.2, "A−"],
  [3.9, "B+"],
  [3.5, "B"],
  [3.2, "B−"],
  [2.9, "C+"],
  [2.5, "C"],
  [2.2, "C−"],
  [1.8, "D"],
];

/** Maps a 1 to 5 score to a letter. */
export function letterGrade(score: number) {
  return LETTERS.find(([min]) => score >= min)?.[1] ?? "F";
}

/** "A−" reads as "A minus" to screen readers. */
export const letterLabel = (letter: string) => letter.replace("−", " minus").replace("+", " plus");

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const defined = <T,>(xs: (T | undefined)[]) => xs.filter((x): x is T => x !== undefined);

/** Whether a dimension can be graded by someone who got this far. */
export const dimensionApplies = (d: (typeof FIRM_DIMENSIONS)[number], reached: StageReached) =>
  STAGES_REACHED.indexOf(reached) >= STAGES_REACHED.indexOf(d.from);

/** One grade's overall score: the mean of the dimensions it covers. */
export const gradeScore = (g: FirmGrade) => mean(defined(FIRM_DIMENSIONS.map((d) => g.scores[d.key])));

export type FirmGradeSummary = {
  count: number;
  /** Different members, which is what MIN_GRADERS counts. */
  graders: number;
  dims: Partial<Record<FirmDimension, number>>;
  score?: number;
  letter?: string;
  recommendRate?: number;
};

export function firmGradeSummary(grades: FirmGrade[]): FirmGradeSummary {
  const count = grades.length;
  const graders = new Set(grades.map((g) => g.memberId)).size;
  if (!count) return { count, graders, dims: {} };
  const dims: FirmGradeSummary["dims"] = {};
  for (const d of FIRM_DIMENSIONS) {
    const xs = defined(grades.map((g) => g.scores[d.key]));
    if (xs.length) dims[d.key] = mean(xs);
  }
  // Every grade counts once, however many dimensions it covers.
  const score = mean(grades.map(gradeScore));
  return {
    count,
    graders,
    dims,
    score,
    letter: graders >= MIN_GRADERS ? letterGrade(score) : undefined,
    recommendRate: grades.filter((g) => g.recommend).length / count,
  };
}

/** Median days to reply, as a 1 to 5 score. */
export const replySpeedScore = (days: number) => (days <= 1 ? 5 : days <= 3 ? 4 : days <= 7 ? 3 : days <= 14 ? 2 : 1);

export type ContactGrade = ReturnType<typeof responseStats> & {
  graders: number;
  responsiveness?: number;
  speed?: number;
  score?: number;
  letter?: string;
};

/**
 * How worthwhile it is to reach out to a contact, from the outreach log alone,
 * so every grade is tied to a real message: response rate, reply speed and
 * helpfulness, each on 1 to 5, averaged over whichever ones have data.
 */
export function contactGrade(items: Outreach[]): ContactGrade {
  const stats = responseStats(items);
  const graders = new Set(items.map((o) => o.memberId)).size;
  if (!stats.total) return { ...stats, graders };
  const responsiveness = 1 + 4 * stats.rate;
  const speed = stats.medianDays != null ? replySpeedScore(stats.medianDays) : undefined;
  const parts = [responsiveness, speed, stats.avgHelpfulness].filter((x): x is number => x != null);
  const score = mean(parts);
  return { ...stats, graders, responsiveness, speed, score, letter: graders >= MIN_GRADERS ? letterGrade(score) : undefined };
}

/* ---------------------------------------------------------------- forum */

/** Latest moment anyone posted in a thread. */
export function threadActivity(post: ForumPost, replies: ForumReply[]) {
  return replies.reduce((latest, r) => (r.postId === post.id && r.createdAt > latest ? r.createdAt : latest), post.createdAt);
}

export function timeAgo(iso: string, now = new Date()) {
  const s = Math.max(0, (now.getTime() - toDate(iso).getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return fmtDate(iso);
}

/** One line under a member's name: role and school, or alumni class. */
export function memberLine(m: Member, now = new Date()) {
  return isAlum(m, now) ? `Alum, class of ${m.gradYear}` : `${m.execTitle ?? m.role}, ${m.school} '${String(m.gradYear).slice(2)}`;
}

export type Byline = { name: string; member?: Member; note?: string };

/**
 * What a viewer sees as the author of something that may be anonymous. Other
 * members see "Anonymous member"; the author and exec still see the name, so a
 * grade is candid without being unaccountable.
 */
export function byline(authorId: string, anonymous: boolean | undefined, viewer: Member, members: Member[]): Byline {
  const author = members.find((m) => m.id === authorId);
  const name = author ? fullName(author) : "Former member";
  if (!anonymous) return { name, member: author };
  if (authorId === viewer.id) return { name: "You", member: author, note: "Anonymous to other members" };
  if (isExec(viewer)) return { name: "Anonymous member", note: `${name}, visible to exec only` };
  return { name: "Anonymous member" };
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

/** Every company named anywhere members record recruiting: applications, reports, contacts, grades and forum threads. */
export function companyNames(data: Pick<PortalData, "applications" | "reports" | "contacts" | "grades" | "posts">) {
  const names = new Set<string>();
  for (const x of [...data.applications, ...data.reports, ...data.contacts, ...data.grades]) names.add(x.company.trim());
  for (const p of data.posts) if (p.company) names.add(p.company.trim());
  names.delete("");
  return [...names];
}

/** Finds the canonical spelling of a firm members typed ("bain & company" -> "Bain & Company"). */
export function matchCompany(data: Parameters<typeof companyNames>[0], typed: string) {
  const t = typed.trim();
  return companyNames(data).find((n) => companySlug(n) === companySlug(t)) ?? t;
}
