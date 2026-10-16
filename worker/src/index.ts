/**
 * BetterNaic API on Cloudflare Workers (free plan).
 *
 * Security layers: CORS origin allowlist, Cloudflare Turnstile on every write
 * from the public, Workers Rate Limiting per IP, a 24-hour per-IP cap stored
 * as an HMAC (never the raw IP), body size limits, strict input validation,
 * HMAC-signed moderator sessions, and an audit log.
 */
import {
  allowedOrigin,
  hmacHex,
  REPORT_STATUSES,
  sha256Hex,
  signToken,
  validateAnnouncement,
  validateReport,
  verifyToken,
  type Session,
} from './lib';

interface RateLimiter {
  limit(opts: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  DB: D1Database;
  REPORT_LIMITER: RateLimiter;
  LOGIN_LIMITER: RateLimiter;
  READ_LIMITER: RateLimiter;
  ALLOWED_ORIGINS: string;
  TURNSTILE_HOSTNAMES: string;
  SESSION_HOURS: string;
  TURNSTILE_SECRET: string;
  SESSION_SECRET: string;
  IP_SALT: string;
  DISCORD_WEBHOOK_URL?: string;
}

const MAX_BODY = 8 * 1024;
const DAILY_REPORT_CAP = 10;

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function headers(origin: string | null, cache = 'no-store'): Headers {
  const h = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': cache,
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    'Referrer-Policy': 'no-referrer',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
    Vary: 'Origin',
  });
  if (origin) {
    h.set('Access-Control-Allow-Origin', origin);
    h.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    h.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    h.set('Access-Control-Max-Age', '600');
  }
  return h;
}

const json = (data: unknown, status: number, origin: string | null, cache?: string) =>
  new Response(JSON.stringify(data), { status, headers: headers(origin, cache) });

async function readJson(req: Request): Promise<Record<string, unknown>> {
  if (!req.headers.get('Content-Type')?.includes('application/json')) throw new HttpError(415, 'Send JSON.');
  const len = Number(req.headers.get('Content-Length') || 0);
  if (len > MAX_BODY) throw new HttpError(413, 'Request too large.');
  const text = await req.text();
  if (text.length > MAX_BODY) throw new HttpError(413, 'Request too large.');
  try {
    const body = JSON.parse(text);
    if (body && typeof body === 'object' && !Array.isArray(body)) return body;
  } catch {
    /* fall through */
  }
  throw new HttpError(400, 'Invalid JSON.');
}

const clientIp = (req: Request) => req.headers.get('CF-Connecting-IP') || '0.0.0.0';

async function limit(limiter: RateLimiter, key: string) {
  const { success } = await limiter.limit({ key });
  if (!success) throw new HttpError(429, 'Too many requests. Please wait a minute and try again.');
}

async function verifyTurnstile(env: Env, token: unknown, ip: string, action: string) {
  if (typeof token !== 'string' || !token || token.length > 2048) throw new HttpError(400, 'Verification is missing. Please complete the check.');
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', token);
  form.append('remoteip', ip);
  form.append('idempotency_key', crypto.randomUUID());
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
  const out = (await res.json()) as { success: boolean; action?: string; hostname?: string };
  const hosts = env.TURNSTILE_HOSTNAMES.split(',').map(s => s.trim());
  // Cloudflare's always-pass test secret (local dev) reports "example.com".
  const testSecret = env.TURNSTILE_SECRET.startsWith('1x0000000000000000000000000000000');
  const hostOk = hosts.includes(out.hostname ?? '') || (testSecret && out.hostname === 'example.com');
  if (!out.success || !hostOk || (out.action && out.action !== action)) {
    throw new HttpError(403, 'Verification failed. Please try again.');
  }
}

async function requireModerator(req: Request, env: Env): Promise<Session> {
  const auth = req.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const session = token ? await verifyToken(token, env.SESSION_SECRET) : null;
  if (!session) throw new HttpError(401, 'Please sign in again.');
  // Deactivating a moderator revokes their sessions immediately.
  const row = await env.DB.prepare('SELECT active FROM moderators WHERE id = ?').bind(session.mid).first<{ active: number }>();
  if (!row || row.active !== 1) throw new HttpError(401, 'Please sign in again.');
  return session;
}

const audit = (env: Env, who: string, action: string, target: string | number | null) =>
  env.DB.prepare('INSERT INTO audit_log (moderator, action, target) VALUES (?, ?, ?)').bind(who, action, target === null ? null : String(target)).run();

// SQLite datetime('now') is UTC without a zone; send ISO 8601 instead.
const iso = (v: unknown) => (typeof v === 'string' && v.length === 19 ? `${v.replace(' ', 'T')}Z` : v);

