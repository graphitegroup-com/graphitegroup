"use client";

import { useState } from "react";
import { AC_SEMESTERS, classStanding, currentTerm, fmtDate, fullName, highestRole, isAlum, memberByEmail, promotionSuggestions, uid } from "@/portal/logic";
import { ExecOnly } from "@/portal/exec-only";
import { usePortal } from "@/portal/store";
import { EXEC_TITLES, ROLES, SCHOOLS, type ExecTitle, type Member, type Role, type School } from "@/portal/types";
import { Avatar, Badge, Button, Card, Drawer, Empty, Field, Input, PageTitle, Select, Stat, StatGroup, Td, Th, rowCls } from "@/portal/ui";

export default function AdminMembersPage() {
  return (
    <ExecOnly>
      <AdminMembers />
    </ExecOnly>
  );
}

function AdminMembers() {
  const { data, me, update } = usePortal();
  const [inviteOpen, setInviteOpen] = useState(false);
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

  return (
    <div>
      <PageTitle
        title="Members & roles"
        sub={`Everyone in Graphite, current and alumni. Only people added here can set up a sign-in. Associate Consultants are proposed for Consultant after ${AC_SEMESTERS} semesters; alumni keep the highest role they held.`}
        actions={<Button onClick={() => setInviteOpen(true)}>Add member</Button>}
      />

      <StatGroup>
        <Stat label="Active members" value={active.length} />
        <Stat label="Seniors" value={seniors.length} sub="Move to alumni on June 1" />
        <Stat label="Alumni in system" value={alumni.length} />
        <Stat label="Not signed in yet" value={data.members.filter((m) => !data.accounts[m.id]).length} sub="Added, no password set" />
      </StatGroup>

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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
            id: `m${uid()}`,
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
