"use client";

import Link from "@/components/app-link";
import { useState, type ReactNode } from "react";
import type { CaseStudy } from "@/content/site";
import type { PublicMember, SiteContent } from "@/lib/site-content";
import { resetSiteContent, saveSiteContent, useSiteContent } from "@/lib/use-site-content";
import { ExecOnly } from "@/portal/exec-only";
import { resizeImage } from "@/portal/image";
import { fmtDate, fullName, isAlum, uid } from "@/portal/logic";
import { usePortal } from "@/portal/store";
import type { Member } from "@/portal/types";
import { Avatar, Badge, Button, Card, Field, Input, PageTitle, Select, Textarea } from "@/portal/ui";

const TABS = ["Numbers", "People", "Case studies", "Recruiting", "Testimonials"] as const;
type Tab = (typeof TABS)[number];

export default function WebsiteAdminPage() {
  const content = useSiteContent();
  return (
    <ExecOnly>
      {/* Remount the editor whenever saved content changes so it starts from the latest version. */}
      <WebsiteEditor key={content.updatedAt ?? "defaults"} initial={content} />
    </ExecOnly>
  );
}

const groupFor = (m: Member) =>
  m.role === "Executive Board" ? "Executive Board" : m.role === "Team Lead" ? "Team Leads" : m.role === "Advisor" ? "Advisors" : "Consultants";

