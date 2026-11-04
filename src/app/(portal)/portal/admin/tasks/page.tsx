"use client";

import { useState } from "react";
import {
  academicYear,
  academicYearLabel,
  audienceLabel,
  fmtDate,
  isAlum,
  matchesAudience,
  semesterEnd,
  taskDueDate,
  templateTerms,
  uid,
  weekOneMonday,
  whenLabel,
} from "@/portal/logic";
import { ExecOnly } from "@/portal/exec-only";
import { usePortal } from "@/portal/store";
import {
  EXEC_TITLES,
  ROLES,
  TASK_SEMESTERS,
  type Audience,
  type ExecTitle,
  type Role,
  type SemesterDates,
  type Settings,
  type TaskSemester,
  type TaskTemplate,
  type TaskWhen,
} from "@/portal/types";
import { Badge, Button, Card, Drawer, Empty, Field, Input, PageTitle, Select, Td, Textarea, Th, rowCls } from "@/portal/ui";

type Calendar = Settings["calendar"];

const ANCHORS: { value: TaskWhen["anchor"]; label: string }[] = [
  { value: "before", label: "Before classes start" },
  { value: "week", label: "During the semester" },
  { value: "end", label: "Before the last week" },
];

const dayFmt = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export default function TasksAdminPage() {
  return (
    <ExecOnly>
      <TasksAdmin />
    </ExecOnly>
  );
}

