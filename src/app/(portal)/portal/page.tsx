"use client";

import Link from "@/components/app-link";
import { academicYearLabel, classStanding, companySlug, fmtDate, followUpsDue, isAlum, isExec, promotionSuggestions, tasksFor, threadActivity, whenLabel, type TaskInstance } from "@/portal/logic";
import { ThreadRow, useThreadVote } from "@/portal/forum";
import { usePortal } from "@/portal/store";
import { Badge, ButtonLink, Card, Empty, PageTitle, Stat, StatGroup } from "@/portal/ui";
import { stageTone } from "@/portal/views/company";

const DAY = 86_400_000;

export default function PortalHome() {
  const { data, me, update } = usePortal();
  const vote = useThreadVote();
  if (!me) return null;

  const now = new Date();
  const tasks = tasksFor(me, data);
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
  const due = followUpsDue(me.id, data.outreach, now);
  const active = data.members.filter((m) => !isAlum(m, now));
  const promos = promotionSuggestions(data.members, now);
  const seniors = active.filter((m) => classStanding(m.gradYear, now) === "Senior");

  const threads = [...data.posts].sort((a, b) => threadActivity(b, data.replies).localeCompare(threadActivity(a, data.replies))).slice(0, 5);

  const dateLine = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div>
      <PageTitle title="Home" sub={`${dateLine}. ${me.execTitle ?? me.role}, ${me.practice}, academic year ${academicYearLabel()}.`} />

      <StatGroup>
        <Stat label="Open tasks" value={open.length} sub={overdue.length ? `${overdue.length} overdue` : "Nothing overdue"} />
        <Stat label="Active applications" value={activeApps.length} sub={`${myApps.length} tracked`} />
        <Stat label="Follow-ups due" value={due.length} sub={`${new Set(myChats.map((o) => o.contactId)).size} people in your network`} />
        <Stat label="Active members" value={active.length} sub={`${seniors.length} seniors this year`} />
      </StatGroup>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Your tasks" action="Dated from the semester calendar" flush>
            {open.length === 0 && done.length === 0 && <Empty>No tasks for you this year.</Empty>}
            <TaskList label="Overdue" tasks={overdue} onToggle={toggle} now={now} />
            <TaskList label="Coming up" tasks={upcoming} onToggle={toggle} now={now} />
            <TaskList label="Done" tasks={done} onToggle={toggle} now={now} />
          </Card>

          <Card
            title="Active in the forum"
            flush
            action={
              <Link href="/portal/forum" className="text-link hover:underline">
                Open the forum
              </Link>
            }
          >
            {threads.length === 0 ? (
              <Empty>
                <span className="mb-3 block">No threads yet. Ask the question everyone else is wondering about.</span>
                <ButtonLink href="/portal/forum" variant="primary">
                  Start a thread
                </ButtonLink>
              </Empty>
            ) : (
              <ul className="divide-y divide-edge">
                {threads.map((p) => (
                  <ThreadRow key={p.id} post={p} data={data} me={me} now={now} onVote={() => vote(p.id)} />
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {isExec(me) && (
            <Card title="Needs attention" flush>
              <ul className="divide-y divide-edge">
                <Row href="/portal/admin" label="Promotions to approve" value={promos.length} />
                <Row href="/portal/directory" label="Seniors graduating this year" value={seniors.length} />
              </ul>
            </Card>
          )}

          <Card
            title="Follow-ups due"
            flush
            action={
              <Link href="/portal/recruiting#network" className="text-link hover:underline">
                My network
              </Link>
            }
          >
            {due.length === 0 ? (
              <Empty>
                Nothing to follow up on.{" "}
                <Link href="/portal/recruiting#network" className="text-link hover:underline">
                  Log outreach
                </Link>{" "}
                and reminders show up here.
              </Empty>
            ) : (
              <ul className="divide-y divide-edge">
                {due.slice(0, 6).map(({ outreach: o, step }) => {
                  const c = data.contacts.find((x) => x.id === o.contactId);
                  return (
                    <li key={o.id}>
                      <Link href="/portal/recruiting#network" className="block px-4 py-2.5 hover:bg-[#fbfbf7]">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="truncate font-medium">{c?.name ?? "Contact removed"}</span>
                          <span className="shrink-0 text-[12px] text-faint">Since {fmtDate(o.date)}</span>
                        </span>
                        <span className="block truncate text-[12.5px] text-muted">{c ? [c.title, c.company].filter(Boolean).join(" at ") : ""}</span>
                        <span className="mt-1 inline-flex items-center gap-1.5 rounded-[2px] bg-[#fbf1da] px-1.5 py-0.5 text-[12px] font-medium text-[#7f5300]">
                          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#c98a00]" />
                          {step.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
                {due.length > 6 && (
                  <li className="px-4 py-2 text-[12.5px] text-muted">
                    And {due.length - 6} more in{" "}
                    <Link href="/portal/recruiting#network" className="text-link hover:underline">
                      My network
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </Card>

          <Card
            title="My applications"
            flush
            action={
              <Link href="/portal/recruiting" className="text-link hover:underline">
                View all
              </Link>
            }
          >
            {myApps.length === 0 ? (
              <Empty>No applications yet.</Empty>
            ) : (
              <ul className="divide-y divide-edge">
                {myApps.slice(0, 5).map((a) => (
                  <li key={a.id}>
                    <Link href={`/portal/companies/${companySlug(a.company)}`} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-[#fbfbf7]">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{a.company}</span>
                        <span className="block truncate text-[12.5px] text-muted">{a.position}</span>
                      </span>
                      <Badge tone={stageTone(a.stage)}>{a.stage}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
}

function Row({ href, label, value }: { href: string; label: string; value: string | number }) {
  return (
    <li>
      <Link href={href} className="flex items-center justify-between px-4 py-2.5 hover:bg-[#fbfbf7]">
        <span>{label}</span>
        <span className="text-muted tabular-nums">{value}</span>
      </Link>
    </li>
  );
}

function TaskList({ label, tasks, onToggle, now }: { label: string; tasks: TaskInstance[]; onToggle: (t: TaskInstance) => void; now: Date }) {
  if (!tasks.length) return null;
  return (
    <div>
      <p className="border-b border-edge bg-stone px-4 py-1.5 text-[12px] font-medium text-muted">
        {label} <span className="ml-1 text-faint tabular-nums">{tasks.length}</span>
      </p>
      <ul className="divide-y divide-edge">
        {tasks.map((t) => {
          const days = Math.round((t.due.getTime() - now.getTime()) / DAY);
          const late = !t.done && days < 0;
          return (
            <li key={t.key} className="flex gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={!!t.done}
                onChange={() => onToggle(t)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
                aria-label={`Mark "${t.template.title}" ${t.done ? "not done" : "done"}`}
              />
              <div className="min-w-0 flex-1">
                <p className={t.done ? "text-muted line-through" : "font-medium"}>{t.template.title}</p>
                {!t.done && <p className="mt-0.5 text-[13px] text-muted">{t.template.body}</p>}
                <p className="mt-0.5 text-[12px] text-faint">
                  {t.semester}, {whenLabel(t.template.when).replace(/^W/, "w").replace(/^L/, "l")}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className={`text-[13px] tabular-nums ${late ? "font-medium text-[#a8261b]" : "text-ink-2"}`}>{fmtDate(t.due)}</p>
                {!t.done && (
                  <p className="text-[12px] text-faint">{days < 0 ? `${-days} days late` : days === 0 ? "Today" : `In ${days} days`}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
