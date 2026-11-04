/**
 * The automation rules, as pure functions so the same logic can run in the
 * browser preview and in a nightly database job.
 */

import {
  FIRM_DIMENSIONS,
  STAGES_REACHED,
  type Application,
  type Audience,
  type InterviewQuestion,
  type InterviewReport,
  type QuestionRound,
  type ClassLevel,
  type CompanyType,
  type Contact,
  type Firm,
  type Job,
  type JobKind,
  type FirmDimension,
  type FirmGrade,
  type ForumPost,
  type ForumReply,
  type Member,
  type Outreach,
  type PortalData,
  type Role,
  type RoleChange,
  type SemesterDates,
  type Stage,
  type StageReached,
  type TaskTemplate,
  type TaskWhen,
  type Term,
} from "./types";

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

/** Semesters an Associate Consultant serves before exec is asked to promote them. */
export const AC_SEMESTERS = 2;

/**
 * Proposed promotions for exec to approve. Nothing changes without approval.
 * The only automatic proposal: Associate Consultant to Consultant after two
 * completed semesters. Every other role change is exec's call.
 */
export function promotionSuggestions(members: Member[], now = new Date()): Promotion[] {
  const out: Promotion[] = [];
  for (const m of members) {
    if (isAlum(m, now) || m.role !== "Associate Consultant") continue;
    const sem = semestersCompleted(m.joinedTerm, now);
    if (sem >= AC_SEMESTERS) out.push({ member: m, to: "Consultant", reason: `${sem} semesters completed` });
  }
  return out;
}

/** Seniority for "highest role". Advisor sits outside the ladder. */
const ROLE_RANK: Record<Role, number> = { Advisor: 0, "Associate Consultant": 1, Consultant: 2, "Team Lead": 3, "Executive Board": 4 };

/**
 * The most senior role a member ever held, from their current role and role
 * history. Alumni are shown with this and it no longer changes.
 */
export function highestRole(m: Member, changes: RoleChange[]): Role {
  return [m.role, ...changes.filter((c) => c.memberId === m.id).flatMap((c) => [c.from, c.to])].reduce((best, r) => (ROLE_RANK[r] > ROLE_RANK[best] ? r : best));
}

/** Finds the member an email belongs to, school or personal, ignoring case and spaces. */
export function memberByEmail(members: Member[], email: string) {
  const e = email.trim().toLowerCase();
  if (!e.includes("@")) return undefined;
  return members.find((m) => m.schoolEmail.trim().toLowerCase() === e || m.personalEmail.trim().toLowerCase() === e);
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
  term: Term;
  semester: "Fall" | "Spring";
  due: Date;
  done?: string;
};

const DAY_MS = 86_400_000;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Monday of the week the semester starts in, so weeks line up even if classes begin midweek. */
export function weekOneMonday(sem: SemesterDates) {
  const start = toDate(sem.start);
  return addDays(start, -((start.getDay() + 6) % 7));
}

/** The Friday a task is due, from the semester's first day and length. */
export function taskDueDate(sem: SemesterDates, when: TaskWhen) {
  const week = when.anchor === "before" ? 1 - when.n : when.anchor === "week" ? when.n : sem.weeks - when.n;
  return addDays(weekOneMonday(sem), (week - 1) * 7 + 4);
}

/** Last day of the semester's final week (its Friday). */
export const semesterEnd = (sem: SemesterDates) => taskDueDate(sem, { anchor: "end", n: 0 });

export function whenLabel(when: TaskWhen) {
  const weeks = (n: number) => `${n} ${n === 1 ? "week" : "weeks"}`;
  if (when.anchor === "before") return `${weeks(when.n)} before classes start`;
  if (when.anchor === "week") return `Week ${when.n}`;
  return when.n === 0 ? "Last week" : `${weeks(when.n)} before the last week`;
}

/** The semesters a template runs in for the calendar's academic year. */
export function templateTerms(t: TaskTemplate, calendar: PortalData["settings"]["calendar"]) {
  const out: { semester: "Fall" | "Spring"; term: Term; dates: SemesterDates }[] = [];
  if (t.semester !== "Spring") out.push({ semester: "Fall", term: `F${calendar.year}`, dates: calendar.fall });
  if (t.semester !== "Fall") out.push({ semester: "Spring", term: `S${calendar.year + 1}`, dates: calendar.spring });
  return out;
}

