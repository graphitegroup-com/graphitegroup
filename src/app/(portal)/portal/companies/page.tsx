"use client";

import Link from "@/components/app-link";
import { useState } from "react";
import { MIN_GRADERS } from "@/portal/logic";
import { GradeForm } from "@/portal/grades";
import { HIRE_LEVELS, LevelChips } from "@/portal/jobs";
import { usePortal } from "@/portal/store";
import { COMPANY_TYPES, type ClassLevel, type CompanyType } from "@/portal/types";
import { Button, Drawer, Empty, GradeTile, Input, PageTitle, Segmented, Select, TableWrap, Td, Th, rowCls } from "@/portal/ui";
import { ReportForm, companyRows, type CompanyRow } from "@/portal/views/company";

type Sort = "activity" | "grade";
const SORTS = [
  { value: "activity", label: "Most reports" },
  { value: "grade", label: "Best graded" },
] as const;

const HIRED_OPTIONS = [{ value: "any", label: "Anyone" }, ...HIRE_LEVELS.map((l) => ({ value: l, label: l }))] as const;
type Hired = "any" | ClassLevel;
const UNSET = "unset";

const byGrade = (a: CompanyRow, b: CompanyRow) =>
  // Lettered firms first, best score first; then firms still collecting grades.
  Number(!!b.grade.letter) - Number(!!a.grade.letter) || (b.grade.score ?? 0) - (a.grade.score ?? 0) || b.grade.graders - a.grade.graders || a.name.localeCompare(b.name);

export default function CompaniesPage() {
  const { data, me } = usePortal();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("activity");
  const [type, setType] = useState<"" | CompanyType | typeof UNSET>("");
  const [hired, setHired] = useState<Hired>("any");
  const [adding, setAdding] = useState<"report" | "grade" | null>(null);

  if (!me) return null;

  const rows = companyRows(data);
  const q = query.trim().toLowerCase();
  const filtered = rows
    .filter((r) => !q || r.name.toLowerCase().includes(q))
    .filter((r) => !type || (type === UNSET ? !r.type : r.type === type))
    .filter((r) => hired === "any" || r.levels.includes(hired))
    // With a year chosen, firms that hired the most members that year come first.
    .sort(sort === "grade" ? byGrade : hired !== "any" ? (a, b) => (b.hiresByLevel[hired] ?? 0) - (a.hiresByLevel[hired] ?? 0) || a.name.localeCompare(b.name) : () => 0);
  const anyFilter = !!q || !!type || hired !== "any";

  return (
    <div>
      <PageTitle
        title="Companies"
        sub="Every firm Graphite members have recruited with or worked at: graded by the members who went through it, with interview notes, who worked there and in which year."
        actions={
          <>
            <Button variant="secondary" onClick={() => setAdding("report")}>
              Add interview report
            </Button>
            <Button onClick={() => setAdding("grade")}>Grade a firm</Button>
          </>
        }
      />

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="w-full sm:max-w-xs">
          <Input type="search" placeholder="Search companies" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search companies" />
        </div>
        <div className="w-full sm:w-64">
          <Select
            aria-label="Type of company"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            options={[{ value: "", label: "All types of company" }, ...COMPANY_TYPES, { value: UNSET, label: "Type not set yet" }]}
          />
        </div>
        <Segmented label="Sort companies" value={sort} options={SORTS} onChange={setSort} />
      </div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <span className="text-[13px] font-medium text-ink-2">Has hired a</span>
        <Segmented label="Has hired a member in this year of school" value={hired} options={HIRED_OPTIONS} onChange={setHired} />
        <span className="text-[12.5px] text-muted">
          {hired === "any" ? "Pick a year to see where members that age have worked." : `Summers count the year just finished: a ${hired.toLowerCase()} summer.`}
        </span>
        <span className="text-[12.5px] text-muted tabular-nums sm:ml-auto">
          {filtered.length} of {rows.length}
          {anyFilter && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setType("");
                setHired("any");
              }}
              className="ml-2 text-link hover:underline"
            >
              Clear filters
            </button>
          )}
        </span>
      </div>
      <p className="mb-2 text-[12px] text-faint">Letters show once {MIN_GRADERS} members have graded a firm. Hires come from members&apos; Experience on their profiles.</p>

      <TableWrap>
        {filtered.length === 0 ? (
          <Empty>
            {rows.length === 0
              ? "No companies yet. Grade a firm or add an interview report to start the list."
              : hired !== "any"
                ? `No firm in this list has hired a ${hired.toLowerCase()} yet. If you worked somewhere as a ${hired.toLowerCase()}, add it under Experience on your profile.`
                : "No companies match these filters."}
          </Empty>
        ) : (
          <table className="w-full min-w-[960px]">
            <thead>
              <tr>
                <Th>Company</Th>
                <Th>Hired</Th>
                <Th>Grade</Th>
                <Th>Recommend</Th>
                <Th>Interview reports</Th>
                <Th>Members applied</Th>
                <Th>Offers</Th>
                <Th>Threads</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.name} className={`group relative ${rowCls}`}>
                  <Td>
                    <Link href={`/portal/companies/${r.slug}`} className="font-medium after:absolute after:inset-0 group-hover:underline">
                      {r.name}
                    </Link>
                    {r.latestYear && <span className="ml-2 text-[12px] text-faint tabular-nums">{r.latestYear}</span>}
                    <span className="block text-[12px] text-muted">{r.type ?? <span className="text-faint">Type not set</span>}</span>
                  </Td>
                  <Td>
                    <LevelChips levels={r.levels} />
                  </Td>
                  <Td>
                    <span className="flex items-center gap-2">
                      <GradeTile letter={r.grade.letter} />
                      <span className="text-[12px] text-muted tabular-nums">
                        {r.grade.graders ? `${r.grade.graders} ${r.grade.graders === 1 ? "member" : "members"}` : "None yet"}
                      </span>
                    </span>
                  </Td>
                  <Td className="tabular-nums">{r.grade.recommendRate != null ? `${Math.round(r.grade.recommendRate * 100)}%` : <span className="text-faint">None</span>}</Td>
                  <Td className="tabular-nums">{r.reports}</Td>
                  <Td className="tabular-nums">{r.applicants}</Td>
                  <Td className="tabular-nums">{r.offers}</Td>
                  <Td className="tabular-nums">{r.threads}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableWrap>

      <Drawer open={adding === "report"} onClose={() => setAdding(null)} title="Add interview report">
        {adding === "report" && <ReportForm onDone={() => setAdding(null)} />}
      </Drawer>
      <Drawer open={adding === "grade"} onClose={() => setAdding(null)} title="Grade a firm">
        {adding === "grade" && <GradeForm onDone={() => setAdding(null)} />}
      </Drawer>
    </div>
  );
}
