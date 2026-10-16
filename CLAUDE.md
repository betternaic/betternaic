# CLAUDE.md

BetterNaic: volunteer-run community portal for Naic, Cavite. Live at
https://betternaic.vercel.app. Built on the Local Government Website Starter Kit
(iyanski/betterlocalgov, CC0).

## Commands

```bash
npm run dev            # frontend, localhost:5173 (talks to the local Worker)
npm run build          # tsc -b + vite build + dist/sitemap.xml
npm run lint
vercel deploy --prod   # Vercel project riecodes-projects/betternaic

cd worker
npm run dev            # wrangler dev on :8787, needs .dev.vars (see .dev.vars.example)
npm test               # node --test on src/lib.ts
npm run deploy         # Worker betternaic-api
npm run db:migrate     # D1 migrations, remote
```

## Layout

- `src/data/*.yaml`: services categories, Naic profile/officials/barangays/history
  (`naic.yaml`), offices, hotlines, places. Loaded by `src/data/yamlLoader.ts`.
- `content/services/<category>/index.yaml` + `<slug>.md`: service guides, found
  with `import.meta.glob` (no code change for new categories).
- `content/pages/*.md`: about-betternaic, privacy, terms, accessibility.
- `src/pages/`: routes are in `src/App.tsx`, lazy-loaded.
- `src/lib/api.ts`: Worker client. `src/components/Turnstile.tsx`: widget.
- `worker/`: Cloudflare Worker (D1 + Turnstile + rate limiting + moderator auth).
  Security design in `docs/CLOUDFLARE.md`.
- `brand/`: logo source and `build.py` that regenerates favicons.

## Rules

- Facts need a public source; local numbers, names and fees only when confirmed
  with the municipality. Never copy prose from naiccavite.org (not open source).
- English text is inline as `t('key', 'English')` defaults; Filipino goes in
  `src/locales/fil.json` (everyday Taglish, not deep Tagalog).
- Keep `worker/src/lib.ts` BARANGAYS in sync with `src/data/naic.yaml` (tested).
- No em dashes in any text.
- Changing the site domain touches several files: see the end of
  `docs/CLOUDFLARE.md`.
- Add a `CHANGELOG.md` entry for user-visible changes.
