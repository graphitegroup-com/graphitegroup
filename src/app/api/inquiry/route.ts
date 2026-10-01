import { NextResponse } from "next/server";

/**
 * Client inquiry intake. Forwards to INQUIRY_WEBHOOK_URL (a Slack incoming
 * webhook works out of the box). Once the portal database exists, inquiries
 * should also be written to a `leads` table.
 */

const FIELDS = ["firstName", "lastName", "email", "organization", "practice", "timing", "message"] as const;
type Inquiry = Record<(typeof FIELDS)[number], string>;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Honeypot: real people never fill this field.
  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const data = Object.fromEntries(
    FIELDS.map((f) => [f, typeof body[f] === "string" ? (body[f] as string).trim().slice(0, 4000) : ""]),
  ) as Inquiry;

  const name = `${data.firstName} ${data.lastName}`.trim();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || data.message.length < 10) {
    return NextResponse.json({ error: "Please add your name, a valid email and a short description." }, { status: 422 });
  }

  const webhook = process.env.INQUIRY_WEBHOOK_URL;
  if (!webhook) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const text = [
    `*New client inquiry* from ${name} <${data.email}>`,
    data.organization && `*Organization:* ${data.organization}`,
    data.practice && `*Practice:* ${data.practice}`,
    data.timing && `*Timing:* ${data.timing}`,
    `>${data.message.replace(/\n/g, "\n>")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, inquiry: data }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "delivery_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