const toAnnouncement = (r: Record<string, unknown>) => ({
  id: r.id,
  title: r.title,
  body: r.body,
  kind: r.kind,
  link: r.link,
  published: r.published === 1,
  createdAt: iso(r.created_at),
  expiresAt: r.expires_at,
});

/* ---------- handlers ---------- */

async function postReport(req: Request, env: Env, ctx: ExecutionContext, origin: string | null) {
  const ip = clientIp(req);
  await limit(env.REPORT_LIMITER, ip);
  const body = await readJson(req);
  // Honeypot: bots fill hidden fields. Pretend it worked, store nothing.
  if (typeof body.website === 'string' && body.website.trim()) return json({ ok: true, id: 0 }, 200, origin);
  const v = validateReport(body);
  if (!v.ok) throw new HttpError(400, v.error);
  await verifyTurnstile(env, body.turnstileToken, ip, 'report');

  const ipHash = (await hmacHex(env.IP_SALT, ip)).slice(0, 32);
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM reports WHERE ip_hash = ? AND created_at > datetime('now', '-1 day')")
    .bind(ipHash)
    .first<{ n: number }>();
  if ((recent?.n ?? 0) >= DAILY_REPORT_CAP) throw new HttpError(429, 'Daily limit reached. Please try again tomorrow.');

  const r = v.value;
  const res = await env.DB.prepare('INSERT INTO reports (category, barangay, message, name, contact, page, ip_hash) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(r.category, r.barangay, r.message, r.name, r.contact, r.page, ipHash)
    .run();
  const id = res.meta.last_row_id;

  // Optional relay to the BetterGov.ph community Discord. No contact details,
  // and no pings.
  if (env.DISCORD_WEBHOOK_URL) {
    ctx.waitUntil(
      fetch(env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'BetterNaic',
          allowed_mentions: { parse: [] },
          content: `New report #${id} (${r.category}, ${r.barangay}):\n${r.message.slice(0, 1500)}`,
        }),
      }).catch(() => undefined)
    );
  }
  return json({ ok: true, id }, 201, origin);
}

async function login(req: Request, env: Env, origin: string | null) {
  const ip = clientIp(req);
  await limit(env.LOGIN_LIMITER, ip);
  const body = await readJson(req);
  const key = typeof body.key === 'string' ? body.key.trim() : '';
  await verifyTurnstile(env, body.turnstileToken, ip, 'login');
  if (key.length < 32 || key.length > 200) throw new HttpError(401, 'Invalid access key.');
  const mod = await env.DB.prepare('SELECT id, name FROM moderators WHERE key_hash = ? AND active = 1')
    .bind(await sha256Hex(key))
    .first<{ id: number; name: string }>();
  if (!mod) throw new HttpError(401, 'Invalid access key.');

  const hours = Math.min(Math.max(Number(env.SESSION_HOURS) || 8, 1), 24);
  const expiresAt = Date.now() + hours * 3600_000;
  const token = await signToken({ sub: mod.name, mid: mod.id, exp: expiresAt }, env.SESSION_SECRET);
  await env.DB.batch([
    env.DB.prepare("UPDATE moderators SET last_login_at = datetime('now') WHERE id = ?").bind(mod.id),
    env.DB.prepare('INSERT INTO audit_log (moderator, action, target) VALUES (?, ?, ?)').bind(mod.name, 'login', null),
  ]);
  return json({ token, name: mod.name, expiresAt }, 200, origin);
}

