"use client";

import { useMemo, useState, type ReactNode } from "react";
import { usePortal } from "@/portal/store";
import { classStanding, fullName, isAlum, isExec, semestersCompleted } from "@/portal/logic";
import { ROLES, SCHOOLS, type Member, type Term } from "@/portal/types";
import { Avatar, Badge, Card, Drawer, Empty, Input, PageTitle, Select, Th, Td } from "@/portal/ui";

type View = "current" | "alumni" | "everyone";
const VIEWS: { key: View; label: string }[] = [
  { key: "current", label: "Current members" },
  { key: "alumni", label: "Alumni" },
  { key: "everyone", label: "Everyone" },
];

const ALL = "All";

function termLabel(t: Term) {
  return `${t[0] === "F" ? "Fall" : "Spring"} ${t.slice(1)}`;
}

function StandingBadge({ gradYear }: { gradYear: number }) {
  const s = classStanding(gradYear);
  return <Badge tone={s === "Alumni" ? "gray" : "blue"}>{s}</Badge>;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 border-b border-line py-2.5 text-sm last:border-b-0">
      <dt className="text-slate">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export default function DirectoryPage() {
  const { data, me } = usePortal();
  const [view, setView] = useState<View>("current");
  const [q, setQ] = useState("");
  const [school, setSchool] = useState(ALL);
  const [role, setRole] = useState(ALL);
  const [practice, setPractice] = useState(ALL);
  const [year, setYear] = useState(ALL);
  const [openId, setOpenId] = useState<string | null>(null);

  const years = useMemo(
    () => [...new Set(data.members.map((m) => m.gradYear))].sort((a, b) => b - a).map(String),
    [data.members],
  );

  const inView = useMemo(
    () =>
      data.members.filter((m) => (view === "current" ? !isAlum(m) : view === "alumni" ? isAlum(m) : true)),
    [data.members, view],
  );

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return inView
      .filter((m) => {
        if (needle) {
          const hay = `${fullName(m)} ${m.schoolEmail} ${m.personalEmail}`.toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        if (school !== ALL && m.school !== school) return false;
        if (role !== ALL && m.role !== role) return false;
        if (practice !== ALL && m.practice !== practice) return false;
        if (year !== ALL && String(m.gradYear) !== year) return false;
        return true;
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
  }, [inView, q, school, role, practice, year]);

  const activeCount = useMemo(() => data.members.filter((m) => !isAlum(m)).length, [data.members]);
  const bySchool = useMemo(
    () => SCHOOLS.map((s) => ({ school: s, count: inView.filter((m) => m.school === s).length })),
    [inView],
  );

  const selected = data.members.find((m) => m.id === openId);

  if (!me) return null;

  const canSeePrivate = (m: Member) => isExec(me) || m.id === me.id;

  return (
    <div>
      <PageTitle title="Directory" sub="Every Graphite member and alum across the five Claremont Colleges." />

      <div className="mb-6 flex flex-wrap gap-0 border border-line bg-white" role="tablist">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            role="tab"
            aria-selected={view === v.key}
            onClick={() => setView(v.key)}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              view === v.key ? "bg-accent text-white" : "text-slate hover:bg-cloud hover:text-ink"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        <span className="border border-line bg-white px-3 py-1.5">
          <span className="font-semibold">{activeCount}</span> <span className="text-slate">active members</span>
        </span>
        {bySchool.map((s) => (
          <button
            key={s.school}
            type="button"
            onClick={() => setSchool(school === s.school ? ALL : s.school)}
            className={`border px-3 py-1.5 transition-colors ${
              school === s.school ? "border-accent bg-accent text-white" : "border-line bg-white hover:bg-cloud"
            }`}
          >
            {s.school} <span className={school === s.school ? "text-white/80" : "text-slate"}>{s.count}</span>
          </button>
        ))}
      </div>

      <Card>
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            type="search"
            placeholder="Search name or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search name or email"
          />
          <Select aria-label="School" value={school} onChange={(e) => setSchool(e.target.value)} options={[ALL, ...SCHOOLS]} />
          <Select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value)} options={[ALL, ...ROLES]} />
          <Select
            aria-label="Practice"
            value={practice}
            onChange={(e) => setPractice(e.target.value)}
            options={[ALL, "Strategy", "Digital"]}
          />
          <Select aria-label="Class year" value={year} onChange={(e) => setYear(e.target.value)} options={[ALL, ...years]} />
        </div>

        {rows.length === 0 ? (
          <Empty>No members match these filters.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-line bg-cloud/50">
                <tr>
                  <Th>Name</Th>
                  <Th>School</Th>
                  <Th>Class</Th>
                  <Th>Practice</Th>
                  <Th>Role</Th>
                  <Th>School email</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => setOpenId(m.id)}
                    className="cursor-pointer border-b border-line last:border-b-0 hover:bg-cloud/60"
                  >
                    <Td>
                      <span className="flex items-center gap-3">
                        <Avatar name={fullName(m)} photo={m.photo} />
                        <span className="font-medium">{fullName(m)}</span>
                      </span>
                    </Td>
                    <Td>{m.school}</Td>
                    <Td>
                      <span className="flex items-center gap-2">
                        {m.gradYear} <StandingBadge gradYear={m.gradYear} />
                      </span>
                    </Td>
                    <Td>{m.practice}</Td>
                    <Td>
                      {m.role}
                      {m.execTitle && <span className="block text-xs text-slate">{m.execTitle}</span>}
                    </Td>
                    <Td>
                      <a
                        href={`mailto:${m.schoolEmail}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-accent hover:underline"
                      >
                        {m.schoolEmail}
                      </a>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="mt-3 text-xs text-slate">Class standing and alumni status update automatically from graduation year.</p>

      <Drawer open={!!selected} onClose={() => setOpenId(null)} title={selected ? fullName(selected) : "Profile"}>
        {selected && (
          <div>
            <div className="mb-6 flex items-center gap-4">
              <Avatar name={fullName(selected)} photo={selected.photo} size={72} />
              <div>
                <p className="font-serif text-2xl">{fullName(selected)}</p>
                <p className="text-sm text-slate">
                  {selected.execTitle ?? selected.role} · {selected.practice}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StandingBadge gradYear={selected.gradYear} />
                  {isAlum(selected) ? <Badge>Alumni</Badge> : <Badge tone="green">Active</Badge>}
                </div>
              </div>
            </div>
            <dl>
              <Row label="School">{selected.school}</Row>
              <Row label="Class year">{selected.gradYear}</Row>
              <Row label="Practice">{selected.practice}</Row>
              <Row label="Role">{selected.role}</Row>
              {selected.execTitle && <Row label="Exec title">{selected.execTitle}</Row>}
              <Row label="School email">
                <a href={`mailto:${selected.schoolEmail}`} className="text-accent hover:underline">
                  {selected.schoolEmail}
                </a>
              </Row>
              <Row label="Personal email">
                <a href={`mailto:${selected.personalEmail}`} className="text-accent hover:underline">
                  {selected.personalEmail}
                </a>
              </Row>
              <Row label="Phone">
                {canSeePrivate(selected) ? selected.phone || "Not provided" : <span className="text-slate">Visible to exec only</span>}
              </Row>
              <Row label="Student ID">
                {canSeePrivate(selected) ? (
                  selected.studentId || "Not provided"
                ) : (
                  <span className="text-slate">Visible to exec only</span>
                )}
              </Row>
              <Row label="LinkedIn">
                {selected.linkedin ? (
                  <a href={selected.linkedin} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                    {selected.linkedin}
                  </a>
                ) : (
                  <span className="text-slate">Not provided</span>
                )}
              </Row>
              <Row label="Membership">
                Joined {termLabel(selected.joinedTerm)} · {semestersCompleted(selected.joinedTerm)} semester
                {semestersCompleted(selected.joinedTerm) === 1 ? "" : "s"} completed
              </Row>
              <Row label="Public website">{selected.showOnWebsite ? "Shown" : "Hidden"}</Row>
            </dl>
          </div>
        )}
      </Drawer>
    </div>
  );
}
