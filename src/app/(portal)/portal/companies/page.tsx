"use client";

import Link from "@/components/app-link";
import { useState } from "react";
import { usePortal } from "@/portal/store";
import { Button, Drawer, Empty, Input, PageTitle, Td, Th } from "@/portal/ui";
import { ReportForm, companyRows } from "@/portal/views/company";

export default function CompaniesPage() {
  const { data, me } = usePortal();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);

  if (!me) return null;

  const rows = companyRows(data);
  const q = query.trim().toLowerCase();
  const filtered = q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows;

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Companies"
        sub="Every firm Graphite members have recruited with: interview notes by year, outcomes and discussion."
        actions={
          <Button variant="secondary" onClick={() => setAdding(true)}>
            Add company notes
          </Button>
        }
      />

      <div className="max-w-sm">
        <Input type="search" placeholder="Search companies" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search companies" />
      </div>

      <div className="mt-8 overflow-x-auto">
        {filtered.length === 0 ? (
          <Empty>{rows.length === 0 ? "No companies yet. Add notes from an interview to start the list." : "No companies match your search."}</Empty>
        ) : (
          <table className="w-full min-w-[680px] text-sm">
            <thead className="border-b border-ink">
              <tr>
                <Th>Company</Th>
                <Th>Interview reports</Th>
                <Th>Members applied</Th>
                <Th>Offers</Th>
                <Th>Latest year</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.name} className="group relative border-b border-line">
                  <Td>
                    <Link href={`/portal/companies/${r.slug}`} className="display text-[1.25rem] leading-tight after:absolute after:inset-0 group-hover:underline">
                      {r.name}
                    </Link>
                  </Td>
                  <Td className="tabular-nums">{r.reports}</Td>
                  <Td className="tabular-nums">{r.applicants}</Td>
                  <Td className="tabular-nums">{r.offers}</Td>
                  <Td className="text-muted tabular-nums">{r.latestYear ?? "None"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Drawer open={adding} onClose={() => setAdding(false)} title="Add interview report">
        {adding && <ReportForm onDone={() => setAdding(false)} />}
      </Drawer>
    </div>
  );
}
