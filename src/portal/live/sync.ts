import type { SupabaseClient } from "@supabase/supabase-js";
import { companySlug } from "../logic";
import type { PortalData } from "../types";
import * as R from "./rows";

/*
  Every change in the portal is a pure function from the old data to the new
  (`update(d => ...)`). In live mode this module compares the two and sends
  the difference to Supabase: deletes, then inserts, then updates, table by
  table in an order where a parent row always exists before its children.
  The database's access rules decide what's allowed; a refusal comes back as
  an error and the store reloads, so the screen never drifts from the data.
*/

type Ctx = { sb: SupabaseClient; meId: string };
type Op = { label: string; run: (c: Ctx) => Promise<void> };

/** Collections whose server-side ids or computed columns change on write, so they're reloaded afterwards. */
export type Reload = "reports" | "firms";

const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

function diffById<T extends { id: string }>(prev: T[], next: T[]) {
  const before = new Map(prev.map((x) => [x.id, x]));
  const after = new Map(next.map((x) => [x.id, x]));
  return {
    added: next.filter((x) => !before.has(x.id)),
    removed: prev.filter((x) => !after.has(x.id)),
    changed: next.filter((x) => before.has(x.id) && !same(before.get(x.id), x)),
    before,
  };
}

async function check<T>(p: PromiseLike<{ data: T; error: { message: string } | null }>, what: string): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

/** Updates that the access rules silently filter out come back with no rows; treat that as a refusal. */
async function updateRow(c: Ctx, table: string, id: string, row: R.Row, what: string) {
  const rows = await check(c.sb.from(table).update(row).eq("id", id).select("id"), what);
  if (!rows?.length) throw new Error(`${what}: you don't have permission to change this`);
}

function tableOps<T extends { id: string }>(
  ops: Op[],
  table: string,
  what: string,
  prev: T[],
  next: T[],
  to: (x: T) => R.Row,
  opts: { mine?: (x: T) => boolean; insert?: boolean; update?: boolean; remove?: boolean } = {},
) {
  const { added, removed, changed } = diffById(prev, next);
  const mine = opts.mine ?? (() => true);
  if (opts.remove !== false) {
    for (const x of removed) ops.push({ label: `remove ${what}`, run: (c) => check(c.sb.from(table).delete().eq("id", x.id), `Couldn't remove the ${what}`).then(() => {}) });
  }
  if (opts.insert !== false) {
    const rows = added.filter(mine).map(to);
    if (rows.length) ops.push({ label: `add ${what}`, run: (c) => check(c.sb.from(table).insert(rows), `Couldn't save the ${what}`).then(() => {}) });
  }
  if (opts.update !== false) {
    for (const x of changed.filter(mine)) ops.push({ label: `update ${what}`, run: (c) => updateRow(c, table, x.id, to(x), `Couldn't update the ${what}`) });
  }
}

