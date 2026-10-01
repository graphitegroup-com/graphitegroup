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
| Pages | `src/app/(site)/`: `/`, `/services`, `/work`, `/about`, `/team`, `/students`, `/contact`, `/members` |
| Client inquiry endpoint | `src/app/api/inquiry/route.ts` |
| Logo (vector, 6 pieces) | `public/brand/mark.svg`, `src/components/mark.tsx` |
| Design tokens | `src/app/globals.css` |

Exec can update most of the public site without code from the portal (**Login → Website**): numbers, Our People with headshots, case studies, recruiting status and testimonials. `src/content/*` holds the defaults those edits are layered on.

## Environment

Copy `.env.example` to `.env.local` and set it in Vercel too.

- `INQUIRY_WEBHOOK_URL`: where homepage inquiries go. A Slack incoming webhook works directly. If it's unset, the form tells clients to reach out on LinkedIn instead of silently dropping the lead.

## Design notes

Two public styles share every component, switched by `data-style` on `<html>` (tokens in `src/app/globals.css`):

- **Classic**: white pages, Source Serif headlines, one blue accent (modeled on BCG, L.E.K., Analysis Group).
- **Modern**: black and white, tight Inter Tight display type, square edges and cobalt highlights.

A switcher in the bottom-right corner (`src/components/style-switcher.tsx`) lets reviewers compare them, and `?style=modern` works in links. Once a style is chosen, delete the switcher and the boot script in `src/app/layout.tsx`, and keep one token block.

## Preview without a server

`npm run build:preview` writes a static copy to `preview-dist/`, with every page as a top-level `.html` file and relative paths, plus an entry page from `scripts/preview-hub.html`. The contact form is inactive there and the portal uses sample data.

## Member portal

Built on sample data; see [`docs/PORTAL.md`](docs/PORTAL.md) for the modules and the steps to connect Supabase (`supabase/schema.sql`).
