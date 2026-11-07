import type { SupabaseClient } from "@supabase/supabase-js";
import { companySlug } from "../logic";
import type { CaseStats, FirmAppStats, PortalData, Settings } from "../types";
import * as R from "./rows";

/** Until exec sets this year's semester dates in Recurring tasks. */
export function defaultCalendar(now = new Date()): Settings["calendar"] {
  const y = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return { year: y, fall: { start: `${y}-08-31`, weeks: 15 }, spring: { start: `${y + 1}-01-19`, weeks: 15 } };
}

export function emptyData(): PortalData {
  return {
    members: [],
    roleChanges: [],
    taskTemplates: [],
    taskDone: {},
    accounts: {},
    invites: [],
    applications: [],
    reports: [],
    questions: [],
    appNotes: [],
    appStats: {},
    comments: [],
    contacts: [],
    outreach: [],
    grades: [],
    firms: [],
    jobs: [],
    posts: [],
    replies: [],
    projects: [],
    projectTeam: [],
    projectTasks: [],
    projectTaskDone: {},
    casebooks: [],
    cases: [],
    caseReviews: [],
    caseStats: {},
    lessons: [],
    templates: [],
    settings: { calendar: defaultCalendar() },
  };
}

const PAGE = 1000;

/** Columns that order each table's pages; tables not listed have an id. */
const ORDER: Record<string, string[]> = {
  member_private: ["member_id"],
  task_completions: ["template_id", "term", "member_id"],
  application_notes_visible: ["company", "cycle", "notes", "member_id"],
  company_application_stats: ["company_key"],
  outreach_private_notes: ["outreach_id"],
  forum_votes: ["member_id", "post_id", "reply_id"],
  settings: ["key"],
  invites: ["email"],
  firms: ["id"],
  project_members: ["project_id", "member_id"],
  project_task_done: ["task_id", "member_id"],
  case_reviews: ["case_id", "member_id"],
  case_stats: ["case_id"],
};

