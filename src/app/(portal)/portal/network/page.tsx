"use client";

import { useState } from "react";
import { usePortal } from "@/portal/store";
import { fmtDate, fullName, pct, responseStats, uid } from "@/portal/logic";
import type { Comment, Contact, Outreach, PortalData } from "@/portal/types";
import { Badge, Button, Card, Drawer, Empty, Field, Input, PageTitle, Select, Stat, Td, Textarea, Th } from "@/portal/ui";

const ALL = "All companies";
const CHANNELS: Outreach["channel"][] = ["Email", "LinkedIn", "Referral", "In person"];
const RATINGS = ["Not rated", "1", "2", "3", "4", "5"] as const;

const today = () => new Date().toISOString().slice(0, 10);
const fmtDays = (d?: number) => (d == null ? "None" : `${d} day${d === 1 ? "" : "s"}`);

type ContactDraft = Omit<Contact, "id" | "addedBy" | "alumClass"> & { alumClass: string };
const emptyContact: ContactDraft = { name: "", company: "", title: "", email: "", linkedin: "", isAlum: false, alumClass: "", preferences: "" };

type OutreachDraft = {
  date: string;
  channel: Outreach["channel"];
  responded: boolean;
  responseDays: string;
  chatted: boolean;
  helpfulness: string;
  referred: boolean;
  notes: string;
};
const newOutreachDraft = (): OutreachDraft => ({
  date: today(),
  channel: "Email",
  responded: false,
  responseDays: "",
  chatted: false,
  helpfulness: "Not rated",
  referred: false,
  notes: "",
});

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" className="h-4 w-4 accent-accent" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

const alumBadge = (c: Contact) => (c.isAlum ? <Badge tone="blue">{c.alumClass ? `Alum '${String(c.alumClass).slice(-2)}` : "Alum"}</Badge> : null);

