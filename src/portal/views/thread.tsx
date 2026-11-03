"use client";

import Link from "@/components/app-link";
import { useState } from "react";
import { useGo } from "@/lib/use-go";
import { useRouteParam } from "@/lib/use-route-param";
import { channelLabel, PostForm, SpaceBadge, ThreadRow, toggleVote, useThreadVote } from "@/portal/forum";
import { companySlug, firmGradeSummary, fmtDate, fullName, isExec, memberLine, threadActivity, timeAgo, uid } from "@/portal/logic";
import { usePortal } from "@/portal/store";
import type { ForumReply, Member } from "@/portal/types";
import { gradeStatus } from "@/portal/grades";
import { Avatar, Badge, Button, Card, Drawer, Empty, GradeTile, PageTitle, Textarea, VoteButton, linkCls } from "@/portal/ui";

function Author({ member, at, edited, now }: { member?: Member; at: string; edited?: string; now: Date }) {
  const name = member ? fullName(member) : "Former member";
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar name={name} photo={member?.photo} size={32} />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[13.5px] font-medium">{name}</p>
        <p className="truncate text-[12px] text-muted">
          {member ? memberLine(member, now) : "No longer in the directory"}
          <span className="mx-1.5 text-faint" aria-hidden>
            ·
          </span>
          <time dateTime={at} title={fmtDate(at)}>
            {timeAgo(at, now)}
          </time>
          {edited && <span className="text-faint"> (edited)</span>}
        </p>
      </div>
    </div>
  );
}

