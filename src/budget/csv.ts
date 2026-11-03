// From bettergovph/transparency-portal (MIT, (c) 2026 BetterGov.ph): https://github.com/bettergovph/transparency-portal
/**
 * Every project in the portal as one CSV, with exact pesos and the source
 * page links, so anyone can check the list without this site.
 */
import type { ScopedProject } from './scope';

const COLUMNS: [string, (p: ScopedProject) => string | number | null][] = [
  ['program', (p) => p.dataset],
  ['id', (p) => p.id],
  ['title', (p) => p.title],
  ['program_line', (p) => p.program],
  ['sub_line', (p) => p.pap],
  ['dpwh_office', (p) => p.office],
  ['region', (p) => p.region],
  ['status', (p) => p.status_label],
  ['group', (p) => p.bridge_group],
  ['unconfirmed_match', (p) => (p.held ? 'yes' : 'no')],
  ['nep_php', (p) => p.nep_php],
  ['house_bill_php', (p) => p.house_php],
  ['change_php', (p) => p.delta_php],
  ['nep_pdf', (p) => p.pdf_url.nep ?? null],
  ['house_bill_pdf', (p) => p.pdf_url.hgab3 ?? p.pdf_url.hgab2 ?? null],
  ['why_listed_here', (p) => p.reasons.map((r) => (r.kind === 'office' ? `office: ${r.label}` : `title names: ${r.label}`)).join('; ')],
  ['url', (p) => p.url],
];

function cell(v: string | number | null): string {
  if (v == null) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function projectsCsv(projects: readonly ScopedProject[]): string {
  const lines = [COLUMNS.map(([h]) => h).join(',')];
  for (const p of projects) lines.push(COLUMNS.map(([, f]) => cell(f(p))).join(','));
  return lines.join('\r\n') + '\r\n';
}

export function downloadText(filename: string, text: string, type = 'text/csv;charset=utf-8') {
  // A BOM so spreadsheet apps read the peso sign and accented names correctly.
  const blob = new Blob(['﻿', text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
