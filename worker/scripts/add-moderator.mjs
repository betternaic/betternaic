#!/usr/bin/env node
// Creates a moderator access key and prints the SQL that stores its hash.
//
//   node scripts/add-moderator.mjs <name> <key-file>
//   npx wrangler d1 execute betternaic --remote --command "<printed SQL>"
//
// The key itself is written only to <key-file> (keep it outside the repo and
// give it to the moderator privately). The database stores just its SHA-256.
import { createHash, randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const [name, keyFile] = process.argv.slice(2);
if (!name || !keyFile || !/^[\w .-]{2,40}$/.test(name)) {
  console.error('Usage: node scripts/add-moderator.mjs <name> <key-file>');
  process.exit(1);
}

const key = `bn_${randomBytes(32).toString('base64url')}`;
const hash = createHash('sha256').update(key).digest('hex');
writeFileSync(keyFile, `${key}\n`, { mode: 0o600 });

console.log(`Key for "${name}" written to ${keyFile}`);
console.log(`INSERT INTO moderators (name, key_hash) VALUES ('${name.replace(/'/g, "''")}', '${hash}');`);
