/*
  Two-way mapping between the portal's data shapes (src/portal/types.ts) and
  the database's rows (supabase/schema.sql). Reads take rows from the tables
  and from the *_visible views, where another member's name is blank on an
  anonymous row; a blank member becomes "" and reads as "Anonymous member".
*/

import type {
  AppNote,
  Application,
  Comment,
  Contact,
  Firm,
  FirmGrade,
  ForumPost,
  ForumReply,
  InterviewQuestion,
  InterviewReport,
  Job,
  Lesson,
  Member,
  Outreach,
  Project,
  ProjectTask,
  RoleChange,
  TaskTemplate,
  Template,
} from "../types";

// Rows come back from PostgREST as JSON; each mapper reads the columns it needs.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

const str = (v: unknown) => (v == null ? "" : String(v));
const opt = <T,>(v: T | null | undefined) => (v == null ? undefined : v);
/** Empty text is stored as null, so "no email" is one thing, not two. */
const blank = (v?: string) => (v && v.trim() ? v.trim() : null);

/** A timestamp as the local calendar date, YYYY-MM-DD. */
export function localDate(ts: string) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts.slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ---------------------------------------------------------------- members */

export const memberFrom = (r: Row, phone = ""): Member => ({
  id: r.id,
  firstName: str(r.first_name),
  lastName: str(r.last_name),
  personalEmail: str(r.personal_email),
  schoolEmail: str(r.school_email),
  phone,
  school: r.school,
  gradYear: r.grad_year,
  practice: r.practice,
  role: r.role,
  execTitle: opt(r.exec_title),
  joinedTerm: r.joined_term,
  linkedin: opt(r.linkedin),
  photo: opt(r.photo_url),
  showOnWebsite: !!r.show_on_website,
});

export const memberTo = (m: Member): Row => ({
  id: m.id,
  first_name: m.firstName.trim(),
  last_name: m.lastName.trim(),
  personal_email: blank(m.personalEmail),
  school_email: blank(m.schoolEmail),
  school: m.school,
  grad_year: m.gradYear,
  practice: m.practice,
  role: m.role,
  exec_title: m.execTitle ?? null,
  joined_term: m.joinedTerm,
  linkedin: blank(m.linkedin),
  photo_url: m.photo ?? null,
  show_on_website: m.showOnWebsite,
});

export const roleChangeFrom = (r: Row): RoleChange => ({ id: r.id, memberId: r.member_id, from: r.from_role, to: r.to_role, term: r.term, approvedBy: str(r.approved_by) });
export const roleChangeTo = (c: RoleChange): Row => ({ id: c.id, member_id: c.memberId, from_role: c.from, to_role: c.to, term: c.term, approved_by: c.approvedBy || null });

/* ---------------------------------------------------------------- tasks */

export const templateTaskFrom = (r: Row): TaskTemplate => ({
  id: r.id,
  title: str(r.title),
  body: str(r.body),
  audience: r.audience_kind === "role" ? { kind: "role", role: r.audience_role } : r.audience_kind === "title" ? { kind: "title", title: r.audience_title } : { kind: "all" },
  semester: r.semester,
  when: { anchor: r.when_anchor, n: r.when_weeks },
  createdBy: str(r.created_by),
});

export const templateTaskTo = (t: TaskTemplate): Row => ({
  id: t.id,
  title: t.title,
  body: t.body,
  audience_kind: t.audience.kind,
  audience_role: t.audience.kind === "role" ? t.audience.role : null,
  audience_title: t.audience.kind === "title" ? t.audience.title : null,
  semester: t.semester,
  when_anchor: t.when.anchor,
  when_weeks: t.when.n,
  created_by: t.createdBy || null,
});

/** taskDone keys are `${templateId}:${term}:${memberId}`; UUIDs have no colons, so splitting is safe. */
export const completionKey = (r: Row) => `${r.template_id}:${r.term}:${r.member_id}`;
export function completionRow(key: string, at?: string): Row {
  const [template_id, term, member_id] = key.split(":");
  return { template_id, term, member_id, ...(at ? { completed_at: at } : {}) };
}

