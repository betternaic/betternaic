// Pure helpers (no bindings), so test/lib.test.ts can run them in Node.

export const REPORT_CATEGORIES = [
  'correction',
  'road',
  'garbage',
  'flood',
  'service',
  'suggestion',
  'other',
] as const;

// Keep in sync with src/data/naic.yaml (test/lib.test.ts checks this).
export const BARANGAYS = [
  'Bagong Karsada', 'Balsahan', 'Bancaan', 'Bucana Malaki', 'Bucana Sasahan',
  'Calubcob', 'Capt. C. Nazareno', 'Gomez-Zamora', 'Halang', 'Humbac',
  'Ibayo Estacion', 'Ibayo Silangan', 'Kanluran', 'Labac', 'Latoria',
  'Mabolo', 'Makina', 'Malainen Bago', 'Malainen Luma', 'Molino',
  'Munting Mapino', 'Muzon', 'Palangue 1', 'Palangue 2 & 3', 'Sabang',
  'San Roque', 'Santulan', 'Sapa', 'Timalan Balsahan', 'Timalan Concepcion',
  'Not specific',
] as const;

export const REPORT_STATUSES = ['new', 'triaged', 'resolved', 'spam'] as const;
export const ANNOUNCEMENT_KINDS = ['advisory', 'news', 'event'] as const;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
// Strip control characters except newline and tab.
// eslint-disable-next-line no-control-regex
const clean = (s: string) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');

export interface ReportInput {
  category: string;
  barangay: string;
  message: string;
  name: string | null;
  contact: string | null;
  page: string | null;
}

export function validateReport(body: Record<string, unknown>): Result<ReportInput> {
  const category = str(body.category);
  const barangay = str(body.barangay);
  const message = clean(str(body.message));
  const name = clean(str(body.name));
  const contact = clean(str(body.contact));
  const page = str(body.page);

  if (!(REPORT_CATEGORIES as readonly string[]).includes(category)) return { ok: false, error: 'Choose a valid category.' };
  if (!(BARANGAYS as readonly string[]).includes(barangay)) return { ok: false, error: 'Choose a valid barangay.' };
  if (message.length < 20) return { ok: false, error: 'Please describe the concern in at least 20 characters.' };
  if (message.length > 2000) return { ok: false, error: 'Please keep the message under 2,000 characters.' };
  if (name.length > 80) return { ok: false, error: 'Name is too long.' };
  if (contact.length > 120) return { ok: false, error: 'Contact is too long.' };
  if (contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) && !/^\+?[\d\s()-]{7,20}$/.test(contact)) {
    return { ok: false, error: 'Enter a valid email address or mobile number, or leave it blank.' };
  }
  if (page && (!page.startsWith('/') || page.length > 200 || /[<>"']/.test(page))) {
    return { ok: false, error: 'Invalid page.' };
  }
  return {
    ok: true,
    value: { category, barangay, message, name: name || null, contact: contact || null, page: page || null },
  };
}

export interface AnnouncementInput {
  title: string;
  body: string;
  kind: (typeof ANNOUNCEMENT_KINDS)[number];
  link: string | null;
  published: boolean;
  expiresAt: string | null;
}

export function validateAnnouncement(body: Record<string, unknown>): Result<AnnouncementInput> {
  const title = clean(str(body.title));
  const text = clean(str(body.body));
  const kind = str(body.kind);
  const link = str(body.link);
  const expiresAt = str(body.expiresAt);

  if (title.length < 3 || title.length > 120) return { ok: false, error: 'Title must be 3 to 120 characters.' };
  if (text.length < 3 || text.length > 1000) return { ok: false, error: 'Text must be 3 to 1,000 characters.' };
  if (!(ANNOUNCEMENT_KINDS as readonly string[]).includes(kind)) return { ok: false, error: 'Invalid type.' };
  if (link) {
    let url: URL;
    try {
      url = new URL(link);
    } catch {
      return { ok: false, error: 'Link must be a full https:// URL.' };
    }
    if (url.protocol !== 'https:' || link.length > 300) return { ok: false, error: 'Link must be a full https:// URL.' };
  }
  let expires: string | null = null;
  if (expiresAt) {
    const d = new Date(expiresAt);
    if (Number.isNaN(d.getTime())) return { ok: false, error: 'Invalid expiry date.' };
    expires = d.toISOString();
  }
  return {
    ok: true,
    value: {
      title,
      body: text,
      kind: kind as AnnouncementInput['kind'],
      link: link || null,
      published: body.published !== false,
      expiresAt: expires,
    },
  };
}

/* ---------- crypto ---------- */

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

export async function sha256Hex(text: string): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function hmacHex(secret: string, text: string): Promise<string> {
  return hex(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(text)));
}

export interface Session {
  sub: string; // moderator name
  mid: number; // moderator id
  exp: number; // unix ms
}

export async function signToken(s: Session, secret: string): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify(s)));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(payload)));
  return `${payload}.${b64url(sig)}`;
}

/** Returns the session if the signature is valid and it has not expired. */
export async function verifyToken(token: string, secret: string, now = Date.now()): Promise<Session | null> {
  const [payload, sig, extra] = token.split('.');
  if (!payload || !sig || extra !== undefined) return null;
  try {
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), fromB64url(sig), enc.encode(payload));
    if (!ok) return null;
    const s = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as Session;
    return typeof s.exp === 'number' && s.exp > now && typeof s.mid === 'number' ? s : null;
  } catch {
    return null;
  }
}

export function allowedOrigin(origin: string | null, list: string): string | null {
  if (!origin) return null;
  return list.split(',').map(s => s.trim()).includes(origin) ? origin : null;
}
