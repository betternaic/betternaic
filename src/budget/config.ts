// Adapted from bettergovph/transparency-portal (MIT, (c) 2026 BetterGov.ph):
// src/config.ts and portal.config.ts, trimmed to what BetterNaic uses.

/** The four programs the FY2027 House bill lists project by project. */
export type DatasetKey = 'dpwh' | 'fmr' | 'hfep' | 'nia';
export const DATASET_KEYS: readonly DatasetKey[] = ['dpwh', 'fmr', 'hfep', 'nia'];

/** A place whose name, in a project's title, brings the project into the portal. */
export interface PlaceQuery {
  /** What readers see: "Naic". */
  label: string;
  /** The API search; every word must appear. Defaults to `label`. */
  q?: string;
  /** A region key ("IV-A") to keep a common name to one region. */
  region?: string;
  /** Programs to search. Defaults to all four. */
  datasets?: DatasetKey[];
}

/** A line removed by hand. Every exclusion is published on the About page. */
export interface Exclusion {
  /** `<dataset>:<id>` for a 2027 line, or `gaa:<family key>` for a 2020–2026 program. */
  key: string;
  reason: string;
}

export interface PortalConfig {
  /** Stable id, used in CSV file names. */
  id: string;
  name: string;
  shortName: string;
  scope: {
    /** DPWH offices, named exactly as the documents publish them. */
    offices?: string[];
    places?: PlaceQuery[];
    /** Legislative districts to show cards for: "leg:cavite:8th". */
    districts?: string[];
    exclude?: Exclusion[];
  };
}

export const DEFAULT_API = 'https://budget.bettergov.ph';
export const SOURCE_CODE_URL = 'https://github.com/bettergovph/transparency-portal';
export const NATIONAL_URL = 'https://budget.bettergov.ph/hgab/2027/overview';

/**
 * Naic is in Cavite's 8th District, which the Cavite 2nd District Engineering
 * Office serves alone (Tier A). The office brings in its whole ledger, so the
 * list also has its work in the district's other towns; every row says why it
 * is listed, and "names Naic" narrows it to titles that spell the town out.
 */
export const portal: PortalConfig = {
  id: 'naic',
  name: 'Municipality of Naic, Cavite',
  shortName: 'Naic',
  scope: {
    offices: ['Cavite 2nd District Engineering Office'],
    places: [{ label: 'Naic', region: 'IV-A' }],
    districts: ['leg:cavite:8th'],
    exclude: [],
  },
};
