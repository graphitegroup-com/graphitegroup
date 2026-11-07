"use client";

import { useState } from "react";
import { ScorePicker } from "./grades";
import { caseDoneBy, caseNeedsRating, casePage, caseReviewsFor, caseStats, duplicateCase, fmtDate, fullName, isExec, isWebUrl, uid, withProtocol } from "./logic";
import { usePortal } from "./store";
import {
  CASE_FORMATS,
  CASE_RATINGS,
  CASE_ROLES,
  CASE_TYPES,
  type CaseFormat,
  type CaseRatingKey,
  type CaseReview,
  type CaseRole,
  type CaseStudy,
  type CaseType,
  type Casebook,
  type Score,
} from "./types";
import { Avatar, Badge, Button, ButtonLink, Field, Input, ScoreBar, Segmented, Select, Textarea } from "./ui";

/** An average rating to one decimal, or a faint "None". */
export function Avg({ value }: { value?: number }) {
  return value == null ? <span className="text-faint">None</span> : <>{value.toFixed(1)}</>;
}

const isDrive = (url: string) => /^https:\/\/(drive|docs)\.google\.com\//i.test(url.trim());

/** Opens a casebook in a new tab. */
export function OpenCasebook({ book, variant = "secondary" }: { book: Casebook; variant?: "primary" | "secondary" }) {
  return (
    <ButtonLink href={book.driveUrl} variant={variant}>
      {isDrive(book.driveUrl) ? "Open in Google Drive" : "Open the casebook"}
      <span aria-hidden>↗</span>
    </ButtonLink>
  );
}

const sectionCls = "border-t border-edge pt-4 mt-5";
const h3Cls = "mb-2 text-[12px] font-medium tracking-[0.06em] text-muted uppercase";

/* ---------------------------------------------------------------- casebooks */

