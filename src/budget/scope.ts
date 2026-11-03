// From bettergovph/transparency-portal (MIT, (c) 2026 BetterGov.ph): https://github.com/bettergovph/transparency-portal
/**
 * Turns the config's scope into the portal's list of projects.
 *
 * A project is in the portal for one or more stated reasons, and every row
 * carries them, so a reader can see why it is here:
 * - "office": the documents list it under one of the scope's DPWH offices;
 * - "place": its title names one of the scope's places.
 * The same line found by several queries appears once, with every reason.
 *
 * Nothing is computed that the API does not publish: amounts, statuses and
 * labels are the API's, row for row.
 */
import { DATASET_KEYS, type DatasetKey, type Exclusion, type PortalConfig } from './config';
import type { Client, Params } from './client';
import type { BridgeGroup, Disclaimer, Meta, OfficeLens, ProjectRow } from './types';
import { BRIDGE_GROUPS } from './types';

export type Reason =
  | { kind: 'office'; label: string }
  | { kind: 'place'; label: string };

export interface ScopedProject extends ProjectRow {
  /** `<dataset>:<id>`, the key exclusions and reports use. */
  key: string;
  reasons: Reason[];
}

export interface QueryReport {
  kind: Reason['kind'];
  label: string;
  dataset: DatasetKey;
  params: Params;
  /** Place queries: kept to this region key, plus rows that give no region. */
  region?: string;
  /** Rows the API returned. */
  total: number;
  /** Rows kept (after the region rule). */
  kept: number;
  truncated: boolean;
  /** The API request, for anyone who wants to check the list. */
  api: string;
  officeLens?: OfficeLens;
}

export interface ScopeResult {
  projects: ScopedProject[];
  excluded: { exclusion: Exclusion; project: ScopedProject | null }[];
  queries: QueryReport[];
  /** Every disclaimer the API attached to the responses used, verbatim, in order. */
  disclaimers: Disclaimer[];
  meta: Meta;
}

export const projectKey = (dataset: string, id: string) => `${dataset}:${id}`;

export async function resolveScope(client: Client, config: PortalConfig): Promise<ScopeResult> {
  const { offices = [], places = [] } = config.scope;
  const exclude = (config.scope.exclude ?? []).filter((e) => !e.key.startsWith('gaa:'));

  type Job = { kind: Reason['kind']; label: string; dataset: DatasetKey; params: Params; region?: string };
  const jobs: Job[] = [
    ...offices.map((office): Job => ({ kind: 'office', label: office, dataset: 'dpwh', params: { office } })),
    // The region is applied here, not by the API: some lists (irrigation) give
    // no region at all, and the API's region filter would drop every such row.
    // A row with no region cannot be ruled out by region, so it stays.
    ...places.flatMap((p) =>
      (p.datasets ?? DATASET_KEYS).map((dataset): Job => ({
        kind: 'place',
        label: p.label,
        dataset,
        params: { q: p.q ?? p.label },
        region: p.region,
      })),
    ),
  ];

  const results = await Promise.all(jobs.map((j) => client.allProjects(j.dataset, j.params)));

  const byKey = new Map<string, ScopedProject>();
  const queries: QueryReport[] = [];
  const disclaimers = new Map<string, Disclaimer>();
  let meta: Meta | null = null;

  for (const [i, job] of jobs.entries()) {
    const { list, rows: fetched, truncated } = results[i];
    const rows = job.region ? fetched.filter((r) => r.region_key == null || r.region_key === job.region) : fetched;
    meta ??= list.meta;
    for (const d of list.disclaimers) if (!disclaimers.has(d.id)) disclaimers.set(d.id, d);
    queries.push({
      kind: job.kind,
      label: job.label,
      dataset: job.dataset,
      params: job.params,
      region: job.region,
      total: list.data.total,
      kept: rows.length,
      truncated,
      api: client.href(`/datasets/${job.dataset}/projects`, job.params),
      officeLens: list.data.office_lens,
    });
    for (const row of rows) {
      const key = projectKey(row.dataset, row.id);
      const reason: Reason = { kind: job.kind, label: job.label };
      const seen = byKey.get(key);
      if (!seen) byKey.set(key, { ...row, key, reasons: [reason] });
      else if (!seen.reasons.some((r) => r.kind === reason.kind && r.label === reason.label)) seen.reasons.push(reason);
    }
  }

  // The disclaimers that apply to every page come first, office ones after,
  // so a list that starts with the general one reads naturally.
  const ordered = [...disclaimers.values()].sort((a, b) => Number(a.id === 'disclaimer-offices') - Number(b.id === 'disclaimer-offices'));

  const excludedKeys = new Map(exclude.map((e) => [e.key, e]));
  const excluded = exclude.map((exclusion) => ({ exclusion, project: byKey.get(exclusion.key) ?? null }));
  const projects = [...byKey.values()].filter((p) => !excludedKeys.has(p.key)).sort(byHouseThenNep);

  if (!meta) {
    // No queries ran (an empty scope): still return the API's meta for the footer.
    meta = (await client.overview()).meta;
  }
  return { projects, excluded, queries, disclaimers: ordered, meta };
}

function byHouseThenNep(a: ProjectRow, b: ProjectRow): number {
  return (b.house_php ?? -1) - (a.house_php ?? -1) || (b.nep_php ?? -1) - (a.nep_php ?? -1) || a.title.localeCompare(b.title);
}

export interface Cell { rows: number; nep_php: number; house_php: number }

export interface Summary {
  rows: number;
  /** Per version: rows that have an amount in it, and the sum. Never added across versions. */
  nep: { rows: number; php: number };
  house: { rows: number; php: number };
  groups: Record<BridgeGroup, Cell>;
  /** Unconfirmed matches (fuzzy or ambiguous pairings) among the rows. */
  unconfirmed: number;
  byDataset: Partial<Record<DatasetKey, Cell>>;
}

const emptyCell = (): Cell => ({ rows: 0, nep_php: 0, house_php: 0 });

export function summarise(rows: readonly ProjectRow[]): Summary {
  const s: Summary = {
    rows: rows.length,
    nep: { rows: 0, php: 0 },
    house: { rows: 0, php: 0 },
    groups: Object.fromEntries(BRIDGE_GROUPS.map((g) => [g, emptyCell()])) as Record<BridgeGroup, Cell>,
    unconfirmed: 0,
    byDataset: {},
  };
  for (const r of rows) {
    if (r.nep_php != null) { s.nep.rows++; s.nep.php += r.nep_php; }
    if (r.house_php != null) { s.house.rows++; s.house.php += r.house_php; }
    if (r.held) s.unconfirmed++;
    const g = s.groups[r.bridge_group] ?? (s.groups[r.bridge_group] = emptyCell());
    g.rows++;
    g.nep_php += r.nep_php ?? 0;
    g.house_php += r.house_php ?? 0;
    const d = s.byDataset[r.dataset] ?? (s.byDataset[r.dataset] = emptyCell());
    d.rows++;
    d.nep_php += r.nep_php ?? 0;
    d.house_php += r.house_php ?? 0;
  }
  return s;
}