/** This academic year's tasks for a member, dated from exec's semester calendar. */
export function tasksFor(member: Member, data: Pick<PortalData, "taskTemplates" | "taskDone" | "settings">) {
  const { calendar } = data.settings;
  return data.taskTemplates
    .filter((t) => matchesAudience(t.audience, member))
    .flatMap((t) =>
      templateTerms(t, calendar).map<TaskInstance>(({ semester, term, dates }) => {
        const key = `${t.id}:${term}:${member.id}`;
        return { key, template: t, term, semester, due: taskDueDate(dates, t.when), done: data.taskDone[key] };
      }),
    )
    .sort((a, b) => a.due.getTime() - b.due.getTime());
}

/* ---------------------------------------------------------------- outreach */

/** Days without a reply before the portal suggests a follow-up. */
export const FOLLOW_UP_DAYS = 7;
/** After this many follow-ups with no reply, it suggests moving on. */
export const MAX_FOLLOW_UPS = 2;

export const daysBetween = (from: Date | string, to: Date | string) => Math.floor((toDate(to).getTime() - toDate(from).getTime()) / DAY_MS);

export type OutreachStage = "Reached out" | "Followed up" | "Replied" | "Chatted";

export function outreachStage(o: Outreach): OutreachStage {
  if (o.chatted) return "Chatted";
  if (o.responded) return "Replied";
  return o.followUps?.length ? "Followed up" : "Reached out";
}

export type NextStep = {
  kind: "follow-up" | "schedule" | "thank" | "rate" | "move-on" | "wait" | "done";
  label: string;
  /** Something the member should do now. */
  due: boolean;
};

/** What a member should do next with one outreach, from how it stands today. */
export function nextStep(o: Outreach, now = new Date()): NextStep {
  if (o.chatted) {
    if (!o.thanked) return { kind: "thank", label: "Send a thank-you note", due: true };
    if (o.helpfulness == null) return { kind: "rate", label: "Rate how helpful the chat was", due: true };
    return { kind: "done", label: "Done", due: false };
  }
  if (o.responded) return { kind: "schedule", label: "Schedule the chat", due: true };
  const last = [o.date, ...(o.followUps ?? [])].sort().at(-1)!;
  const waited = daysBetween(last, now);
  const sent = o.followUps?.length ?? 0;
  if (waited < FOLLOW_UP_DAYS) {
    const left = FOLLOW_UP_DAYS - waited;
    return { kind: "wait", label: `Follow up in ${left} ${left === 1 ? "day" : "days"} if no reply`, due: false };
  }
  if (sent >= MAX_FOLLOW_UPS) return { kind: "move-on", label: `No reply after ${sent + 1} messages. Try someone else.`, due: false };
  return { kind: "follow-up", label: sent ? "Follow up again" : "Follow up", due: true };
}

/** One member's outreach that needs action now, oldest first. */
export function followUpsDue(memberId: string, outreach: Outreach[], now = new Date()) {
  return outreach
    .filter((o) => o.memberId === memberId)
    .map((o) => ({ outreach: o, step: nextStep(o, now) }))
    .filter((x) => x.step.due)
    .sort((a, b) => a.outreach.date.localeCompare(b.outreach.date));
}

/** Marks a reply, counting days from the first message. */
export const withReply = (o: Outreach, on: string): Outreach => ({ ...o, responded: true, respondedOn: on, responseDays: Math.max(0, daysBetween(o.date, on)) });

/** "https://www.linkedin.com/in/jane-doe/?x=1" -> "linkedin.com/in/jane-doe" */
export const normalizeLinkedIn = (url: string) =>
  url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "");

