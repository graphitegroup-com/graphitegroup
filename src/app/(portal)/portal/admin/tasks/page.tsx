"use client";

import { useState } from "react";
import { academicYear, academicYearLabel, audienceLabel, isAlum, matchesAudience, uid } from "@/portal/logic";
import { ExecOnly } from "@/portal/exec-only";
import { usePortal } from "@/portal/store";
import { EXEC_TITLES, ROLES, type Audience, type ExecTitle, type Role, type TaskTemplate } from "@/portal/types";
import { Badge, Button, Card, Drawer, Empty, Field, Input, PageTitle, Select, Td, Textarea, Th, rowCls } from "@/portal/ui";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Academic-year order: July first.
const ORDER = (t: TaskTemplate) => ((t.month + 5) % 12) * 100 + t.day;

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

  const year = academicYear();
  const active = data.members.filter((m) => !isAlum(m));
  const templates = data.taskTemplates.slice().sort((a, b) => ORDER(a) - ORDER(b));

  const save = (t: TaskTemplate) =>
    update((d) => ({
      ...d,
      taskTemplates: d.taskTemplates.some((x) => x.id === t.id) ? d.taskTemplates.map((x) => (x.id === t.id ? t : x)) : [...d.taskTemplates, t],
    }));
  const remove = (id: string) => update((d) => ({ ...d, taskTemplates: d.taskTemplates.filter((t) => t.id !== id) }));

  return (
    <div>
      <PageTitle
        title="Recurring tasks"
        sub="Set a task once and it appears on the right people's home page every academic year. Tasks aimed at a title follow whoever holds it, so they hand over automatically when exec changes."
        actions={
          <Button
            onClick={() =>
              setEditing({ id: `t${uid()}`, title: "", body: "", audience: { kind: "all" }, month: 9, day: 1, createdBy: me.id })
            }
          >
            New recurring task
          </Button>
        }
      />

      <Card title={`Calendar for ${academicYearLabel(year)}`} flush>
        {templates.length === 0 ? (
          <Empty>No recurring tasks yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr>
                  <Th>Due</Th>
                  <Th>Task</Th>
                  <Th>Assigned to</Th>
                  <Th>Done this year</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => {
                  const assignees = active.filter((m) => matchesAudience(t.audience, m));
                  const done = assignees.filter((m) => data.taskDone[`${t.id}:${year}:${m.id}`]).length;
                  return (
                    <tr key={t.id} className={rowCls}>
                      <Td className="whitespace-nowrap text-ink-2 tabular-nums">
                        {MONTHS[t.month - 1]} {t.day}
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
                          <span className="block h-1 bg-prussian" style={{ width: `${assignees.length ? (done / assignees.length) * 100 : 0}%` }} />
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

function TaskDrawer({
  initial,
  isNew,
  onClose,
  onSave,
  onDelete,
}: {
  initial: TaskTemplate;
  isNew: boolean;
  onClose: () => void;
  onSave: (t: TaskTemplate) => void;
  onDelete: (id: string) => void;
}) {
  const [t, setT] = useState(initial);
  const kind = t.audience.kind;
  const setAudience = (a: Audience) => setT({ ...t, audience: a });

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
        <div className="grid grid-cols-2 gap-3">
          <Field label="Due month">
            <Select options={MONTHS} value={MONTHS[t.month - 1]} onChange={(e) => setT({ ...t, month: MONTHS.indexOf(e.target.value) + 1 })} />
          </Field>
          <Field label="Due day">
            <Input type="number" min={1} max={31} value={t.day} onChange={(e) => setT({ ...t, day: Math.min(31, Math.max(1, Number(e.target.value))) })} />
          </Field>
        </div>
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