function WebsiteEditor({ initial }: { initial: SiteContent }) {
  const { data } = usePortal();
  const [c, setC] = useState<SiteContent>(initial);
  const [tab, setTab] = useState<Tab>("Numbers");
  const [msg, setMsg] = useState<{ tone: "green" | "red"; text: string } | null>(null);
  const dirty = JSON.stringify(c) !== JSON.stringify(initial);

  const publish = () => {
    try {
      saveSiteContent(c);
      setMsg({ tone: "green", text: "Published. The public site now shows these changes." });
    } catch (e) {
      setMsg({ tone: "red", text: e instanceof Error ? e.message : "Could not save." });
    }
  };

  const syncFromDirectory = () => {
    const members = data.members.filter((m) => m.showOnWebsite && !isAlum(m));
    const roster: PublicMember[] = members.map((m) => ({
      id: m.id,
      name: fullName(m),
      role: m.execTitle ?? (m.practice === "Digital" && m.role !== "Executive Board" ? `Digital ${m.role}` : m.role),
      group: groupFor(m),
      photo: m.photo,
    }));
    setC({ ...c, roster, groups: ["Executive Board", "Team Leads", "Consultants", "Advisors"] });
    setMsg({ tone: "green", text: `Pulled ${roster.length} current members from the directory. Review, then publish.` });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Website"
        sub="Edit what the public site shows. Changes go live when you publish; no code changes needed."
        actions={
          <>
            <Link href="/" target="_blank" className="inline-flex items-center px-3.5 py-2 text-sm font-semibold text-accent hover:underline">
              View site ↗
            </Link>
            <Button variant="secondary" disabled={!dirty} onClick={() => setC(initial)}>
              Discard
            </Button>
            <Button disabled={!dirty} onClick={publish}>
              Publish changes
            </Button>
          </>
        }
      />

      {msg && (
        <div className={`mb-6 border px-4 py-3 text-sm ${msg.tone === "green" ? "border-[#b7dcc5] bg-[#e6f4ec] text-[#1d6b3f]" : "border-[#e7b4b4] bg-[#fbe9e9] text-[#9b2c2c]"}`}>
          {msg.text}
        </div>
      )}

      <div className="mb-6 flex gap-6 overflow-x-auto border-b border-line" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`relative pb-3 text-sm font-semibold whitespace-nowrap ${tab === t ? "text-accent" : "text-slate hover:text-ink"}`}
          >
            {t}
            {tab === t && <span className="absolute inset-x-0 -bottom-px h-[3px] bg-accent" />}
          </button>
        ))}
      </div>

      {tab === "Numbers" && (
        <Card title="By the numbers" action={<span className="text-xs text-slate">Shown on Home and About</span>}>
          <div className="grid gap-5 p-5 md:grid-cols-2">
            {c.stats.map((s, i) => (
              <div key={i} className="grid grid-cols-3 gap-3 border border-line p-4">
                <Field label="Value">
                  <Input value={s.value} onChange={(e) => setC({ ...c, stats: c.stats.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
                </Field>
                <div className="col-span-2">
                  <Field label="Label">
                    <Input value={s.label} onChange={(e) => setC({ ...c, stats: c.stats.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                  </Field>
                </div>
              </div>
            ))}
          </div>
          <p className="border-t border-line px-5 py-3 text-xs text-slate">
            For reference: {data.projects.length} projects are in the portal archive and {data.members.filter((m) => !isAlum(m)).length} members are active.
          </p>
        </Card>
      )}

      {tab === "People" && <PeopleEditor c={c} setC={setC} onSync={syncFromDirectory} />}
      {tab === "Case studies" && <CasesEditor c={c} setC={setC} />}

      {tab === "Recruiting" && (
        <Card title="Recruiting status" action={<span className="text-xs text-slate">Shown on Join Us</span>}>
          <div className="grid gap-5 p-5 md:grid-cols-2">
            <Field label="Applications">
              <Select
                options={["Open", "Closed"]}
                value={c.recruiting.status === "open" ? "Open" : "Closed"}
                onChange={(e) => setC({ ...c, recruiting: { ...c.recruiting, status: e.target.value === "Open" ? "open" : "closed" } })}
              />
            </Field>
            <Field label="Current cycle">
              <Input value={c.recruiting.cycle} onChange={(e) => setC({ ...c, recruiting: { ...c.recruiting, cycle: e.target.value } })} />
            </Field>
            <Field label="Next cycle">
              <Input value={c.recruiting.next} onChange={(e) => setC({ ...c, recruiting: { ...c.recruiting, next: e.target.value } })} />
            </Field>
            <Field label="Decisions released">
              <Input value={c.recruiting.decisions} onChange={(e) => setC({ ...c, recruiting: { ...c.recruiting, decisions: e.target.value } })} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Message when closed">
                <Textarea value={c.recruiting.closedMessage} onChange={(e) => setC({ ...c, recruiting: { ...c.recruiting, closedMessage: e.target.value } })} />
              </Field>
            </div>
          </div>
        </Card>
      )}

      {tab === "Testimonials" && (
        <Card
          title="Client testimonials"
          action={
            <Button variant="secondary" onClick={() => setC({ ...c, testimonials: [...c.testimonials, { quote: "", name: "", org: "" }] })}>
              Add testimonial
            </Button>
          }
        >
          <ul className="divide-y divide-line">
            {c.testimonials.map((t, i) => (
              <li key={i} className="grid gap-3 p-5 md:grid-cols-12">
                <div className="md:col-span-7">
                  <Field label={i === 0 ? "Quote (featured on Home)" : "Quote"}>
                    <Textarea value={t.quote} onChange={(e) => setC({ ...c, testimonials: c.testimonials.map((x, j) => (j === i ? { ...x, quote: e.target.value } : x)) })} />
                  </Field>
                </div>
                <div className="space-y-3 md:col-span-4">
                  <Field label="Name or title">
                    <Input value={t.name} onChange={(e) => setC({ ...c, testimonials: c.testimonials.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                  </Field>
                  <Field label="Organization">
                    <Input value={t.org} onChange={(e) => setC({ ...c, testimonials: c.testimonials.map((x, j) => (j === i ? { ...x, org: e.target.value } : x)) })} />
                  </Field>
                </div>
                <div className="flex items-start justify-end md:col-span-1">
                  <Button variant="ghost" aria-label="Remove testimonial" onClick={() => setC({ ...c, testimonials: c.testimonials.filter((_, j) => j !== i) })}>
                    ✕
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5 text-xs text-slate">
        <span>{initial.updatedAt ? `Last published ${fmtDate(initial.updatedAt)}` : "Showing the default content."}</span>
        <button
          type="button"
          className="underline hover:text-ink"
          onClick={() => {
            if (confirm("Reset the public site to the default content?")) {
              resetSiteContent();
              setMsg({ tone: "green", text: "Reset to default content." });
            }
          }}
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}

function PeopleEditor({ c, setC, onSync }: { c: SiteContent; setC: (c: SiteContent) => void; onSync: () => void }) {
  const [error, setError] = useState("");
  const setMember = (id: string, patch: Partial<PublicMember>) => setC({ ...c, roster: c.roster.map((m) => (m.id === id ? { ...m, ...patch } : m)) });

  return (
    <div className="space-y-6">
      <Card
        title="Our People page"
        action={
          <span className="flex gap-2">
            <Button variant="secondary" onClick={onSync} title="Replace this list with current members marked 'Show on website'">
              Sync from directory
            </Button>
            <Button
              variant="secondary"
              onClick={() => setC({ ...c, roster: [...c.roster, { id: uid(), name: "New member", role: "Consultant", group: c.groups.at(-2) ?? c.groups[0] }] })}
            >
              Add person
            </Button>
          </span>
        }
      >
        <p className="border-b border-line px-5 py-3 text-xs text-slate">
          Sync pulls everyone active in the directory with their role and headshot, so new members and promotions reach the site in one step.
        </p>
        {error && <p className="px-5 pt-3 text-sm text-[#9b2c2c]">{error}</p>}
        {c.groups.map((g) => {
          const people = c.roster.filter((m) => m.group === g);
          return (
            <Section key={g} title={`${g} (${people.length})`}>
              {people.length === 0 && <p className="text-sm text-slate">Nobody in this group.</p>}
              <ul className="grid gap-3 md:grid-cols-2">
                {people.map((m) => (
                  <li key={m.id} className="flex gap-4 border border-line p-3">
                    <div className="shrink-0 text-center">
                      <Avatar name={m.name} photo={m.photo} size={72} />
                      <label className="mt-2 block cursor-pointer text-xs font-semibold text-accent hover:underline">
                        {m.photo ? "Replace" : "Add photo"}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              setMember(m.id, { photo: await resizeImage(file, 600) });
                              setError("");
                            } catch (err) {
                              setError(err instanceof Error ? err.message : "Could not use that image.");
                            }
                          }}
                        />
                      </label>
                      {m.photo && (
                        <button type="button" className="text-xs text-slate hover:text-ink" onClick={() => setMember(m.id, { photo: undefined })}>
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid flex-1 gap-2">
                      <Input aria-label="Name" value={m.name} onChange={(e) => setMember(m.id, { name: e.target.value })} />
                      <Input aria-label="Title" value={m.role} onChange={(e) => setMember(m.id, { role: e.target.value })} />
                      <div className="flex gap-2">
                        <Select aria-label="Group" options={c.groups} value={m.group} onChange={(e) => setMember(m.id, { group: e.target.value })} />
                        <Button variant="ghost" aria-label={`Remove ${m.name}`} onClick={() => setC({ ...c, roster: c.roster.filter((x) => x.id !== m.id) })}>
                          ✕
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          );
        })}
      </Card>
    </div>
  );
}

function CasesEditor({ c, setC }: { c: SiteContent; setC: (c: SiteContent) => void }) {
  const setCase = (i: number, patch: Partial<CaseStudy>) => setC({ ...c, caseStudies: c.caseStudies.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const move = (i: number, dir: -1 | 1) => {
    const list = c.caseStudies.slice();
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    setC({ ...c, caseStudies: list });
  };
  return (
    <Card
      title="Case studies"
      action={
        <Button
          variant="secondary"
          onClick={() =>
            setC({
              ...c,
              caseStudies: [...c.caseStudies, { client: "New client", title: "", practice: "Strategy", sector: "", summary: "", outcome: "" }],
            })
          }
        >
          Add case study
        </Button>
      }
    >
      <p className="border-b border-line px-5 py-3 text-xs text-slate">The first three are featured on the homepage. All appear on Our Work.</p>
      <ul className="divide-y divide-line">
        {c.caseStudies.map((cs, i) => (
          <li key={i} className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <strong>{cs.client || "Untitled"}</strong>
                {i < 3 && <Badge tone="blue">Featured</Badge>}
              </span>
              <span className="flex gap-1">
                <Button variant="ghost" aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                  ↑
                </Button>
                <Button variant="ghost" aria-label="Move down" onClick={() => move(i, 1)} disabled={i === c.caseStudies.length - 1}>
                  ↓
                </Button>
                <Button variant="ghost" aria-label="Remove" onClick={() => setC({ ...c, caseStudies: c.caseStudies.filter((_, j) => j !== i) })}>
                  ✕
                </Button>
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <Field label="Client">
                <Input value={cs.client} onChange={(e) => setCase(i, { client: e.target.value })} />
              </Field>
              <Field label="Project title">
                <Input value={cs.title} onChange={(e) => setCase(i, { title: e.target.value })} />
              </Field>
              <Field label="Practice">
                <Select options={["Strategy", "Digital"]} value={cs.practice} onChange={(e) => setCase(i, { practice: e.target.value as CaseStudy["practice"] })} />
              </Field>
              <Field label="Sector">
                <Input value={cs.sector} onChange={(e) => setCase(i, { sector: e.target.value })} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Summary">
                  <Textarea value={cs.summary} onChange={(e) => setCase(i, { summary: e.target.value })} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Result">
                  <Textarea value={cs.outcome} onChange={(e) => setCase(i, { outcome: e.target.value })} />
                </Field>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-line p-5 first-of-type:border-t-0">
      <h3 className="mb-3 text-xs font-semibold tracking-[0.08em] text-slate uppercase">{title}</h3>
      {children}
    </div>
  );
}
