"use client";

import Link from "@/components/app-link";
import { academicYearLabel, classStanding, companySlug, fmtDate, fullName, isAlum, isExec, promotionSuggestions, tasksFor, type TaskInstance } from "@/portal/logic";
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
  const upcoming = open.filter((t) => t.due.getTime() >= now.getTime());
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

  const name = (id: string) => {
    const m = data.members.find((x) => x.id === id);
    return m ? fullName(m) : "A member";
  };
  const recent = [
    ...data.reports.map((r) => ({ date: `${r.year}-06-01`, text: `${r.position}, ${r.round}`, title: r.company, href: `/portal/companies/${companySlug(r.company)}`, who: r.memberId })),
    ...data.comments
      .filter((c) => c.subject.startsWith("company:"))
      .map((c) => ({ date: c.createdAt, text: c.body, title: "Discussion", href: `/portal/companies/${c.subject.slice(8)}`, who: c.memberId })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <div>
      <PageTitle title={`${greeting(now)}, ${me.firstName}.`} sub={`${me.execTitle ?? me.role}, ${me.practice}. Academic year ${academicYearLabel()}.`} />

      <div className="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4">
        <Stat label="Open tasks" value={open.length} sub={overdue.length ? `${overdue.length} overdue` : "Nothing overdue"} />
        <Stat label="Active applications" value={activeApps.length} sub={`${myApps.length} tracked`} />
        <Stat label="Coffee chats" value={myChats.length} sub={`${myChats.filter((o) => o.responded).length} replied`} />
        <Stat label="Active members" value={active.length} sub={`${seniors.length} seniors this year`} />
      </div>

      <div className="mt-16 grid gap-16 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <Card title="Your tasks" action={<span className="text-muted">Set by the executive board each year</span>}>
            {open.length === 0 && done.length === 0 && <Empty>No tasks for you this year.</Empty>}
            <TaskList label="Overdue" tasks={overdue} onToggle={toggle} now={now} />
            <TaskList label="Coming up" tasks={upcoming} onToggle={toggle} now={now} />
            <TaskList label="Done" tasks={done} onToggle={toggle} now={now} />
          </Card>
        </div>

        <div className="space-y-14 lg:col-span-5">
          {isExec(me) && (
            <Card title="Needs your attention">
              <ul className="divide-y divide-line">
                <Row href="/portal/admin" label="Promotions to approve" value={promos.length} />
                <Row href="/portal/directory" label="Seniors graduating this year" value={seniors.length} />
                <Row href="/portal/admin/website" label="Public website" value="Edit" />
              </ul>
            </Card>
          )}

          <Card title="My recruiting" action={<Link href="/portal/recruiting" className="link-u text-muted">Open</Link>}>
            {myApps.length === 0 ? (
              <Empty>No applications yet.</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {myApps.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-baseline justify-between gap-4 py-3">
                    <span className="min-w-0">
                      <Link href={`/portal/companies/${companySlug(a.company)}`} className="display block truncate text-[1.15rem] hover:text-accent">
                        {a.company}
                      </Link>
                      <span className="block truncate text-sm text-muted">{a.position}</span>
                    </span>
                    <Badge tone={a.stage === "Offer" ? "green" : a.stage === "Rejected" ? "red" : "blue"}>{a.stage}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Latest company notes">
            <ul className="divide-y divide-line">
              {recent.map((r, i) => (
                <li key={i} className="py-3">
                  <Link href={r.href} className="group block">
                    <span className="font-medium group-hover:text-accent">{r.title}</span>
                    <span className="mt-0.5 line-clamp-2 block text-sm text-ink-2">{r.text}</span>
                    <span className="mt-1 block text-xs text-muted">
                      {name(r.who)}, {fmtDate(r.date)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ href, label, value }: { href: string; label: string; value: string | number }) {
  return (
    <li>
      <Link href={href} className="flex items-baseline justify-between py-3 hover:text-accent">
        <span>{label}</span>
        <span className="text-muted">{value} →</span>
      </Link>
    </li>
  );
}

function TaskList({ label, tasks, onToggle, now }: { label: string; tasks: TaskInstance[]; onToggle: (t: TaskInstance) => void; now: Date }) {
  if (!tasks.length) return null;
  return (
    <div className="mt-6">
      <p className="text-sm text-muted">
        {label} <span className="text-faint">{tasks.length}</span>
      </p>
      <ul className="mt-2 divide-y divide-line border-t border-line">
        {tasks.map((t) => {
          const days = Math.round((t.due.getTime() - now.getTime()) / DAY);
          const late = !t.done && days < 0;
          return (
            <li key={t.key} className="flex gap-4 py-4">
              <input
                type="checkbox"
                checked={!!t.done}
                onChange={() => onToggle(t)}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-ink)]"
                aria-label={`Mark "${t.template.title}" ${t.done ? "not done" : "done"}`}
              />
              <div className="min-w-0 flex-1">
                <p className={t.done ? "text-muted line-through" : "font-medium"}>{t.template.title}</p>
                {!t.done && <p className="mt-1 text-sm leading-relaxed text-ink-2">{t.template.body}</p>}
              </div>
              <div className="shrink-0 text-right text-sm">
                <p className={late ? "text-[#b4423c]" : "text-ink-2"}>{fmtDate(t.due)}</p>
                {!t.done && <p className="text-xs text-muted">{days < 0 ? `${-days} days late` : days === 0 ? "Today" : `In ${days} days`}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