/* ---------------------------------------------------------------- recruiting */

/** Your own applications, from the table: everything, including private notes. */
export const ownApplicationFrom = (r: Row): Application => ({
  id: r.id,
  memberId: r.member_id,
  company: str(r.company),
  position: str(r.position),
  cycle: str(r.cycle),
  stage: r.stage,
  furthest: r.furthest,
  anonymous: !!r.anonymous,
  effort: opt(r.effort),
  fit: opt(r.fit),
  updatedAt: localDate(r.updated_at),
  notes: str(r.notes),
  notesAnonymous: !!r.notes_anonymous,
  privateNotes: r.private_notes ? String(r.private_notes) : undefined,
});

/** Someone else's application, from applications_visible: no notes, effort or fit. */
export const sharedApplicationFrom = (r: Row): Application => ({
  id: r.id,
  memberId: str(r.member_id),
  company: str(r.company),
  position: str(r.position),
  cycle: str(r.cycle),
  stage: r.stage,
  furthest: r.furthest,
  anonymous: !!r.anonymous,
  updatedAt: localDate(r.updated_at),
  notes: "",
});

export const applicationTo = (a: Application): Row => ({
  id: a.id,
  member_id: a.memberId,
  company: a.company.trim(),
  position: a.position.trim(),
  cycle: a.cycle.trim(),
  stage: a.stage,
  furthest: a.furthest,
  anonymous: a.anonymous,
  effort: a.effort ?? null,
  fit: a.fit ?? null,
  notes: a.notes,
  notes_anonymous: !!a.notesAnonymous,
  private_notes: a.privateNotes ?? "",
});

export const appNoteFrom = (r: Row, i: number): AppNote => ({
  id: `note-${i}`,
  company: str(r.company),
  cycle: str(r.cycle),
  notes: str(r.notes),
  memberId: str(r.member_id),
  anonymous: !!r.anonymous,
});

export const reportFrom = (r: Row): InterviewReport => ({
  id: r.id,
  company: str(r.company),
  memberId: str(r.member_id),
  year: r.year,
  position: str(r.position),
  round: str(r.round),
  format: str(r.format),
  overview: str(r.overview),
  tips: str(r.tips),
  difficulty: r.difficulty ?? 3,
  outcome: r.outcome ?? "Unknown",
  anonymous: r.anonymous || undefined,
});

export const reportTo = (r: InterviewReport): Row => ({
  id: r.id,
  company: r.company.trim(),
  year: r.year,
  position: r.position,
  round: r.round,
  format: r.format,
  overview: r.overview,
  tips: r.tips,
  difficulty: r.difficulty,
  outcome: r.outcome,
  anonymous: !!r.anonymous,
});

export const questionFrom = (r: Row): InterviewQuestion => ({ id: r.id, company: str(r.company), round: r.round, question: str(r.question), memberId: opt(r.member_id) });

export const gradeFrom = (r: Row): FirmGrade => ({
  id: r.id,
  company: str(r.company),
  memberId: str(r.member_id),
  cycle: str(r.cycle),
  stageReached: r.stage_reached,
  outcome: r.outcome,
  scores: {
    communication: r.communication,
    speed: r.speed,
    ...(r.fairness != null ? { fairness: r.fairness } : {}),
    ...(r.interviewers != null ? { interviewers: r.interviewers } : {}),
  },
  recommend: !!r.recommend,
  review: str(r.review),
  anonymous: !!r.anonymous,
  createdAt: str(r.created_at),
  tracked: r.tracked == null ? undefined : !!r.tracked,
});

