"use client";

import { useMemo, useState } from "react";
import Link from "@/components/app-link";
import { usePortal } from "@/portal/store";
import { fullName, isExec, uid } from "@/portal/logic";
import type { Practice, Project, Template } from "@/portal/types";
import { Button, Drawer, Empty, Field, Input, PageTitle, Select, Textarea } from "@/portal/ui";

type Tab = "archive" | "templates";
const ALL_CATEGORIES = "All categories";
const ALL_YEARS = "All years";
const PRACTICES = ["All", "Strategy", "Digital"] as const;

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

const fieldCls = "w-full border border-line bg-paper px-3 py-2 text-[0.9375rem] text-ink focus:border-ink focus:outline-none";

/** Plain text tab, underlined when active. Same treatment as the public site's filters. */
function TextTab({ active, onClick, children, role = "tab" }: { active: boolean; onClick: () => void; children: React.ReactNode; role?: string }) {
  return (
    <button
      type="button"
      role={role}
      aria-selected={role === "tab" ? active : undefined}
      aria-pressed={role === "tab" ? undefined : active}
      onClick={onClick}
      className={`transition-colors ${active ? "text-ink underline decoration-1 underline-offset-[0.45em]" : "text-muted hover:text-ink"}`}
    >
      {children}
    </button>
  );
}

export default function ProjectsPage() {
  const { data, me, update } = usePortal();
  const [tab, setTab] = useState<Tab>("archive");
  const [q, setQ] = useState("");
  const [practice, setPractice] = useState<(typeof PRACTICES)[number]>("All");
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [year, setYear] = useState(ALL_YEARS);
  const [addingProject, setAddingProject] = useState(false);
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [addingTemplate, setAddingTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState(emptyTemplate);

  const categories = useMemo(() => [...new Set(data.projects.flatMap((p) => p.categories))].sort((a, b) => a.localeCompare(b)), [data.projects]);
  const years = useMemo(() => [...new Set(data.projects.map((p) => p.year))].sort((a, b) => b - a).map(String), [data.projects]);

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
  const projectById = (id?: string) => data.projects.find((p) => p.id === id);

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
      deliverables: f.deliverableUrl.trim() ? [{ label: f.deliverableLabel.trim() || "Deliverable", url: f.deliverableUrl.trim() }] : [],
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

  return (
    <div>
      <PageTitle
        title="Projects"
        sub="Every past engagement and the templates that came out of them. Summaries will be generated from the Google Drive project folders once Drive is connected."
        actions={
          exec &&
          (tab === "archive" ? <Button onClick={() => setAddingProject(true)}>Add project</Button> : <Button onClick={() => setAddingTemplate(true)}>Add template</Button>)
        }
      />

      <div className="flex gap-7 border-b border-line pb-4 text-[1.0625rem]" role="tablist" aria-label="Projects view">
        <TextTab active={tab === "archive"} onClick={() => setTab("archive")}>
          Archive
        </TextTab>
        <TextTab active={tab === "templates"} onClick={() => setTab("templates")}>
          Templates
        </TextTab>
      </div>

      {tab === "archive" && (
        <>
          <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center">
            <Input type="search" placeholder="Search client, summary, sector or category" aria-label="Search projects" value={q} onChange={(e) => setQ(e.target.value)} className="lg:max-w-sm" />
            <div className="flex gap-5 text-sm" aria-label="Practice">
              {PRACTICES.map((p) => (
                <TextTab key={p} role="button" active={practice === p} onClick={() => setPractice(p)}>
                  {p}
                </TextTab>
              ))}
            </div>
            <div className="flex gap-3 lg:ml-auto">
              <Select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)} options={[ALL_CATEGORIES, ...categories]} className="lg:w-56" />
              <Select aria-label="Year" value={year} onChange={(e) => setYear(e.target.value)} options={[ALL_YEARS, ...years]} className="lg:w-36" />
            </div>
          </div>

          <p className="mt-8 text-sm text-muted">
            {results.length} {results.length === 1 ? "engagement" : "engagements"}
          </p>
          <div className="mt-3 border-t border-ink">
            {results.length === 0 ? (
              <Empty>No projects match these filters.</Empty>
            ) : (
              <ul>
                {results.map((p) => (
                  <li key={p.id} className="grid gap-x-10 gap-y-2 border-b border-line py-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                    <div className="min-w-0">
                      <Link href={`/portal/projects/${p.id}`} className="display text-[1.5rem] leading-tight hover:underline hover:decoration-1 hover:underline-offset-4">
                        {p.client}
                      </Link>
                      <p className="mt-1.5 text-sm text-muted">
                        {p.term} {p.year} · {p.practice}
                        {p.sector && ` · ${p.sector}`}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-1 leading-relaxed text-ink-2">{p.summary}</p>
                      {p.categories.length > 0 && <p className="mt-1.5 text-sm text-muted">{p.categories.join(", ")}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {tab === "templates" && (
        <div className="mt-10 space-y-14">
          {templateGroups.length === 0 && <Empty>No templates yet.</Empty>}
          {templateGroups.map(([cat, list]) => (
            <section key={cat}>
              <h2 className="display border-b border-ink pb-3 text-[1.5rem] leading-tight">{cat}</h2>
              <ul>
                {list.map((t) => {
                  const src = projectById(t.sourceProjectId);
                  return (
                    <li key={t.id} className="grid gap-x-10 gap-y-1.5 border-b border-line py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]">
                      <a href={t.url} target="_blank" rel="noreferrer" className="link-u font-medium">
                        {t.title}
                      </a>
                      <p className="text-ink-2">{t.description}</p>
                      <p className="text-sm text-muted md:text-right">
                        {src && (
                          <>
                            From{" "}
                            <Link href={`/portal/projects/${src.id}`} className="link-u text-ink-2">
                              {src.client}
                            </Link>
                          </>
                        )}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

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
              <Select value={projectForm.term} onChange={(e) => setProjectForm({ ...projectForm, term: e.target.value as Project["term"] })} options={["Fall", "Spring"]} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Practice">
              <Select value={projectForm.practice} onChange={(e) => setProjectForm({ ...projectForm, practice: e.target.value as Practice })} options={["Strategy", "Digital"]} />
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
              <Input placeholder="Final deck" value={projectForm.deliverableLabel} onChange={(e) => setProjectForm({ ...projectForm, deliverableLabel: e.target.value })} />
            </Field>
            <Field label="Deliverable URL">
              <Input type="url" placeholder="https://" value={projectForm.deliverableUrl} onChange={(e) => setProjectForm({ ...projectForm, deliverableUrl: e.target.value })} />
            </Field>
          </div>
          <Field label="Team lead">
            <select value={projectForm.lead || me.id} onChange={(e) => setProjectForm({ ...projectForm, lead: e.target.value })} className={fieldCls}>
              {memberOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={!projectForm.client.trim()}>
              Save project
            </Button>
            <Button variant="secondary" onClick={() => setAddingProject(false)}>
              Cancel
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
            <Input required list="template-categories" value={templateForm.category} onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })} />
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
            <select value={templateForm.sourceProjectId} onChange={(e) => setTemplateForm({ ...templateForm, sourceProjectId: e.target.value })} className={fieldCls}>
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
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={!templateForm.title.trim() || !templateForm.category.trim()}>
              Save template
            </Button>
            <Button variant="secondary" onClick={() => setAddingTemplate(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
