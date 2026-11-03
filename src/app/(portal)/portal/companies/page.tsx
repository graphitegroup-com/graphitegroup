"use client";

import Link from "@/components/app-link";
import { useState } from "react";
import { MIN_GRADERS } from "@/portal/logic";
import { GradeForm } from "@/portal/grades";
import { usePortal } from "@/portal/store";
import { Button, Drawer, Empty, GradeTile, Input, PageTitle, Segmented, TableWrap, Td, Th, rowCls } from "@/portal/ui";
import { ReportForm, companyRows, type CompanyRow } from "@/portal/views/company";

type Sort = "activity" | "grade";
const SORTS = [
  { value: "activity", label: "Most reports" },
  { value: "grade", label: "Best graded" },
] as const;

const byGrade = (a: CompanyRow, b: CompanyRow) =>
  // Lettered firms first, best score first; then firms still collecting grades.
  Number(!!b.grade.letter) - Number(!!a.grade.letter) || (b.grade.score ?? 0) - (a.grade.score ?? 0) || b.grade.graders - a.grade.graders || a.name.localeCompare(b.name);

export default function CompaniesPage() {
  const { data, me } = usePortal();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("activity");
  const [adding, setAdding] = useState<"report" | "grade" | null>(null);

  if (!me) return null;

  const rows = companyRows(data);
  const q = query.trim().toLowerCase();
  const filtered = (q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows).sort(sort === "grade" ? byGrade : () => 0);

  return (
    <div>
      <PageTitle
        title="Companies"
        sub="Every firm Graphite members have recruited with, graded by the members who went through it, with interview notes by year and forum threads."
        actions={
          <>
            <Button variant="secondary" onClick={() => setAdding("report")}>
              Add interview report
            </Button>
            <Button onClick={() => setAdding("grade")}>Grade a firm</Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:max-w-xs">
          <Input type="search" placeholder="Search companies" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search companies" />
        </div>
        <Segmented label="Sort companies" value={sort} options={SORTS} onChange={setSort} />
        <p className="text-[12.5px] text-muted sm:ml-auto">Letters show once {MIN_GRADERS} members have graded a firm.</p>
      </div>

      <TableWrap>
        {filtered.length === 0 ? (
          <Empty>{rows.length === 0 ? "No companies yet. Grade a firm or add an interview report to start the list." : "No companies match your search."}</Empty>
        ) : (
          <table className="w-full min-w-[760px]">
            <thead>
              <tr>
                <Th>Company</Th>
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