export const gradeTo = (g: FirmGrade): Row => ({
  id: g.id,
  company: g.company.trim(),
  member_id: g.memberId,
  cycle: g.cycle.trim(),
  stage_reached: g.stageReached,
  outcome: g.outcome,
  communication: g.scores.communication ?? null,
  speed: g.scores.speed ?? null,
  fairness: g.scores.fairness ?? null,
  interviewers: g.scores.interviewers ?? null,
  recommend: g.recommend,
  review: g.review,
  anonymous: g.anonymous,
  created_at: g.createdAt || undefined,
});

/* ---------------------------------------------------------------- network */

export const contactFrom = (r: Row): Contact => ({
  id: r.id,
  name: str(r.name),
  company: str(r.company),
  title: str(r.title),
  email: str(r.email),
  linkedin: str(r.linkedin),
  isAlum: !!r.is_alum,
  alumClass: opt(r.alum_class),
  isSchoolAlum: r.is_school_alum || undefined,
  alumSchool: opt(r.alum_school),
  schoolClass: opt(r.school_class),
  preferences: str(r.preferences),
  addedBy: str(r.added_by),
  history: Array.isArray(r.history) && r.history.length ? r.history : undefined,
  updatedAt: opt(r.updated_at),
  updatedBy: opt(r.updated_by),
});

export const contactTo = (c: Contact): Row => ({
  id: c.id,
  name: c.name.trim(),
  company: c.company,
  title: c.title,
  email: blank(c.email),
  linkedin: blank(c.linkedin),
  is_alum: c.isAlum,
  alum_class: c.alumClass ?? null,
  is_school_alum: !!c.isSchoolAlum,
  alum_school: c.isSchoolAlum ? (c.alumSchool ?? null) : null,
  school_class: c.isSchoolAlum ? (c.schoolClass ?? null) : null,
  preferences: c.preferences,
  added_by: c.addedBy || null,
  history: c.history ?? [],
  updated_by: c.updatedBy ?? null,
  updated_at: c.updatedAt ?? null,
});

export const outreachFrom = (r: Row, privateNotes?: string): Outreach => ({
  id: r.id,
  contactId: r.contact_id,
  memberId: str(r.member_id),
  date: str(r.date),
  channel: r.channel,
  responded: !!r.responded,
  responseDays: opt(r.response_days),
  chatted: !!r.chatted,
  helpfulness: opt(r.helpfulness),
  referred: !!r.referred,
  notes: str(r.notes),
  privateNotes: privateNotes || undefined,
  anonymous: r.anonymous || undefined,
  followUps: Array.isArray(r.follow_ups) && r.follow_ups.length ? r.follow_ups : undefined,
  respondedOn: opt(r.responded_on),
  thanked: r.thanked || undefined,
});

export const outreachTo = (o: Outreach): Row => ({
  id: o.id,
  contact_id: o.contactId,
  member_id: o.memberId,
  date: o.date,
  channel: o.channel,
  responded: o.responded,
  response_days: o.responseDays ?? null,
  chatted: o.chatted,
  helpfulness: o.helpfulness ?? null,
  referred: o.referred,
  notes: o.notes,
  anonymous: !!o.anonymous,
  follow_ups: o.followUps ?? [],
  responded_on: o.respondedOn ?? null,
  thanked: !!o.thanked,
});

export const commentFrom = (r: Row): Comment => ({ id: r.id, subject: str(r.subject), memberId: str(r.member_id), body: str(r.body), createdAt: str(r.created_at) });
export const commentTo = (c: Comment): Row => ({ id: c.id, subject: c.subject, member_id: c.memberId, body: c.body, created_at: c.createdAt || undefined });

/* ---------------------------------------------------------------- firms and experience */

export const firmFrom = (r: Row): Firm => ({ name: str(r.name), type: r.type, updatedBy: opt(r.updated_by), updatedAt: opt(r.updated_at) });

export const jobFrom = (r: Row): Job => ({
  id: r.id,
  memberId: r.member_id,
  company: str(r.company),
  role: str(r.role),
  kind: r.kind,
  year: r.year,
  classAtTime: r.class_at_time,
  createdAt: str(r.created_at),
});
export const jobTo = (j: Job): Row => ({
  id: j.id,
  member_id: j.memberId,
  company: j.company.trim(),
  role: j.role.trim(),
  kind: j.kind,
  year: j.year,
  class_at_time: j.classAtTime,
  created_at: j.createdAt || undefined,
});

