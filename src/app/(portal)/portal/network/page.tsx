"use client";

import { useState } from "react";
import Link from "@/components/app-link";
import { usePortal } from "@/portal/store";
import { MIN_GRADERS, companyNames, companySlug, contactGrade, findContact, isLinkedInUrl, matchCompany, pct, responseStats, uid, withProtocol } from "@/portal/logic";
import { FirmOptions } from "@/portal/outreach";
import type { Contact } from "@/portal/types";
import { Button, Drawer, Empty, Field, GradeTile, Input, PageTitle, Stat, StatGroup, TableWrap, Td, Textarea, Th, linkCls, rowCls } from "@/portal/ui";

type ContactDraft = Omit<Contact, "id" | "addedBy" | "alumClass"> & { alumClass: string };
const emptyContact: ContactDraft = { name: "", company: "", title: "", email: "", linkedin: "", isAlum: false, alumClass: "", preferences: "" };

const alumShort = (c: Contact) => (c.alumClass ? `Graphite '${String(c.alumClass).slice(-2)}` : "Graphite alum");
const none = <span className="text-faint">None</span>;

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-[13px] whitespace-nowrap text-ink-2">
      <input type="checkbox" className="h-4 w-4 accent-[var(--color-accent)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export default function NetworkPage() {
  const { data, me, update } = usePortal();
  const [query, setQuery] = useState("");
  const [alumOnly, setAlumOnly] = useState(false);
  const [company, setCompany] = useState("");
  const [adding, setAdding] = useState(false);
  const [contactDraft, setContactDraft] = useState<ContactDraft>(emptyContact);
  const [formError, setFormError] = useState("");

  if (!me) return null;

  const org = responseStats(data.outreach);
  const companies = [...new Set(data.contacts.map((c) => c.company).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const q = query.trim().toLowerCase();
  const firm = company.trim().toLowerCase();
  // Typing part of a firm's name narrows the list; earlier employers count too.
  const atFirm = (c: Contact) => !firm || c.company.toLowerCase().includes(firm) || !!c.history?.some((h) => h.company.toLowerCase().includes(firm));
  const rows = data.contacts
    .filter(
      (c) =>
        (!q || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)) &&
        (!alumOnly || c.isAlum) &&
        atFirm(c),
    )
    .map((c) => ({ contact: c, stats: contactGrade(data.outreach.filter((o) => o.contactId === c.id)) }))
    .sort((a, b) => a.contact.name.localeCompare(b.contact.name));

  const draftFirm = contactDraft.company.trim() ? matchCompany(data, contactDraft.company) : "";
  const duplicate =
    contactDraft.name.trim() && (contactDraft.linkedin.trim() || draftFirm)
      ? findContact(data.contacts, { name: contactDraft.name, linkedin: contactDraft.linkedin, company: draftFirm })
      : undefined;

  const closeAdd = () => {
    setAdding(false);
    setFormError("");
  };

  const saveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactDraft.name.trim() || duplicate) return;
    if (!isLinkedInUrl(contactDraft.linkedin)) {
      setFormError("Paste their LinkedIn profile link, for example linkedin.com/in/their-name.");
      return;
    }
    const year = Number(contactDraft.alumClass);
    const c: Contact = {
      id: uid(),
      name: contactDraft.name.trim(),
      company: draftFirm,
      title: contactDraft.title.trim(),
      email: contactDraft.email.trim(),
      linkedin: withProtocol(contactDraft.linkedin),
      isAlum: contactDraft.isAlum,
      alumClass: contactDraft.isAlum && year > 0 ? year : undefined,
      preferences: contactDraft.preferences.trim(),
      addedBy: me.id,
    };
    update((d) => ({ ...d, contacts: [...d.contacts, c] }));
    setContactDraft(emptyContact);
    closeAdd();
  };

  return (
    <div>
      <PageTitle
        title="Network"
        sub="People Graphite members have reached out to, graded on how often they reply, how fast and how much they help."
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
        <div className="w-full md:max-w-[15rem]">
          <Input type="search" list="network-firms" placeholder="Search companies" value={company} onChange={(e) => setCompany(e.target.value)} aria-label="Search companies" />
          <FirmOptions id="network-firms" names={companies} />
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
          <table className="w-full min-w-[1020px]">
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Grade</Th>
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
                    <span className="flex items-center gap-2" title={s.letter ? undefined : `A letter needs ${MIN_GRADERS} members' outreach`}>
                      <GradeTile letter={s.letter} />
                      <span className="text-[12px] text-muted tabular-nums">{s.graders ? `${s.graders} ${s.graders === 1 ? "member" : "members"}` : "None yet"}</span>
                    </span>
                  </Td>
                  <Td>
                    {c.company ? (
                      <Link href={`/portal/companies/${companySlug(c.company)}`} className={linkCls}>
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

      <Drawer open={adding} onClose={closeAdd} title="Add contact">
        <form onSubmit={saveContact} className="space-y-4">
          <Field label="Name">
            <Input required value={contactDraft.name} onChange={(e) => setContactDraft({ ...contactDraft, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company">
              <Input required list="add-contact-firms" value={contactDraft.company} onChange={(e) => setContactDraft({ ...contactDraft, company: e.target.value })} />
              <FirmOptions id="add-contact-firms" names={companyNames(data)} />
            </Field>
            <Field label="Title">
              <Input required value={contactDraft.title} onChange={(e) => setContactDraft({ ...contactDraft, title: e.target.value })} />
            </Field>
          </div>
          <Field label="Email">
            <Input type="email" value={contactDraft.email} onChange={(e) => setContactDraft({ ...contactDraft, email: e.target.value })} />
          </Field>
          <Field label="LinkedIn profile">
            <Input
              required
              inputMode="url"
              placeholder="linkedin.com/in/their-name"
              value={contactDraft.linkedin}
              onChange={(e) => {
                setContactDraft({ ...contactDraft, linkedin: e.target.value });
                setFormError("");
              }}
              aria-invalid={!!formError}
            />
          </Field>
          {formError && (
            <p role="alert" className="-mt-2 text-[12.5px] text-[#a8261b]">
              {formError}
            </p>
          )}
          {duplicate && (
            <p role="status" className="rounded-[3px] border border-edge bg-[#fbfbf7] px-3 py-2 text-[12.5px] text-ink-2">
              {duplicate.name} is already in the Network.{" "}
              <Link href={`/portal/network/${duplicate.id}`} className={linkCls} onClick={closeAdd}>
                Open their page
              </Link>{" "}
              to log outreach or update their role.
            </p>
          )}
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
            <Button type="submit" disabled={!!duplicate}>
              Save contact
            </Button>
            <Button variant="secondary" onClick={closeAdd}>
              Cancel
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
