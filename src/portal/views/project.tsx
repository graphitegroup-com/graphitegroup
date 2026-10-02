"use client";

import { useState } from "react";
import Link from "@/components/app-link";
import { useRouteParam } from "@/lib/use-route-param";
import { usePortal } from "@/portal/store";
import { fmtDate, fullName, uid } from "@/portal/logic";
import type { Comment } from "@/portal/types";
import { Avatar, Button, Card, Empty, PageTitle, Textarea } from "@/portal/ui";

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
        <p className="text-muted">
          This project may have been removed, or the link is incomplete.{" "}
          <Link href="/portal/projects" className="link-u text-ink">
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

      <div className="grid gap-x-16 gap-y-14 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-14">
          <Card title="Summary">
            <p className="max-w-[65ch] pt-5 text-[1.0625rem] leading-relaxed text-ink-2">
              {p.summary || <span className="text-muted">No summary yet. It will be generated from the project folder once Drive is connected.</span>}
            </p>
          </Card>

          <Card title="Deliverables">
            {p.deliverables.length === 0 ? (
              <Empty>No deliverables linked.</Empty>
            ) : (
              <ul>
                {p.deliverables.map((d) => (
                  <li key={d.label + d.url} className="border-b border-line py-3.5">
                    <a href={d.url} target="_blank" rel="noreferrer" className="link-u">
                      {d.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Templates from this project">
            {templates.length === 0 ? (
              <Empty>No templates have come out of this project yet.</Empty>
            ) : (
              <ul>
                {templates.map((t) => (
                  <li key={t.id} className="border-b border-line py-4">
                    <a href={t.url} target="_blank" rel="noreferrer" className="link-u font-medium">
                      {t.title}
                    </a>
                    {t.description && <p className="mt-1 text-sm text-muted">{t.description}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Discussion">
            {thread.length === 0 ? (
              <Empty>No comments yet. Share what worked or what you would change.</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {thread.map((c) => {
                  const author = data.members.find((m) => m.id === c.memberId);
                  const name = author ? fullName(author) : "Former member";
                  return (
                    <li key={c.id} className="flex gap-4 py-5">
                      <Avatar name={name} photo={author?.photo} size={32} />
                      <div className="min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{name}</span> <span className="text-muted">{fmtDate(c.createdAt)}</span>
                        </p>
                        <p className="mt-1 max-w-[65ch] leading-relaxed whitespace-pre-wrap text-ink-2">{c.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <form onSubmit={postComment} className="max-w-2xl border-t border-line pt-5">
              <Textarea placeholder="Add to the discussion" aria-label="Add a comment" value={comment} onChange={(e) => setComment(e.target.value)} />
              <div className="mt-3">
                <Button type="submit" disabled={!comment.trim()}>
                  Post
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <aside className="space-y-14">
          <Card title="Team lead">
            <div className="flex items-center gap-3 pt-5">
              <Avatar name={leadName} photo={lead?.photo} size={40} />
              <div className="min-w-0">
                <p className="font-medium">{leadName}</p>
                {lead && <p className="text-sm text-muted">{lead.execTitle ?? lead.role}</p>}
              </div>
            </div>
          </Card>

          <Card title="Categories">
            {p.categories.length === 0 ? (
              <Empty>None assigned.</Empty>
            ) : (
              <ul className="pt-2">
                {p.categories.map((c) => (
                  <li key={c} className="border-b border-line py-2.5 text-ink-2">
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
