#!/usr/bin/env node
// Writes dist/sitemap.xml after `vite build`, from the static routes plus every
// service guide listed in content/services/*/index.yaml.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://betternaic.vercel.app';

const staticRoutes = [
  '/',
  '/services',
  '/government',
  '/government/officials',
  '/government/offices',
  '/government/barangays',
  '/statistics',
  '/transparency',
  '/tourism',
  '/about',
  '/emergency',
  '/report',
  '/about-betternaic',
  '/accessibility',
  '/privacy',
  '/terms',
  '/sitemap',
];

const servicesDir = path.join(root, 'content/services');
const serviceRoutes = fs.readdirSync(servicesDir).flatMap(category => {
  const index = path.join(servicesDir, category, 'index.yaml');
  if (!fs.existsSync(index)) return [];
  const { pages = [] } = yaml.load(fs.readFileSync(index, 'utf8')) ?? {};
  return [`/services/${category}`, ...pages.map(p => `/services/${category}/${p.slug}`)];
});

const today = new Date().toISOString().slice(0, 10);
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticRoutes, ...serviceRoutes]
  .map(r => `  <url><loc>${SITE}${r}</loc><lastmod>${today}</lastmod></url>`)
  .join('\n')}
</urlset>
`;

const out = path.join(root, 'dist/sitemap.xml');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, xml);
console.log(`sitemap.xml: ${staticRoutes.length + serviceRoutes.length} URLs`);
