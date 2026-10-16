# BetterNaic

A volunteer-run, open-source community portal for **Naic, Cavite**, part of the
[BetterGov.ph LGU Directory](https://lgu.bettergov.ph).

**Live:** https://betternaic.vercel.app

> Not an official website of the Municipality of Naic. For official transactions,
> go to the Municipal Hall or the office concerned.

## What's inside

- **Services:** 35 plain-language guides in 12 categories (civil registration,
  business permits, property tax and cedula, building permits, senior/PWD/solo
  parent IDs, PhilHealth YAKAP, RSBSA, PESO, clearances, National ID, and more),
  each with requirements, steps, where to go, and the law behind it.
- **Government:** 2025–2028 elected officials, municipal offices and what each
  handles, and the 30 barangays with PSA census population.
- **Statistics:** population growth 1990–2024 and the municipal profile, every
  figure sourced.
- **Emergency:** verified national hotlines, health facilities, and flood and
  typhoon preparedness for a coastal town.
- **Discover Naic:** heritage sites with credited Wikimedia Commons photos, and a
  short history (Casa Hacienda de Naic, the 1897 Naic Military Agreement).
- **Transparency:** where Naic's budget, audit reports and procurement records
  are published, and how to request public documents.
- **Report a concern:** a protected form for corrections and local issues,
  reviewed by volunteer moderators.
- **Announcements:** advisories that moderators post from `/admin`, shown on the
  home page.
- English and Filipino interface, client-side search, sitemap, and a design that
  works on small phones.

Local hotlines, office heads and phone numbers are only added once confirmed with
the office itself. A wrong number is worse than none.

## Built on

- The [Local Government Website Starter Kit](https://github.com/iyanski/betterlocalgov)
  (CC0), the template recommended by the BetterGov.ph LGU Directory, set up with
  its `npm run setup` tool.
- Ideas from [BetterIndang](https://betterindang.org), the portal of a neighboring
  Cavite town, and other better*.org portals in the directory.
- Content repurposed and fact-checked from public sources. Each page names its
  sources (PSA, PhilAtlas, Wikipedia, election results, national agencies).

## Stack

| Part | What |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router, i18next, YAML + Markdown content |
| Hosting | Vercel (`betternaic.vercel.app`), with CSP and security headers in `vercel.json` |
| API | Cloudflare Worker `betternaic-api` (`worker/`) |
| Data | Cloudflare D1 (`betternaic`, APAC) |
| Bot protection | Cloudflare Turnstile |
| Rate limiting | Workers Rate Limiting API |

Everything runs on free tiers. See [docs/CLOUDFLARE.md](docs/CLOUDFLARE.md) for
the security design and operations runbook.

## Run locally

Node.js 22+.

```bash
npm install
npm run dev                      # http://localhost:5173

# API (optional, for the report form, announcements and /admin)
cd worker
npm install
cp .dev.vars.example .dev.vars   # test keys only
npm run db:migrate:local
npm run dev                      # http://localhost:8787
```

`.env.development` points the frontend at the local Worker and uses Cloudflare's
always-pass Turnstile test key.

## Checks

```bash
npm run build        # type-check, build, write dist/sitemap.xml
npm run lint
cd worker && npm test   # validation, session tokens, CORS, data sync
```

## Editing content

See [docs/CONTENT.md](docs/CONTENT.md). Most changes are YAML or Markdown under
`content/` and `src/data/`, no code needed.

## Deploy

```bash
vercel deploy --prod          # frontend
cd worker && npm run deploy   # API
```

The Vercel project is also connected to this GitHub repository, so pushes to
`main` deploy automatically.

## Contributing

Corrections are the most useful contribution: use the
[report form](https://betternaic.vercel.app/report) or open an issue or pull
request. Please cite a public source for any fact you add.

## License

Code: [MIT](LICENSE). Text written for BetterNaic may be reused with credit.
Photos keep their Wikimedia Commons licenses (credited on each page). The logo
was generated with ChatGPT Images from the default BetterLGU logo and the Naic
seal's fish, waves and rice stalks; see `brand/`.