export default function NetworkPage() {
  const { data, me, update } = usePortal();
  const [query, setQuery] = useState("");
  const [alumOnly, setAlumOnly] = useState(false);
  const [company, setCompany] = useState(ALL);
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [contactDraft, setContactDraft] = useState<ContactDraft>(emptyContact);

  if (!me) return null;

  const org = responseStats(data.outreach);
  const companies = [...new Set(data.contacts.map((c) => c.company).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const q = query.trim().toLowerCase();
  const rows = data.contacts
    .filter((c) => (!q || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q)) && (!alumOnly || c.isAlum) && (company === ALL || c.company === company))
    .map((c) => ({ contact: c, stats: responseStats(data.outreach.filter((o) => o.contactId === c.id)) }))
    .sort((a, b) => a.contact.name.localeCompare(b.contact.name));
  const openContact = data.contacts.find((c) => c.id === openId);

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
        sub="Shared contacts across Graphite. Log every outreach so the next member knows who responds, how quickly and how to approach them."
        actions={<Button onClick={() => setAdding(true)}>Add contact</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Outreach logged" value={org.total} sub={`${data.contacts.length} contacts`} />
        <Stat label="Response rate" value={pct(org.rate)} sub={`${org.responded} responded`} />
        <Stat label="Median response" value={org.medianDays != null ? `${org.medianDays}d` : "None"} sub="Days to reply" />
        <Stat label="Referrals" value={org.referrals} />
      </div>

      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center">
        <Input type="search" placeholder="Search name or company" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search contacts" className="md:max-w-sm" />
        <Select options={[ALL, ...companies]} value={company} onChange={(e) => setCompany(e.target.value)} aria-label="Filter by company" className="md:max-w-xs" />
        <Check label="Graphite alumni only" checked={alumOnly} onChange={setAlumOnly} />
      </div>

      <Card className="mt-4">
        {rows.length === 0 ? (
          <Empty>No contacts match these filters.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-b border-line bg-cloud">
                <tr>
                  <Th>Name</Th>
                  <Th>Company</Th>
                  <Th>Title</Th>
                  <Th>Outreach</Th>
                  <Th>Response rate</Th>
                  <Th>Median days</Th>
                  <Th>Helpfulness</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ contact: c, stats: s }) => (
                  <tr
                    key={c.id}
                    tabIndex={0}
                    onClick={() => setOpenId(c.id)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpenId(c.id))}
                    className="cursor-pointer border-b border-line last:border-0 hover:bg-cloud focus:bg-cloud focus:outline-none"
                  >
                    <Td>
                      <span className="flex flex-wrap items-center gap-2 font-medium">
                        {c.name} {alumBadge(c)}
                      </span>
                    </Td>
                    <Td>{c.company}</Td>
                    <Td className="text-slate">{c.title}</Td>
                    <Td>{s.total}</Td>
                    <Td>{s.total ? pct(s.rate) : "None"}</Td>
                    <Td>{s.medianDays ?? "None"}</Td>
                    <Td>{s.avgHelpfulness != null ? s.avgHelpfulness.toFixed(1) : "None"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Drawer open={!!openContact} onClose={() => setOpenId(null)} title={openContact?.name ?? "Contact"}>
        {openContact && <ContactDetail key={openContact.id} contact={openContact} data={data} meId={me.id} update={update} />}
      </Drawer>

      <Drawer open={adding} onClose={() => setAdding(false)} title="Add contact">
        <form onSubmit={saveContact} className="space-y-4">
          <Field label="Name">
            <Input required value={contactDraft.name} onChange={(e) => setContactDraft({ ...contactDraft, name: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
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
              <Input type="number" min={1990} max={2100} placeholder="e.g. 2023" value={contactDraft.alumClass} onChange={(e) => setContactDraft({ ...contactDraft, alumClass: e.target.value })} />
            </Field>
          )}
          <Field label="Preferences" hint="How they like to be contacted, availability, anything that helps the next member.">
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

function ContactDetail({
  contact: c,
  data,
  meId,
  update,
}: {
  contact: Contact;
  data: PortalData;
  meId: string;
  update: (fn: (d: PortalData) => PortalData) => void;
}) {
  const [draft, setDraft] = useState<OutreachDraft>(newOutreachDraft);
  const [comment, setComment] = useState("");

  const log = data.outreach.filter((o) => o.contactId === c.id).sort((a, b) => b.date.localeCompare(a.date));
  const s = responseStats(log);
  const subject = `contact:${c.id}`;
  const comments = data.comments.filter((x) => x.subject === subject).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const memberName = (id: string) => {
    const m = data.members.find((x) => x.id === id);
    return m ? fullName(m) : "Former member";
  };

  const saveOutreach = (e: React.FormEvent) => {
    e.preventDefault();
    const days = draft.responseDays.trim() === "" ? undefined : Math.max(0, Number(draft.responseDays));
    const o: Outreach = {
      id: uid(),
      contactId: c.id,
      memberId: meId,
      date: draft.date || today(),
      channel: draft.channel,
      responded: draft.responded,
      responseDays: draft.responded && days != null && Number.isFinite(days) ? days : undefined,
      chatted: draft.chatted,
      helpfulness: draft.helpfulness === "Not rated" ? undefined : (Number(draft.helpfulness) as Outreach["helpfulness"]),
      referred: draft.referred,
      notes: draft.notes.trim(),
    };
    update((d) => ({ ...d, outreach: [...d.outreach, o] }));
    setDraft(newOutreachDraft());
  };

  const postComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    const x: Comment = { id: uid(), subject, memberId: meId, body: comment.trim(), createdAt: today() };
    update((d) => ({ ...d, comments: [...d.comments, x] }));
    setComment("");
  };

  return (
    <div className="space-y-8">
      <section className="space-y-2 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{[c.title, c.company].filter(Boolean).join(", ")}</span>
          {alumBadge(c)}
        </div>
        {c.email && (
          <p>
            <span className="text-slate">Email: </span>
            <a href={`mailto:${c.email}`} className="text-accent hover:underline">
              {c.email}
            </a>
          </p>
        )}
        {c.linkedin && (
          <p>
            <span className="text-slate">LinkedIn: </span>
            <a href={c.linkedin} target="_blank" rel="noreferrer" className="break-all text-accent hover:underline">
              {c.linkedin}
            </a>
          </p>
        )}
        {c.preferences && (
          <div className="border border-line bg-cloud px-4 py-3">
            <p className="text-xs font-semibold text-slate uppercase">Preferences</p>
            <p className="mt-1 whitespace-pre-line">{c.preferences}</p>
          </div>
        )}
        <p className="text-xs text-slate">Added by {memberName(c.addedBy)}</p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Stat label="Outreach" value={s.total} />
        <Stat label="Response rate" value={s.total ? pct(s.rate) : "None"} />
        <Stat label="Median response" value={s.medianDays != null ? `${s.medianDays}d` : "None"} />
        <Stat label="Avg helpfulness" value={s.avgHelpfulness != null ? s.avgHelpfulness.toFixed(1) : "None"} sub={`${s.referrals} referral${s.referrals === 1 ? "" : "s"}`} />
      </section>

      <section>
        <h3 className="mb-3 font-serif text-lg">Outreach log</h3>
        {log.length === 0 ? (
          <p className="text-sm text-slate">No outreach logged yet.</p>
        ) : (
          <div className="overflow-x-auto border border-line">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-line bg-cloud">
                <tr>
                  <Th>Member</Th>
                  <Th>Date</Th>
                  <Th>Channel</Th>
                  <Th>Responded</Th>
                  <Th>Chatted</Th>
                  <Th>Helpful</Th>
                  <Th>Referred</Th>
                  <Th>Notes</Th>
                </tr>
              </thead>
              <tbody>
                {log.map((o) => (
                  <tr key={o.id} className="border-b border-line last:border-0">
                    <Td className="font-medium whitespace-nowrap">{memberName(o.memberId)}</Td>
                    <Td className="whitespace-nowrap text-slate">{fmtDate(o.date)}</Td>
                    <Td>{o.channel}</Td>
                    <Td className="whitespace-nowrap">
                      {o.responded ? <Badge tone="green">Yes, {fmtDays(o.responseDays)}</Badge> : <Badge>No</Badge>}
                    </Td>
                    <Td>{o.chatted ? "Yes" : "No"}</Td>
                    <Td>{o.helpfulness != null ? `${o.helpfulness}/5` : ""}</Td>
                    <Td>{o.referred ? <Badge tone="blue">Referred</Badge> : "No"}</Td>
                    <Td className="text-slate">{o.notes}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 font-serif text-lg">Log outreach</h3>
        <form onSubmit={saveOutreach} className="space-y-4 border border-line p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date">
              <Input type="date" required value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            </Field>
            <Field label="Channel">
              <Select options={CHANNELS} value={draft.channel} onChange={(e) => setDraft({ ...draft, channel: e.target.value as Outreach["channel"] })} />
            </Field>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Check label="Responded" checked={draft.responded} onChange={(v) => setDraft({ ...draft, responded: v })} />
            <Check label="Chatted" checked={draft.chatted} onChange={(v) => setDraft({ ...draft, chatted: v })} />
            <Check label="Referred me" checked={draft.referred} onChange={(v) => setDraft({ ...draft, referred: v })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Response days">
              <Input
                type="number"
                min={0}
                disabled={!draft.responded}
                value={draft.responseDays}
                onChange={(e) => setDraft({ ...draft, responseDays: e.target.value })}
                placeholder="e.g. 3"
              />
            </Field>
            <Field label="Helpfulness">
              <Select options={RATINGS} value={draft.helpfulness} onChange={(e) => setDraft({ ...draft, helpfulness: e.target.value })} />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </Field>
          <Button type="submit">Save outreach</Button>
        </form>
      </section>

      <section>
        <h3 className="mb-3 font-serif text-lg">Comments</h3>
        {comments.length === 0 ? (
          <p className="text-sm text-slate">No comments yet.</p>
        ) : (
          <ul className="divide-y divide-line border border-line">
            {comments.map((x) => (
              <li key={x.id} className="px-4 py-3">
                <p className="text-xs text-slate">
                  <span className="font-semibold text-ink">{memberName(x.memberId)}</span> · {fmtDate(x.createdAt)}
                </p>
                <p className="mt-1 text-sm whitespace-pre-line">{x.body}</p>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={postComment} className="mt-3">
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share context or advice about this contact" aria-label="New comment" />
          <div className="mt-2 flex justify-end">
            <Button type="submit" disabled={!comment.trim()}>
              Post
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
