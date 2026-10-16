# Security and operations (Cloudflare free tier)

The site is static on Vercel. Everything that accepts input runs on a Cloudflare
Worker, `betternaic-api`, at `https://betternaic-api.eirmonpaculan11.workers.dev`.

## What protects what

| Layer | Where | What it does |
| --- | --- | --- |
| Turnstile | report form, moderator sign-in | Cloudflare's bot check. The Worker verifies every token server-side (siteverify), and checks the hostname and the action (`report` or `login`). Widget `betternaic`, managed mode, allowed domain `betternaic.vercel.app` only. |
| Rate limiting | Worker bindings in `wrangler.jsonc` | Per client IP: 3 reports/min, 5 sign-ins/min, 120 reads/min. |
| Daily cap | D1 | At most 10 reports per IP per 24 hours, counted by an HMAC of the IP (the raw IP is never stored). The hash is cleared after 2 days. |
| CORS / origin check | Worker | Only `https://betternaic.vercel.app` may call it from a browser; any write without that Origin gets 403. |
| Input limits | Worker | JSON only, 8 KB max body, strict validation (`worker/src/lib.ts`), control characters stripped, honeypot field. |
| Moderator auth | Worker + D1 | Personal access keys (32 random bytes). D1 stores only their SHA-256. Sign-in returns an HMAC-signed session token valid 8 hours, kept in `sessionStorage`. Deactivating a moderator revokes their sessions at once. |
| Audit log | D1 `audit_log` | Every sign-in, report status change and announcement change. |
| Response headers | Worker | `Content-Security-Policy: default-src 'none'`, `nosniff`, `no-referrer`, HSTS, `no-store` on private data. |
| Site headers | `vercel.json` | Strict CSP (scripts only from self and Turnstile; API host allowlisted), `X-Frame-Options: DENY`, `Permissions-Policy`, HSTS, `noindex` on `/admin`. |
| Retention | Cron `17 19 * * *` (03:17 PH time) | Deletes reports older than a year, IP hashes older than 2 days, long-expired announcements and old audit entries. |
| DDoS | Cloudflare network | `workers.dev` traffic gets Cloudflare's automatic DDoS mitigation. |

Not used, and why:

- **WAF custom rules, Bot Fight Mode, Cloudflare Access:** these need a domain
  (zone) on Cloudflare. With `vercel.app` and `workers.dev` there is no zone. If
  the project moves to `betternaic.org` on Cloudflare, put Access in front of the
  admin API and add WAF rate rules.
- **Proxying the API through Vercel:** the Worker would then see Vercel's IPs, and
  per-IP rate limiting would stop working. The browser calls the Worker directly.

## Secrets

Stored as Worker secrets, never in the repo:

- `TURNSTILE_SECRET`: from the Turnstile widget
- `SESSION_SECRET`: signs moderator sessions (rotate to sign everyone out)
- `IP_SALT`: keys the IP hash
- `DISCORD_WEBHOOK_URL` (optional): relays new reports, without contact details,
  to a BetterGov.ph community channel once the Discord mods provision one

The maintainer's local copies are in `C:\dev\.secrets\betternaic\`.

```bash
cd worker
npx wrangler secret put SESSION_SECRET      # paste a new 64-char hex string
npx wrangler deploy --secrets-file <file>   # or upload several at once
```

## Moderators

```bash
cd worker
node scripts/add-moderator.mjs "name" path/outside/repo/name.key
npx wrangler d1 execute betternaic --remote --command "<printed INSERT>"
```

Give the key to the moderator privately. To remove someone:

```bash
npx wrangler d1 execute betternaic --remote --command "UPDATE moderators SET active = 0 WHERE name = 'name'"
```

## Database

```bash
npx wrangler d1 migrations apply betternaic --remote        # schema changes
npx wrangler d1 execute betternaic --remote --command "SELECT status, COUNT(*) FROM reports GROUP BY status"
npx wrangler d1 time-travel info betternaic                  # point-in-time restore
```

## Changing the site domain

If the site moves (for example to `betternaic.org`), update together:

1. `ALLOWED_ORIGINS` and `TURNSTILE_HOSTNAMES` in `worker/wrangler.jsonc`, then deploy
2. the Turnstile widget's domains (Cloudflare dashboard, Turnstile)
3. `connect-src` in `vercel.json` if the API host changes
4. `VITE_WEBSITE_URL` and `VITE_OG_IMAGE_URL` in `.env`, the canonical and `og:` tags
   in `index.html`, `public/robots.txt`, and `SITE` in `scripts/generate-sitemap.js`