export default function ThreadView() {
  const id = useRouteParam("id");
  const { data, me, update } = usePortal();
  const go = useGo();
  const voteThread = useThreadVote();
  const [reply, setReply] = useState("");
  const [editing, setEditing] = useState(false);

  if (!me) return null;

  const post = data.posts.find((p) => p.id === id);
  if (!post) {
    return (
      <div>
        <PageTitle title="Thread not found" back={{ href: "/portal/forum", label: "Forum" }} />
        <p className="text-[13.5px] text-muted">
          It may have been deleted, or the link is incomplete.{" "}
          <Link href="/portal/forum" className={linkCls}>
            Return to the forum
          </Link>
          .
        </p>
      </div>
    );
  }

  const now = new Date();
  const exec = isExec(me);
  const member = (mid: string) => data.members.find((m) => m.id === mid);
  const mine = post.memberId === me.id;
  const replies = data.replies.filter((r) => r.postId === post.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const grade = post.company ? firmGradeSummary(data.grades.filter((g) => g.company.trim() === post.company)) : undefined;
  const reportCount = post.company ? data.reports.filter((r) => r.company.trim() === post.company).length : 0;
  const related = data.posts
    .filter((p) => p.id !== post.id && (post.company ? p.company === post.company : p.channel === post.channel))
    .sort((a, b) => threadActivity(b, data.replies).localeCompare(threadActivity(a, data.replies)))
    .slice(0, 4);

  const postReply = (e: React.FormEvent) => {
    e.preventDefault();
    const body = reply.trim();
    if (!body) return;
    const r: ForumReply = { id: uid(), postId: post.id, memberId: me.id, body, createdAt: new Date().toISOString(), upvotes: [] };
    update((d) => ({ ...d, replies: [...d.replies, r] }));
    setReply("");
  };

  const voteReply = (r: ForumReply) =>
    r.memberId !== me.id && update((d) => ({ ...d, replies: d.replies.map((x) => (x.id === r.id ? { ...x, upvotes: toggleVote(x.upvotes, me.id) } : x)) }));

  const removeReply = (r: ForumReply) => {
    if (!window.confirm("Delete this reply?")) return;
    update((d) => ({ ...d, replies: d.replies.filter((x) => x.id !== r.id) }));
  };

  const removePost = () => {
    if (!window.confirm(`Delete "${post.title}" and its ${replies.length} ${replies.length === 1 ? "reply" : "replies"}?`)) return;
    update((d) => ({ ...d, posts: d.posts.filter((p) => p.id !== post.id), replies: d.replies.filter((r) => r.postId !== post.id) }));
    go("/portal/forum", { replace: true });
  };

  const togglePin = () => update((d) => ({ ...d, posts: d.posts.map((p) => (p.id === post.id ? { ...p, pinned: !p.pinned } : p)) }));

  return (
    <div>
      <PageTitle
        back={{ href: "/portal/forum", label: "Forum" }}
        title={post.title}
        sub={
          <span className="flex flex-wrap items-center gap-2">
            {post.pinned && <Badge tone="amber">Pinned</Badge>}
            <SpaceBadge space={post.space} />
            <Badge>{channelLabel(post.channel)}</Badge>
            {post.company && (
              <Link href={`/portal/companies/${companySlug(post.company)}`} className={linkCls}>
                {post.company}
              </Link>
            )}
          </span>
        }
        actions={
          (mine || exec) && (
            <>
              {exec && (
                <Button variant="secondary" onClick={togglePin}>
                  {post.pinned ? "Unpin" : "Pin to top"}
                </Button>
              )}
              {mine && (
                <Button variant="secondary" onClick={() => setEditing(true)}>
                  Edit
                </Button>
              )}
              <Button variant="danger" onClick={removePost}>
                Delete
              </Button>
            </>
          )
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <article className="rounded-[3px] border border-edge bg-white">
            <div className="flex gap-3 px-4 py-4">
              <VoteButton count={post.upvotes.length} voted={post.upvotes.includes(me.id)} onToggle={() => voteThread(post.id)} label={post.title} disabled={mine} />
              <div className="min-w-0 flex-1">
                <Author member={member(post.memberId)} at={post.createdAt} edited={post.editedAt} now={now} />
                <div className="prose-portal mt-3">{post.body}</div>
              </div>
            </div>
          </article>

          <Card title={replies.length === 1 ? "1 reply" : `${replies.length} replies`} flush>
            {replies.length === 0 ? (
              <Empty>No replies yet. If you know the answer, or know who does, say so.</Empty>
            ) : (
              <ul className="divide-y divide-edge">
                {replies.map((r) => (
                  <li key={r.id} className="flex gap-3 px-4 py-3.5">
                    <VoteButton
                      count={r.upvotes.length}
                      voted={r.upvotes.includes(me.id)}
                      onToggle={() => voteReply(r)}
                      label={`reply by ${member(r.memberId) ? fullName(member(r.memberId)!) : "a former member"}`}
                      disabled={r.memberId === me.id}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <Author member={member(r.memberId)} at={r.createdAt} now={now} />
                        {(r.memberId === me.id || exec) && (
                          <Button variant="ghost" onClick={() => removeReply(r)} aria-label="Delete reply">
                            Delete
                          </Button>
                        )}
                      </div>
                      <div className="prose-portal mt-2">{r.body}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={postReply} className="border-t border-edge bg-[#fbfbf7] px-4 py-3">
              <Textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply" aria-label="Write a reply" />
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-[12px] text-muted">Replying as {fullName(me)}</p>
                <Button type="submit" disabled={!reply.trim()}>
                  Reply
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          {post.company && grade && (
            <Card title="About the firm" flush>
              <Link href={`/portal/companies/${companySlug(post.company)}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[#fbfbf7]">
                <GradeTile letter={grade.letter} size="md" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{post.company}</span>
                  <span className="block text-[12.5px] text-muted">{gradeStatus(grade)}</span>
                  <span className="block text-[12.5px] text-muted">
                    {reportCount} interview {reportCount === 1 ? "report" : "reports"}
                  </span>
                </span>
              </Link>
            </Card>
          )}

          <Card title={post.company ? `More about ${post.company}` : `More in ${channelLabel(post.channel)}`} flush>
            {related.length === 0 ? (
              <Empty>Nothing else here yet.</Empty>
            ) : (
              <ul className="divide-y divide-edge">
                {related.map((p) => (
                  <ThreadRow key={p.id} post={p} data={data} me={me} now={now} onVote={() => voteThread(p.id)} showCompany={!post.company} />
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Drawer open={editing} onClose={() => setEditing(false)} title="Edit thread">
        {editing && <PostForm initial={post} onDone={() => setEditing(false)} />}
      </Drawer>
    </div>
  );
}
