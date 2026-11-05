import type { SupabaseClient } from "@supabase/supabase-js";
import { companySlug } from "../logic";
import type { FirmAppStats, PortalData, Settings } from "../types";
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
    lessons: [],
    templates: [],
    settings: { calendar: defaultCalendar() },
  };
}

/** Everything the signed-in member may see, in one round of parallel queries. */
export async function loadAll(sb: SupabaseClient): Promise<PortalData> {
  const q = async (table: string) => {
    const { data, error } = await sb.from(table).select("*");
    if (error) {
      // A table or view the code expects isn't there: the database is behind the code.
      const missing = error.code === "PGRST205" || error.code === "42P01" || /could not find the table|does not exist/i.test(error.message);
      throw new Error(
        missing
          ? `The database is missing an update (no "${table}"). In Supabase's SQL editor, run the newest file in supabase/migrations/, then reload this page.`
          : `Couldn't load ${table}: ${error.message}`,
      );
    }
    return (data ?? []) as R.Row[];
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
    lessons: lessons.map(R.lessonFrom),
    templates: templates.map(R.docTemplateFrom),
    settings: { calendar: calendar ?? defaultCalendar() },
  };
}
