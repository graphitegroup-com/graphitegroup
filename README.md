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

Rebuilt from the original graphitegroup.co in the brand palette: Inter with tight tracking, pewter-to-ink gradient titles, black pill buttons, dark feature bands with the dotted world map, glowing icon tiles, half-photo practice cards and faint column guides. Tokens and utilities (`grad-title`, `t-hero` to `t-h4`, `pill`, `band`, `lines-bg`, `card-glow`) live in `src/app/globals.css`; page building blocks are in `src/components/gg.tsx`. The portal uses the same system through `src/portal/ui.tsx`.

### Variants

Four color treatments share one layout: `original` (default), `prussian`, `gradient` and `light`. Each is a block of `--v-*` variables under `[data-variant]` in `globals.css`, so a variant never changes structure. Preview one with `?variant=prussian` or the Variant button in the corner (`src/components/variant-switcher.tsx`); the choice is remembered per browser. To ship one, make its values the `:root` defaults, then remove the switcher from both layouts and `VARIANT_BOOT` from `src/app/layout.tsx`.

## Preview without a server

`npm run build:preview` writes a static copy to `preview-dist/`, with every page as a top-level `.html` file and relative paths, plus an entry page from `scripts/preview-hub.html`. The contact form is inactive there and the portal uses sample data.

## Member portal

Built on sample data; see [`docs/PORTAL.md`](docs/PORTAL.md) for the modules and the steps to connect Supabase (`supabase/schema.sql`).
