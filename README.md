# Graphite Group portal

The members-only portal for Graphite Group: a forum, grades for firms and contacts, interview reports, the directory and exec tools. Next.js 16 (App Router), Tailwind CSS 4. `/` opens the portal.

The public site stays on WordPress for now, so members who don't code can keep editing it. This repo also holds a public site modeled on ycombinator.com, switched off: its pages sit in `src/app/_public-site/`, and Next.js doesn't route folders that start with `_`. To serve them from here again, rename that folder back to `src/app/(site)` and replace the `/` redirect in `next.config.ts`.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run lint
npm run build:preview   # static copy in ./preview-dist (no server needed)
```

## Where things live

| What | Where |
| --- | --- |
| Copy, stats, case studies, testimonials, practices | `src/content/site.ts` |
| Team roster | `src/content/team.ts` (moves to the portal database later) |
| Recruiting status, dates, application links | `src/content/recruiting.ts` |
| Portal pages | `src/app/(portal)/`, see [`docs/PORTAL.md`](docs/PORTAL.md) |
| Public pages (switched off) | `src/app/_public-site/`: home, clients, students, work, life, people, about, contact |
| Client inquiry endpoint | `src/app/api/inquiry/route.ts` |
| Logo (vector, 6 pieces) | `public/brand/mark.svg`, `src/components/mark.tsx` |
| Design tokens | `src/app/globals.css` |

The portal's exec Website editor (`/portal/admin/website`, out of the sidebar while the public pages are off) edits those pages' numbers, roster, case studies, recruiting status and testimonials. `src/content/*` holds the defaults those edits are layered on.

## Environment

Copy `.env.example` to `.env.local`, and set the same values in your host's settings.

- `INQUIRY_WEBHOOK_URL`: only used by the public contact form, so leave it unset while the public pages are off. When set, it's where inquiries go. A Slack incoming webhook works directly. If it's unset, the form tells clients to reach out on LinkedIn instead of silently dropping the lead.

## Design notes

Both parts use a plain white page. The public site is modeled on ycombinator.com: Source Serif 4 display type with italic emphasis, light Outfit body copy, hairline cards, uppercase eyebrows and tag chips, and black pills with italic serif labels. The header centers its links around Graphite's mark in a Prussian square, which plays the part of YC's orange square; the footer is black. Layout and type follow YC, while the name, mark and colors stay Graphite's own.

Tokens and type classes (`t-hero`, `t-display`, `t-h2`, `t-h3`, `eyebrow`, `chip`, `card`, `pill`, `field`) live in `src/app/globals.css`, scoped under `.site`; page building blocks (`PageHeader`, `CaseRows`, `ClientShowcase`, `PersonRows`, `FactCard`, `SideNav`) are in `src/components/gg.tsx`. The portal keeps its own Bookface-style system through `src/portal/ui.tsx`.

## Preview without a server

`npm run build:preview` writes a static copy to `preview-dist/`, with every page as a top-level `.html` file and relative paths. While the public pages are off it opens straight to sign-in; with them on, it starts at `scripts/preview-hub.html`. The portal uses sample data there.

## Member portal

Built on sample data; see [`docs/PORTAL.md`](docs/PORTAL.md) for the modules and the steps to connect Supabase (`supabase/schema.sql`).