/** Everything the signed-in member may see, in one round of parallel queries. */
export async function loadAll(sb: SupabaseClient): Promise<PortalData> {
  // Supabase returns at most 1,000 rows a request (its "max rows" setting). Each
  // table is read in pages, in a fixed order so no row is skipped or repeated,
  // until the count the database reports has arrived.
  const q = async (table: string) => {
    const order = ORDER[table] ?? ["id"];
    const rows: R.Row[] = [];
    for (;;) {
      let req = sb.from(table).select("*", { count: "exact" });
      for (const col of order) req = req.order(col, { ascending: true, nullsFirst: true });
      const { data, error, count } = await req.range(rows.length, rows.length + PAGE - 1);
      if (error) throw loadError(table, error);
      rows.push(...((data ?? []) as R.Row[]));
      if (!data?.length || count == null || rows.length >= count) return rows;
    }
  };
  const loadError = (table: string, error: { code?: string; message: string }) => {
    // A table or view the code expects isn't there: the database is behind the code.
    const missing = error.code === "PGRST205" || error.code === "42P01" || /could not find the table|does not exist/i.test(error.message);
    return new Error(
      missing
        ? `The database is missing an update (no "${table}"). In Supabase's SQL editor, run the newest file in supabase/migrations/, then reload this page.`
        : `Couldn't load ${table}: ${error.message}`,
    );
  };
  const [
    members,
    privateRows,
    roleChanges,
    taskTemplates,
    completions,
    ownApps,
    sharedApps,
    notes,
    stats,
    reports,
    questions,
    comments,
    contacts,
    outreach,
    privateNotes,
    grades,
    firms,
    jobs,
    posts,
    replies,
    votes,
    projects,
    lessons,
    templates,
    settings,
    invites,
    team,
    projectTasks,
    projectTaskDone,
    casebooks,
    cases,
    caseReviews,
    caseStatRows,
  ] = await Promise.all([
    q("members"),
    q("member_private"),
    q("role_changes"),
    q("task_templates"),
    q("task_completions"),
    q("applications"),
    q("applications_visible"),
    q("application_notes_visible"),
    q("company_application_stats"),
    q("interview_reports_visible"),
    q("interview_questions"),
    q("comments"),
    q("contacts"),
    q("outreach_visible"),
    q("outreach_private_notes"),
    q("firm_grades_visible"),
    q("firms"),
    q("jobs"),
    q("forum_posts"),
    q("forum_replies"),
    q("forum_votes"),
    q("projects"),
    q("lessons"),
    q("templates"),
    q("settings"),
    q("invites"),
    q("project_members"),
    q("project_tasks"),
    q("project_task_done"),
    q("casebooks"),
    q("cases"),
    q("case_reviews"),
    q("case_stats"),
  ]);

  const phone = new Map(privateRows.map((r) => [r.member_id as string, String(r.phone ?? "")]));
  const own = ownApps.map(R.ownApplicationFrom);
  const ownIds = new Set(own.map((a) => a.id));
  const notesById = new Map(privateNotes.map((r) => [r.outreach_id as string, String(r.notes ?? "")]));
  const vs = votes as R.Vote[];

  const appStats: Record<string, FirmAppStats> = {};
  for (const r of stats) {
    const k = companySlug(String(r.company ?? "").trim());
    const prev = appStats[k];
    const ratings = Number(r.effort_ratings) || 0;
    const avg = r.avg_effort == null ? undefined : Number(r.avg_effort);
    appStats[k] = prev
      ? {
          applicants: prev.applicants + Number(r.applicants),
          offers: prev.offers + Number(r.offers),
          effortRatings: prev.effortRatings + ratings,
          avgEffort:
            avg == null ? prev.avgEffort : prev.avgEffort == null ? avg : (prev.avgEffort * prev.effortRatings + avg * ratings) / (prev.effortRatings + ratings || 1),
        }
      : { applicants: Number(r.applicants), offers: Number(r.offers), effortRatings: ratings, avgEffort: avg };
  }

  const calendar = settings.find((r) => r.key === "calendar")?.value as Settings["calendar"] | undefined;

  return {
    members: members.map((r) => R.memberFrom(r, phone.get(r.id))),
    roleChanges: roleChanges.map(R.roleChangeFrom),
    taskTemplates: taskTemplates.map(R.templateTaskFrom),
    taskDone: Object.fromEntries(completions.map((r) => [R.completionKey(r), String(r.completed_at)])),
    // Who has finished setting up their account; Members and roles shows it.
    accounts: Object.fromEntries(members.filter((r) => r.setup_completed_at).map((r) => [r.id as string, String(r.setup_completed_at)])),
    invites: invites.map((r) => ({ email: String(r.email), role: r.role, addedBy: r.added_by ?? undefined, createdAt: String(r.created_at) })),
    applications: [...own, ...sharedApps.filter((r) => !ownIds.has(r.id)).map(R.sharedApplicationFrom)],
    reports: reports.map(R.reportFrom),
    questions: questions.map(R.questionFrom),
    appNotes: notes.map(R.appNoteFrom),
    appStats,
    comments: comments.map(R.commentFrom),
    contacts: contacts.map(R.contactFrom),
    outreach: outreach.map((r) => R.outreachFrom(r, notesById.get(r.id))),
    grades: grades.map(R.gradeFrom),
    firms: firms.map(R.firmFrom),
    jobs: jobs.map(R.jobFrom),
    posts: posts.map((r) => R.postFrom(r, vs)),
    replies: replies.map((r) => R.replyFrom(r, vs)),
    projects: projects.map(R.projectFrom),
    projectTeam: team.map((r) => ({ projectId: String(r.project_id), memberId: String(r.member_id) })),
    projectTasks: projectTasks.map(R.projectTaskFrom),
    projectTaskDone: Object.fromEntries(projectTaskDone.map((r) => [`${r.task_id}:${r.member_id}`, String(r.done_at)])),
    casebooks: casebooks.map(R.casebookFrom),
    cases: cases.map(R.caseFrom),
    caseReviews: caseReviews.map(R.caseReviewFrom),
    caseStats: Object.fromEntries(caseStatRows.map((r): [string, CaseStats] => [String(r.case_id), R.caseStatsFrom(r)])),
    lessons: lessons.map(R.lessonFrom),
    templates: templates.map(R.docTemplateFrom),
    settings: { calendar: calendar ?? defaultCalendar() },
  };
}
