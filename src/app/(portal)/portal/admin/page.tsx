"use client";

import { useState } from "react";
import { classStanding, currentTerm, fmtDate, fullName, isAlum, promotionSuggestions, uid } from "@/portal/logic";
import { ExecOnly } from "@/portal/exec-only";
import { usePortal } from "@/portal/store";
import { EXEC_TITLES, ROLES, SCHOOLS, type ExecTitle, type Member, type Role, type School } from "@/portal/types";
import { Avatar, Badge, Button, Card, Drawer, Empty, Field, Input, PageTitle, Select, Stat, Td, Th } from "@/portal/ui";

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
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Members & roles"
        sub="Class standing and alumni status update automatically from graduation year. Promotions are proposed each term and take effect when you approve them."
        actions={<Button onClick={() => setInviteOpen(true)}>Add member</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Active members" value={active.length} />
        <Stat label="Seniors" value={seniors.length} sub="Move to alumni on June 1" />
        <Stat label="Alumni in system" value={alumni.length} />
        <Stat label="Pending promotions" value={promos.length} />
      </div>

      <Card
        className="mt-6"
        title="Proposed promotions"
        action={promos.length > 1 ? <Button variant="secondary" onClick={approveAll}>Approve all</Button> : undefined}
      >
        {promos.length === 0 ? (
          <Empty>No promotions to review this term.</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {promos.map((p) => (
              <li key={p.member.id} className="flex flex-wrap items-center justify-between gap-4 py-3.5">
                <span className="flex items-center gap-3">
                  <Avatar name={fullName(p.member)} photo={p.member.photo} />
                  <span>
                    <span className="block font-medium">{fullName(p.member)}</span>
                    <span className="text-sm text-muted">
                      {p.member.role} → <strong className="text-ink">{p.to}</strong> · {p.reason}
                    </span>
                  </span>
                </span>
                <span className="flex gap-2">
                  <Button variant="ghost" onClick={() => setSkipped((s) => [...s, p.member.id])}>
                    Not now
                  </Button>
                  <Button onClick={() => changeRole(p.member, p.to)}>Approve</Button>
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
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={showAlumni} onChange={(e) => setShowAlumni(e.target.checked)} />
            Include alumni
          </label>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b border-line">
              <tr>
                <Th>Member</Th>
                <Th>School</Th>
                <Th>Class</Th>
                <Th>Role</Th>
                <Th>Exec title</Th>
                <Th>On website</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {roster.map((m) => {
                const standing = classStanding(m.gradYear, now);
                return (
                  <tr key={m.id} className={standing === "Alumni" ? "bg-stone" : ""}>
                    <Td>
                      <span className="flex items-center gap-3">
                        <Avatar name={fullName(m)} photo={m.photo} size={30} />
                        <span>
                          <span className="block font-medium">{fullName(m)}</span>
                          <span className="text-xs text-muted">{m.schoolEmail}</span>
                        </span>
                      </span>
                    </Td>
                    <Td>{m.school}</Td>
                    <Td>
                      {m.gradYear} <Badge tone={standing === "Alumni" ? "gray" : "blue"}>{standing}</Badge>
                    </Td>
                    <Td>
                      <Select
                        aria-label={`Role for ${fullName(m)}`}
                        options={ROLES}
                        value={m.role}
                        disabled={standing === "Alumni"}
                        onChange={(e) => changeRole(m, e.target.value as Role)}
                        className="!w-48"
                      />
                    </Td>
                    <Td>
                      {m.role === "Executive Board" ? (
                        <Select
                          aria-label={`Exec title for ${fullName(m)}`}
                          options={EXEC_TITLES}
                          value={m.execTitle ?? EXEC_TITLES[0]}
                          onChange={(e) => setMember(m.id, { execTitle: e.target.value as ExecTitle })}
                          className="!w-64"
                        />
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </Td>
                    <Td>
                      <input
                        type="checkbox"
                        aria-label={`Show ${fullName(m)} on website`}
                        checked={m.showOnWebsite && standing !== "Alumni"}
                        disabled={standing === "Alumni"}
                        onChange={(e) => setMember(m.id, { showOnWebsite: e.target.checked })}
                      />
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6" title="Role history">
        {data.roleChanges.length === 0 ? (
          <Empty>Role changes you approve are recorded here, so every member&apos;s path is kept.</Empty>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {data.roleChanges.slice(0, 20).map((c) => {
              const m = data.members.find((x) => x.id === c.memberId);
              const by = data.members.find((x) => x.id === c.approvedBy);
              return (
                <li key={c.id} className="py-3">
                  <strong>{m ? fullName(m) : "Member"}</strong>: {c.from} → {c.to}{" "}
                  <span className="text-muted">
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
        onClose={() => setInviteOpen(false)}
        onAdd={(m) => update((d) => ({ ...d, members: [...d.members, m] }))}
      />
      <p className="mt-6 text-xs text-muted">Last checked {fmtDate(now)}.</p>
    </div>
  );
}

function InviteDrawer({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (m: Member) => void }) {
  const blank = { firstName: "", lastName: "", schoolEmail: "", school: "Pomona" as School, gradYear: new Date().getFullYear() + 4, practice: "Strategy" as Member["practice"], role: "Associate Consultant" as Role };
  const [f, setF] = useState(blank);
  const valid = f.firstName && f.lastName && f.schoolEmail.includes("@");
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
            personalEmail: "",
            phone: "",
            studentId: "",
            joinedTerm: currentTerm(),
            showOnWebsite: true,
          });
          setF(blank);
          onClose();
        }}
      >
        <p className="text-sm text-muted">They&apos;ll be asked to complete the rest of their profile at first login.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name">
            <Input value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} required />
          </Field>
          <Field label="Last name">
            <Input value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} required />
          </Field>
        </div>
        <Field label="School email">
          <Input type="email" value={f.schoolEmail} onChange={(e) => setF({ ...f, schoolEmail: e.target.value })} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
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
        <Button type="submit" disabled={!valid}>
          Add member
        </Button>
      </form>
    </Drawer>
  );
}
