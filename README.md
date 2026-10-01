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
| Pages | `src/app/(site)/`: `/`, `/work`, `/students`, `/team`, `/members` |
| Client inquiry endpoint | `src/app/api/inquiry/route.ts` |
| Logo (vector, 6 pieces) | `public/brand/mark.svg`, `src/components/mark.tsx` |
| Design tokens | `src/app/globals.css` |

Updating the site for a new semester is usually a change to `src/content/*` only.

## Environment

Copy `.env.example` to `.env.local` and set it in Vercel too.

- `INQUIRY_WEBHOOK_URL`: where homepage inquiries go. A Slack incoming webhook works directly. If it's unset, the form tells clients to reach out on LinkedIn instead of silently dropping the lead.

## Design notes

Graphite is stacked sheets of hexagonal carbon, so that's the system: an interactive two-layer honeycomb lattice in the heroes (cursor bends the top sheet; the lower sheet drifts in parallax), the hex-G mark that assembles from its six pieces, and the member journey on `/students` told as sheets stacking on each other. Palette is pencil lead on warm paper, with the old site's steel blue kept as the only accent. Type: Inter Tight, Instrument Serif italics for emphasis, JetBrains Mono for labels. All motion respects `prefers-reduced-motion`.

## Member portal

See [`docs/PORTAL.md`](docs/PORTAL.md) for the plan.