async function route(req: Request, env: Env, ctx: ExecutionContext, origin: string | null): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const m = req.method;

  if (m === 'GET' && path === '/api/health') return json({ ok: true }, 200, origin);

  if (m === 'GET' && path === '/api/announcements') {
    await limit(env.READ_LIMITER, clientIp(req));
    const { results } = await env.DB.prepare(
      "SELECT * FROM announcements WHERE published = 1 AND (expires_at IS NULL OR expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) ORDER BY created_at DESC LIMIT 20"
    ).all();
    return json({ items: results.map(toAnnouncement) }, 200, origin, 'public, max-age=60');
  }

  if (m === 'POST' && path === '/api/reports') return postReport(req, env, ctx, origin);
  if (m === 'POST' && path === '/api/admin/login') return login(req, env, origin);

  if (path.startsWith('/api/admin/')) {
    const s = await requireModerator(req, env);

    if (m === 'GET' && path === '/api/admin/reports') {
      const status = url.searchParams.get('status') || 'new';
      if (status !== 'all' && !(REPORT_STATUSES as readonly string[]).includes(status)) throw new HttpError(400, 'Invalid status.');
      const stmt =
        status === 'all'
          ? env.DB.prepare('SELECT id, category, barangay, message, name, contact, page, status, created_at FROM reports ORDER BY created_at DESC LIMIT 200')
          : env.DB.prepare('SELECT id, category, barangay, message, name, contact, page, status, created_at FROM reports WHERE status = ? ORDER BY created_at DESC LIMIT 200').bind(status);
      const { results } = await stmt.all();
      return json({ items: results.map(({ created_at, ...r }) => ({ ...r, createdAt: iso(created_at) })) }, 200, origin);
    }

    const reportMatch = path.match(/^\/api\/admin\/reports\/(\d+)$/);
    if (m === 'PATCH' && reportMatch) {
      const body = await readJson(req);
      const status = String(body.status);
      if (!(REPORT_STATUSES as readonly string[]).includes(status)) throw new HttpError(400, 'Invalid status.');
      const res = await env.DB.prepare("UPDATE reports SET status = ?, updated_at = datetime('now') WHERE id = ?").bind(status, Number(reportMatch[1])).run();
      if (!res.meta.changes) throw new HttpError(404, 'Report not found.');
      await audit(env, s.sub, `report:${status}`, reportMatch[1]);
      return json({ ok: true }, 200, origin);
    }

    if (m === 'GET' && path === '/api/admin/announcements') {
      const { results } = await env.DB.prepare('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 100').all();
      return json({ items: results.map(toAnnouncement) }, 200, origin);
    }

    if (m === 'POST' && path === '/api/admin/announcements') {
      const v = validateAnnouncement(await readJson(req));
      if (!v.ok) throw new HttpError(400, v.error);
      const a = v.value;
      const res = await env.DB.prepare('INSERT INTO announcements (title, body, kind, link, published, expires_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(a.title, a.body, a.kind, a.link, a.published ? 1 : 0, a.expiresAt, s.sub)
        .run();
      await audit(env, s.sub, 'announcement:create', res.meta.last_row_id);
      return json({ ok: true, id: res.meta.last_row_id }, 201, origin);
    }

    const annMatch = path.match(/^\/api\/admin\/announcements\/(\d+)$/);
    if (annMatch && m === 'PATCH') {
      const v = validateAnnouncement(await readJson(req));
      if (!v.ok) throw new HttpError(400, v.error);
      const a = v.value;
      const res = await env.DB.prepare(
        "UPDATE announcements SET title = ?, body = ?, kind = ?, link = ?, published = ?, expires_at = ?, updated_at = datetime('now') WHERE id = ?"
      )
        .bind(a.title, a.body, a.kind, a.link, a.published ? 1 : 0, a.expiresAt, Number(annMatch[1]))
        .run();
      if (!res.meta.changes) throw new HttpError(404, 'Announcement not found.');
      await audit(env, s.sub, 'announcement:update', annMatch[1]);
      return json({ ok: true, id: Number(annMatch[1]) }, 200, origin);
    }
    if (annMatch && m === 'DELETE') {
      const res = await env.DB.prepare('DELETE FROM announcements WHERE id = ?').bind(Number(annMatch[1])).run();
      if (!res.meta.changes) throw new HttpError(404, 'Announcement not found.');
      await audit(env, s.sub, 'announcement:delete', annMatch[1]);
      return json({ ok: true }, 200, origin);
    }
  }

  throw new HttpError(404, 'Not found.');
}

export default {
  async fetch(req, env, ctx): Promise<Response> {
    const origin = allowedOrigin(req.headers.get('Origin'), env.ALLOWED_ORIGINS);

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: origin ? 204 : 403, headers: headers(origin) });
    }
    // Browsers always send Origin on cross-site writes; refuse unknown sites.
    if (req.method !== 'GET' && !origin) return json({ error: 'Origin not allowed.' }, 403, null);

    try {
      return await route(req, env, ctx, origin);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status, origin);
      console.error(err);
      return json({ error: 'Server error. Please try again later.' }, 500, origin);
    }
  },

  async scheduled(_event, env): Promise<void> {
    await env.DB.batch([
      env.DB.prepare("DELETE FROM reports WHERE created_at < datetime('now', '-365 days')"),
      env.DB.prepare("UPDATE reports SET ip_hash = NULL WHERE ip_hash IS NOT NULL AND created_at < datetime('now', '-2 days')"),
      env.DB.prepare("DELETE FROM announcements WHERE expires_at IS NOT NULL AND expires_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-90 days')"),
      env.DB.prepare("DELETE FROM audit_log WHERE created_at < datetime('now', '-365 days')"),
    ]);
  },
} satisfies ExportedHandler<Env>;
