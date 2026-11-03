"use client";

import { useMemo, useState, type ReactNode } from "react";
import { usePortal } from "@/portal/store";
import { classAtTimeLabel, classStanding, companySlug, fullName, highestRole, isAlum, isExec, semestersCompleted } from "@/portal/logic";
import Link from "@/components/app-link";
import { ROLES, SCHOOLS, type Member, type Term } from "@/portal/types";
import { Avatar, Badge, Button, Drawer, Empty, Input, PageTitle, Select, TableWrap, Tabs, Td, Th, rowCls } from "@/portal/ui";

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
    <div className="grid grid-cols-[120px_1fr] gap-3 border-b border-edge py-2 text-[13.5px] last:border-b-0">
      <dt className="text-muted">{label}</dt>
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
  // Alumni are listed with the most senior role they held.
  const roleOf = (m: Member) => (isAlum(m) ? highestRole(m, data.roleChanges) : m.role);
  // Personal email is the one that lasts; school email is the fallback until someone adds theirs.
  const emailOf = (m: Member) => m.personalEmail || m.schoolEmail;
  const filtered = school !== ALL || role !== ALL || practice !== ALL || year !== ALL || q.trim() !== "";
  const clearFilters = () => {
    setSchool(ALL);
    setRole(ALL);
    setPractice(ALL);
    setYear(ALL);
    setQ("");
  };

  return (
    <div>
      <PageTitle title="Directory" sub="Every Graphite member and alum across the five Claremont Colleges." />

      <Tabs value={view} options={VIEWS.map((v) => ({ value: v.key, label: v.label }))} onChange={setView} />

      <div className="mb-4 flex flex-wrap items-center gap-1 text-[13px]">
        <span className="mr-2">
          <span className="font-medium tabular-nums">{activeCount}</span> <span className="text-muted">active members</span>
        </span>
        <button
          type="button"
          onClick={() => setSchool(ALL)}
          aria-pressed={school === ALL}
          className={`h-7 rounded-[3px] px-2 transition-colors ${
            school === ALL ? "bg-stone font-medium text-ink shadow-[inset_0_0_0_1px_var(--color-edge)]" : "text-ink-2 hover:bg-stone hover:text-ink"
          }`}
        >
          All schools <span className="text-faint tabular-nums">{inView.length}</span>
        </button>
        {bySchool.map((s) => (
          <button
            key={s.school}
            type="button"
            onClick={() => setSchool(school === s.school ? ALL : s.school)}
            aria-pressed={school === s.school}
            className={`h-7 rounded-[3px] px-2 transition-colors ${
              school === s.school ? "bg-stone font-medium text-ink shadow-[inset_0_0_0_1px_var(--color-edge)]" : "text-ink-2 hover:bg-stone hover:text-ink"
            }`}
          >
            {s.school} <span className="text-faint tabular-nums">{s.count}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="w-full max-w-xs">
          <Input
            type="search"
            placeholder="Search name or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search name or email"
          />
        </div>
        <div className="w-36">
          <Select aria-label="School" value={school} onChange={(e) => setSchool(e.target.value)} options={[{ value: ALL, label: "All schools" }, ...SCHOOLS]} />
        </div>
        <div className="w-48">
          <Select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value)} options={[{ value: ALL, label: "All roles" }, ...ROLES]} />
        </div>
        <div className="w-36">
          <Select aria-label="Practice" value={practice} onChange={(e) => setPractice(e.target.value)} options={[{ value: ALL, label: "Both practices" }, "Strategy", "Digital"]} />
        </div>
        <div className="w-28">
          <Select aria-label="Class year" value={year} onChange={(e) => setYear(e.target.value)} options={[{ value: ALL, label: "All years" }, ...years]} />
        </div>
        {filtered && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
        <span className="text-[12.5px] text-muted tabular-nums sm:ml-auto">
          {rows.length} of {inView.length}
        </span>
      </div>

      <TableWrap>
        {rows.length === 0 ? (
          <Empty>
            No members match these filters.{" "}
            <button type="button" onClick={clearFilters} className="text-link hover:underline">
              Show everyone
            </button>
          </Empty>
        ) : (
          <table className="w-full min-w-[860px]">
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Role</Th>
                <Th>School</Th>
                <Th>Class</Th>
                <Th>Practice</Th>
                <Th>Email</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} onClick={() => setOpenId(m.id)} className={`cursor-pointer ${rowCls}`}>
                  <Td>
                    <span className="flex items-center gap-2.5">
                      <Avatar name={fullName(m)} photo={m.photo} size={24} />
                      <span className="font-medium whitespace-nowrap">{fullName(m)}</span>
                    </span>
                  </Td>
                  <Td>
                    <span className="block whitespace-nowrap">{m.execTitle ?? roleOf(m)}</span>
                    {m.execTitle && <span className="block text-[12.5px] text-muted">{roleOf(m)}</span>}
                  </Td>
                  <Td className="whitespace-nowrap">{m.school}</Td>
                  <Td>
                    <span className="whitespace-nowrap tabular-nums">{m.gradYear}</span>
                    <span className="ml-2 text-[12.5px] text-muted">{classStanding(m.gradYear)}</span>
                  </Td>
                  <Td className="text-ink-2">{m.practice}</Td>
                  <Td>
                    <a href={`mailto:${emailOf(m)}`} onClick={(e) => e.stopPropagation()} className="text-ink-2 hover:underline">
                      {emailOf(m)}
                    </a>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableWrap>
      <p className="mt-2 text-[12px] text-muted">Class standing and alumni status update automatically from graduation year.</p>

      <Drawer open={!!selected} onClose={() => setOpenId(null)} title={selected ? fullName(selected) : "Profile"}>
        {selected && (
          <div>
            <div className="mb-5 flex items-center gap-3">
              <Avatar name={fullName(selected)} photo={selected.photo} size={48} />
              <div className="min-w-0">
                <p className="font-semibold">{fullName(selected)}</p>
                <p className="text-[13px] text-muted">
                  {selected.execTitle ?? roleOf(selected)}, {selected.practice}
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
              <Row label={isAlum(selected) ? "Final role" : "Role"}>{roleOf(selected)}</Row>
              {selected.execTitle && <Row label="Exec title">{selected.execTitle}</Row>}
              <Row label="Email">
                {emailOf(selected) ? (
                  <a href={`mailto:${emailOf(selected)}`} className="text-link hover:underline">
                    {emailOf(selected)}
                  </a>
                ) : (
                  <span className="text-muted">Not provided</span>
                )}
              </Row>
              <Row label="Phone">
                {canSeePrivate(selected) ? selected.phone || "Not provided" : <span className="text-muted">Visible to exec only</span>}
              </Row>
              <Row label="LinkedIn">
                {selected.linkedin ? (
                  <a href={selected.linkedin} target="_blank" rel="noreferrer" className="text-link hover:underline">
                    {selected.linkedin}
                  </a>
                ) : (
                  <span className="text-muted">Not provided</span>
                )}
              </Row>
              <Row label="Membership">
                Joined {termLabel(selected.joinedTerm)}, {semestersCompleted(selected.joinedTerm)} semester
                {semestersCompleted(selected.joinedTerm) === 1 ? "" : "s"} completed
              </Row>
              <Row label="Experience">
                {(() => {
                  const jobs = data.jobs.filter((j) => j.memberId === selected.id).sort((a, b) => b.year - a.year);
                  if (!jobs.length) return <span className="text-muted">None added yet</span>;
                  return (
                    <ul className="space-y-1.5">
                      {jobs.map((j) => (
                        <li key={j.id}>
                          {j.role} at{" "}
                          <Link href={`/portal/companies/${companySlug(j.company)}`} className="text-link hover:underline" onClick={() => setOpenId(null)}>
                            {j.company}
                          </Link>
                          <span className="block text-[12px] text-muted">
                            {classAtTimeLabel(j)} {j.year}
                          </span>
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </Row>
              <Row label="Public website">{selected.showOnWebsite ? "Shown" : "Hidden"}</Row>
            </dl>
          </div>
        )}
      </Drawer>
    </div>
  );
}
