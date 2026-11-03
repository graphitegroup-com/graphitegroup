"use client";

import { useState } from "react";
import { fullName, threadActivity } from "@/portal/logic";
import { PostForm, ThreadRow, useThreadVote } from "@/portal/forum";
import { usePortal } from "@/portal/store";
import { FORUM_CHANNELS, type ForumChannel, type ForumPost } from "@/portal/types";
import { Avatar, Button, Drawer, Empty, Input, Label, PageTitle, Segmented, Select } from "@/portal/ui";

type ChannelFilter = "all" | ForumChannel;
type Sort = "active" | "new" | "top";

const SORTS = [
  { value: "active", label: "Active" },
  { value: "new", label: "New" },
  { value: "top", label: "Most helpful" },
] as const;

export default function ForumPage() {
  const { data, me } = usePortal();
  const vote = useThreadVote();
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [sort, setSort] = useState<Sort>("active");
  const [query, setQuery] = useState("");
  const [composing, setComposing] = useState(false);

  if (!me) return null;

  const now = new Date();
  const q = query.trim().toLowerCase();
  const counts = Object.fromEntries(FORUM_CHANNELS.map((c) => [c.id, data.posts.filter((p) => p.channel === c.id).length])) as Record<ForumChannel, number>;

  const activity = (p: ForumPost) => threadActivity(p, data.replies);
  const order: Record<Sort, (a: ForumPost, b: ForumPost) => number> = {
    active: (a, b) => activity(b).localeCompare(activity(a)),
    new: (a, b) => b.createdAt.localeCompare(a.createdAt),
    top: (a, b) => b.upvotes.length - a.upvotes.length || activity(b).localeCompare(activity(a)),
  };

  const matches = data.posts
    .filter((p) => channel === "all" || p.channel === channel)
    .filter((p) => !q || `${p.title} ${p.body} ${p.company ?? ""}`.toLowerCase().includes(q))
    .sort(order[sort]);
  // Pinned threads lead the default view, the way announcements do on Bookface.
  const pinnedFirst = sort === "active" && !q;
  const threads = pinnedFirst ? [...matches.filter((p) => p.pinned), ...matches.filter((p) => !p.pinned)] : matches;

  const channelMeta = FORUM_CHANNELS.find((c) => c.id === channel);

  return (
    <div>
      <PageTitle
        title="Forum"
        sub="Ask and answer questions about recruiting, interviews, referrals and offers. Only members and alumni can see it."
        actions={<Button onClick={() => setComposing(true)}>New thread</Button>}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[208px_1fr]">
        <nav aria-label="Channels" className="hidden lg:block">
          <Label className="px-2 pb-1.5">Channels</Label>
          <ul className="space-y-px">
            {[{ id: "all" as const, label: "All threads", count: data.posts.length }, ...FORUM_CHANNELS.map((c) => ({ id: c.id, label: c.label, count: counts[c.id] }))].map((c) => {
              const on = channel === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => setChannel(c.id)}
                    className={`flex h-8 w-full items-center justify-between gap-2 rounded-[3px] px-2 text-left text-[13.5px] transition-colors ${
                      on ? "bg-stone font-medium text-ink" : "text-ink-2 hover:bg-stone"
                    }`}
                  >
                    <span className="truncate">{c.label}</span>
                    <span className="text-[12px] text-faint tabular-nums">{c.count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="lg:hidden">
              <Select
                aria-label="Channel"
                options={[{ value: "all", label: "All threads" }, ...FORUM_CHANNELS.map((c) => ({ value: c.id, label: `${c.label} (${counts[c.id]})` }))]}
                value={channel}
                onChange={(e) => setChannel(e.target.value as ChannelFilter)}
              />
            </div>
            <div className="w-full sm:max-w-xs">
              <Input type="search" placeholder="Search threads" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search threads" />
            </div>
            <div className="sm:ml-auto">
              <Segmented label="Sort threads" value={sort} options={SORTS} onChange={setSort} />
            </div>
          </div>

          <section className="overflow-hidden rounded-[3px] border border-edge bg-white">
            <button
              type="button"
              onClick={() => setComposing(true)}
              className="flex w-full items-center gap-3 border-b border-edge px-4 py-3 text-left hover:bg-[#fbfbf7]"
            >
              <Avatar name={fullName(me)} photo={me.photo} size={32} />
              <span className="flex h-9 flex-1 items-center rounded-[3px] border border-[#d6d6cb] bg-white px-3 text-[13.5px] text-faint">
                {channelMeta ? `Ask about ${channelMeta.label.toLowerCase()}` : "Ask Graphite a question about recruiting, interviews or offers"}
              </span>
            </button>
            {channelMeta && <p className="border-b border-edge bg-[#fbfbf7] px-4 py-2 text-[12.5px] text-muted">{channelMeta.description}</p>}
            {threads.length === 0 ? (
              <Empty>{q ? "No threads match your search." : "No threads here yet. Start one; someone in Graphite has been through it."}</Empty>
            ) : (
              <ul className="divide-y divide-edge">
                {threads.map((p) => (
                  <ThreadRow key={p.id} post={p} data={data} me={me} now={now} onVote={() => vote(p.id)} />
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <Drawer open={composing} onClose={() => setComposing(false)} title="New thread">
        {composing && <PostForm channel={channel === "all" ? undefined : channel} onDone={() => setComposing(false)} />}
      </Drawer>
    </div>
  );
}
