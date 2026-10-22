"use client";

import { useMemo, useState } from "react";
import Link from "@/components/app-link";
import { usePortal } from "@/portal/store";
import { fullName, isExec, uid } from "@/portal/logic";
import type { Practice, Project, Template } from "@/portal/types";
import { Button, Card, Drawer, Empty, Field, Input, PageTitle, Segmented, Select, Tabs, TableWrap, Td, Textarea, Th, fieldCls, rowCls } from "@/portal/ui";

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

const PRACTICE_OPTIONS = PRACTICES.map((p) => ({ value: p, label: p }));

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

      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "archive", label: "Archive", count: data.projects.length },
          { value: "templates", label: "Templates", count: data.templates.length },
        ]}
      />

      {tab === "archive" && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Input
              type="search"
              placeholder="Search client, summary, sector or category"
              aria-label="Search projects"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-xs"
            />
            <Segmented label="Practice" value={practice} options={PRACTICE_OPTIONS} onChange={setPractice} />
            <Select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)} options={[ALL_CATEGORIES, ...categories]} className="w-auto!" />
            <Select aria-label="Year" value={year} onChange={(e) => setYear(e.target.value)} options={[ALL_YEARS, ...years]} className="w-auto!" />
            <span className="ml-auto text-[13px] text-muted tabular-nums">
              {results.length} {results.length === 1 ? "engagement" : "engagements"}
            </span>
          </div>

          <TableWrap>
            {results.length === 0 ? (
              <Empty>No projects match these filters.</Empty>
            ) : (
              <table className="w-full min-w-[820px] table-fixed">
                <thead>
                  <tr>
                    <Th className="w-[42%]">Client</Th>
                    <Th className="w-[12%]">Term</Th>
                    <Th className="w-[11%]">Practice</Th>
                    <Th className="w-[15%]">Sector</Th>
                    <Th>Tags</Th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((p) => (
                    <tr key={p.id} className={`group relative ${rowCls}`}>
                      <Td className="py-2">
                        <Link href={`/portal/projects/${p.id}`} className="block truncate font-medium after:absolute after:inset-0 group-hover:underline">
                          {p.client}
                        </Link>
                        {p.summary && <span className="mt-0.5 block truncate text-[12.5px] text-muted">{p.summary}</span>}
                      </Td>
                      <Td className="whitespace-nowrap text-ink-2 tabular-nums">
                        {p.term} {p.year}
                      </Td>
                      <Td>
                        {p.practice}
                      </Td>
                      <Td className="truncate text-ink-2">{p.sector}</Td>
                      <Td className="truncate text-[13px] text-muted">{p.categories.join(", ")}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </TableWrap>
        </>
      )}

      {tab === "templates" && (
        <Card title="Templates" flush>
          {templateGroups.length === 0 && <Empty>No templates yet.</Empty>}
          {templateGroups.map(([cat, list]) => (
            <div key={cat}>
              <p className="border-b border-edge bg-stone px-4 py-1.5 text-[12px] font-medium text-muted">
                {cat} <span className="ml-1 text-faint tabular-nums">{list.length}</span>
              </p>
              <ul className="divide-y divide-edge border-b border-edge last:border-0">
                {list.map((t) => {
                  const src = projectById(t.sourceProjectId);
                  return (
                    <li key={t.id} className="grid gap-x-6 gap-y-0.5 px-4 py-2.5 hover:bg-[#fafbfc] md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto] md:items-baseline">
                      <a href={t.url} target="_blank" rel="noreferrer" className="truncate font-medium hover:underline">
                        {t.title}
                      </a>
                      <p className="text-[13px] text-ink-2">{t.description}</p>
                      <p className="text-[12.5px] whitespace-nowrap text-muted md:text-right">
                        {src && (
                          <>
                            From{" "}
                            <Link href={`/portal/projects/${src.id}`} className="text-ink-2 hover:underline">
                              {src.client}
                            </Link>
                          </>
                        )}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </Card>
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
            <select value={projectForm.lead || me.id} onChange={(e) => setProjectForm({ ...projectForm, lead: e.target.value })} className={`${fieldCls} h-8 pr-7`}>
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
            <select value={templateForm.sourceProjectId} onChange={(e) => setTemplateForm({ ...templateForm, sourceProjectId: e.target.value })} className={`${fieldCls} h-8 pr-7`}>
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
