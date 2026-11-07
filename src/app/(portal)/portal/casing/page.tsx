"use client";

import { useState } from "react";
import { Avg, CaseForm, CaseView, CasebookForm, CasebookView, OpenCasebook, casesIn } from "@/portal/casing";
import { caseDoneBy, casePage, caseStats } from "@/portal/logic";
import { usePortal } from "@/portal/store";
import { CASE_TYPES, type CaseStats, type CaseStudy, type CaseType, type Casebook } from "@/portal/types";
import { Badge, Button, Drawer, Empty, Input, PageTitle, Segmented, Select, TableWrap, Tabs, Td, Th, rowCls } from "@/portal/ui";

type Tab = "casebooks" | "cases";
type Panel =
  | { kind: "book"; id: string }
  | { kind: "case"; id: string }
  | { kind: "add-book" }
  | { kind: "edit-book"; id: string }
  | { kind: "add-case"; casebookId?: string }
  | { kind: "edit-case"; id: string };

const SORTS = [
  { value: "book", label: "Casebook order" },
  { value: "new", label: "Newest" },
  { value: "easy", label: "Easiest first" },
  { value: "hard", label: "Hardest first" },
  { value: "math", label: "Most math" },
  { value: "best", label: "Most recommended" },
  { value: "done", label: "Most done" },
] as const;
type Sort = (typeof SORTS)[number]["value"];
type Status = "all" | "todo" | "done";

/**
 * Practice cases. Casebooks open in Google Drive; each case is listed from
 * one. Members' thoughts on a case stay hidden until you've done it.
 */
export default function CasingPage() {
  const { data, me } = usePortal();
  const [tab, setTab] = useState<Tab>("casebooks");
  const [panel, setPanel] = useState<Panel | null>(null);
  if (!me) return null;

  const book = (id: string) => data.casebooks.find((b) => b.id === id);
  const kase = (id: string) => data.cases.find((c) => c.id === id);
  const close = () => setPanel(null);
  const openBook = (id: string) => setPanel({ kind: "book", id });
  const openCase = (id: string) => setPanel({ kind: "case", id });

  let title = "";
  let body: React.ReactNode = null;
  if (panel?.kind === "book" && book(panel.id)) {
    const b = book(panel.id)!;
    title = b.title;
    body = (
      <CasebookView
        key={b.id}
        book={b}
        onOpenCase={openCase}
        onAddCase={() => setPanel({ kind: "add-case", casebookId: b.id })}
        onEdit={() => setPanel({ kind: "edit-book", id: b.id })}
        onDeleted={close}
      />
    );
  } else if (panel?.kind === "case" && kase(panel.id)) {
    const c = kase(panel.id)!;
    title = c.title;
    body = <CaseView key={c.id} kase={c} onOpenBook={openBook} onEdit={() => setPanel({ kind: "edit-case", id: c.id })} onDeleted={close} />;
  } else if (panel?.kind === "add-book" || panel?.kind === "edit-book") {
    const b = panel.kind === "edit-book" ? book(panel.id) : undefined;
    title = b ? "Edit casebook" : "Add a casebook";
    // Saved or cancelled: back to the casebook, or closed if it was a new one that was cancelled.
    body = <CasebookForm book={b} onDone={(id) => (id ? openBook(id) : close())} />;
  } else if (panel?.kind === "add-case" || panel?.kind === "edit-case") {
    const c = panel.kind === "edit-case" ? kase(panel.id) : undefined;
    title = c ? "Edit case" : "Add a case";
    body = (
      <CaseForm
        kase={c}
        casebookId={panel.kind === "add-case" ? panel.casebookId : undefined}
        onDone={(id) => (id ? openCase(id) : panel.kind === "add-case" && panel.casebookId ? openBook(panel.casebookId) : close())}
      />
    );
  }

  return (
    <div>
      <PageTitle
        title="Casing"
        sub="Practice cases from the club's casebooks. Open a casebook in Google Drive, or find a case by type, difficulty and how much math it takes. Members' thoughts on a case stay hidden until you've done it, so nothing gets spoiled."
        actions={
          <>
            <Button variant="secondary" onClick={() => setPanel({ kind: "add-book" })}>
              Add casebook
            </Button>
            <Button onClick={() => setPanel({ kind: "add-case" })}>Add case</Button>
          </>
        }
      />
      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "casebooks", label: "Casebooks", count: data.casebooks.length },
          { value: "cases", label: "Cases", count: data.cases.length },
        ]}
      />
      {tab === "casebooks" ? <Casebooks onOpen={openBook} onAdd={() => setPanel({ kind: "add-book" })} /> : <Cases onOpen={openCase} />}
      <Drawer open={!!body} onClose={close} title={title}>
        {body}
      </Drawer>
    </div>
  );
}