/* ---------------------------------------------------------------- forum */

export type Vote = { member_id: string; post_id: string | null; reply_id: string | null };

export const postFrom = (r: Row, votes: Vote[]): ForumPost => ({
  id: r.id,
  space: r.space,
  channel: r.channel,
  memberId: str(r.member_id),
  title: str(r.title),
  body: str(r.body),
  company: opt(r.company),
  pinned: r.pinned || undefined,
  createdAt: str(r.created_at),
  editedAt: opt(r.edited_at),
  upvotes: votes.filter((v) => v.post_id === r.id).map((v) => v.member_id),
});
export const postTo = (p: ForumPost): Row => ({
  id: p.id,
  space: p.space,
  channel: p.channel,
  member_id: p.memberId,
  title: p.title,
  body: p.body,
  company: p.company ?? null,
  pinned: !!p.pinned,
  created_at: p.createdAt || undefined,
  edited_at: p.editedAt ?? null,
});

export const replyFrom = (r: Row, votes: Vote[]): ForumReply => ({
  id: r.id,
  postId: r.post_id,
  memberId: str(r.member_id),
  body: str(r.body),
  createdAt: str(r.created_at),
  upvotes: votes.filter((v) => v.reply_id === r.id).map((v) => v.member_id),
});
export const replyTo = (r: ForumReply): Row => ({ id: r.id, post_id: r.postId, member_id: r.memberId, body: r.body, created_at: r.createdAt || undefined });

/* ---------------------------------------------------------------- projects */

export const projectFrom = (r: Row): Project => ({
  id: r.id,
  client: str(r.client),
  year: r.year,
  term: r.term,
  practice: r.practice,
  sector: str(r.sector),
  categories: r.categories ?? [],
  summary: str(r.summary),
  deliverables: Array.isArray(r.deliverables) ? r.deliverables : [],
  lead: str(r.lead),
});
export const projectTo = (p: Project): Row => ({
  id: p.id,
  client: p.client,
  year: p.year,
  term: p.term,
  practice: p.practice,
  sector: p.sector,
  categories: p.categories,
  summary: p.summary,
  deliverables: p.deliverables,
  lead: p.lead || null,
});

export const lessonFrom = (r: Row): Lesson => ({ id: r.id, projectId: r.project_id, memberId: str(r.member_id), body: str(r.body), tags: r.tags ?? [], createdAt: str(r.created_at) });
export const lessonTo = (l: Lesson): Row => ({ id: l.id, project_id: l.projectId, member_id: l.memberId || null, body: l.body, tags: l.tags, created_at: l.createdAt || undefined });

export const docTemplateFrom = (r: Row): Template => ({
  id: r.id,
  title: str(r.title),
  category: str(r.category),
  description: str(r.description),
  sourceProjectId: opt(r.source_project_id),
  url: str(r.url),
});
export const docTemplateTo = (t: Template): Row => ({
  id: t.id,
  title: t.title,
  category: t.category,
  description: t.description,
  source_project_id: t.sourceProjectId ?? null,
  url: t.url,
});

export const projectTaskFrom = (r: Row): ProjectTask => ({
  id: r.id,
  projectId: r.project_id,
  title: str(r.title),
  body: str(r.body),
  week: r.week,
  assigneeId: opt(r.assignee_id),
  createdBy: str(r.created_by),
  createdAt: str(r.created_at),
});
export const projectTaskTo = (t: ProjectTask): Row => ({
  id: t.id,
  project_id: t.projectId,
  title: t.title.trim(),
  body: t.body,
  week: t.week,
  assignee_id: t.assigneeId ?? null,
  created_by: t.createdBy || null,
  created_at: t.createdAt || undefined,
});