/** The writes that turn `prev` into `next`, in a safe order, and what to reload afterwards. */
export function planSync(prev: PortalData, next: PortalData, meId: string): { ops: Op[]; reload: Set<Reload> } {
  const ops: Op[] = [];
  const reload = new Set<Reload>();
  const own = <T extends { memberId: string }>(x: T) => x.memberId === meId;

  /* members: exec adds and edits; members edit themselves and finish setup once. */
  if (prev.members !== next.members || prev.accounts !== next.accounts) {
    const { added, changed, before } = diffById(prev.members, next.members);
    const setupDone = Object.keys(next.accounts).filter((id) => !prev.accounts[id]);
    if (added.length) ops.push({ label: "add members", run: (c) => check(c.sb.from("members").insert(added.map(R.memberTo)), "Couldn't add the member").then(() => {}) });
    const ids = new Set([...changed.map((m) => m.id), ...setupDone]);
    for (const id of ids) {
      const m = next.members.find((x) => x.id === id);
      if (!m || added.includes(m)) continue;
      const row = R.memberTo(m);
      if (setupDone.includes(id)) row.setup_completed_at = next.accounts[id];
      ops.push({ label: "update member", run: (c) => updateRow(c, "members", id, row, "Couldn't save the profile") });
      const old = before.get(id);
      if (old && old.phone !== m.phone) {
        ops.push({
          label: "save phone",
          run: (c) => check(c.sb.from("member_private").upsert({ member_id: id, phone: m.phone.trim() || null }), "Couldn't save the phone number").then(() => {}),
        });
      }
    }
    for (const m of added.filter((x) => x.phone.trim())) {
      ops.push({ label: "save phone", run: (c) => check(c.sb.from("member_private").upsert({ member_id: m.id, phone: m.phone.trim() }), "Couldn't save the phone number").then(() => {}) });
    }
    if (prev.members.some((m) => !next.members.some((x) => x.id === m.id))) {
      throw new Error("Members can't be deleted from the portal. Ask the Managing Director to remove them in Supabase.");
    }
  }

  /* Invites are keyed by email. Exec adds and removes them; joining removes them in the database. */
  if (prev.invites !== next.invites) {
    const before = new Map(prev.invites.map((i) => [i.email, i]));
    const after = new Map(next.invites.map((i) => [i.email, i]));
    const added = next.invites.filter((i) => !before.has(i.email));
    if (added.length) {
      ops.push({
        label: "invite",
        run: (c) => check(c.sb.from("invites").insert(added.map((i) => ({ email: i.email, role: i.role, added_by: meId }))), "Couldn't save the invites").then(() => {}),
      });
    }
    for (const i of prev.invites.filter((x) => !after.has(x.email))) {
      ops.push({ label: "remove invite", run: (c) => check(c.sb.from("invites").delete().eq("email", i.email), "Couldn't remove the invite").then(() => {}) });
    }
    for (const i of next.invites.filter((x) => before.has(x.email) && before.get(x.email)!.role !== x.role)) {
      ops.push({ label: "change invite", run: (c) => check(c.sb.from("invites").update({ role: i.role }).eq("email", i.email), "Couldn't change the invite").then(() => {}) });
    }
  }

  if (prev.roleChanges !== next.roleChanges) tableOps(ops, "role_changes", "role change", prev.roleChanges, next.roleChanges, R.roleChangeTo);
  if (prev.taskTemplates !== next.taskTemplates) tableOps(ops, "task_templates", "task", prev.taskTemplates, next.taskTemplates, R.templateTaskTo);

  if (prev.taskDone !== next.taskDone) {
    for (const key of Object.keys(prev.taskDone).filter((k) => !next.taskDone[k])) {
      const r = R.completionRow(key);
      ops.push({
        label: "mark task not done",
        run: (c) => check(c.sb.from("task_completions").delete().match(r), "Couldn't update the task").then(() => {}),
      });
    }
    const added = Object.keys(next.taskDone).filter((k) => !prev.taskDone[k]);
    if (added.length) {
      ops.push({
        label: "mark task done",
        run: (c) => check(c.sb.from("task_completions").insert(added.map((k) => R.completionRow(k, next.taskDone[k]))), "Couldn't update the task").then(() => {}),
      });
    }
  }

  if (prev.contacts !== next.contacts) tableOps(ops, "contacts", "contact", prev.contacts, next.contacts, R.contactTo, { remove: false });

  if (prev.outreach !== next.outreach) {
    tableOps(ops, "outreach", "outreach", prev.outreach, next.outreach, R.outreachTo, { mine: own });
    const { added, changed, before } = diffById(prev.outreach, next.outreach);
    for (const o of [...added, ...changed].filter(own)) {
      const old = before.get(o.id);
      if ((old?.privateNotes ?? "") === (o.privateNotes ?? "")) continue;
      ops.push({
        label: "save private notes",
        run: (c) =>
          check(c.sb.from("outreach_private_notes").upsert({ outreach_id: o.id, member_id: meId, notes: o.privateNotes ?? "" }), "Couldn't save your private notes").then(() => {}),
      });
    }
  }

  if (prev.applications !== next.applications) tableOps(ops, "applications", "application", prev.applications, next.applications, R.applicationTo, { mine: own });

  /* Interviews: logged through log_interview, which files the questions without a name unless asked. */
  if (prev.reports !== next.reports || prev.questions !== next.questions) {
    const reports = diffById(prev.reports, next.reports);
    const questions = diffById(prev.questions, next.questions);
    for (const r of reports.added.filter(own)) {
      const firm = companySlug(r.company.trim());
      const qs = questions.added.filter((q) => companySlug(q.company.trim()) === firm);
      ops.push({
        label: "log interview",
        run: (c) =>
          check(
            c.sb.rpc("log_interview", {
              p_company: r.company.trim(),
              p_year: r.year,
              p_position: r.position,
              p_round: r.round,
              p_format: r.format,
              p_overview: r.overview,
              p_tips: r.tips,
              p_difficulty: r.difficulty,
              p_outcome: r.outcome,
              p_anonymous: !!r.anonymous,
              p_question_round: qs[0]?.round ?? "Other",
              p_questions: qs.map((q) => q.question),
              p_questions_anonymous: !qs.some((q) => q.memberId),
            }),
            "Couldn't save the interview",
          ).then(() => {}),
      });
      reload.add("reports");
    }
    for (const r of reports.changed.filter(own)) ops.push({ label: "update interview", run: (c) => updateRow(c, "interview_reports", r.id, R.reportTo(r), "Couldn't update the interview") });
    for (const r of reports.removed) ops.push({ label: "remove interview", run: (c) => check(c.sb.from("interview_reports").delete().eq("id", r.id), "Couldn't remove the interview").then(() => {}) });
    for (const q of questions.removed) ops.push({ label: "remove question", run: (c) => check(c.sb.from("interview_questions").delete().eq("id", q.id), "Couldn't remove the question").then(() => {}) });
  }

  if (prev.comments !== next.comments) tableOps(ops, "comments", "comment", prev.comments, next.comments, R.commentTo, { mine: own, update: false });

  /* Firm types are keyed by name. */
  if (prev.firms !== next.firms) {
    const before = new Map(prev.firms.map((f) => [companySlug(f.name), f]));
    for (const f of next.firms) {
      const old = before.get(companySlug(f.name));
      if (!old) {
        ops.push({ label: "set firm type", run: (c) => check(c.sb.from("firms").insert({ name: f.name.trim(), type: f.type, updated_by: meId }), "Couldn't save the firm type").then(() => {}) });
      } else if (old.type !== f.type) {
        ops.push({
          label: "change firm type",
          run: async (c) => {
            const rows = await check(
              c.sb.from("firms").update({ type: f.type, updated_by: meId, updated_at: new Date().toISOString() }).ilike("name", old.name.trim().replace(/[\\%_]/g, (m) => `\\${m}`)).select("id"),
              "Couldn't change the firm type",
            );
            if (!rows?.length) throw new Error("Couldn't change the firm type: it wasn't found");
          },
        });
      }
    }
    reload.add("firms");
  }

  if (prev.jobs !== next.jobs) tableOps(ops, "jobs", "job", prev.jobs, next.jobs, R.jobTo, { mine: own });
  if (prev.grades !== next.grades) tableOps(ops, "firm_grades", "grade", prev.grades, next.grades, R.gradeTo, { mine: own });

  if (prev.posts !== next.posts || prev.replies !== next.replies) {
    tableOps(ops, "forum_posts", "thread", prev.posts, next.posts, R.postTo, { mine: (p) => p.memberId === meId || !prev.posts.some((x) => x.id === p.id) });
    // Exec can pin or edit anyone's thread; the database checks who's allowed.
    const { changed } = diffById(prev.posts, next.posts);
    for (const p of changed.filter((x) => x.memberId !== meId)) {
      const old = prev.posts.find((x) => x.id === p.id)!;
      if (!same({ ...old, upvotes: [] }, { ...p, upvotes: [] })) ops.push({ label: "update thread", run: (c) => updateRow(c, "forum_posts", p.id, R.postTo(p), "Couldn't update the thread") });
    }
    tableOps(ops, "forum_replies", "reply", prev.replies, next.replies, R.replyTo, { mine: own, update: false });
    const votes = (kind: "post_id" | "reply_id", a: { id: string; upvotes: string[] }[], b: { id: string; upvotes: string[] }[]) => {
      const was = new Map(a.map((x) => [x.id, x.upvotes.includes(meId)]));
      for (const x of b) {
        const now = x.upvotes.includes(meId);
        const then = was.get(x.id) ?? false;
        if (now === then) continue;
        ops.push({
          label: now ? "vote" : "remove vote",
          run: (c) =>
            now
              ? check(c.sb.from("forum_votes").insert({ member_id: meId, [kind]: x.id }), "Couldn't save your vote").then(() => {})
              : check(c.sb.from("forum_votes").delete().match({ member_id: meId, [kind]: x.id }), "Couldn't remove your vote").then(() => {}),
        });
      }
    };
    votes("post_id", prev.posts, next.posts);
    votes("reply_id", prev.replies, next.replies);
    // Only the vote changed on someone else's thread or reply; the table update above skips those.
  }

  if (prev.projects !== next.projects) tableOps(ops, "projects", "project", prev.projects, next.projects, R.projectTo);
  if (prev.lessons !== next.lessons) tableOps(ops, "lessons", "lesson", prev.lessons, next.lessons, R.lessonTo);
  if (prev.templates !== next.templates) tableOps(ops, "templates", "template", prev.templates, next.templates, R.docTemplateTo);

  if (!same(prev.settings, next.settings)) {
    ops.push({
      label: "save the semester calendar",
      run: (c) => check(c.sb.from("settings").upsert({ key: "calendar", value: next.settings.calendar }), "Couldn't save the semester dates").then(() => {}),
    });
  }

  return { ops, reload };
}

export async function runSync(sb: SupabaseClient, meId: string, prev: PortalData, next: PortalData) {
  const { ops, reload } = planSync(prev, next, meId);
  for (const op of ops) await op.run({ sb, meId });
  return reload;
}