export function CasebookForm({ book, onDone }: { book?: Casebook; onDone: (id?: string) => void }) {
  const { me, update } = usePortal();
  const [title, setTitle] = useState(book?.title ?? "");
  const [source, setSource] = useState(book?.source ?? "");
  const [link, setLink] = useState(book?.driveUrl ?? "");
  const [description, setDescription] = useState(book?.description ?? "");
  const [error, setError] = useState("");
  if (!me) return null;
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return setError("Give the casebook a name.");
        const url = link.trim() ? withProtocol(link) : "";
        if (!isWebUrl(url)) return setError("Paste the casebook's Google Drive link, starting with https://.");
        const next: Casebook = {
          id: book?.id ?? uid(),
          title: title.trim(),
          source: source.trim(),
          driveUrl: url,
          description: description.trim(),
          addedBy: book?.addedBy ?? me.id,
          createdAt: book?.createdAt ?? new Date().toISOString(),
        };
        update((d) => ({ ...d, casebooks: book ? d.casebooks.map((b) => (b.id === book.id ? next : b)) : [...d.casebooks, next] }));
        onDone(next.id);
      }}
    >
      <Field label="Name">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Graphite Casebook" required />
      </Field>
      <Field label="Where it's from" hint="Who wrote it and when, so members know what they're opening.">
        <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Graphite Group, 2025 edition" />
      </Field>
      <Field label="Google Drive link" hint="In Drive, choose Share, then set General access to “Anyone with the link”, or members will have to request access.">
        <Input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://drive.google.com/file/d/…" required />
      </Field>
      <Field label="About it">
        <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="How hard the cases are, what they cover, where to start." />
      </Field>
      {error && (
        <p role="alert" className="text-[13px] text-[#a8261b]">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit">{book ? "Save changes" : "Add casebook"}</Button>
        <Button variant="secondary" onClick={() => onDone(book?.id)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** A casebook: its Drive link, and the cases members have listed from it. */
export function CasebookView({
  book,
  onOpenCase,
  onAddCase,
  onEdit,
  onDeleted,
}: {
  book: Casebook;
  onOpenCase: (id: string) => void;
  onAddCase: () => void;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const { data, me, update } = usePortal();
  const [confirm, setConfirm] = useState(false);
  if (!me) return null;
  const cases = casesIn(data.cases, book.id);
  const canEdit = book.addedBy === me.id || isExec(me);
  const adder = data.members.find((m) => m.id === book.addedBy);
  return (
    <div>
      {book.source && <p className="text-[13px] text-muted">{book.source}</p>}
      <div className="mt-3">
        <OpenCasebook book={book} variant="primary" />
      </div>
      {book.description && <p className="mt-4 text-[13.5px] whitespace-pre-line text-ink-2">{book.description}</p>}

      <section className={sectionCls} aria-label="Cases in this casebook">
        <h3 className={h3Cls}>Cases in it ({cases.length})</h3>
        {cases.length === 0 ? (
          <p className="text-[13px] text-muted">No cases listed from it yet.</p>
        ) : (
          <ul className="-mx-2">
            {cases.map((c) => {
              const s = caseStats(data, c.id);
              const done = !!caseDoneBy(data, c.id, me.id);
              return (
                <li key={c.id}>
                  <button type="button" onClick={() => onOpenCase(c.id)} className="flex w-full items-start justify-between gap-3 rounded-[3px] px-2 py-2 text-left hover:bg-stone">
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-medium">{c.title}</span>
                      <span className="block text-[12px] text-muted">{[casePage(c), c.type, c.format].filter(Boolean).join(" · ")}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-[12px] text-muted tabular-nums">
                      {s.avg.difficulty != null && <span>Difficulty {s.avg.difficulty.toFixed(1)}</span>}
                      {done && <Badge tone="green">Done</Badge>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <Button variant="secondary" className="mt-3" onClick={onAddCase}>
          Add a case from this casebook
        </Button>
      </section>

      <footer className={`${sectionCls} flex flex-wrap items-center gap-x-3 gap-y-2 text-[12.5px] text-muted`}>
        <span>Added by {adder ? fullName(adder) : "a former member"}</span>
        {canEdit && (
          <>
            <Button variant="ghost" onClick={onEdit}>
              Edit casebook
            </Button>
            {cases.length > 0 ? (
              <span className="text-faint">To delete it, remove its cases first.</span>
            ) : confirm ? (
              <span className="flex items-center gap-1">
                Delete this casebook?
                <Button
                  variant="danger"
                  onClick={() => {
                    update((d) => ({ ...d, casebooks: d.casebooks.filter((b) => b.id !== book.id) }));
                    onDeleted();
                  }}
                >
                  Delete
                </Button>
                <Button variant="ghost" onClick={() => setConfirm(false)}>
                  Cancel
                </Button>
              </span>
            ) : (
              <Button variant="danger" onClick={() => setConfirm(true)}>
                Delete casebook
              </Button>
            )}
          </>
        )}
      </footer>
    </div>
  );
}

/** A casebook's cases in the order they appear in it. */
export const casesIn = (cases: CaseStudy[], casebookId: string) =>
  cases.filter((c) => c.casebookId === casebookId).sort((a, b) => (parseInt(a.page) || 9999) - (parseInt(b.page) || 9999) || a.title.localeCompare(b.title));

/* ---------------------------------------------------------------- cases */

export function CaseForm({ kase, casebookId, onDone }: { kase?: CaseStudy; casebookId?: string; onDone: (id?: string) => void }) {
  const { data, me, update } = usePortal();
  const [title, setTitle] = useState(kase?.title ?? "");
  const [book, setBook] = useState(kase?.casebookId ?? casebookId ?? "");
  const [page, setPage] = useState(kase?.page ?? "");
  const [type, setType] = useState<CaseType>(kase?.type ?? "Profitability");
  const [format, setFormat] = useState<CaseFormat>(kase?.format ?? "Interviewer-led");
  const [industry, setIndustry] = useState(kase?.industry ?? "");
  const [summary, setSummary] = useState(kase?.summary ?? "");
  const [error, setError] = useState("");
  if (!me) return null;
  const books = [...data.casebooks].sort((a, b) => a.title.localeCompare(b.title));
  const industries = [...new Set(data.cases.map((c) => c.industry.trim()).filter(Boolean))].sort();
  if (!books.length) return <p className="text-[13.5px] text-muted">Add a casebook first: every case belongs to one.</p>;
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return setError("Give the case a name.");
        if (!book) return setError("Choose the casebook it's in.");
        if (duplicateCase(data.cases, book, title, kase?.id)) return setError("That casebook already has a case with this name.");
        const next: CaseStudy = {
          id: kase?.id ?? uid(),
          casebookId: book,
          title: title.trim(),
          page: page.trim(),
          type,
          format,
          industry: industry.trim(),
          summary: summary.trim(),
          addedBy: kase?.addedBy ?? me.id,
          createdAt: kase?.createdAt ?? new Date().toISOString(),
        };
        update((d) => ({ ...d, cases: kase ? d.cases.map((c) => (c.id === kase.id ? next : c)) : [...d.cases, next] }));
        onDone(next.id);
      }}
    >
      <Field label="Name">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Coffee chain profit decline" required />
      </Field>
      <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-3">
        <Field label="Casebook">
          <Select value={book} onChange={(e) => setBook(e.target.value)} options={[{ value: "", label: "Choose one" }, ...books.map((b) => ({ value: b.id, label: b.title }))]} />
        </Field>
        <Field label="Page">
          <Input value={page} onChange={(e) => setPage(e.target.value)} placeholder="12" inputMode="numeric" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value as CaseType)} options={CASE_TYPES} />
        </Field>
        <Field label="Industry">
          <Input value={industry} onChange={(e) => setIndustry(e.target.value)} list="case-industries" placeholder="e.g. Retail" />
          <datalist id="case-industries">
            {industries.map((i) => (
              <option key={i} value={i} />
            ))}
          </datalist>
        </Field>
      </div>
      <div>
        <span className="mb-1 block text-[13px] font-medium text-ink-2">Format</span>
        <Segmented label="Format" value={format} onChange={setFormat} options={CASE_FORMATS.map((f) => ({ value: f, label: f }))} />
      </div>
      <Field label="The setup" hint="The prompt in a sentence or two, with no answers. Everyone sees this before doing the case.">
        <Textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
      </Field>
      {error && (
        <p role="alert" className="text-[13px] text-[#a8261b]">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit">{kase ? "Save changes" : "Add case"}</Button>
        <Button variant="secondary" onClick={() => onDone(kase?.id)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/**
 * One case: its setup and averages for everyone; members' thoughts only once
 * you've done it. Marking it done asks for your ratings straight away.
 */
export function CaseView({ kase: c, onOpenBook, onEdit, onDeleted }: { kase: CaseStudy; onOpenBook: (id: string) => void; onEdit: () => void; onDeleted: () => void }) {
  const { data, me, update } = usePortal();
  const [editing, setEditing] = useState(false);
  const [later, setLater] = useState(false);
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!me) return null;
  const book = data.casebooks.find((b) => b.id === c.casebookId);
  const mine = caseDoneBy(data, c.id, me.id);
  const stats = caseStats(data, c.id);
  const reviews = caseReviewsFor(data, c.id, me.id);
  const exec = isExec(me);
  const canEdit = c.addedBy === me.id || exec;
  const showForm = !!mine && (editing || (caseNeedsRating(mine) && !later));

  const markDone = () => {
    setLater(false);
    update((d) => ({ ...d, caseReviews: [...d.caseReviews, { caseId: c.id, memberId: me.id, completedAt: new Date().toISOString(), role: "Candidate", ratings: {}, notes: "" }] }));
  };
  const undo = () => {
    setConfirmUndo(false);
    setEditing(false);
    update((d) => ({ ...d, caseReviews: d.caseReviews.filter((r) => !(r.caseId === c.id && r.memberId === me.id)) }));
  };

  return (
    <div>
      <p className="text-[13px] text-muted">
        {book ? (
          <button type="button" className="text-link hover:underline" onClick={() => onOpenBook(book.id)}>
            {book.title}
          </button>
        ) : (
          "Unknown casebook"
        )}
        {[casePage(c), c.type, c.format, c.industry].filter(Boolean).map((x) => ` · ${x}`)}
      </p>
      {c.summary && <p className="mt-3 text-[14px] whitespace-pre-line">{c.summary}</p>}
      {book && (
        <div className="mt-3">
          <OpenCasebook book={book} />
        </div>
      )}

      <section className={sectionCls} aria-label="Ratings">
        <h3 className={h3Cls}>
          {stats.done ? `Done by ${stats.done} ${stats.done === 1 ? "member" : "members"}` : "Nobody has done it yet"}
          {stats.rated > 0 && stats.rated < stats.done && `, rated by ${stats.rated}`}
        </h3>
        {stats.rated > 0 ? (
          <div className="space-y-1.5">
            {CASE_RATINGS.map((r) => (
              <ScoreBar key={r.key} label={r.label} value={stats.avg[r.key]} />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-muted">No ratings yet. Averages show here once members rate it.</p>
        )}
      </section>

      <section className={sectionCls} aria-label="Your review">
        {!mine ? (
          <div className="rounded-[3px] border border-edge bg-stone px-4 py-3">
            <p className="text-[13.5px] font-medium">Done this case?</p>
            <p className="mt-0.5 text-[13px] text-muted">
              Members&apos; thoughts stay hidden until you&apos;ve done it, so nothing gets spoiled.{" "}
              {stats.written ? `${stats.written} ${stats.written === 1 ? "member has" : "members have"} written about it.` : "Nobody has written about it yet."}
            </p>
            <Button className="mt-3" onClick={markDone}>
              I&apos;ve done this case
            </Button>
          </div>
        ) : showForm ? (
          <ReviewForm
            review={mine}
            first={caseNeedsRating(mine) && !editing}
            onDone={() => {
              setEditing(false);
              setLater(true);
            }}
          />
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="basis-full text-[13.5px]">
              {caseNeedsRating(mine) ? "You haven't rated it yet." : `You did it on ${fmtDate(mine.completedAt)}, as the ${mine.role.toLowerCase()}.`}
            </p>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              {caseNeedsRating(mine) ? "Rate it" : "Edit your review"}
            </Button>
            {confirmUndo ? (
              <span className="flex items-center gap-1 text-[12.5px] text-muted">
                Remove your ratings and thoughts?
                <Button variant="danger" onClick={undo}>
                  Remove
                </Button>
                <Button variant="ghost" onClick={() => setConfirmUndo(false)}>
                  Keep
                </Button>
              </span>
            ) : (
              <Button variant="ghost" onClick={() => setConfirmUndo(true)}>
                Mark not done
              </Button>
            )}
          </div>
        )}
      </section>

      {mine && (
        <section className={sectionCls} aria-label="What members thought">
          <h3 className={h3Cls}>What members thought ({reviews.length})</h3>
          <ul className="divide-y divide-edge">
            {reviews.map((r) => (
              <ReviewItem key={r.memberId} review={r} you={r.memberId === me.id} canRemove={exec && r.memberId !== me.id} />
            ))}
          </ul>
        </section>
      )}

      {canEdit && (
        <footer className={`${sectionCls} flex flex-wrap items-center gap-2 text-[12.5px] text-muted`}>
          <Button variant="ghost" onClick={onEdit}>
            Edit case
          </Button>
          {confirmDelete ? (
            <span className="flex flex-wrap items-center gap-1">
              Delete this case{stats.done ? ` and ${stats.done} ${stats.done === 1 ? "review" : "reviews"}` : ""}?
              <Button
                variant="danger"
                onClick={() => {
                  update((d) => ({ ...d, cases: d.cases.filter((x) => x.id !== c.id), caseReviews: d.caseReviews.filter((r) => r.caseId !== c.id) }));
                  onDeleted();
                }}
              >
                Delete
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </span>
          ) : (
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              Delete case
            </Button>
          )}
        </footer>
      )}
    </div>
  );
}

function ReviewItem({ review: r, you, canRemove }: { review: CaseReview; you: boolean; canRemove: boolean }) {
  const { data, update } = usePortal();
  const m = data.members.find((x) => x.id === r.memberId);
  const name = you ? "You" : m ? fullName(m) : "A former member";
  const rated = CASE_RATINGS.filter((x) => r.ratings[x.key] != null);
  return (
    <li className="py-3">
      <div className="flex items-center gap-2">
        <Avatar name={m ? fullName(m) : "?"} photo={m?.photo} size={22} />
        <span className="text-[13.5px] font-medium">{name}</span>
        <span className="text-[12px] text-muted">
          {r.role} · {fmtDate(r.completedAt)}
          {r.minutes ? ` · ${r.minutes} min` : ""}
        </span>
        {canRemove && (
          <button
            type="button"
            className="ml-auto text-[12px] text-faint hover:text-[#a8261b]"
            onClick={() => {
              if (window.confirm(`Remove ${name}'s review?`)) update((d) => ({ ...d, caseReviews: d.caseReviews.filter((x) => !(x.caseId === r.caseId && x.memberId === r.memberId)) }));
            }}
          >
            Remove
          </button>
        )}
      </div>
      <p className="mt-1 text-[12px] text-muted tabular-nums">{rated.length ? rated.map((x) => `${x.label} ${r.ratings[x.key]}`).join(" · ") : "No ratings yet"}</p>
      {r.notes && <p className="mt-1 text-[13.5px] whitespace-pre-line">{r.notes}</p>}
    </li>
  );
}

/** Asked as soon as you mark a case done: how hard, how much math, and the rest. */
function ReviewForm({ review, first, onDone }: { review: CaseReview; first: boolean; onDone: () => void }) {
  const { update } = usePortal();
  const [role, setRole] = useState<CaseRole>(review.role);
  const [ratings, setRatings] = useState<Partial<Record<CaseRatingKey, Score>>>(review.ratings);
  const [minutes, setMinutes] = useState(review.minutes ? String(review.minutes) : "");
  const [notes, setNotes] = useState(review.notes);
  const [error, setError] = useState("");
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (ratings.difficulty == null || ratings.math == null) return setError("Rate the difficulty and the math, at least.");
        const mins = Math.round(Number(minutes));
        const next: CaseReview = { ...review, role, ratings, minutes: mins >= 1 && mins <= 600 ? mins : undefined, notes: notes.trim(), updatedAt: new Date().toISOString() };
        update((d) => ({ ...d, caseReviews: d.caseReviews.map((r) => (r.caseId === review.caseId && r.memberId === review.memberId ? next : r)) }));
        onDone();
      }}
    >
      <div>
        <p className="text-[15px] font-medium">{first ? "How was it?" : "Your review"}</p>
        <p className="text-[12.5px] text-muted">Difficulty and math are required; the rest helps other members pick their next case.</p>
      </div>
      <div>
        <span className="mb-1 block text-[13px] font-medium text-ink-2">You did it as the</span>
        <Segmented label="You did it as the" value={role} onChange={setRole} options={CASE_ROLES.map((r) => ({ value: r, label: r }))} />
      </div>
      {CASE_RATINGS.map((r) => (
        <ScorePicker
          key={r.key}
          name={`case-${r.key}`}
          label={r.key === "difficulty" || r.key === "math" ? `${r.label} (required)` : r.label}
          hint={r.hint}
          scale={r.scale}
          value={ratings[r.key]}
          onChange={(s) => {
            setRatings((x) => ({ ...x, [r.key]: s }));
            setError("");
          }}
        />
      ))}
      <Field label="How long it took, in minutes">
        <Input type="number" min={1} max={600} inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} className="max-w-[7rem]" />
      </Field>
      <Field label="Your thoughts" hint="What tripped you up, what to watch for, how to run it as the interviewer. Only members who've done the case see this.">
        <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      {error && (
        <p role="alert" className="text-[13px] text-[#a8261b]">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit">Save review</Button>
        <Button variant="secondary" onClick={onDone}>
          {first ? "Later" : "Cancel"}
        </Button>
      </div>
    </form>
  );
}
