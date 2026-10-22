"use client";

import Link from "@/components/app-link";
import { useState, type ReactNode } from "react";
import type { CaseStudy } from "@/content/site";
import type { PublicMember, SiteContent } from "@/lib/site-content";
import { resetSiteContent, saveSiteContent, useSiteContent } from "@/lib/use-site-content";
import { STATIC_PREVIEW } from "@/lib/preview";
import { ExecOnly } from "@/portal/exec-only";
import { resizeImage } from "@/portal/image";
import { fmtDate, fullName, isAlum, uid } from "@/portal/logic";
import { usePortal } from "@/portal/store";
import type { Member } from "@/portal/types";
import { Avatar, Badge, Button, Card, Field, Input, PageTitle, Select, Tabs, Textarea } from "@/portal/ui";

const TABS = ["Numbers", "People", "Case studies", "Recruiting", "Testimonials"] as const;
type Tab = (typeof TABS)[number];
const TAB_OPTIONS = TABS.map((t) => ({ value: t, label: t }));

const ghostCls = "inline-flex h-7 cursor-pointer items-center rounded-md px-2 text-[12.5px] font-medium text-muted hover:bg-stone hover:text-ink";

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
    <div>
      <PageTitle
        title="Website"
        sub="Edit what the public site shows. Changes go live when you publish; no code changes needed."
        actions={
          <>
            {!STATIC_PREVIEW && (
              <Link href="/" target="_blank" className="inline-flex h-8 items-center rounded-md px-2 text-[13px] font-medium text-muted hover:bg-stone hover:text-ink">
                View site
              </Link>
            )}
            {dirty && <Badge tone="amber">Unpublished changes</Badge>}
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
        <div
          role="status"
          className={`mb-5 rounded-md border px-3 py-2 text-[13px] ${msg.tone === "green" ? "border-[#c4e3cd] bg-[#e5f3e9] text-[#1d6b37]" : "border-[#f0c9c5] bg-[#fbe9e8] text-[#a8261b]"}`}
        >
          {msg.text}
        </div>
      )}

      <Tabs value={tab} onChange={setTab} options={TAB_OPTIONS} />

      {tab === "Numbers" && (
        <Card title="By the numbers" action="Shown on Home and About">
          <div className="grid gap-x-6 gap-y-4 py-4 md:grid-cols-2">
            {c.stats.map((s, i) => (
              <div key={i} className="grid grid-cols-3 gap-3">
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
          <p className="-mx-4 -mb-1 border-t border-edge bg-stone px-4 py-2 text-[12.5px] text-muted">
            For reference: {data.projects.length} projects are in the portal archive and {data.members.filter((m) => !isAlum(m)).length} members are active.
          </p>
        </Card>
      )}

      {tab === "People" && <PeopleEditor c={c} setC={setC} onSync={syncFromDirectory} />}
      {tab === "Case studies" && <CasesEditor c={c} setC={setC} />}

      {tab === "Recruiting" && (
        <Card title="Recruiting status" action="Shown on Join Us">
          <div className="grid gap-4 py-4 md:grid-cols-2">
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
          flush
          action={
            <Button variant="secondary" onClick={() => setC({ ...c, testimonials: [...c.testimonials, { quote: "", name: "", org: "" }] })}>
              Add testimonial
            </Button>
          }
        >
          <ul className="divide-y divide-edge">
            {c.testimonials.map((t, i) => (
              <li key={i} className="grid gap-3 px-4 py-4 md:grid-cols-12">
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
                  <Button variant="danger" aria-label="Remove testimonial" onClick={() => setC({ ...c, testimonials: c.testimonials.filter((_, j) => j !== i) })}>
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[12.5px] text-muted">
        <span>{initial.updatedAt ? `Last published ${fmtDate(initial.updatedAt)}` : "Showing the default content."}</span>
        <Button
          variant="danger"
          onClick={() => {
            if (confirm("Reset the public site to the default content?")) {
              resetSiteContent();
              setMsg({ tone: "green", text: "Reset to default content." });
            }
          }}
        >
          Reset to defaults
        </Button>
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
        flush
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
        <p className="border-b border-edge px-4 py-2.5 text-[12.5px] text-muted">
          Sync pulls everyone active in the directory with their role and headshot, so new members and promotions reach the site in one step.
        </p>
        {error && <p className="border-b border-edge bg-[#fbe9e8] px-4 py-2 text-[13px] text-[#a8261b]">{error}</p>}
        {c.groups.map((g) => {
          const people = c.roster.filter((m) => m.group === g);
          return (
            <Section key={g} title={g} count={people.length}>
              {people.length === 0 && <p className="px-4 py-3 text-[13px] text-muted">Nobody in this group.</p>}
              <ul className="divide-y divide-edge">
                {people.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 md:flex-nowrap">
                    <Avatar name={m.name} photo={m.photo} size={40} />
                    <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-3">
                      <Input aria-label="Name" value={m.name} onChange={(e) => setMember(m.id, { name: e.target.value })} />
                      <Input aria-label="Title" value={m.role} onChange={(e) => setMember(m.id, { role: e.target.value })} />
                      <Select aria-label="Group" options={c.groups} value={m.group} onChange={(e) => setMember(m.id, { group: e.target.value })} />
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <label className={ghostCls}>
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
                        <Button variant="ghost" onClick={() => setMember(m.id, { photo: undefined })}>
                          Remove photo
                        </Button>
                      )}
                      <Button variant="danger" aria-label={`Remove ${m.name}`} onClick={() => setC({ ...c, roster: c.roster.filter((x) => x.id !== m.id) })}>
                        Remove
                      </Button>
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
      flush
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
      <p className="border-b border-edge px-4 py-2.5 text-[12.5px] text-muted">The first three are featured on the homepage. All appear on Our Work.</p>
      <ul>
        {c.caseStudies.map((cs, i) => (
          <li key={i} className="border-b border-edge last:border-0">
            <div className="flex items-center justify-between gap-3 border-b border-edge bg-stone px-4 py-1.5">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-[13px] font-semibold">{cs.client || "Untitled"}</span>
                {i < 3 && <Badge tone="blue">Featured</Badge>}
              </span>
              <span className="flex gap-1">
                <Button variant="ghost" aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                  ↑
                </Button>
                <Button variant="ghost" aria-label="Move down" onClick={() => move(i, 1)} disabled={i === c.caseStudies.length - 1}>
                  ↓
                </Button>
                <Button variant="danger" aria-label="Remove case study" onClick={() => setC({ ...c, caseStudies: c.caseStudies.filter((_, j) => j !== i) })}>
                  Remove
                </Button>
              </span>
            </div>
            <div className="grid gap-3 px-4 py-4 md:grid-cols-4">
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

function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <div className="border-b border-edge last:border-0">
      <p className="border-b border-edge bg-stone px-4 py-1.5 text-[12px] font-medium text-muted">
        {title} <span className="ml-1 text-faint tabular-nums">{count}</span>
      </p>
      {children}
    </div>
  );
}
