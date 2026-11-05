"use client";

import Link from "@/components/app-link";
import { useState } from "react";
import {
  assignToProject,
  currentProjects,
  currentTerm,
  fmtDate,
  fullName,
  isAlum,
  isExec,
  onTeam,
  projectTaskDue,
  projectTerm,
  runsTeam,
  semesterWeek,
  semesterWeeks,
  teamOf,
  termName,
  uid,
} from "@/portal/logic";
import { usePortal } from "@/portal/store";
import type { Member, Project, ProjectTask } from "@/portal/types";
import { Avatar, Badge, Button, Card, Empty, Field, Input, PageTitle, Select, Textarea } from "@/portal/ui";

/**
 * This semester's project teams. Exec staffs any team and a project's lead
 * staffs theirs; leads set tasks week by week for the whole team or one
 * person, and each member checks off their own.
 */
export default function TeamsPage() {
  const { data, me } = usePortal();
  if (!me) return null;
  const now = new Date();
  const term = currentTerm(now);
  const projects = currentProjects(data, me, now);

  return (
    <div>
      <PageTitle
        title="Teams"
        sub={`${termName(term)}: who's on each project, and what each team is working on week by week. Team leads and exec set the tasks; due dates follow the semester calendar.`}
      />
      {projects.length === 0 ? (
        <Card flush>
          <Empty>
            No projects for {termName(term)} yet.{" "}
            {isExec(me) ? (
              <>
                Add them in{" "}
                <Link href="/portal/projects" className="text-link hover:underline">
                  Projects
                </Link>{" "}
                with this semester and a team lead for each.
              </>
            ) : (
              "Exec adds them in Projects."
            )}
          </Empty>
        </Card>
      ) : (
        <div className="space-y-6">
          {projects.map((p) => (
            <TeamCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function TeamCard({ project: p }: { project: Project }) {
  const { data, me, update } = usePortal();
  const [adding, setAdding] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  if (!me) return null;
  const now = new Date();
  const term = projectTerm(p);
  const team = teamOf(data, p)
    .map((id) => data.members.find((m) => m.id === id))
    .filter((m): m is Member => !!m);
  const lead = data.members.find((m) => m.id === p.lead);
  const runs = runsTeam(me, p);
  const mine = onTeam(data, p, me.id);
  const open = runs || mine || showTasks;
  const tasks = data.projectTasks.filter((t) => t.projectId === p.id).sort((a, b) => a.week - b.week || a.title.localeCompare(b.title));
  const weeks = [...new Set(tasks.map((t) => t.week))];
  const thisWeek = semesterWeek(term, data.settings, now);
  // Active members not on this team; adding moves them off any other team this semester.
  const others = data.members.filter((m) => !isAlum(m, now) && !team.some((t) => t.id === m.id)).sort((a, b) => a.lastName.localeCompare(b.lastName));

  const done = (t: ProjectTask, memberId: string) => !!data.projectTaskDone[`${t.id}:${memberId}`];
  const toggle = (t: ProjectTask) =>
    update((d) => {
      const key = `${t.id}:${me.id}`;
      const next = { ...d.projectTaskDone };
      if (next[key]) delete next[key];
      else next[key] = new Date().toISOString();
      return { ...d, projectTaskDone: next };
    });

  return (
    <Card
      title={
        <span className="flex flex-wrap items-center gap-2 normal-case">
          <span className="text-[14px] font-medium tracking-normal text-ink">{p.client}</span>
          <span className="tracking-normal">{p.practice}</span>
          {mine && <Badge tone="blue">Your team</Badge>}
        </span>
      }
      action={<span className="whitespace-nowrap">{lead ? `Led by ${fullName(lead)}` : "No lead set"}</span>}
      flush
    >
      <div className="grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)]">
        <div className="border-b border-edge md:border-r md:border-b-0">
          <p className="px-4 pt-3 text-[12px] font-medium text-muted">Team ({team.length})</p>
          <ul className="px-2 py-1.5">
            {team.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 rounded-[3px] px-2 py-1">
                <span className="flex min-w-0 items-center gap-2">
                  <Avatar name={fullName(m)} photo={m.photo} size={22} />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium">{fullName(m)}</span>
                    <span className="block truncate text-[12px] text-muted">{m.id === p.lead ? "Team lead" : m.role}</span>
                  </span>
                </span>
                {runs && m.id !== p.lead && (
                  <button
                    type="button"
                    className="text-[12px] text-faint hover:text-[#a8261b]"
                    aria-label={`Remove ${fullName(m)} from ${p.client}`}
                    onClick={() => update((d) => assignToProject(d, m.id, null))}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
          {runs && (
            <div className="px-4 pb-3">
              <Select
                aria-label={`Add someone to ${p.client}`}
                value=""
                onChange={(e) => e.target.value && update((d) => assignToProject(d, e.target.value, p.id))}
                options={[{ value: "", label: "Add someone to the team" }, ...others.map((m) => ({ value: m.id, label: `${fullName(m)}, ${m.role}` }))]}
              />
            </div>
          )}
        </div>

        <div className="min-w-0">
          {!open ? (
            <div className="px-4 py-3 text-[13px] text-muted">
              {tasks.length} {tasks.length === 1 ? "task" : "tasks"} this semester.{" "}
              <button type="button" className="text-link hover:underline" onClick={() => setShowTasks(true)}>
                Show their tasks
              </button>
            </div>
          ) : tasks.length === 0 ? (
            <Empty>{runs ? "No tasks yet. Add the first one below." : "No tasks yet."}</Empty>
          ) : (
            weeks.map((w) => (
              <div key={w} className="border-b border-edge last:border-0">
                <p className={`px-4 pt-3 text-[12px] font-medium ${w === thisWeek ? "text-accent" : "text-muted"}`}>
                  Week {w}, due {fmtDate(projectTaskDue(p, w, data.settings))}
                  {w === thisWeek && " (this week)"}
                </p>
                <ul className="divide-y divide-edge">
                  {tasks
                    .filter((t) => t.week === w)
                    .map((t) => {
                      const assignee = t.assigneeId ? data.members.find((m) => m.id === t.assigneeId) : undefined;
                      const forMe = mine && (!t.assigneeId || t.assigneeId === me.id);
                      const people = t.assigneeId ? [t.assigneeId] : team.map((m) => m.id);
                      const count = people.filter((id) => done(t, id)).length;
                      return (
                        <li key={t.id} className="flex gap-3 px-4 py-2.5">
                          {forMe ? (
                            <input
                              type="checkbox"
                              checked={done(t, me.id)}
                              onChange={() => toggle(t)}
                              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
                              aria-label={`Mark "${t.title}" ${done(t, me.id) ? "not done" : "done"}`}
                            />
                          ) : (
                            <span className="h-4 w-4 shrink-0" aria-hidden />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className={forMe && done(t, me.id) ? "text-muted line-through" : "font-medium"}>{t.title}</p>
                            {t.body && <p className="mt-0.5 text-[13px] whitespace-pre-line text-muted">{t.body}</p>}
                            <p className="mt-0.5 text-[12px] text-faint">
                              {assignee ? fullName(assignee) : "Everyone on the team"}
                              {(runs || mine) && ` · ${t.assigneeId ? (count ? "done" : "not done yet") : `${count} of ${people.length} done`}`}
                            </p>
                          </div>
                          {runs && (
                            <button
                              type="button"
                              className="self-start text-[12px] text-faint hover:text-[#a8261b]"
                              aria-label={`Delete task ${t.title}`}
                              onClick={() => update((d) => ({ ...d, projectTasks: d.projectTasks.filter((x) => x.id !== t.id) }))}
                            >
                              Delete
                            </button>
                          )}
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))
          )}
          {runs && (
            <div className="border-t border-edge px-4 py-3">
              {adding ? (
                <TaskForm project={p} team={team} defaultWeek={thisWeek} weeks={semesterWeeks(term, data.settings)} onDone={() => setAdding(false)} />
              ) : (
                <Button variant="secondary" onClick={() => setAdding(true)}>
                  Add a task
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function TaskForm({ project, team, defaultWeek, weeks, onDone }: { project: Project; team: Member[]; defaultWeek: number; weeks: number; onDone: () => void }) {
  const { data, me, update } = usePortal();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [week, setWeek] = useState(String(defaultWeek));
  const [assignee, setAssignee] = useState("");
  if (!me) return null;
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        const task: ProjectTask = {
          id: uid(),
          projectId: project.id,
          title: title.trim(),
          body: body.trim(),
          week: Number(week),
          assigneeId: assignee || undefined,
          createdBy: me.id,
          createdAt: new Date().toISOString(),
        };
        update((d) => ({ ...d, projectTasks: [...d.projectTasks, task] }));
        onDone();
      }}
    >
      <Field label="Task">
        <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Market sizing first draft" />
      </Field>
      <Field label="Details">
        <Textarea rows={2} value={body} onChange={(e) => setBody(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Week" hint={`Due ${fmtDate(projectTaskDue(project, Number(week), data.settings))}`}>
          <Select value={week} onChange={(e) => setWeek(e.target.value)} options={Array.from({ length: weeks }, (_, i) => ({ value: String(i + 1), label: `Week ${i + 1}` }))} />
        </Field>
        <Field label="For">
          <Select value={assignee} onChange={(e) => setAssignee(e.target.value)} options={[{ value: "", label: "Everyone on the team" }, ...team.map((m) => ({ value: m.id, label: fullName(m) }))]} />
        </Field>
      </div>
      <div className="flex gap-2">
        <Button type="submit">Add task</Button>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