/** An existing contact for this person: same LinkedIn profile, or same name at the same firm. */
export function findContact(contacts: Contact[], who: { name: string; linkedin: string; company: string }) {
  const li = normalizeLinkedIn(who.linkedin);
  const name = who.name.trim().toLowerCase();
  const firm = companySlug(who.company.trim());
  return (
    (li ? contacts.find((c) => c.linkedin && normalizeLinkedIn(c.linkedin) === li) : undefined) ??
    contacts.find((c) => c.name.trim().toLowerCase() === name && companySlug(c.company.trim()) === firm)
  );
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
export function companyNames(data: Pick<PortalData, "applications" | "reports" | "contacts" | "grades" | "posts" | "jobs" | "firms">) {
  const names = new Set<string>();
  for (const x of [...data.applications, ...data.reports, ...data.contacts, ...data.grades, ...data.jobs]) names.add(x.company.trim());
  for (const f of data.firms) names.add(f.name.trim());
  for (const p of data.posts) if (p.company) names.add(p.company.trim());
  names.delete("");
  return [...names];
}

/* ---------------------------------------------------------------- applications */

/** Stages in order of progress. Rejected and Withdrew are outcomes, not progress. */
export const PROGRESS_STAGES: Stage[] = ["Researching", "Applied", "Online Assessment", "First Round", "Superday / Final", "Offer"];
export const stageRank = (s: Stage) => PROGRESS_STAGES.indexOf(s);

/** Applications stay private until the member reaches this stage. */
export const SHARED_FROM: Stage = "First Round";
export const isShared = (a: Pick<Application, "furthest">) => stageRank(a.furthest) >= stageRank(SHARED_FROM);

/**
 * Moves an application to a stage. Rejected and Withdrew keep how far it got;
 * any other stage becomes how far it got, since nobody moves backwards in a
 * process and a lower stage is a correction. Matches the database trigger.
 */
export function withStage(a: Application, stage: Stage, on: string): Application {
  const furthest = stageRank(stage) >= 0 ? stage : a.furthest;
  return { ...a, stage, furthest, updatedAt: on };
}

const REACHED: Partial<Record<Stage, string>> = { "Online Assessment": "Online assessment", "First Round": "First round", "Superday / Final": "Final round" };
/** How far an application got, in words: "Online assessment", "First round", "Final round", "Offer". */
export const reachedLabel = (s: Stage) => REACHED[s] ?? s;

export type AppOutcome = "Offer" | "Rejected" | "Withdrew" | "In process";
export const appOutcome = (a: Pick<Application, "stage">): AppOutcome =>
  a.stage === "Offer" || a.stage === "Rejected" || a.stage === "Withdrew" ? a.stage : "In process";

/** The recruiting year: the first four-digit year in the cycle, else when it was last updated. */
export const appYear = (a: Pick<Application, "cycle" | "updatedAt">) => Number(a.cycle.match(/\d{4}/)?.[0]) || Number(a.updatedAt.slice(0, 4));

/** What a viewer may see: their own, everything for exec, and other members' once shared. */
export const visibleApplications = (apps: Application[], viewer: Member) => apps.filter((a) => a.memberId === viewer.id || isExec(viewer) || isShared(a));

export type AppPrompt = { kind: "rate" | "interview" | "grade" | "experience"; label: string };

/**
 * The one thing worth logging next for an application, in the order it comes
 * up: rate the application once you've applied, log the interview once you
 * reach a first round, grade the process once there's an outcome, and add an
 * offer to your experience.
 */
export function applicationPrompt(a: Application, data: Pick<PortalData, "reports" | "grades" | "jobs">): AppPrompt | undefined {
  const firm = companySlug(a.company.trim());
  const at = (c: string) => companySlug(c.trim()) === firm;
  if (stageRank(a.furthest) >= stageRank("Applied") && (a.effort == null || a.fit == null)) return { kind: "rate", label: "Rate the application" };
  // Interviews for a cycle happen in its year or the year before (fall 2026 for a summer 2027 internship).
  const y = appYear(a);
  if (stageRank(a.furthest) >= stageRank("First Round") && !data.reports.some((r) => r.memberId === a.memberId && at(r.company) && r.year >= y - 1 && r.year <= y)) {
    return { kind: "interview", label: "Log the interview" };
  }
  const decided = a.stage === "Offer" || a.stage === "Rejected";
  if (decided && stageRank(a.furthest) >= stageRank("Online Assessment") && !data.grades.some((g) => g.memberId === a.memberId && at(g.company) && g.cycle.trim().toLowerCase() === a.cycle.trim().toLowerCase())) {
    return { kind: "grade", label: "Grade the process" };
  }
  if (a.stage === "Offer" && !data.jobs.some((j) => j.memberId === a.memberId && at(j.company))) return { kind: "experience", label: "Add to my experience" };
  return undefined;
}

/* ---------------------------------------------------------------- question bank */

/** The broad round a report's free-text round falls in. */
export function questionRound(round: string): QuestionRound {
  if (/assess|\boa\b|hirevue|test|online|video/i.test(round)) return "Online assessment";
  if (/final|super|partner|last/i.test(round)) return "Final round";
  if (/first|1st|phone|screen|initial|second|2nd/i.test(round)) return "First round";
  return "Other";
}

/**
 * Save an interview: the notes under the member (named or anonymous), and the
 * questions straight into the firm's question bank. Anonymous questions keep
 * no author at all; named ones keep only the member.
 */
export function logInterview(
  d: PortalData,
  report: InterviewReport,
  questions: { round: QuestionRound; question: string }[],
  questionsAnonymous = true,
): PortalData {
  const company = report.company.trim();
  const added: InterviewQuestion[] = questions.map((q) => ({ id: uid(), company, ...q, ...(questionsAnonymous ? {} : { memberId: report.memberId }) }));
  return { ...d, reports: [report, ...d.reports], questions: [...d.questions, ...added] };
}

/**
 * Who an application's notes show as. The name appears once the application
 * itself is shared (a first round), unless the member posted the notes
 * anonymously; before that they're anonymous like the application.
 */
export function noteByline(a: Application, viewer: Member, members: Member[]): Byline {
  const anonymous = !!a.notesAnonymous || !isShared(a);
  const by = byline(a.memberId, anonymous, viewer, members);
  if (a.memberId === viewer.id && anonymous && !a.notesAnonymous) return { ...by, note: "Your name shows once you reach a first round" };
  return by;
}

/** Every member's notes on their applications at a firm, newest cycle first. */
export const firmNotes = (apps: Application[], company: string) =>
  apps
    .filter((a) => companySlug(a.company.trim()) === companySlug(company.trim()) && a.notes.trim())
    .sort((a, b) => appYear(b) - appYear(a));

/* ---------------------------------------------------------------- similar members */

/** Only applications shared with a name feed suggestions; anonymous and early-stage ones never do. */
const suggestable = (a: Application) => isShared(a) && !a.anonymous;

const jaccard = <T,>(a: Set<T>, b: Set<T>) => {
  const union = new Set([...a, ...b]).size;
  if (!union) return 0;
  return [...a].filter((x) => b.has(x)).length / union;
};

export type SimilarMember = { member: Member; score: number; sharedFirms: string[]; sharedTypes: CompanyType[]; apps: Application[] };

/**
 * Members whose applications look most like yours: the same firms (60%) and
 * the same kinds of firm they're most interested in (40%; types rated a fit
 * of 4 or 5, or every type applied to if they haven't rated fit).
 */
export function similarMembers(data: Pick<PortalData, "applications" | "members" | "firms">, me: Member, limit = 5): SimilarMember[] {
  const key = (c: string) => companySlug(c.trim());
  const interests = (apps: Application[]) => {
    const rated = apps.filter((a) => a.fit != null);
    const from = rated.length ? rated.filter((a) => (a.fit ?? 0) >= 4) : apps;
    return new Set(from.map((a) => firmType(data.firms, a.company)).filter((t): t is CompanyType => !!t));
  };
  const mine = data.applications.filter((a) => a.memberId === me.id);
  const myFirms = new Set(mine.map((a) => key(a.company)));
  const myTypes = interests(mine);
  const byMember = new Map<string, Application[]>();
  for (const a of data.applications) {
    if (a.memberId === me.id || !suggestable(a)) continue;
    byMember.set(a.memberId, [...(byMember.get(a.memberId) ?? []), a]);
  }
  const out: SimilarMember[] = [];
  for (const [id, apps] of byMember) {
    const member = data.members.find((m) => m.id === id);
    if (!member) continue;
    const firms = new Set(apps.map((a) => key(a.company)));
    const types = interests(apps);
    const score = 0.6 * jaccard(myFirms, firms) + 0.4 * jaccard(myTypes, types);
    if (score <= 0) continue;
    const sharedFirms = [...new Set(apps.filter((a) => myFirms.has(key(a.company))).map((a) => a.company.trim()))];
    out.push({ member, score, sharedFirms, sharedTypes: [...types].filter((t) => myTypes.has(t)), apps });
  }
  return out.sort((a, b) => b.score - a.score || a.member.lastName.localeCompare(b.member.lastName)).slice(0, limit);
}

export type SuggestedFirm = { company: string; score: number; members: Member[]; finals: number; offers: number; offerYears: number[] };

/** Firms similar members applied to that you haven't, weighted by how alike you are and how far they got. */
export function suggestedFirms(data: Pick<PortalData, "applications">, me: Member, similar: SimilarMember[], limit = 8): SuggestedFirm[] {
  const key = (c: string) => companySlug(c.trim());
  const myFirms = new Set(data.applications.filter((a) => a.memberId === me.id).map((a) => key(a.company)));
  const byFirm = new Map<string, SuggestedFirm>();
  for (const s of similar) {
    for (const a of s.apps) {
      const k = key(a.company);
      if (myFirms.has(k)) continue;
      const f = byFirm.get(k) ?? { company: a.company.trim(), score: 0, members: [], finals: 0, offers: 0, offerYears: [] };
      const final = stageRank(a.furthest) >= stageRank("Superday / Final");
      const offer = a.stage === "Offer";
      // Every shared application reached a first round; a final counts more, an offer most.
      f.score += s.score * (1 + (final ? 1 : 0) + (offer ? 2 : 0));
      if (!f.members.includes(s.member)) f.members.push(s.member);
      if (final) f.finals++;
      if (offer) {
        f.offers++;
        f.offerYears.push(appYear(a));
      }
      byFirm.set(k, f);
    }
  }
  return [...byFirm.values()].sort((a, b) => b.score - a.score || a.company.localeCompare(b.company)).slice(0, limit);
}

/* ---------------------------------------------------------------- firms and jobs */

/** A firm's type, if a member has set one. */
export function firmType(firms: Firm[], company: string): CompanyType | undefined {
  const slug = companySlug(company.trim());
  return firms.find((f) => companySlug(f.name) === slug)?.type;
}

/**
 * Year in school when someone held a job, from their graduation year. A
 * summer internship counts the year just finished (the summer of 2026 for a
 * 2028 graduate is their sophomore summer). Members can correct it.
 */
export function defaultClassAtTime(gradYear: number, kind: JobKind, year: number): ClassLevel {
  if (kind === "Full-time") return year <= gradYear ? "Senior" : "Alum";
  // Years from this one to graduation: 3 = freshman, 2 = sophomore, 1 = junior, 0 = senior.
  const left = gradYear - year;
  const levels: ClassLevel[] = ["Senior", "Junior", "Sophomore", "Freshman"];
  // A summer in the graduation year comes after commencement; part-time work that spring is senior year.
  if (left < 0 || (kind === "Summer internship" && left === 0)) return "Alum";
  return levels[Math.min(left, 3)];
}

/** "Sophomore summer", "Full-time after graduating", "Part-time as a junior". */
export function classAtTimeLabel(job: Pick<Job, "kind" | "classAtTime">) {
  const c = job.classAtTime;
  if (job.kind === "Summer internship") return c === "Alum" ? "Summer after graduating" : `${c} summer`;
  if (job.kind === "Full-time") return c === "Senior" ? "Full-time out of college" : c === "Alum" ? "Full-time after graduating" : `Full-time as a ${c.toLowerCase()}`;
  return c === "Alum" ? "Part-time after graduating" : `Part-time as a ${c.toLowerCase()}`;
}

/** Jobs members held at a firm, newest first. */
export const jobsAt = (jobs: Job[], company: string) =>
  jobs.filter((j) => companySlug(j.company.trim()) === companySlug(company.trim())).sort((a, b) => b.year - a.year || a.classAtTime.localeCompare(b.classAtTime));

/** Finds the canonical spelling of a firm members typed ("bain & company" -> "Bain & Company"). */
export function matchCompany(data: Parameters<typeof companyNames>[0], typed: string) {
  const t = typed.trim();
  return companyNames(data).find((n) => companySlug(n) === companySlug(t)) ?? t;
}

/* ---- networking (fork) ---- */

/** Today as a local calendar date, YYYY-MM-DD (toISOString would give UTC, a day off in the evening). */
export function localToday(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Latest date anything happened on an outreach: first message, a follow-up or the reply. */
export const lastActivity = (o: Outreach) => [o.date, ...(o.followUps ?? []), o.respondedOn ?? ""].sort().at(-1)!;

/**
 * A contact after they move to a new firm or title. The old company and title
 * go to the top of their history, so outreach grades stay with the person.
 */
export function movedContact(c: Contact, next: { company: string; title: string }, by: string, on = localToday()): Contact {
  const company = next.company.trim();
  const title = next.title.trim();
  if (company === c.company.trim() && title === c.title.trim()) return c;
  const history = c.company.trim() || c.title.trim() ? [{ company: c.company, title: c.title, until: on }, ...(c.history ?? [])] : c.history;
  return { ...c, company, title, history, updatedAt: new Date().toISOString(), updatedBy: by };
}

/** "linkedin.com/in/jane" -> "https://linkedin.com/in/jane", so saved links open. */
export const withProtocol = (url: string) => (/^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`);

/** Whether a pasted link points at a LinkedIn profile. */
export const isLinkedInUrl = (url: string) => /^linkedin\.com\/(in|pub)\/[^/]+/.test(normalizeLinkedIn(url));
