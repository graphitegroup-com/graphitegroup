# graphitegroup.co

The Graphite Group website and (soon) member portal. Next.js 16 (App Router), Tailwind CSS 4, Motion. Deploys to Vercel.

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
| Pages | `src/app/(site)/`: `/`, `/clients`, `/students`, `/work`, `/life`, `/people`, `/about`, `/contact` |
| Client inquiry endpoint | `src/app/api/inquiry/route.ts` |
| Logo (vector, 6 pieces) | `public/brand/mark.svg`, `src/components/mark.tsx` |
| Design tokens | `src/app/globals.css` |

Exec can update most of the public site without code from the portal (**Login → Website**): numbers, Our People with headshots, case studies, recruiting status and testimonials. `src/content/*` holds the defaults those edits are layered on.

## Environment

Copy `.env.example` to `.env.local` and set it in Vercel too.

- `INQUIRY_WEBHOOK_URL`: where homepage inquiries go. A Slack incoming webhook works directly. If it's unset, the form tells clients to reach out on LinkedIn instead of silently dropping the lead.

## Design notes

The public site is modeled on ycombinator.com: a warm cream page (`#F5F5EE`), Source Serif 4 display type with italic emphasis, light Outfit body copy, hairline cards, uppercase eyebrows and tag chips, and black pills with italic serif labels. The header centers its links around Graphite's mark in a Prussian square, which plays the part of YC's orange square; the footer is black. Layout and type follow YC, while the name, mark and colors stay Graphite's own.

Tokens and type classes (`t-hero`, `t-display`, `t-h2`, `t-h3`, `eyebrow`, `chip`, `card`, `pill`, `field`) live in `src/app/globals.css`, scoped under `.site`; page building blocks (`PageHeader`, `CaseRows`, `ClientShowcase`, `PersonRows`, `FactCard`, `SideNav`) are in `src/components/gg.tsx`. The portal keeps its own Bookface-style system through `src/portal/ui.tsx`.

## Preview without a server

`npm run build:preview` writes a static copy to `preview-dist/`, with every page as a top-level `.html` file and relative paths, plus an entry page from `scripts/preview-hub.html`. The contact form is inactive there and the portal uses sample data.

## Member portal

Built on sample data; see [`docs/PORTAL.md`](docs/PORTAL.md) for the modules and the steps to connect Supabase (`supabase/schema.sql`).
