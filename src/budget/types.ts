// From bettergovph/transparency-portal (MIT, (c) 2026 BetterGov.ph): https://github.com/bettergovph/transparency-portal
/**
 * The parts of the BetterGov.ph Budget API (`/api/v1/hgab/2027/*`) the portal
 * reads. Field names are the API's. Full reference:
 * https://budget.bettergov.ph/docs and /api/v1/openapi.json.
 *
 * Rules the API keeps and the portal must keep too:
 * - Amounts are integer pesos. null means "this version has no such line", never zero.
 * - The NEP and the House bill are two versions of one budget: compare, never add.
 * - Pairings are candidates (leads for checking), never confirmed changes.
 */
import type { DatasetKey } from './config';

export type BridgeGroup = 'house_only' | 'nep_only' | 'unchanged' | 'increased' | 'decreased' | 'scope_review';
export const BRIDGE_GROUPS: readonly BridgeGroup[] = [
  'house_only', 'nep_only', 'unchanged', 'increased', 'decreased', 'scope_review',
];

export interface Disclaimer {
  id: string;
  title: string;
  body: string;
  url: string;
  restrictions_url?: string;
  upstream_restrictions_url?: string;
}

export interface Meta {
  dataset: 'hgab';
  fiscal_year: number;
  currency: 'PHP';
  scale: 'pesos';
  source_repo: string;
  source_commit: string;
  built_at: string;
  notice: string;
  total?: number;
  [key: string]: unknown;
}

export interface Envelope<T> {
  meta: Meta;
  disclaimers: Disclaimer[];
  data: T;
}

export interface Term { term: string; meaning: string }

export interface GroupInfo {
  group: BridgeGroup;
  label: string;
  sub: string;
  help: string;
  rows: number;
  php: number;
}

export interface DatasetInfo {
  key: DatasetKey;
  label: string;
  short: string;
  agency: string;
  summary: string;
  one_row: string;
  house_stage: 'hgab2' | 'hgab3';
  house_stage_label: string;
  bridge: { groups: Record<BridgeGroup, GroupInfo> };
}

export interface DocumentInfo {
  key: string;
  title: string;
  stage: string;
  reading: number | null;
  volume: string | null;
  pdf_url: string;
  source_url: string | null;
}

export interface RecordVersion { key: Version; short: string; label: string; plain: string }

export interface Overview {
  title: string;
  summary: string;
  record_versions: RecordVersion[];
  rules: string[];
  terms: Record<string, Term>;
  datasets: DatasetInfo[];
  documents: DocumentInfo[];
  url: string;
}

export type Version = 'nep' | 'hgab2' | 'hgab3' | 'api';

export interface ProjectRow {
  id: string;
  dataset: DatasetKey;
  title: string;
  program: string | null;
  pap: string | null;
  region: string | null;
  region_key: string | null;
  office: string | null;
  office_kind: string | null;
  zone: string | null;
  trace: string;
  status_label: string;
  bridge_group: BridgeGroup;
  group_label: string;
  held: boolean;
  nep_php: number | null;
  hgab2_php: number | null;
  hgab3_php: number | null;
  house_php: number | null;
  api_php: number | null;
  delta_php: number | null;
  nep_page: number | null;
  hgab2_page: number | null;
  hgab3_page: number | null;
  pdf_url: Partial<Record<Version, string>>;
  flags: string[];
  lon: number | null;
  lat: number | null;
  url: string;
  api_url: string;
}

export interface Labelled { code: string; label: string; help?: string }

export interface ProjectDetail extends ProjectRow {
  house_match: string | null;
  reading_status: string | null;
  api_presence: string | null;
  confidence: number | null;
  length_m: number | null;
  labels: {
    status: Labelled & { group: BridgeGroup; group_label: string; held: boolean };
    match: Labelled | null;
    reading: Labelled | null;
    dpwh_site: Labelled | null;
    zone: Labelled | null;
    flags: Labelled[];
  };
}

export interface DistrictRef { id: string; label: string; url: string; api_url?: string }

