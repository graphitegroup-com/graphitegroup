"use client";

import { useState } from "react";
import { AC_SEMESTERS, classStanding, currentTerm, fmtDate, fullName, highestRole, isAlum, memberByEmail, parseEmails, promotionSuggestions, schoolForEmail, uid } from "@/portal/logic";
import { useGo } from "@/lib/use-go";
import { ExecOnly } from "@/portal/exec-only";
import { usePortal } from "@/portal/store";
import { EXEC_TITLES, ROLES, SCHOOLS, type ExecTitle, type Member, type Role, type School } from "@/portal/types";
import { Avatar, Badge, Button, Card, Drawer, Empty, Field, Input, PageTitle, Select, Stat, StatGroup, Td, Textarea, Th, rowCls } from "@/portal/ui";
import type { Invite } from "@/portal/types";

export default function AdminMembersPage() {
  return (
    <ExecOnly>
      <AdminMembers />
    </ExecOnly>
  );
}

function AdminMembers() {
  const { data, me, update, viewAs } = usePortal();
  const go = useGo();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [showAlumni, setShowAlumni] = useState(false);
  const [skipped, setSkipped] = useState<string[]>([]);
  if (!me) return null;

  const now = new Date();
  const promos = promotionSuggestions(data.members, now).filter((p) => !skipped.includes(p.member.id));
  const active = data.members.filter((m) => !isAlum(m, now));
  const alumni = data.members.filter((m) => isAlum(m, now));
  const roster = (showAlumni ? data.members : active).slice().sort((a, b) => ROLES.indexOf(b.role) - ROLES.indexOf(a.role) || a.lastName.localeCompare(b.lastName));
  const seniors = active.filter((m) => classStanding(m.gradYear, now) === "Senior");

  const setMember = (id: string, patch: Partial<Member>) =>
    update((d) => ({ ...d, members: d.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));

  const changeRole = (m: Member, to: Role) =>
    update((d) => ({
      ...d,
      members: d.members.map((x) =>
        x.id === m.id ? { ...x, role: to, execTitle: to === "Executive Board" ? x.execTitle ?? EXEC_TITLES[0] : undefined } : x,
      ),
      roleChanges: [{ id: uid(), memberId: m.id, from: m.role, to, term: currentTerm(now), approvedBy: me.id }, ...d.roleChanges],
    }));

  const approveAll = () => promos.forEach((p) => changeRole(p.member, p.to));

  const previewAs = (m: Member) => {
    viewAs(m.id);
    go(isAlum(m, now) ? "/portal/forum" : "/portal");
  };
  // One example of each kind of member, for a quick look at what they see.
  const presets = [
    ...(["Associate Consultant", "Consultant", "Team Lead"] as Role[]).map((r) => ({ label: r, member: active.find((m) => m.role === r && m.id !== me.id) })),
    { label: "Alum", member: alumni[0] },
  ].filter((x): x is { label: string; member: Member } => !!x.member);
  const waiting = data.invites.length + data.members.filter((m) => !data.accounts[m.id]).length;

  return (
    <div>
      <PageTitle
        title="Members & roles"
        sub={`Everyone in Graphite, current and alumni. Only people added here can set up a sign-in. Associate Consultants are proposed for Consultant after ${AC_SEMESTERS} semesters; alumni keep the highest role they held.`}
        actions={
          <span className="flex flex-wrap gap-2">
            <Button onClick={() => setPasteOpen(true)}>Invite by email</Button>
            <Button variant="secondary" onClick={() => setInviteOpen(true)}>
              Add one member
            </Button>
          </span>
        }
      />

      <StatGroup>
        <Stat label="Active members" value={active.length} />
        <Stat label="Seniors" value={seniors.length} sub="Move to alumni on June 1" />
        <Stat label="Alumni in system" value={alumni.length} />
        <Stat label="Waiting to sign up" value={waiting} sub={`${data.invites.length} invited by email`} />
      </StatGroup>

      {presets.length > 0 && (
        <Card className="mt-6" title="See the portal as someone else" flush>
          <div className="flex flex-wrap items-center gap-2 px-4 py-3">
            <span className="text-[13px] text-muted">Preview what they see, with changes off:</span>
            {presets.map((x) => (
              <Button key={x.label} variant="secondary" onClick={() => previewAs(x.member)} aria-label={`View as ${x.label}: ${fullName(x.member)}`}>
                {x.label}
                <span className="ml-1 text-faint">({fullName(x.member)})</span>
              </Button>
            ))}
          </div>
        </Card>
      )}

      <Card
        className="mt-6"
        title="Proposed promotions"
        action={promos.length > 1 ? <Button variant="secondary" onClick={approveAll}>Approve all</Button> : undefined}
        flush
      >
        {promos.length === 0 ? (
          <Empty>No Associate Consultants have finished {AC_SEMESTERS} semesters yet.</Empty>
        ) : (
          <ul className="divide-y divide-edge">
            {promos.map((p) => (
              <li key={p.member.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-2.5">
                <span className="flex items-center gap-3">
                  <Avatar name={fullName(p.member)} photo={p.member.photo} size={24} />
                  <span>
                    <span className="block font-medium">{fullName(p.member)}</span>
                    <span className="text-[12.5px] text-muted">
                      {p.member.role} to <span className="font-medium text-ink">{p.to}</span>, {p.reason}
                    </span>
                  </span>
                </span>
                <span className="flex gap-2">
                  <Button variant="ghost" onClick={() => setSkipped((s) => [...s, p.member.id])}>
                    Not now
                  </Button>
                  <Button variant="secondary" onClick={() => changeRole(p.member, p.to)}>Approve</Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        className="mt-6"
        title="Roster"
        action={
          <label className="flex items-center gap-2 text-[12.5px] text-muted">
            <input type="checkbox" className="h-4 w-4 accent-[var(--color-accent)]" checked={showAlumni} onChange={(e) => setShowAlumni(e.target.checked)} />
            Include alumni
          </label>
        }
        flush
      >
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr>
                <Th>Member</Th>
                <Th>School</Th>
                <Th>Class</Th>
                <Th>Role</Th>
                <Th>Exec title</Th>
                <Th>Sign-in</Th>
                <Th>On website</Th>
                <Th>
                  <span className="sr-only">View as</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {roster.map((m) => {
                const standing = classStanding(m.gradYear, now);
                return (
                  <tr key={m.id} className={`${rowCls} ${standing === "Alumni" ? "text-muted" : ""}`}>
                    <Td>
                      <span className="flex items-center gap-2.5">
                        <Avatar name={fullName(m)} photo={m.photo} size={24} />
                        <span>
                          <span className="block font-medium">{fullName(m)}</span>
                          <span className="block text-[12.5px] text-muted">{[m.schoolEmail, m.personalEmail].filter(Boolean).join(" · ")}</span>
                        </span>
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap">{m.school}</Td>
                    <Td>
                      <span className="flex items-center gap-2 tabular-nums">
                        {m.gradYear} <span className="text-[12.5px] text-muted">{standing}</span>
                      </span>
                    </Td>
                    <Td>
                      {standing === "Alumni" ? (
                        // Alumni keep the most senior role they held; it no longer changes.
                        <span className="whitespace-nowrap">
                          {highestRole(m, data.roleChanges)}
                          <span className="block text-[12px] text-faint">Final role</span>
                        </span>
                      ) : (
                        <Select
                          aria-label={`Role for ${fullName(m)}`}
                          options={ROLES}
                          value={m.role}
                          onChange={(e) => changeRole(m, e.target.value as Role)}
                          className="!h-7 !w-48 text-[13px]"
                        />
                      )}
                    </Td>
                    <Td>
                      {standing === "Alumni" ? (
                        <span className="text-[13px]">{m.execTitle ?? <span className="text-faint">None</span>}</span>
                      ) : m.role === "Executive Board" ? (
                        <Select
                          aria-label={`Exec title for ${fullName(m)}`}
                          options={EXEC_TITLES}
                          value={m.execTitle ?? EXEC_TITLES[0]}
                          onChange={(e) => setMember(m.id, { execTitle: e.target.value as ExecTitle })}
                          className="!h-7 !w-64 text-[13px]"
                        />
                      ) : (
                        <span className="text-faint">-</span>
                      )}
                    </Td>
                    <Td>
                      {data.accounts[m.id] ? <Badge tone="green">Set up</Badge> : <Badge tone="amber">Not yet</Badge>}
                    </Td>
                    <Td>
                      <input
                        type="checkbox"
                        aria-label={`Show ${fullName(m)} on website`}
                        checked={m.showOnWebsite && standing !== "Alumni"}
                        disabled={standing === "Alumni"}
                        onChange={(e) => setMember(m.id, { showOnWebsite: e.target.checked })}
                        className="h-4 w-4 accent-[var(--color-accent)]"
                      />
                    </Td>
                    <Td className="pr-0 text-right whitespace-nowrap">
                      {m.id !== me.id && (
                        <Button variant="ghost" onClick={() => previewAs(m)} aria-label={`View as ${fullName(m)}`}>
                          View as
                        </Button>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        className="mt-6"
        title={`Invited, not signed up${data.invites.length ? ` (${data.invites.length})` : ""}`}
        action={
          <Button variant="ghost" onClick={() => setPasteOpen(true)}>
            Invite by email
          </Button>
        }
        flush
      >
        {data.invites.length === 0 ? (
          <Empty>Nobody waiting. Paste a list of emails and each person can set up their account whenever they&apos;re ready.</Empty>
        ) : (
          <ul className="divide-y divide-edge">
            {[...data.invites]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.email.localeCompare(b.email))
              .map((i) => (
                <li key={i.email} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{i.email}</span>
                    <span className="text-[12px] text-muted">
                      {i.role}
                      {schoolForEmail(i.email) ? `, ${schoolForEmail(i.email)}` : ""}, invited {fmtDate(i.createdAt)}
                    </span>
                  </span>
                  <Button variant="ghost" onClick={() => update((d) => ({ ...d, invites: d.invites.filter((x) => x.email !== i.email) }))} aria-label={`Remove invite for ${i.email}`}>
                    Remove
                  </Button>
                </li>
              ))}
          </ul>
        )}
      </Card>

      <Card className="mt-6" title="Role history" flush>
        {data.roleChanges.length === 0 ? (
          <Empty>Role changes you approve are recorded here, so every member&apos;s path is kept.</Empty>
        ) : (
          <ul className="divide-y divide-edge">
            {data.roleChanges.slice(0, 20).map((c) => {
              const m = data.members.find((x) => x.id === c.memberId);
              const by = data.members.find((x) => x.id === c.approvedBy);
              return (
                <li key={c.id} className="px-4 py-2.5">
                  <span className="font-medium">{m ? fullName(m) : "Member"}</span>: {c.from} to {c.to}{" "}
                  <span className="text-[13px] text-muted">
                    ({c.term[0] === "F" ? "Fall" : "Spring"} {c.term.slice(1)}, approved by {by ? fullName(by) : "exec"})
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Drawer open={pasteOpen} onClose={() => setPasteOpen(false)} title="Invite by email">
        {pasteOpen && (
          <PasteInvites
            members={data.members}
            invites={data.invites}
            onInvite={(emails, role) => {
              const at = new Date().toISOString();
              update((d) => ({ ...d, invites: [...d.invites, ...emails.map((email): Invite => ({ email, role, addedBy: me.id, createdAt: at }))] }));
              setPasteOpen(false);
            }}
            onCancel={() => setPasteOpen(false)}
          />
        )}
      </Drawer>
      <InviteDrawer
        open={inviteOpen}
        members={data.members}
        onClose={() => setInviteOpen(false)}
        onAdd={(m) => update((d) => ({ ...d, members: [...d.members, m] }))}
      />
      <p className="mt-4 text-[12px] text-muted">Last checked {fmtDate(now)}.</p>
    </div>
  );
}

function InviteDrawer({ open, members, onClose, onAdd }: { open: boolean; members: Member[]; onClose: () => void; onAdd: (m: Member) => void }) {
  const blank = {
    firstName: "",
    lastName: "",
    schoolEmail: "",
    personalEmail: "",
    school: "Pomona" as School,
    gradYear: new Date().getFullYear() + 4,
    practice: "Strategy" as Member["practice"],
    role: "Associate Consultant" as Role,
  };
  const [f, setF] = useState(blank);
  const emails = [f.schoolEmail, f.personalEmail].map((e) => e.trim()).filter(Boolean);
  const taken = emails.map((e) => memberByEmail(members, e)).find(Boolean);
  const valid = f.firstName.trim() && f.lastName.trim() && emails.length > 0 && emails.every((e) => e.includes("@")) && !taken;
  return (
    <Drawer open={open} onClose={onClose} title="Add member">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onAdd({
            id: uid(),
            ...f,
            firstName: f.firstName.trim(),
            lastName: f.lastName.trim(),
            schoolEmail: f.schoolEmail.trim(),
            personalEmail: f.personalEmail.trim(),
            phone: "",
            joinedTerm: currentTerm(),
            showOnWebsite: true,
          });
          setF(blank);
          onClose();
        }}
      >
        <p className="text-[13px] text-muted">
          Only people added here can use the portal. Once added, they open the sign-in page, choose &ldquo;Set up your account&rdquo; with either email, set a
          password and fill in their details.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            <Input value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} required />
          </Field>
          <Field label="Last name">
            <Input value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} required />
          </Field>
        </div>
        <Field label="School email">
          <Input type="email" value={f.schoolEmail} onChange={(e) => setF({ ...f, schoolEmail: e.target.value })} placeholder="name@cmc.edu" />
        </Field>
        <Field label="Personal email" hint="Add at least one. Alumni sign in with this once their school email closes.">
          <Input type="email" value={f.personalEmail} onChange={(e) => setF({ ...f, personalEmail: e.target.value })} placeholder="name@gmail.com" />
        </Field>
        {taken && (
          <p role="alert" className="text-[12.5px] text-[#a8261b]">
            {fullName(taken)} already uses that email.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="School">
            <Select options={SCHOOLS} value={f.school} onChange={(e) => setF({ ...f, school: e.target.value as School })} />
          </Field>
          <Field label="Graduation year">
            <Input type="number" value={f.gradYear} onChange={(e) => setF({ ...f, gradYear: Number(e.target.value) })} />
          </Field>
          <Field label="Practice">
            <Select options={["Strategy", "Digital"]} value={f.practice} onChange={(e) => setF({ ...f, practice: e.target.value as Member["practice"] })} />
          </Field>
          <Field label="Starting role">
            <Select options={ROLES} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })} />
          </Field>
        </div>
        <p className="text-[12.5px] text-muted">They can correct school, year, practice, role and start term when they set up their account.</p>
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={!valid}>
            Add member
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

/** Paste any list of emails; each becomes an invite that the person turns into a member when they set up. */
function PasteInvites({ members, invites, onInvite, onCancel }: { members: Member[]; invites: Invite[]; onInvite: (emails: string[], role: Role) => void; onCancel: () => void }) {
  const [text, setText] = useState("");
  const [role, setRole] = useState<Role>("Associate Consultant");
  const found = parseEmails(text);
  const onRoster = found.filter((e) => memberByEmail(members, e));
  const already = found.filter((e) => !onRoster.includes(e) && invites.some((i) => i.email === e));
  const fresh = found.filter((e) => !onRoster.includes(e) && !already.includes(e));
  const notSchool = fresh.filter((e) => !schoolForEmail(e));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (fresh.length) onInvite(fresh, role);
      }}
    >
      <p className="text-[13px] text-muted">
        Paste as many emails as you like: one per line, separated by commas, or copied straight from a spreadsheet or an email. Each person can then choose
        &ldquo;Set up your account&rdquo; with that email and fill in their own name, school and class.
      </p>
      <Field label="Emails">
        <Textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder={"jdoe27@cmc.edu\nasmith@pomona.edu, bkim@hmc.edu"} />
      </Field>
      <Field label="Role they'll start with" hint="They confirm it during setup. Exec titles are assigned here afterwards.">
        <Select options={ROLES.filter((r) => r !== "Executive Board")} value={role} onChange={(e) => setRole(e.target.value as Role)} />
      </Field>
      {found.length > 0 && (
        <div role="status" className="space-y-1 rounded-[3px] border border-edge bg-[#fbfbf7] px-3 py-2 text-[12.5px] text-ink-2">
          <p>
            <span className="font-medium">{fresh.length}</span> new {fresh.length === 1 ? "email" : "emails"} to invite
            {onRoster.length > 0 && `; ${onRoster.length} already on the roster`}
            {already.length > 0 && `; ${already.length} already invited`}.
          </p>
          {notSchool.length > 0 && (
            <p className="text-muted">
              {notSchool.length} {notSchool.length === 1 ? "isn't a" : "aren't"} Claremont school {notSchool.length === 1 ? "email" : "emails"}, which is fine: they&apos;ll be
              saved as personal emails.
            </p>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={!fresh.length}>
          {fresh.length ? `Invite ${fresh.length} ${fresh.length === 1 ? "person" : "people"}` : "Invite"}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
