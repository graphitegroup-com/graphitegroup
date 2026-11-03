"use client";

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { usePortal } from "@/portal/store";
import { classStanding, fullName, isAlum, isExec, semestersCompleted } from "@/portal/logic";
import { EXEC_TITLES, ROLES, SCHOOLS, type ExecTitle, type Member, type Practice, type Role, type School } from "@/portal/types";
import { Avatar, Badge, Button, Card, Field, Input, PageTitle, Select } from "@/portal/ui";

const MAX_SIDE = 480;
const JPEG_QUALITY = 0.82;

/** Reads an image file and returns a downscaled JPEG data URL. */
function downscaleImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load image"));
      img.onload = () => {
        const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable"));
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function ProfileForm({ me, exec, onSave }: { me: Member; exec: boolean; onSave: (m: Member) => void }) {
  const [form, setForm] = useState<Member>(() => ({ ...me }));
  const [saved, setSaved] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(false), 2500);
    return () => window.clearTimeout(t);
  }, [saved]);

  const set = <K extends keyof Member>(key: K, value: Member[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const onPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    try {
      set("photo", await downscaleImage(file));
    } catch {
      setPhotoError("That image could not be processed. Try a JPEG or PNG.");
    }
  };

  const removePhoto = () => {
    set("photo", undefined);
    if (fileRef.current) fileRef.current.value = "";
  };

  const setRole = (role: Role) => {
    setForm((f) => ({
      ...f,
      role,
      execTitle: role === "Executive Board" ? (f.execTitle ?? EXEC_TITLES[0]) : undefined,
    }));
    setSaved(false);
  };

  const save = () => {
    const next: Member = {
      ...form,
      gradYear: Number(form.gradYear) || me.gradYear,
      role: exec ? form.role : me.role,
      execTitle: (exec ? form.role : me.role) === "Executive Board" ? (exec ? form.execTitle : me.execTitle) : undefined,
    };
    onSave(next);
    setSaved(true);
  };

  const name = fullName(form).trim() || "Member";
  const sem = semestersCompleted(me.joinedTerm);

  return (
    <form
      className="max-w-3xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <Card title="Personal">
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4">
            <Avatar name={name} photo={form.photo} size={56} />
            <div className="min-w-0 space-y-1.5">
              <p className="text-[13px] font-medium text-ink-2">Headshot</p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onPhoto}
                  className="block text-[13px] text-muted file:mr-3 file:h-8 file:rounded-[3px] file:border file:border-edge file:bg-white file:px-3 file:text-[13px] file:font-medium file:text-ink hover:file:bg-stone"
                />
                {form.photo && (
                  <Button variant="ghost" onClick={removePhoto}>
                    Remove photo
                  </Button>
                )}
              </div>
              {photoError && <p className="text-[12px] text-[#a8261b]">{photoError}</p>}
              <p className="text-[12px] text-muted">Resized to 480px before saving.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name">
              <Input required value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </Field>
            <Field label="Last name">
              <Input required value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </Field>
            <Field label="Personal email">
              <Input type="email" value={form.personalEmail} onChange={(e) => set("personalEmail", e.target.value)} />
            </Field>
            <Field label="School email">
              <Input type="email" value={form.schoolEmail} onChange={(e) => set("schoolEmail", e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Student ID">
              <Input value={form.studentId} onChange={(e) => set("studentId", e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="LinkedIn URL">
                <Input
                  type="url"
                  placeholder="https://www.linkedin.com/in/"
                  value={form.linkedin ?? ""}
                  onChange={(e) => set("linkedin", e.target.value)}
                />
              </Field>
            </div>
          </div>

          <p className="text-[12.5px] text-muted">
            Phone and student ID are visible only to you and the executive board. They are used for payroll.
          </p>
        </div>
      </Card>

      <Card title="School">
        <div className="grid gap-4 py-4 sm:grid-cols-2">
          <Field label="School">
            <Select value={form.school} onChange={(e) => set("school", e.target.value as School)} options={SCHOOLS} />
          </Field>
          <Field label="Graduation year">
            <Input
              type="number"
              min={2000}
              max={2100}
              value={form.gradYear}
              onChange={(e) => set("gradYear", Number(e.target.value))}
            />
          </Field>
          <ReadOnly label="Class standing" hint={`Class of ${me.gradYear}`}>
            {classStanding(me.gradYear)}
          </ReadOnly>
          <ReadOnly label="Status" hint="Updates automatically from graduation year">
            {isAlum(me) ? <Badge>Alumni</Badge> : <Badge tone="green">Active</Badge>}
          </ReadOnly>
        </div>
      </Card>

      <Card title="Graphite">
        <div className="space-y-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Practice">
              <Select
                value={form.practice}
                onChange={(e) => set("practice", e.target.value as Practice)}
                options={["Strategy", "Digital"]}
              />
            </Field>
            <Field label="Role" hint={exec ? undefined : "Exec updates roles"}>
              <Select
                value={form.role}
                disabled={!exec}
                onChange={(e) => setRole(e.target.value as Role)}
                options={ROLES}
              />
            </Field>
            {form.role === "Executive Board" && (
              <Field label="Exec title" hint={exec ? undefined : "Exec updates titles"}>
                <Select
                  value={form.execTitle ?? EXEC_TITLES[0]}
                  disabled={!exec}
                  onChange={(e) => set("execTitle", e.target.value as ExecTitle)}
                  options={EXEC_TITLES}
                />
              </Field>
            )}
            <ReadOnly label="Semesters completed" hint={`Joined ${me.joinedTerm[0] === "F" ? "Fall" : "Spring"} ${me.joinedTerm.slice(1)}`}>
              <span className="tabular-nums">{sem}</span>
            </ReadOnly>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.showOnWebsite}
              onChange={(e) => set("showOnWebsite", e.target.checked)}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            Show me on the public website
          </label>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-2">
        {saved && (
          <span role="status" className="text-[13px] font-medium text-[#1d6b37]">
            Saved
          </span>
        )}
        <Button type="submit">Save profile</Button>
      </div>
    </form>
  );
}

function ReadOnly({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[13px] font-medium text-ink-2">{label}</p>
      <div className="flex h-8 items-center text-[13.5px]">{children}</div>
      {hint && <p className="mt-1 text-[12px] text-muted">{hint}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const { me, update } = usePortal();
  if (!me) return null;
  const exec = isExec(me);

  const onSave = (next: Member) => {
    update((d) => ({ ...d, members: d.members.map((m) => (m.id === next.id ? next : m)) }));
  };

  return (
    <div>
      <PageTitle title="My profile" sub="Keep your details current so the directory and payroll stay accurate." />
      <ProfileForm key={me.id} me={me} exec={exec} onSave={onSave} />
    </div>
  );
}
