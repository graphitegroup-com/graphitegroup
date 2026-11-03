"use client";

import Link from "@/components/app-link";
import { useState } from "react";
import { fmtDate, fullName, uid } from "./logic";
import { usePortal } from "./store";
import type { Lesson, PortalData, Project } from "./types";
import { Badge, Button, Field, Input, Textarea, linkCls } from "./ui";

/** Every tag in use with how many lessons carry it, most used first. */
export function lessonTags(lessons: Lesson[]) {
  const counts = new Map<string, number>();
  for (const l of lessons) for (const t of l.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** Text a search box matches a lesson against. */
export const lessonHaystack = (l: Lesson) => `${l.body} ${l.tags.join(" ")}`.toLowerCase();

const splitTags = (s: string) => [...new Set(s.split(",").map((t) => t.trim()).filter(Boolean))];

/** Add a lesson to a project. Tags reuse existing ones so lessons stack up by topic. */
export function LessonForm({ project }: { project: Project }) {
  const { data, me, update } = usePortal();
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const known = lessonTags(data.lessons).map(([t]) => t);
  const listId = `lesson-tags-${project.id}`;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!me || !body.trim()) return;
    // Match existing tags case-insensitively so "survey" joins "Survey".
    const picked = splitTags(tags).map((t) => known.find((k) => k.toLowerCase() === t.toLowerCase()) ?? t);
    const lesson: Lesson = { id: uid(), projectId: project.id, memberId: me.id, body: body.trim(), tags: picked, createdAt: new Date().toISOString() };
    update((d) => ({ ...d, lessons: [lesson, ...d.lessons] }));
    setBody("");
    setTags("");
  };

  return (
    <form onSubmit={save} className="space-y-3 border-t border-edge bg-[#fbfbf7] px-4 py-3">
      <Field label="Add a lesson" hint="One specific thing a future team should do or avoid, and why.">
        <Textarea id={`lesson-body-${project.id}`} rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="e.g. Agree on the final format in week one; the client wanted a memo, not a deck." />
      </Field>
      <Field label="Topics" hint="Comma separated. Reuse a topic so lessons group together.">
        <Input id={`lesson-tags-input-${project.id}`} list={listId} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Scoping, Survey" />
        <datalist id={listId}>
          {known.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={!body.trim()}>
          Add lesson
        </Button>
      </div>
    </form>
  );
}

/** One lesson; `showProject` adds which engagement it came from. */
export function LessonItem({ lesson, data, showProject = false, onTag }: { lesson: Lesson; data: PortalData; showProject?: boolean; onTag?: (t: string) => void }) {
  const author = data.members.find((m) => m.id === lesson.memberId);
  const project = data.projects.find((p) => p.id === lesson.projectId);
  return (
    <li className="px-4 py-3">
      <p className="prose-portal">{lesson.body}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[12.5px] text-muted">
        {lesson.tags.map((t) =>
          onTag ? (
            <button key={t} type="button" onClick={() => onTag(t)} className="rounded-[2px] focus-visible:outline-2" aria-label={`Show lessons about ${t}`}>
              <Badge>{t}</Badge>
            </button>
          ) : (
            <Badge key={t}>{t}</Badge>
          ),
        )}
        {showProject && project && (
          <Link href={`/portal/projects/${project.id}`} className={linkCls}>
            {project.client}, {project.term} {project.year}
          </Link>
        )}
        <span>
          {author ? fullName(author) : "Former member"}, {fmtDate(lesson.createdAt)}
        </span>
      </div>
    </li>
  );
}
