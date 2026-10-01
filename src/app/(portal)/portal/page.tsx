"use client";

import Link from "@/components/app-link";
import { academicYearLabel, classStanding, fmtDate, fullName, isAlum, isExec, promotionSuggestions, tasksFor, type TaskInstance } from "@/portal/logic";
import { usePortal } from "@/portal/store";
import { Badge, Card, Empty, PageTitle, Stat } from "@/portal/ui";

const DAY = 86_400_000;

function greeting(now: Date) {
  const h = now.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function PortalHome() {
  const { data, me, update } = usePortal();
  if (!me) return null;

  const now = new Date();
  const tasks = tasksFor(me, data, now);
  const open = tasks.filter((t) => !t.done);
  const overdue = open.filter((t) => t.due.getTime() < now.getTime());
  const soon = open.filter((t) => t.due.getTime() >= now.getTime() && t.due.getTime() - now.getTime() <= 45 * DAY);
  const later = open.filter((t) => t.due.getTime() - now.getTime() > 45 * DAY);
  const done = tasks.filter((t) => t.done);

  const toggle = (t: TaskInstance) =>
    update((d) => {
      const taskDone = { ...d.taskDone };
      if (taskDone[t.key]) delete taskDone[t.key];
      else taskDone[t.key] = new Date().toISOString();
      return { ...d, taskDone };
    });

  const myApps = data.applications.filter((a) => a.memberId === me.id);
  const activeApps = myApps.filter((a) => !["Offer", "Rejected", "Withdrew"].includes(a.stage));
  const myChats = data.outreach.filter((o) => o.memberId === me.id);
  const active = data.members.filter((m) => !isAlum(m, now));
  const promos = promotionSuggestions(data.members, now);
  const seniors = active.filter((m) => classStanding(m.gradYear, now) === "Senior");

  const recent = [
    ...data.reports.map((r) => ({ date: `${r.year}-06-01`, text: `${r.position} interview notes for ${r.company}`, who: r.memberId, href: "/portal/companies" })),
    ...data.comments.map((c) => ({ date: c.createdAt, text: c.body, who: c.memberId, href: c.subject.startsWith("company") ? "/portal/companies" : c.subject.startsWith("contact") ? "/portal/network" : "/portal/projects" })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  const name = (id: string) => {
    const m = data.members.find((x) => x.id === id);
    return m ? fullName(m) : "A member";
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title={`${greeting(now)}, ${me.firstName}`}
        sub={`${me.execTitle ?? me.role} · ${me.practice} · Academic year ${academicYearLabel()}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Open action items" value={open.length} sub={overdue.length ? `${overdue.length} overdue` : "Nothing overdue"} />
        <Stat label="Active applications" value={activeApps.length} sub={`${myApps.length} tracked in total`} />
        <Stat label="Coffee chats logged" value={myChats.length} sub={`${myChats.filter((o) => o.responded).length} responses`} />
        <Stat label="Active members" value={active.length} sub={`${seniors.length} seniors graduating in ${now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear()}`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Your action items" action={<span className="text-xs text-slate">Generated each July from exec&apos;s recurring tasks</span>}>
          {open.length === 0 && <Empty>You&apos;re all caught up.</Empty>}
          <TaskGroup label="Overdue" tone="red" tasks={overdue} onToggle={toggle} now={now} />
          <TaskGroup label="Due soon" tone="amber" tasks={soon} onToggle={toggle} now={now} />
          <TaskGroup label="Later this year" tone="gray" tasks={later} onToggle={toggle} now={now} />
          {done.length > 0 && <TaskGroup label="Completed" tone="green" tasks={done} onToggle={toggle} now={now} />}
        </Card>

        <div className="space-y-6">
          {isExec(me) && (
            <Card title="Exec attention">
              <ul className="divide-y divide-line text-sm">
                <li className="flex items-center justify-between px-5 py-3">
                  <span>Promotions awaiting approval</span>
                  <Link href="/portal/admin" className="font-semibold text-accent">
                    {promos.length} →
                  </Link>
                </li>
                <li className="flex items-center justify-between px-5 py-3">
                  <span>Seniors to transition to alumni</span>
                  <Link href="/portal/directory" className="font-semibold text-accent">
                    {seniors.length} →
                  </Link>
                </li>
                <li className="flex items-center justify-between px-5 py-3">
                  <span>Public website</span>
                  <Link href="/portal/admin/website" className="font-semibold text-accent">
                    Edit →
                  </Link>
                </li>
              </ul>
            </Card>
          )}

          <Card title="My recruiting" action={<Link href="/portal/recruiting" className="text-xs font-semibold text-accent">Open →</Link>}>
            {myApps.length === 0 ? (
              <Empty>No applications yet.</Empty>
            ) : (
              <ul className="divide-y divide-line text-sm">
                {myApps.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{a.company}</span>
                      <span className="block truncate text-xs text-slate">{a.position}</span>
                    </span>
                    <Badge tone={a.stage === "Offer" ? "green" : a.stage === "Rejected" ? "red" : "blue"}>{a.stage}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Recent from the org">
            <ul className="divide-y divide-line text-sm">
              {recent.map((r, i) => (
                <li key={i} className="px-5 py-3">
                  <Link href={r.href} className="line-clamp-2 hover:text-accent">
                    {r.text}
                  </Link>
                  <span className="mt-0.5 block text-xs text-slate">
                    {name(r.who)} · {fmtDate(r.date)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TaskGroup({
  label,
  tone,
  tasks,
  onToggle,
  now,
}: {
  label: string;
  tone: "red" | "amber" | "gray" | "green";
  tasks: TaskInstance[];
  onToggle: (t: TaskInstance) => void;
  now: Date;
}) {
  if (!tasks.length) return null;
  return (
    <div>
      <p className="border-b border-line bg-cloud/60 px-5 py-2 text-xs font-semibold tracking-[0.08em] text-slate uppercase">
        {label} · {tasks.length}
      </p>
      <ul className="divide-y divide-line">
        {tasks.map((t) => {
          const days = Math.round((t.due.getTime() - now.getTime()) / DAY);
          return (
            <li key={t.key} className="flex gap-4 px-5 py-4">
              <input
                type="checkbox"
                checked={!!t.done}
                onChange={() => onToggle(t)}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
                aria-label={`Mark "${t.template.title}" ${t.done ? "not done" : "done"}`}
              />
              <div className="min-w-0 flex-1">
                <p className={`font-medium ${t.done ? "text-slate line-through" : ""}`}>{t.template.title}</p>
                <p className="mt-0.5 text-sm text-slate">{t.template.body}</p>
              </div>
              <div className="shrink-0 text-right">
                <Badge tone={tone}>{fmtDate(t.due)}</Badge>
                {!t.done && <p className="mt-1 text-xs text-slate">{days < 0 ? `${-days}d late` : days === 0 ? "Today" : `in ${days}d`}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
