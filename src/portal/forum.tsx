"use client";

import Link from "@/components/app-link";
import { useState } from "react";
import { useGo } from "@/lib/use-go";
import { companyNames, companySlug, fullName, isAlum, matchCompany, threadActivity, timeAgo, uid } from "./logic";
import { usePortal } from "./store";
import { FORUM_CHANNELS, FORUM_SPACES, type ForumChannel, type ForumPost, type ForumSpace, type Member, type PortalData } from "./types";
import { Avatar, Badge, Button, Field, Input, Select, Textarea, VoteButton, linkCls } from "./ui";

export const channelLabel = (id: ForumChannel) => FORUM_CHANNELS.find((c) => c.id === id)?.label ?? "General";
export const spaceLabel = (id: ForumSpace) => FORUM_SPACES.find((s) => s.id === id)?.label ?? "Everyone";

/** Small marker for threads that are for one group; "Everyone" threads carry none. */
export function SpaceBadge({ space }: { space: ForumSpace }) {
  if (space === "everyone") return null;
  return <Badge tone={space === "alumni" ? "amber" : "blue"}>{space === "alumni" ? "Alumni" : "Current members"}</Badge>;
}

/** Adds or removes a member from a vote list. */
export const toggleVote = (votes: string[], memberId: string) => (votes.includes(memberId) ? votes.filter((v) => v !== memberId) : [...votes, memberId]);

export const replyCount = (data: Pick<PortalData, "replies">, postId: string) => data.replies.filter((r) => r.postId === postId).length;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Shared datalist of firm names so threads and grades land on the same company page. */
export function CompanyOptions({ id, data }: { id: string; data: Parameters<typeof companyNames>[0] }) {
  return (
    <datalist id={id}>
      {companyNames(data)
        .sort((a, b) => a.localeCompare(b))
        .map((n) => (
          <option key={n} value={n} />
        ))}
    </datalist>
  );
}

type PostDraft = { space: ForumSpace; channel: ForumChannel; title: string; body: string; company: string };

/**
 * New thread, or an edit of one the member wrote. Mount it only while its
 * drawer is open so each opening starts from a fresh draft.
 */
export function PostForm({
  initial,
  company,
  channel,
  space,
  onDone,
}: {
  initial?: ForumPost;
  company?: string;
  channel?: ForumChannel;
  space?: ForumSpace;
  onDone: () => void;
}) {
  const { data, me, update } = usePortal();
  const go = useGo();
  const [draft, setDraft] = useState<PostDraft>(() => ({
    // Alumni start in the alumni space; everyone else posts to everyone unless they're in a space tab.
    space: initial?.space ?? space ?? (me && isAlum(me) ? "alumni" : "everyone"),
    channel: initial?.channel ?? channel ?? "recruiting",
    title: initial?.title ?? "",
    body: initial?.body ?? "",
    company: initial?.company ?? company ?? "",
  }));
  const set = (patch: Partial<PostDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const title = draft.title.trim();
    const body = draft.body.trim();
    if (!me || !title || !body) return;
    const firm = draft.company.trim() ? matchCompany(data, draft.company) : undefined;
    if (initial) {
      update((d) => ({
        ...d,
        posts: d.posts.map((p) => (p.id === initial.id ? { ...p, space: draft.space, channel: draft.channel, title, body, company: firm, editedAt: new Date().toISOString() } : p)),
      }));
      onDone();
      return;
    }
    const post: ForumPost = { id: uid(), space: draft.space, channel: draft.channel, memberId: me.id, title, body, company: firm, createdAt: new Date().toISOString(), upvotes: [] };
    update((d) => ({ ...d, posts: [post, ...d.posts] }));
    onDone();
    go(`/portal/forum/${post.id}`);
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <Field label="Who it's for" hint={`${FORUM_SPACES.find((s) => s.id === draft.space)?.description}. Everyone in Graphite can still read it.`}>
        <Select options={FORUM_SPACES.map((s) => ({ value: s.id, label: s.label }))} value={draft.space} onChange={(e) => set({ space: e.target.value as ForumSpace })} />
      </Field>
      <Field label="Channel" hint={FORUM_CHANNELS.find((c) => c.id === draft.channel)?.description}>
        <Select options={FORUM_CHANNELS.map((c) => ({ value: c.id, label: c.label }))} value={draft.channel} onChange={(e) => set({ channel: e.target.value as ForumChannel })} />
      </Field>
      <Field label="Title" hint="Ask the specific question. Members skim titles.">
        <Input required maxLength={140} value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. How did you prepare for the Bain online test?" />
      </Field>
      <Field label="Details">
        <Textarea required rows={7} value={draft.body} onChange={(e) => set({ body: e.target.value })} placeholder="Context helps: your year, the role, the cycle and what you've already tried." />
      </Field>
      <Field label="Company" hint="Optional. The thread also appears on that firm's page.">
        <Input list="post-companies" value={draft.company} onChange={(e) => set({ company: e.target.value })} placeholder="e.g. Goldman Sachs" />
        <CompanyOptions id="post-companies" data={data} />
      </Field>
      <p className="text-[12.5px] text-muted">Posts show your name. Only Graphite members and alumni can see the forum.</p>
      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={!draft.title.trim() || !draft.body.trim()}>
          {initial ? "Save changes" : "Post thread"}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** One thread in a list: vote, title, excerpt and a meta line. The whole row opens the thread. */
export function ThreadRow({ post, data, me, now, onVote, showCompany = true }: { post: ForumPost; data: PortalData; me: Member; now: Date; onVote: () => void; showCompany?: boolean }) {
  const author = data.members.find((m) => m.id === post.memberId);
  const name = author ? fullName(author) : "Former member";
  const replies = replyCount(data, post.id);
  const sep = (
    <span className="text-faint" aria-hidden>
      ·
    </span>
  );
  return (
    <li className="relative flex gap-3 px-4 py-3 hover:bg-[#fbfbf7]">
      <VoteButton count={post.upvotes.length} voted={post.upvotes.includes(me.id)} onToggle={onVote} label={post.title} disabled={post.memberId === me.id} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {post.pinned && <Badge tone="amber">Pinned</Badge>}
          <SpaceBadge space={post.space} />
          <Link href={`/portal/forum/${post.id}`} className="text-[14.5px] leading-snug font-medium text-ink after:absolute after:inset-0 hover:underline">
            {post.title}
          </Link>
        </p>
        <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">{post.body}</p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12.5px] text-muted">
          <Avatar name={name} photo={author?.photo} size={16} />
          <span className="text-ink-2">{name}</span>
          {author && isAlum(author) && <span className="text-faint">Alum &apos;{String(author.gradYear).slice(2)}</span>}
          {sep}
          <span>{channelLabel(post.channel)}</span>
          {showCompany && post.company && (
            <>
              {sep}
              <Link href={`/portal/companies/${companySlug(post.company)}`} className={`relative z-10 ${linkCls}`}>
                {post.company}
              </Link>
            </>
          )}
          {sep}
          <span>{plural(replies, "reply", "replies")}</span>
          {sep}
          <span>{replies ? `Active ${timeAgo(threadActivity(post, data.replies), now)}` : timeAgo(post.createdAt, now)}</span>
        </p>
      </div>
    </li>
  );
}

/** Vote on a thread as the signed-in member. */
export function useThreadVote() {
  const { me, update } = usePortal();
  return (postId: string) =>
    me &&
    update((d) => ({
      ...d,
      posts: d.posts.map((p) => (p.id === postId && p.memberId !== me.id ? { ...p, upvotes: toggleVote(p.upvotes, me.id) } : p)),
    }));
}