export interface OfficeLensOffice {
  id: string;
  name: string;
  kind: string;
  kind_label: string;
  tier: 'A' | 'B';
  tier_text: string;
  districts: DistrictRef[];
}

export interface OfficeLens {
  printed_office: string;
  offices: OfficeLensOffice[];
  shared_office_total: boolean;
  tier_meaning: string;
  note: string;
}

export interface ProjectSums {
  nep_php: number | null;
  hgab2_php: number | null;
  hgab3_php: number | null;
  unconfirmed_rows: number;
  not_additive_across_versions: true;
}

export interface ProjectList {
  total: number;
  sums: ProjectSums;
  rows: ProjectRow[];
  office_lens?: OfficeLens;
}

export interface Portrait { url: string; attribution: string; license: string; source_url: string }

export interface Representative {
  name: string;
  seat: string;
  status: string;
  status_note: string | null;
  profile_url: string | null;
  bills_url: string | null;
  portrait: Portrait | null;
}

export interface GroupCell {
  group: BridgeGroup;
  label: string;
  sub: string;
  rows: number;
  php: number;
  unconfirmed_rows: number;
  unconfirmed_php: number;
}

/** One DPWH office as a district page returns it: its own figures, whole. */
export interface DistrictOffice {
  id: string;
  name: string;
  kind: string;
  kind_label: string;
  region: string | null;
  tier: 'A' | 'B';
  tier_text: string;
  district_ids: string[];
  co_served_districts: DistrictRef[];
  years?: { fy: number; stage: string; stage_label: string; scope: string; php: number | null; matched_label: string | null }[];
  /** The office's 2027 named projects, NEP against House bill on the same ledger. */
  fy2027?: {
    nep_php: number | null;
    hgab2_php: number | null;
    hgab3_php: number | null;
    nep_records: number;
    hgab3_records: number;
    bridge: { net_php: number; groups: Record<BridgeGroup, GroupCell> };
    annotations?: { unconfirmed_rows: number; unconfirmed_php: number };
    office_change?: { rows: number; nep_php: number; hgab3_php: number };
  } | null;
  projects_url?: string;
}

export interface DistrictCard {
  id: string;
  label: string;
  jurisdiction: string;
  district_label: string;
  region: string | null;
  region_key: string | null;
  attribution: { code: 'A' | 'B' | 'mixed' | 'none'; label: string; meaning: string };
  representative: Representative | null;
  offices: DistrictOffice[];
  headline: {
    fy2027_nep_php: number | null;
    fy2027_hgab3_php: number | null;
    shared_office_total: boolean;
    note: string;
    scope: Record<string, string>;
  };
  fy2027_vs_proposal: {
    nep_php: number | null;
    hgab3_php: number | null;
    delta_php: number | null;
    unconfirmed_rows: number;
    unconfirmed_php: number;
    note: string;
  } | null;
  url: string;
  residual_note?: string;
}

export interface DistrictList {
  total: number;
  districts: DistrictCard[];
}

// ---------------------------------------------------------------------------
// GAA FY2020–2026 (/api/v1/gaa): the enacted budgets
// ---------------------------------------------------------------------------

/** The enacted years the API covers. */
export const GAA_YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026] as const;
export type GaaYear = (typeof GAA_YEARS)[number];

/** Per year: how many lines carry the name, and their appropriation in pesos. */
export type GaaYears = Record<string, { count: number; amount: number }>;

/** GAA responses carry no disclaimers, and list pages a cursor. */
export interface GaaEnvelope<T> {
  meta: { dataset: 'gaa'; years: number[]; currency: 'PHP'; scale: 'pesos'; matched?: number; matched_amount?: number; [key: string]: unknown };
  data: T;
  next_cursor?: string | null;
}

export interface GaaDepartment {
  id: string;
  slug: string;
  description: string;
  years: GaaYears;
}

/**
 * A program, activity or project "family": the same name in one agency across
 * the years. A renamed project is a different family.
 */
export interface GaaProgram {
  department_id: string;
  agency_id: string;
  fam_key: string;
  name: string;
  ids_count: number;
  years: GaaYears;
}
