"use client";

import { useMemo, useState } from "react";
import { usePortal } from "@/portal/store";
import { fmtDate, fullName, isExec, uid } from "@/portal/logic";
import type { Practice, Project, Template } from "@/portal/types";
import { Avatar, Badge, Button, Card, Drawer, Empty, Field, Input, PageTitle, Select, Textarea } from "@/portal/ui";

type Tab = "archive" | "templates";
const ALL_CATEGORIES = "All categories";
const ALL_YEARS = "All years";

const emptyProject = () => ({
  client: "",
  year: String(new Date().getFullYear()),
  term: "Fall" as Project["term"],
  practice: "Strategy" as Practice,
  sector: "",
  categories: "",
  summary: "",
  deliverableLabel: "",
  deliverableUrl: "",
  lead: "",
});

const emptyTemplate = () => ({ title: "", category: "", description: "", sourceProjectId: "", url: "" });

function PracticeBadge({ practice }: { practice: Practice }) {
  return <Badge tone={practice === "Digital" ? "dark" : "blue"}>{practice}</Badge>;
}

export default function ProjectsPage() {
  const { data, me, update } = usePortal();
  const [tab, setTab] = useState<Tab>("archive");
  const [q, setQ] = useState("");
  const [practice, setPractice] = useState<"All" | Practice>("All");
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [year, setYear] = useState(ALL_YEARS);
  const [openId, setOpenId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [addingProject, setAddingProject] = useState(false);
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [addingTemplate, setAddingTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState(emptyTemplate);

  const categories = useMemo(
    () => [...new Set(data.projects.flatMap((p) => p.categories))].sort((a, b) => a.localeCompare(b)),
    [data.projects],
  );
  const years = useMemo(
    () => [...new Set(data.projects.map((p) => p.year))].sort((a, b) => b - a).map(String),
    [data.projects],
  );

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.projects
      .filter((p) => {
        if (needle) {
          const hay = `${p.client} ${p.summary} ${p.sector} ${p.categories.join(" ")}`.toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        if (practice !== "All" && p.practice !== practice) return false;
        if (category !== ALL_CATEGORIES && !p.categories.includes(category)) return false;
        if (year !== ALL_YEARS && String(p.year) !== year) return false;
        return true;
      })
      .sort((a, b) => b.year - a.year || (a.term === b.term ? 0 : a.term === "Fall" ? -1 : 1));
  }, [data.projects, q, practice, category, year]);

  const templateGroups = useMemo(() => {
    const groups = new Map<string, Template[]>();
    for (const t of data.templates) {
      const list = groups.get(t.category) ?? [];
      list.push(t);
      groups.set(t.category, list);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [data.templates]);

  if (!me) return null;
  const exec = isExec(me);

  const memberName = (id: string) => {
    const m = data.members.find((x) => x.id === id);
    return m ? fullName(m) : "Unknown";
  };
  const projectById = (id?: string) => data.projects.find((p) => p.id === id);

  const selected = projectById(openId ?? undefined);
  const subject = selected ? `project:${selected.id}` : "";
  const thread = data.comments
    .filter((c) => c.subject === subject)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const postComment = () => {
    const body = comment.trim();
    if (!body || !selected) return;
    update((d) => ({
      ...d,
      comments: [...d.comments, { id: uid(), subject, memberId: me.id, body, createdAt: new Date().toISOString() }],
    }));
    setComment("");
  };

  const saveProject = () => {
    const f = projectForm;
    if (!f.client.trim()) return;
    const project: Project = {
      id: uid(),
      client: f.client.trim(),
      year: Number(f.year) || new Date().getFullYear(),
      term: f.term,
      practice: f.practice,
      sector: f.sector.trim(),
      categories: f.categories
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      summary: f.summary.trim(),
      deliverables: f.deliverableUrl.trim()
        ? [{ label: f.deliverableLabel.trim() || "Deliverable", url: f.deliverableUrl.trim() }]
        : [],
      lead: f.lead || me.id,
    };
    update((d) => ({ ...d, projects: [project, ...d.projects] }));
    setAddingProject(false);
    setProjectForm(emptyProject());
  };

  const saveTemplate = () => {
    const f = templateForm;
    if (!f.title.trim() || !f.category.trim()) return;
    const template: Template = {
      id: uid(),
      title: f.title.trim(),
      category: f.category.trim(),
      description: f.description.trim(),
      sourceProjectId: f.sourceProjectId || undefined,
      url: f.url.trim() || "#",
    };
    update((d) => ({ ...d, templates: [...d.templates, template] }));
    setAddingTemplate(false);
    setTemplateForm(emptyTemplate());
  };

  const memberOptions = data.members
    .slice()
    .sort((a, b) => a.lastName.localeCompare(b.lastName))
    .map((m) => ({ id: m.id, label: fullName(m) }));
  const projectOptions = data.projects.map((p) => ({ id: p.id, label: `${p.client} (${p.term} ${p.year})` }));

  const tabBtn = (key: Tab, label: string) => (
    <button
      key={key}
      type="button"
      role="tab"
      aria-selected={tab === key}
      onClick={() => setTab(key)}
      className={`px-4 py-2 text-sm font-semibold transition-colors ${
        tab === key ? "bg-accent text-white" : "text-slate hover:bg-cloud hover:text-ink"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <PageTitle
        title="Projects"
        sub="Past client engagements and the reusable templates that came out of them. Summaries are generated from the Google Drive project folders once Drive is connected."
        actions={
          exec &&
          (tab === "archive" ? (
            <Button onClick={() => setAddingProject(true)}>Add project</Button>
          ) : (
            <Button onClick={() => setAddingTemplate(true)}>Add template</Button>
          ))
        }
      />

      <div className="mb-6 flex flex-wrap border border-line bg-white" role="tablist">
        {tabBtn("archive", "Project archive")}
        {tabBtn("templates", "Templates")}
      </div>

      {tab === "archive" && (
        <>
          <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto_220px_160px] md:items-center">
            <Input
              type="search"
              placeholder="Search client, summary, category or sector"
              aria-label="Search projects"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5">
              {(["All", "Strategy", "Digital"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPractice(p)}
                  className={`border px-3 py-1.5 text-sm transition-colors ${
                    practice === p ? "border-accent bg-accent text-white" : "border-line bg-white hover:bg-cloud"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <Select
              aria-label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[ALL_CATEGORIES, ...categories]}
            />
            <Select aria-label="Year" value={year} onChange={(e) => setYear(e.target.value)} options={[ALL_YEARS, ...years]} />
          </div>

          {results.length === 0 ? (
            <Card>
              <Empty>No projects match these filters.</Empty>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {results.map((p) => (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setOpenId(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpenId(p.id);
                    }
                  }}
                  className="flex cursor-pointer flex-col border border-line bg-white p-5 transition-colors hover:border-accent"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-xl">{p.client}</h3>
                      <p className="mt-0.5 text-xs text-slate">
                        {p.term} {p.year} · {p.sector}
                      </p>
                    </div>
                    <PracticeBadge practice={p.practice} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.categories.map((c) => (
                      <Badge key={c}>{c}</Badge>
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed">{p.summary}</p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4 text-sm">
                    <div className="flex flex-wrap gap-3">
                      {p.deliverables.map((d) => (
                        <a
                          key={d.label + d.url}
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-accent hover:underline"
                        >
                          {d.label}
                        </a>
                      ))}
                    </div>
                    <span className="text-xs text-slate">Lead: {memberName(p.lead)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "templates" && (
        <div className="space-y-6">
          {templateGroups.length === 0 && (
            <Card>
              <Empty>No templates yet.</Empty>
            </Card>
          )}
          {templateGroups.map(([cat, list]) => (
            <Card key={cat} title={cat}>
              <ul>
                {list.map((t) => {
                  const src = projectById(t.sourceProjectId);
                  return (
                    <li
                      key={t.id}
                      className="flex flex-col gap-3 border-b border-line px-5 py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold">{t.title}</p>
                        <p className="mt-1 text-sm text-slate">{t.description}</p>
                        {src && (
                          <button
                            type="button"
                            onClick={() => setOpenId(src.id)}
                            className="mt-1.5 text-xs font-medium text-accent hover:underline"
                          >
                            From {src.client} ({src.term} {src.year})
                          </button>
                        )}
                      </div>
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 border border-line px-3 py-1.5 text-sm font-semibold hover:bg-cloud"
                      >
                        Open template
                      </a>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}

      <Drawer open={!!selected} onClose={() => setOpenId(null)} title={selected?.client ?? "Project"}>
        {selected && (
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <PracticeBadge practice={selected.practice} />
                <span className="text-sm text-slate">
                  {selected.term} {selected.year} · {selected.sector}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selected.categories.map((c) => (
                  <Badge key={c}>{c}</Badge>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed">{selected.summary}</p>
              <p className="mt-3 text-sm">
                <span className="text-slate">Project lead:</span> {memberName(selected.lead)}
              </p>
            </div>

            <section>
              <h3 className="mb-2 text-xs font-semibold tracking-[0.08em] text-slate uppercase">Deliverables</h3>
              {selected.deliverables.length === 0 ? (
                <p className="text-sm text-slate">No deliverables linked.</p>
              ) : (
                <ul className="space-y-1.5">
                  {selected.deliverables.map((d) => (
                    <li key={d.label + d.url}>
                      <a href={d.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-accent hover:underline">
                        {d.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold tracking-[0.08em] text-slate uppercase">Templates from this project</h3>
              {data.templates.filter((t) => t.sourceProjectId === selected.id).length === 0 ? (
                <p className="text-sm text-slate">No templates derived from this project yet.</p>
              ) : (
                <ul className="border border-line">
                  {data.templates
                    .filter((t) => t.sourceProjectId === selected.id)
                    .map((t) => (
                      <li key={t.id} className="flex items-start justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0">
                        <div>
                          <p className="text-sm font-semibold">{t.title}</p>
                          <p className="text-xs text-slate">{t.description}</p>
                        </div>
                        <a href={t.url} target="_blank" rel="noreferrer" className="shrink-0 text-sm font-medium text-accent hover:underline">
                          Open
                        </a>
                      </li>
                    ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold tracking-[0.08em] text-slate uppercase">Comments</h3>
              {thread.length === 0 ? (
                <p className="mb-3 text-sm text-slate">No comments yet. Share what worked or what you would change.</p>
              ) : (
                <ul className="mb-4 space-y-4">
                  {thread.map((c) => {
                    const author = data.members.find((m) => m.id === c.memberId);
                    const name = author ? fullName(author) : "Former member";
                    return (
                      <li key={c.id} className="flex gap-3">
                        <Avatar name={name} photo={author?.photo} size={32} />
                        <div>
                          <p className="text-sm">
                            <span className="font-semibold">{name}</span>{" "}
                            <span className="text-xs text-slate">{fmtDate(c.createdAt)}</span>
                          </p>
                          <p className="mt-0.5 text-sm whitespace-pre-wrap">{c.body}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Textarea
                placeholder="Add a comment"
                aria-label="Add a comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="mt-2 flex justify-end">
                <Button onClick={postComment} disabled={!comment.trim()}>
                  Post comment
                </Button>
              </div>
            </section>
          </div>
        )}
      </Drawer>

      <Drawer open={addingProject} onClose={() => setAddingProject(false)} title="Add project">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveProject();
          }}
        >
          <Field label="Client">
            <Input required value={projectForm.client} onChange={(e) => setProjectForm({ ...projectForm, client: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Year">
              <Input type="number" value={projectForm.year} onChange={(e) => setProjectForm({ ...projectForm, year: e.target.value })} />
            </Field>
            <Field label="Term">
              <Select
                value={projectForm.term}
                onChange={(e) => setProjectForm({ ...projectForm, term: e.target.value as Project["term"] })}
                options={["Fall", "Spring"]}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Practice">
              <Select
                value={projectForm.practice}
                onChange={(e) => setProjectForm({ ...projectForm, practice: e.target.value as Practice })}
                options={["Strategy", "Digital"]}
              />
            </Field>
            <Field label="Sector">
              <Input value={projectForm.sector} onChange={(e) => setProjectForm({ ...projectForm, sector: e.target.value })} />
            </Field>
          </div>
          <Field label="Categories" hint="Separate with commas, for example: Market sizing, Pricing">
            <Input value={projectForm.categories} onChange={(e) => setProjectForm({ ...projectForm, categories: e.target.value })} />
          </Field>
          <Field label="Summary">
            <Textarea rows={4} value={projectForm.summary} onChange={(e) => setProjectForm({ ...projectForm, summary: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Deliverable label">
              <Input
                placeholder="Final deck"
                value={projectForm.deliverableLabel}
                onChange={(e) => setProjectForm({ ...projectForm, deliverableLabel: e.target.value })}
              />
            </Field>
            <Field label="Deliverable URL">
              <Input
                type="url"
                placeholder="https://"
                value={projectForm.deliverableUrl}
                onChange={(e) => setProjectForm({ ...projectForm, deliverableUrl: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Project lead">
            <select
              value={projectForm.lead || me.id}
              onChange={(e) => setProjectForm({ ...projectForm, lead: e.target.value })}
              className="w-full border border-line bg-white px-3 py-2 text-sm text-ink focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
            >
              {memberOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAddingProject(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!projectForm.client.trim()}>
              Save project
            </Button>
          </div>
        </form>
      </Drawer>

      <Drawer open={addingTemplate} onClose={() => setAddingTemplate(false)} title="Add template">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveTemplate();
          }}
        >
          <Field label="Title">
            <Input required value={templateForm.title} onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })} />
          </Field>
          <Field label="Category">
            <Input
              required
              list="template-categories"
              value={templateForm.category}
              onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
            />
            <datalist id="template-categories">
              {templateGroups.map(([c]) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Description">
            <Textarea value={templateForm.description} onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })} />
          </Field>
          <Field label="Source project" hint="Optional">
            <select
              value={templateForm.sourceProjectId}
              onChange={(e) => setTemplateForm({ ...templateForm, sourceProjectId: e.target.value })}
              className="w-full border border-line bg-white px-3 py-2 text-sm text-ink focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
            >
              <option value="">None</option>
              {projectOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Template URL">
            <Input type="url" placeholder="https://" value={templateForm.url} onChange={(e) => setTemplateForm({ ...templateForm, url: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAddingTemplate(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!templateForm.title.trim() || !templateForm.category.trim()}>
              Save template
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
