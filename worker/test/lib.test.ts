import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as yaml from 'js-yaml';
import {
  allowedOrigin,
  BARANGAYS,
  signToken,
  validateAnnouncement,
  validateReport,
  verifyToken,
} from '../src/lib.ts';

const good = {
  category: 'road',
  barangay: 'Sabang',
  message: 'Big pothole near the chapel on the main road, since last week.',
  name: 'Juan',
  contact: '0917 123 4567',
  page: '/services/business',
};

test('accepts a valid report and trims it', () => {
  const r = validateReport({ ...good, message: `  ${good.message}  ` });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.value.message, good.message);
});

test('rejects bad report fields', () => {
  for (const bad of [
    { category: 'nope' },
    { barangay: 'Atlantis' },
    { message: 'too short' },
    { message: 'x'.repeat(2001) },
    { contact: 'not a contact' },
    { page: 'https://evil.example' },
    { page: '/x"><script>' },
  ]) {
    assert.equal(validateReport({ ...good, ...bad }).ok, false, JSON.stringify(bad));
  }
});

test('optional report fields may be blank', () => {
  const r = validateReport({ ...good, name: '', contact: '', page: '' });
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual([r.value.name, r.value.contact, r.value.page], [null, null, null]);
});

test('announcement links must be https', () => {
  const base = { title: 'No classes', body: 'Classes suspended today.', kind: 'advisory' };
  assert.equal(validateAnnouncement({ ...base, link: 'https://facebook.com/x' }).ok, true);
  assert.equal(validateAnnouncement({ ...base, link: 'http://facebook.com/x' }).ok, false);
  assert.equal(validateAnnouncement({ ...base, link: 'javascript:alert(1)' }).ok, false);
  assert.equal(validateAnnouncement({ ...base, kind: 'gossip' }).ok, false);
});

test('session tokens verify, and reject tampering and expiry', async () => {
  const secret = 'test-secret-0123456789abcdef';
  const exp = Date.now() + 60_000;
  const token = await signToken({ sub: 'rie', mid: 1, exp }, secret);
  assert.deepEqual(await verifyToken(token, secret), { sub: 'rie', mid: 1, exp });
  assert.equal(await verifyToken(token, 'other-secret'), null);
  const [payload, sig] = token.split('.');
  const forged = Buffer.from(JSON.stringify({ sub: 'x', mid: 2, exp })).toString('base64url');
  assert.equal(await verifyToken(`${forged}.${sig}`, secret), null);
  assert.equal(await verifyToken(`${payload}.${sig}.extra`, secret), null);
  assert.equal(await verifyToken(token, secret, exp + 1), null);
});

test('only listed origins pass CORS', () => {
  const list = 'https://betternaic.vercel.app, http://localhost:5173';
  assert.equal(allowedOrigin('https://betternaic.vercel.app', list), 'https://betternaic.vercel.app');
  assert.equal(allowedOrigin('https://evil.vercel.app', list), null);
  assert.equal(allowedOrigin(null, list), null);
});

test('worker barangay list matches the site data', () => {
  const data = yaml.load(readFileSync(new URL('../../src/data/naic.yaml', import.meta.url), 'utf8')) as {
    barangays: { name: string }[];
  };
  assert.deepEqual(
    [...BARANGAYS].filter(b => b !== 'Not specific').sort(),
    data.barangays.map(b => b.name).sort()
  );
});
