"use client";

import { useState } from "react";
import Link from "@/components/app-link";
import { usePortal } from "@/portal/store";
import { companySlug, pct, responseStats, uid } from "@/portal/logic";
import type { Contact } from "@/portal/types";
import { Button, Drawer, Empty, Field, Input, PageTitle, Select, Stat, StatGroup, TableWrap, Td, Textarea, Th, rowCls } from "@/portal/ui";

const ALL = "All companies";

type ContactDraft = Omit<Contact, "id" | "addedBy" | "alumClass"> & { alumClass: string };
const emptyContact: ContactDraft = { name: "", company: "", title: "", email: "", linkedin: "", isAlum: false, alumClass: "", preferences: "" };

const alumShort = (c: Contact) => (c.alumClass ? `Graphite '${String(c.alumClass).slice(-2)}` : "Graphite alum");
const none = <span className="text-faint">None</span>;

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-[13px] whitespace-nowrap text-ink-2">
      <input type="checkbox" className="h-4 w-4 accent-[var(--color-prussian)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export default function NetworkPage() {
  const { data, me, update } = usePortal();
  const [query, setQuery] = useState("");
  const [alumOnly, setAlumOnly] = useState(false);
  const [company, setCompany] = useState(ALL);
  const [adding, setAdding] = useState(false);
  const [contactDraft, setContactDraft] = useState<ContactDraft>(emptyContact);

  if (!me) return null;

  const org = responseStats(data.outreach);
  const companies = [...new Set(data.contacts.map((c) => c.company).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const q = query.trim().toLowerCase();
  const rows = data.contacts
    .filter(
      (c) =>
        (!q || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)) &&
        (!alumOnly || c.isAlum) &&
        (company === ALL || c.company === company),
    )
    .map((c) => ({ contact: c, stats: responseStats(data.outreach.filter((o) => o.contactId === c.id)) }))
    .sort((a, b) => a.contact.name.localeCompare(b.contact.name));

  const saveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactDraft.name.trim()) return;
    const year = Number(contactDraft.alumClass);
    const c: Contact = {
      id: uid(),
      name: contactDraft.name.trim(),
      company: contactDraft.company.trim(),
      title: contactDraft.title.trim(),
      email: contactDraft.email.trim(),
      linkedin: contactDraft.linkedin.trim(),
      isAlum: contactDraft.isAlum,
      alumClass: contactDraft.isAlum && year > 0 ? year : undefined,
      preferences: contactDraft.preferences.trim(),
      addedBy: me.id,
    };
    update((d) => ({ ...d, contacts: [...d.contacts, c] }));
    setContactDraft(emptyContact);
    setAdding(false);
  };

  return (
    <div>
      <PageTitle
        title="Network"
        sub="People Graphite members have reached out to, with how they respond and how to approach them."
        actions={<Button onClick={() => setAdding(true)}>Add contact</Button>}
      />

      <StatGroup>
        <Stat label="Outreach logged" value={org.total} sub={`Across ${data.contacts.length} contacts`} />
        <Stat label="Response rate" value={pct(org.rate)} sub={`${org.responded} of ${org.total} replied`} />
        <Stat label="Median reply time" value={org.medianDays ?? "None"} sub="Days" />
        <Stat label="Referrals" value={org.referrals} />
      </StatGroup>

      <div className="mt-6 mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="w-full md:max-w-xs">
          <Input type="search" placeholder="Search name, company or title" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search contacts" />
        </div>
        <div className="w-full md:max-w-[14rem]">
          <Select options={[ALL, ...companies]} value={company} onChange={(e) => setCompany(e.target.value)} aria-label="Filter by company" />
        </div>
        <Check label="Graphite alumni only" checked={alumOnly} onChange={setAlumOnly} />
        <p className="text-[13px] text-muted tabular-nums md:ml-auto">
          {rows.length} {rows.length === 1 ? "contact" : "contacts"}
        </p>
      </div>

      <TableWrap>
        {rows.length === 0 ? (
          <Empty>No contacts match these filters.</Empty>
        ) : (
          <table className="w-full min-w-[920px]">
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Company</Th>
                <Th>Title</Th>
                <Th className="text-right">Outreach</Th>
                <Th className="text-right">Response rate</Th>
                <Th className="text-right">Median reply</Th>
                <Th className="text-right">Helpfulness</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ contact: c, stats: s }) => (
                <tr key={c.id} className={rowCls}>
                  <Td className="whitespace-nowrap">
                    <Link href={`/portal/network/${c.id}`} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                    {c.isAlum && <span className="ml-2 text-[12.5px] text-muted">{alumShort(c)}</span>}
                  </Td>
                  <Td>
                    {c.company ? (
                      <Link href={`/portal/companies/${companySlug(c.company)}`} className="hover:underline">
                        {c.company}
                      </Link>
                    ) : (
                      none
                    )}
                  </Td>
                  <Td className="text-muted">{c.title}</Td>
                  <Td className="text-right tabular-nums">{s.total}</Td>
                  <Td className="text-right tabular-nums">{s.total ? pct(s.rate) : none}</Td>
                  <Td className="text-right tabular-nums">{s.medianDays != null ? `${s.medianDays} ${s.medianDays === 1 ? "day" : "days"}` : none}</Td>
                  <Td className="text-right tabular-nums">{s.avgHelpfulness != null ? `${s.avgHelpfulness.toFixed(1)} of 5` : none}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableWrap>

      <Drawer open={adding} onClose={() => setAdding(false)} title="Add contact">
        <form onSubmit={saveContact} className="space-y-4">
          <Field label="Name">
            <Input required value={contactDraft.name} onChange={(e) => setContactDraft({ ...contactDraft, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company">
              <Input value={contactDraft.company} onChange={(e) => setContactDraft({ ...contactDraft, company: e.target.value })} />
            </Field>
            <Field label="Title">
              <Input value={contactDraft.title} onChange={(e) => setContactDraft({ ...contactDraft, title: e.target.value })} />
            </Field>
          </div>
          <Field label="Email">
            <Input type="email" value={contactDraft.email} onChange={(e) => setContactDraft({ ...contactDraft, email: e.target.value })} />
          </Field>
          <Field label="LinkedIn">
            <Input type="url" placeholder="https://www.linkedin.com/in/" value={contactDraft.linkedin} onChange={(e) => setContactDraft({ ...contactDraft, linkedin: e.target.value })} />
          </Field>
          <Check label="Graphite alum" checked={contactDraft.isAlum} onChange={(v) => setContactDraft({ ...contactDraft, isAlum: v })} />
          {contactDraft.isAlum && (
            <Field label="Class year">
              <Input type="number" min={1990} max={2100} placeholder="For example, 2023" value={contactDraft.alumClass} onChange={(e) => setContactDraft({ ...contactDraft, alumClass: e.target.value })} />
            </Field>
          )}
          <Field label="How to approach" hint="How they like to be contacted, availability, anything that helps the next member.">
            <Textarea value={contactDraft.preferences} onChange={(e) => setContactDraft({ ...contactDraft, preferences: e.target.value })} />
          </Field>
          <div className="flex gap-2 pt-2">
            <Button type="submit">Save contact</Button>
            <Button variant="secondary" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
