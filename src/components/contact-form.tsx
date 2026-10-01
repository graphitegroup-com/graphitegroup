"use client";

import { useState, type FormEvent } from "react";
import { site } from "@/content/site";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

const field =
  "mt-2 w-full border border-line bg-white px-4 py-3 text-[0.95rem] text-ink placeholder:text-mist focus:border-highlight focus:outline-none focus:ring-1 focus:ring-highlight";
const labelCls = "block text-sm font-semibold";

export function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      });
      if (res.ok) return setStatus({ kind: "sent" });
      const body = await res.json().catch(() => ({}));
      if (res.status !== 422) {
        return setStatus({ kind: "error", message: "unavailable" });
      }
      setStatus({ kind: "error", message: body.error ?? "Something went wrong. Please try again." });
    } catch {
      setStatus({ kind: "error", message: "Network error. Please try again." });
    }
  }

  if (status.kind === "sent") {
    return (
      <div className="border-t-[3px] border-highlight bg-cloud p-10">
        <h2 className="font-serif text-3xl">Thank you</h2>
        <p className="mt-3 text-lg leading-relaxed text-slate">
          We have received your message and will be in touch within a few business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <label className={labelCls}>
          First name
          <input name="firstName" required autoComplete="given-name" className={field} />
        </label>
        <label className={labelCls}>
          Last name
          <input name="lastName" required autoComplete="family-name" className={field} />
        </label>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <label className={labelCls}>
          Work email
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
        <label className={labelCls}>
          Organization
          <input name="organization" autoComplete="organization" className={field} />
        </label>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <label className={labelCls}>
          Area of interest
          <select name="practice" className={field} defaultValue="Not sure yet">
            <option>Strategy</option>
            <option>Digital</option>
            <option>Not sure yet</option>
          </select>
        </label>
        <label className={labelCls}>
          Preferred timing
          <select name="timing" className={field} defaultValue="Next available semester">
            <option>Fall semester</option>
            <option>Spring semester</option>
            <option>Next available semester</option>
          </select>
        </label>
      </div>
      <label className={labelCls}>
        How can we help?
        <textarea
          name="message"
          required
          minLength={10}
          rows={6}
          className={`${field} resize-y`}
          placeholder="A short description of your organization and the question you are working on."
        />
      </label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <div className="flex flex-wrap items-center gap-5">
        <button type="submit" disabled={status.kind === "sending"} className="btn btn-primary disabled:opacity-60">
          {status.kind === "sending" ? "Sending…" : "Submit"}
        </button>
        {status.kind === "error" && (
          <p role="alert" className="text-sm text-slate">
            {status.message === "unavailable" ? (
              <>
                Our form is temporarily unavailable. Please message us on{" "}
                <a href={site.linkedin} className="text-highlight underline">
                  LinkedIn
                </a>
                .
              </>
            ) : (
              status.message
            )}
          </p>
        )}
      </div>
    </form>
  );
}