function TasksAdmin() {
  const { data, me, update } = usePortal();
  const [editing, setEditing] = useState<TaskTemplate | null>(null);
  if (!me) return null;

  const { calendar } = data.settings;
  const active = data.members.filter((m) => !isAlum(m));
  // One row per task per semester, in calendar order, so the year reads like a plan.
  const rows = data.taskTemplates
    .flatMap((t) => templateTerms(t, calendar).map((x) => ({ t, ...x, due: taskDueDate(x.dates, t.when) })))
    .sort((a, b) => a.due.getTime() - b.due.getTime());

  const save = (t: TaskTemplate) =>
    update((d) => ({
      ...d,
      taskTemplates: d.taskTemplates.some((x) => x.id === t.id) ? d.taskTemplates.map((x) => (x.id === t.id ? t : x)) : [...d.taskTemplates, t],
    }));
  const remove = (id: string) => update((d) => ({ ...d, taskTemplates: d.taskTemplates.filter((t) => t.id !== id) }));
  const saveCalendar = (c: Calendar) => update((d) => ({ ...d, settings: { ...d.settings, calendar: c } }));

  return (
    <div>
      <PageTitle
        title="Recurring tasks"
        sub="Set the semester dates once a year and every task dates itself from them. Tasks aimed at an exec title follow whoever holds it, so they hand over automatically."
        actions={
          <Button
            onClick={() =>
              setEditing({ id: uid(), title: "", body: "", audience: { kind: "all" }, semester: "Every semester", when: { anchor: "week", n: 1 }, createdBy: me.id })
            }
          >
            New recurring task
          </Button>
        }
      />

      <CalendarCard calendar={calendar} onSave={saveCalendar} />

      <Card title={`Task calendar for ${academicYearLabel(calendar.year)}`} className="mt-6" flush>
        {rows.length === 0 ? (
          <Empty>No recurring tasks yet.</Empty>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr>
                  <Th>Due</Th>
                  <Th>Task</Th>
                  <Th>Assigned to</Th>
                  <Th>Done</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ t, term, semester, due }) => {
                  const assignees = active.filter((m) => matchesAudience(t.audience, m));
                  const done = assignees.filter((m) => data.taskDone[`${t.id}:${term}:${m.id}`]).length;
                  return (
                    <tr key={`${t.id}:${term}`} className={rowCls}>
                      <Td className="whitespace-nowrap">
                        <span className="block text-ink-2 tabular-nums">{dayFmt(due)}</span>
                        <span className="block text-[12px] text-muted">
                          {semester}, {whenLabel(t.when).toLowerCase()}
                        </span>
                      </Td>
                      <Td>
                        <span className="block font-medium">{t.title}</span>
                        <span className="mt-0.5 block text-[13px] text-muted">{t.body}</span>
                      </Td>
                      <Td>
                        <Badge tone={t.audience.kind === "title" ? "dark" : "gray"}>{audienceLabel(t.audience)}</Badge>
                        <span className="mt-1 block text-[12px] text-muted">
                          {assignees.length} {assignees.length === 1 ? "person" : "people"}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-[13px] tabular-nums">
                          {done}/{assignees.length}
                        </span>
                        <span className="mt-1.5 block h-1 w-24 overflow-hidden rounded-sm bg-edge">
                          <span className="block h-1 bg-accent" style={{ width: `${assignees.length ? (done / assignees.length) * 100 : 0}%` }} />
                        </span>
                      </Td>
                      <Td className="text-right whitespace-nowrap">
                        <Button variant="ghost" onClick={() => setEditing(t)}>
                          Edit
                        </Button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing && (
        <TaskDrawer
          key={editing.id}
          initial={editing}
          calendar={calendar}
          isNew={!data.taskTemplates.some((t) => t.id === editing.id)}
          onClose={() => setEditing(null)}
          onSave={(t) => {
            save(t);
            setEditing(null);
          }}
          onDelete={(id) => {
            remove(id);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

/** The two semesters' first day of classes and length; everything else is computed from these. */
function CalendarCard({ calendar, onSave }: { calendar: Calendar; onSave: (c: Calendar) => void }) {
  const [draft, setDraft] = useState(calendar);
  const [saved, setSaved] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(calendar);
  const stale = calendar.year !== academicYear();
  const setSem = (key: "fall" | "spring", patch: Partial<SemesterDates>) => {
    setSaved(false);
    setDraft((d) => {
      const next = { ...d, [key]: { ...d[key], ...patch } };
      // The academic year follows fall's first day (fall 2026 starts 2026-27).
      return { ...next, year: Number(next.fall.start.slice(0, 4)) || d.year };
    });
  };
  const valid = (["fall", "spring"] as const).every((k) => /^\d{4}-\d{2}-\d{2}$/.test(draft[k].start) && draft[k].weeks >= 1 && draft[k].weeks <= 30);

  return (
    <Card
      title={`Semester calendar, ${academicYearLabel(draft.year)}`}
      action={
        dirty ? (
          <Button
            disabled={!valid}
            onClick={() => {
              onSave(draft);
              setSaved(true);
            }}
          >
            Save dates
          </Button>
        ) : saved ? (
          <span role="status">Saved. Every due date has moved with it.</span>
        ) : undefined
      }
    >
      {stale && (
        <p role="note" className="mt-3 rounded-[3px] border border-[#ecd9a8] bg-[#fbf1da] px-3 py-2 text-[13px] text-[#5c4300]">
          These dates are for {academicYearLabel(calendar.year)}. Enter this year&apos;s first days of classes so tasks land on the right weeks.
        </p>
      )}
      <div className="grid gap-x-6 gap-y-4 py-4 md:grid-cols-2">
        {(["fall", "spring"] as const).map((k) => {
          const sem = draft[k];
          const ok = /^\d{4}-\d{2}-\d{2}$/.test(sem.start) && sem.weeks >= 1;
          return (
            <fieldset key={k} className="min-w-0">
              <legend className="mb-2 text-[13.5px] font-medium">{k === "fall" ? "Fall" : "Spring"}</legend>
              <div className="grid grid-cols-[1fr_7rem] gap-3">
                <Field label="First day of classes">
                  <Input type="date" value={sem.start} onChange={(e) => setSem(k, { start: e.target.value })} />
                </Field>
                <Field label="Weeks">
                  <Input type="number" min={1} max={30} value={sem.weeks} onChange={(e) => setSem(k, { weeks: Math.max(1, Math.min(30, Number(e.target.value) || 1)) })} />
                </Field>
              </div>
              {ok && (
                <p className="mt-1.5 text-[12.5px] text-muted">
                  Week 1 starts {dayFmt(weekOneMonday(sem))}. The last week ends {dayFmt(semesterEnd(sem))}.
                </p>
              )}
            </fieldset>
          );
        })}
      </div>
    </Card>
  );
}

function TaskDrawer({
  initial,
  calendar,
  isNew,
  onClose,
  onSave,
  onDelete,
}: {
  initial: TaskTemplate;
  calendar: Calendar;
  isNew: boolean;
  onClose: () => void;
  onSave: (t: TaskTemplate) => void;
  onDelete: (id: string) => void;
}) {
  const [t, setT] = useState(initial);
  const kind = t.audience.kind;
  const setAudience = (a: Audience) => setT({ ...t, audience: a });
  const setWhen = (patch: Partial<TaskWhen>) => setT({ ...t, when: { ...t.when, ...patch } });
  const shortest = Math.min(calendar.fall.weeks, calendar.spring.weeks);
  const maxN = t.when.anchor === "before" ? 8 : t.when.anchor === "week" ? shortest : shortest - 1;
  const minN = t.when.anchor === "end" ? 0 : 1;
  const preview = templateTerms(t, calendar).map((x) => `${x.semester} ${fmtDate(taskDueDate(x.dates, t.when))}`);

  return (
    <Drawer open onClose={onClose} title={isNew ? "New recurring task" : "Edit recurring task"}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (t.title.trim()) onSave(t);
        }}
      >
        <Field label="Title">
          <Input value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} placeholder="Book rooms for recruiting" required />
        </Field>
        <Field label="Details">
          <Textarea value={t.body} onChange={(e) => setT({ ...t, body: e.target.value })} />
        </Field>
        <Field label="Semester">
          <Select options={TASK_SEMESTERS} value={t.semester} onChange={(e) => setT({ ...t, semester: e.target.value as TaskSemester })} />
        </Field>
        <div className="grid grid-cols-[1fr_6rem] gap-3">
          <Field label="When">
            <Select
              options={ANCHORS}
              value={t.when.anchor}
              onChange={(e) => {
                const anchor = e.target.value as TaskWhen["anchor"];
                setWhen({ anchor, n: anchor === "end" ? 0 : 1 });
              }}
            />
          </Field>
          <Field label={t.when.anchor === "week" ? "Week" : "Weeks"}>
            <Input type="number" min={minN} max={maxN} value={t.when.n} onChange={(e) => setWhen({ n: Math.max(minN, Math.min(maxN, Number(e.target.value) || minN)) })} />
          </Field>
        </div>
        <p className="-mt-2 text-[12.5px] text-muted">
          {whenLabel(t.when)}. Due the Friday of that week: {preview.join(" and ")}.
        </p>
        <Field label="Who gets it">
          <Select
            options={["Everyone", "Everyone in a role", "Whoever holds an exec title"]}
            value={kind === "all" ? "Everyone" : kind === "role" ? "Everyone in a role" : "Whoever holds an exec title"}
            onChange={(e) =>
              setAudience(
                e.target.value === "Everyone"
                  ? { kind: "all" }
                  : e.target.value === "Everyone in a role"
                    ? { kind: "role", role: ROLES[0] }
                    : { kind: "title", title: EXEC_TITLES[0] },
              )
            }
          />
        </Field>
        {t.audience.kind === "role" && (
          <Field label="Role">
            <Select options={ROLES} value={t.audience.role} onChange={(e) => setAudience({ kind: "role", role: e.target.value as Role })} />
          </Field>
        )}
        {t.audience.kind === "title" && (
          <Field label="Exec title" hint="Hands over automatically when someone new takes the title.">
            <Select options={EXEC_TITLES} value={t.audience.title} onChange={(e) => setAudience({ kind: "title", title: e.target.value as ExecTitle })} />
          </Field>
        )}
        <div className="flex gap-2 pt-2">
          <Button type="submit">{isNew ? "Create task" : "Save changes"}</Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {!isNew && (
            <Button variant="danger" className="ml-auto self-center" onClick={() => onDelete(t.id)}>
              Delete
            </Button>
          )}
        </div>
      </form>
    </Drawer>
  );
}