function Casebooks({ onOpen, onAdd }: { onOpen: (id: string) => void; onAdd: () => void }) {
  const { data, me } = usePortal();
  if (!me) return null;
  if (!data.casebooks.length) {
    return (
      <div className="rounded-[3px] border border-edge bg-white">
        <Empty>
          No casebooks yet.{" "}
          <button type="button" className="text-link hover:underline" onClick={onAdd}>
            Add the first one
          </button>{" "}
          with its Google Drive link.
        </Empty>
      </div>
    );
  }
  const books = [...data.casebooks].sort((a, b) => a.title.localeCompare(b.title));
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {books.map((b) => (
        <CasebookCard key={b.id} book={b} onOpen={() => onOpen(b.id)} />
      ))}
    </ul>
  );
}

function CasebookCard({ book: b, onOpen }: { book: Casebook; onOpen: () => void }) {
  const { data, me } = usePortal();
  if (!me) return null;
  const cases = casesIn(data.cases, b.id);
  const done = cases.filter((c) => caseDoneBy(data, c.id, me.id)).length;
  return (
    <li className="flex flex-col rounded-[3px] border border-edge bg-white">
      <div className="flex-1 px-4 pt-3.5 pb-3">
        <h2 className="text-[15px] font-medium">
          <button type="button" onClick={onOpen} className="text-left hover:underline">
            {b.title}
          </button>
        </h2>
        {b.source && <p className="text-[12.5px] text-muted">{b.source}</p>}
        {b.description && <p className="mt-2 line-clamp-2 text-[13px] text-ink-2">{b.description}</p>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-edge px-4 py-2.5">
        <button type="button" onClick={onOpen} className="text-[13px] text-link hover:underline">
          {cases.length} {cases.length === 1 ? "case" : "cases"}
          {done > 0 && `, ${done} done by you`}
        </button>
        <OpenCasebook book={b} />
      </div>
    </li>
  );
}

function Cases({ onOpen }: { onOpen: (id: string) => void }) {
  const { data, me } = usePortal();
  const [query, setQuery] = useState("");
  const [book, setBook] = useState("");
  const [type, setType] = useState<"" | CaseType>("");
  const [status, setStatus] = useState<Status>("all");
  const [sort, setSort] = useState<Sort>("book");
  if (!me) return null;

  const books = new Map(data.casebooks.map((b) => [b.id, b]));
  const q = query.trim().toLowerCase();
  const all = data.cases.map((c) => ({ c, s: caseStats(data, c.id), done: !!caseDoneBy(data, c.id, me.id), book: books.get(c.casebookId) }));
  const doneCount = all.filter((r) => r.done).length;
  // Cases without the number being sorted on go last.
  const by = (x?: number, y?: number, high = true) => (x == null ? (y == null ? 0 : 1) : y == null ? -1 : high ? y - x : x - y);
  const rows = all
    .filter(
      (r) =>
        (!q || [r.c.title, r.c.industry, r.c.summary, r.c.type].some((t) => t.toLowerCase().includes(q))) &&
        (!book || r.c.casebookId === book) &&
        (!type || r.c.type === type) &&
        (status === "all" || (status === "done") === r.done),
    )
    .sort((a, b) => {
      const d =
        sort === "new"
          ? b.c.createdAt.localeCompare(a.c.createdAt)
          : sort === "easy"
            ? by(a.s.avg.difficulty, b.s.avg.difficulty, false)
            : sort === "hard"
              ? by(a.s.avg.difficulty, b.s.avg.difficulty)
              : sort === "math"
                ? by(a.s.avg.math, b.s.avg.math)
                : sort === "best"
                  ? by(a.s.avg.quality, b.s.avg.quality)
                  : sort === "done"
                    ? b.s.done - a.s.done
                    : (a.book?.title ?? "").localeCompare(b.book?.title ?? "") || (parseInt(a.c.page) || 9999) - (parseInt(b.c.page) || 9999);
      return d || a.c.title.localeCompare(b.c.title);
    });

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
        <div className="w-full md:max-w-[15rem]">
          <Input type="search" placeholder="Search cases" aria-label="Search cases" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="w-full md:w-52">
          <Select
            aria-label="Casebook"
            value={book}
            onChange={(e) => setBook(e.target.value)}
            options={[{ value: "", label: "All casebooks" }, ...[...data.casebooks].sort((a, b) => a.title.localeCompare(b.title)).map((b) => ({ value: b.id, label: b.title }))]}
          />
        </div>
        <div className="w-full md:w-44">
          <Select aria-label="Type of case" value={type} onChange={(e) => setType(e.target.value as "" | CaseType)} options={[{ value: "", label: "All types" }, ...CASE_TYPES]} />
        </div>
        <div className="w-full md:w-48">
          <Select aria-label="Sort cases by" value={sort} onChange={(e) => setSort(e.target.value as Sort)} options={SORTS.map((s) => ({ value: s.value, label: `Sort: ${s.label}` }))} />
        </div>
        <Segmented
          label="Show"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All" },
            { value: "todo", label: "Not done yet" },
            { value: "done", label: "Done" },
          ]}
        />
        <p className="text-[13px] text-muted tabular-nums md:ml-auto">
          You&apos;ve done {doneCount} of {all.length}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[3px] border border-edge bg-white">
          <Empty>{data.cases.length ? "No cases match these filters." : "No cases yet. Open a casebook and add the cases in it."}</Empty>
        </div>
      ) : (
        <>
          <div className="max-md:hidden">
            <TableWrap>
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>Case</Th>
                    <Th>Type</Th>
                    <Th className="text-right">Difficulty</Th>
                    <Th className="text-right">Math</Th>
                    <Th className="text-right">Worth practicing</Th>
                    <Th className="text-right">Done by</Th>
                    <Th>
                      <span className="sr-only">You</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.c.id} className={`cursor-pointer ${rowCls}`} onClick={() => onOpen(r.c.id)}>
                      <Td>
                        <button type="button" className="text-left font-medium hover:underline" onClick={(e) => {
                            e.stopPropagation();
                            onOpen(r.c.id);
                          }}>
                          {r.c.title}
                        </button>
                        <span className="block text-[12px] text-muted">{[r.book?.title, casePage(r.c)].filter(Boolean).join(", ")}</span>
                      </Td>
                      <Td className="text-muted">
                        {r.c.type}
                        <span className="block text-[12px] text-faint">{r.c.format}</span>
                      </Td>
                      <Td className="text-right tabular-nums">
                        <Avg value={r.s.avg.difficulty} />
                      </Td>
                      <Td className="text-right tabular-nums">
                        <Avg value={r.s.avg.math} />
                      </Td>
                      <Td className="text-right tabular-nums">
                        <Avg value={r.s.avg.quality} />
                      </Td>
                      <Td className="text-right tabular-nums">{r.s.done}</Td>
                      <Td>{r.done && <Badge tone="green">Done</Badge>}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </div>
          <ul className="space-y-2 md:hidden">
            {rows.map((r) => (
              <CaseCard key={r.c.id} kase={r.c} stats={r.s} done={r.done} bookTitle={r.book?.title} onOpen={() => onOpen(r.c.id)} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function CaseCard({ kase: c, stats: s, done, bookTitle, onOpen }: { kase: CaseStudy; stats: CaseStats; done: boolean; bookTitle?: string; onOpen: () => void }) {
  return (
    <li>
      <button type="button" onClick={onOpen} className="block w-full rounded-[3px] border border-edge bg-white px-4 py-3 text-left hover:bg-[#fbfbf7]">
        <span className="flex items-start justify-between gap-2">
          <span className="font-medium">{c.title}</span>
          {done && <Badge tone="green">Done</Badge>}
        </span>
        <span className="block text-[12px] text-muted">{[bookTitle, casePage(c), c.type].filter(Boolean).join(" · ")}</span>
        <span className="mt-1.5 flex flex-wrap gap-x-4 text-[12.5px] text-ink-2 tabular-nums">
          <span>
            Difficulty <Avg value={s.avg.difficulty} />
          </span>
          <span>
            Math <Avg value={s.avg.math} />
          </span>
          <span>Done by {s.done}</span>
        </span>
      </button>
    </li>
  );
}
