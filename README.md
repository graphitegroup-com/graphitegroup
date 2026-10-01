# graphitegroup.co

The Graphite Group website and (soon) member portal. Next.js 16 (App Router), Tailwind CSS 4, Motion. Deploys to Vercel.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run lint
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

Updating the site for a new semester is usually a change to `src/content/*` only.

## Environment

Copy `.env.example` to `.env.local` and set it in Vercel too.

- `INQUIRY_WEBHOOK_URL`: where homepage inquiries go. A Slack incoming webhook works directly. If it's unset, the form tells clients to reach out on LinkedIn instead of silently dropping the lead.

## Design notes

Modeled on professional-services sites (BCG, L.E.K., Roland Berger, Analysis Group): two-tier header with a utility bar, photo hero with featured work overlapping it, white pages with thin rules, Source Serif headlines over Inter body text, one accent blue on a graphite neutral, near-square corners and only a subtle fade-in for motion. Shared building blocks live in `src/components/blocks.tsx`.

## Member portal

See [`docs/PORTAL.md`](docs/PORTAL.md) for the plan.
