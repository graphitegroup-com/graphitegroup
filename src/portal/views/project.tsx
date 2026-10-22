"use client";

import { useState } from "react";
import Link from "@/components/app-link";
import { useRouteParam } from "@/lib/use-route-param";
import { usePortal } from "@/portal/store";
import { fmtDate, fullName, uid } from "@/portal/logic";
import type { Comment } from "@/portal/types";
import { Avatar, Badge, Button, Card, Empty, PageTitle, Textarea } from "@/portal/ui";

export default function ProjectView() {
  const id = useRouteParam("id");
  const { data, me, update } = usePortal();
  const [comment, setComment] = useState("");

  if (!me) return null;

  const p = data.projects.find((x) => x.id === id);
  if (!p) {
    return (
      <div>
        <PageTitle title="Project not found" back={{ href: "/portal/projects", label: "Projects" }} />
        <p className="text-[13.5px] text-muted">
          This project may have been removed, or the link is incomplete.{" "}
          <Link href="/portal/projects" className="text-ink hover:underline">
            Return to the archive
          </Link>
          .
        </p>
      </div>
    );
  }

  const subject = `project:${p.id}`;
  const thread = data.comments.filter((c) => c.subject === subject).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const templates = data.templates.filter((t) => t.sourceProjectId === p.id);
  const lead = data.members.find((m) => m.id === p.lead);
  const leadName = lead ? fullName(lead) : "Former member";

  const postComment = (e: React.FormEvent) => {
    e.preventDefault();
    const body = comment.trim();
    if (!body) return;
    const x: Comment = { id: uid(), subject, memberId: me.id, body, createdAt: new Date().toISOString() };
    update((d) => ({ ...d, comments: [...d.comments, x] }));
    setComment("");
  };

  return (
    <div>
      <PageTitle
        back={{ href: "/portal/projects", label: "Projects" }}
        title={p.client}
        sub={[`${p.term} ${p.year}`, p.practice, p.sector].filter(Boolean).join(" · ")}
      />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card title="Summary">
            <p className="max-w-[70ch] py-3 leading-relaxed text-ink-2">
              {p.summary || <span className="text-muted">No summary yet. It will be generated from the project folder once Drive is connected.</span>}
            </p>
          </Card>

          <Card title="Deliverables" flush>
            {p.deliverables.length === 0 ? (
              <Empty>No deliverables linked.</Empty>
            ) : (
              <ul className="divide-y divide-edge">
                {p.deliverables.map((d) => (
                  <li key={d.label + d.url}>
                    <a href={d.url} target="_blank" rel="noreferrer" className="block px-4 py-2.5 font-medium hover:bg-[#fafbfc] hover:underline">
                      {d.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Templates from this project" flush>
            {templates.length === 0 ? (
              <Empty>No templates have come out of this project yet.</Empty>
            ) : (
              <ul className="divide-y divide-edge">
                {templates.map((t) => (
                  <li key={t.id} className="px-4 py-2.5 hover:bg-[#fafbfc]">
                    <a href={t.url} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                      {t.title}
                    </a>
                    {t.description && <p className="mt-0.5 text-[12.5px] text-muted">{t.description}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Discussion" flush>
            {thread.length === 0 ? (
              <Empty>No comments yet. Share what worked or what you would change.</Empty>
            ) : (
              <ul className="divide-y divide-edge">
                {thread.map((c) => {
                  const author = data.members.find((m) => m.id === c.memberId);
                  const name = author ? fullName(author) : "Former member";
                  return (
                    <li key={c.id} className="flex gap-3 px-4 py-3">
                      <Avatar name={name} photo={author?.photo} size={28} />
                      <div className="min-w-0">
                        <p className="text-[13px]">
                          <span className="font-medium">{name}</span> <span className="ml-1 text-[12px] text-faint">{fmtDate(c.createdAt)}</span>
                        </p>
                        <p className="mt-0.5 max-w-[70ch] leading-relaxed whitespace-pre-wrap text-ink-2">{c.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <form onSubmit={postComment} className="border-t border-edge bg-stone px-4 py-3">
              <Textarea placeholder="Add to the discussion" aria-label="Add a comment" value={comment} onChange={(e) => setComment(e.target.value)} />
              <div className="mt-2 flex justify-end">
                <Button type="submit" disabled={!comment.trim()}>
                  Post
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <Card title="Details">
          <dl className="divide-y divide-edge">
            <div className="py-2.5">
              <dt className="text-[12.5px] text-muted">Team lead</dt>
              <dd className="mt-1 flex items-center gap-2 text-[13.5px]">
                <Avatar name={leadName} photo={lead?.photo} size={24} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{leadName}</span>
                  {lead && <span className="block truncate text-[12px] text-muted">{lead.execTitle ?? lead.role}</span>}
                </span>
              </dd>
            </div>
            <div className="py-2.5">
              <dt className="text-[12.5px] text-muted">Term</dt>
              <dd className="mt-0.5 text-[13.5px] tabular-nums">
                {p.term} {p.year}
              </dd>
            </div>
            <div className="py-2.5">
              <dt className="text-[12.5px] text-muted">Practice</dt>
              <dd className="mt-1 text-[13.5px]">
                {p.practice}
              </dd>
            </div>
            {p.sector && (
              <div className="py-2.5">
                <dt className="text-[12.5px] text-muted">Sector</dt>
                <dd className="mt-0.5 text-[13.5px]">{p.sector}</dd>
              </div>
            )}
            <div className="py-2.5">
              <dt className="text-[12.5px] text-muted">Categories</dt>
              <dd className="mt-1 text-[13.5px]">
                {p.categories.length === 0 ? (
                  <span className="text-muted">None assigned.</span>
                ) : (
                  <span className="flex flex-wrap gap-1">
                    {p.categories.map((c) => (
                      <Badge key={c}>{c}</Badge>
                    ))}
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
