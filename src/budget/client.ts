// From bettergovph/transparency-portal (MIT, (c) 2026 BetterGov.ph): https://github.com/bettergovph/transparency-portal
/**
 * A small client for the BetterGov.ph Budget API. Works in the browser and in
 * Node 20+ (the scripts), since both have `fetch`.
 *
 * Every GET is memoised for the life of the page: the API is read-only and
 * edge-cached, and the portal asks for the same overview from several views.
 */
import type { DatasetKey } from './config';
import type {
  DistrictCard, DistrictList, Envelope, GaaDepartment, GaaEnvelope, GaaProgram, Overview, ProjectDetail, ProjectList, ProjectRow,
} from './types';

/** The API's page-size ceiling for project lists. */
export const PAGE_SIZE = 200;
/** A place query that matches more than this is too broad to be one LGU's; the portal says so. */
export const MAX_ROWS_PER_QUERY = 4000;
/** GAA program lists page up to 500 rows. */
export const GAA_PAGE_SIZE = 500;
/** A place matching more GAA program families than this in one department is cut there, and said so. */
export const MAX_GAA_PROGRAMS = 6000;

export type Params = Record<string, string | number | undefined>;

export class ApiError extends Error {
  readonly status: number;
  readonly url: string;
  constructor(status: number, url: string, message: string) {
    super(message);
    this.status = status;
    this.url = url;
  }
}

export interface Client {
  base: string;
  /** Any JSON route; paths not starting with /api/ are under /api/v1/hgab/2027. */
  json<T>(path: string, params?: Params): Promise<T>;
  get<T>(path: string, params?: Params): Promise<Envelope<T>>;
  overview(): Promise<Envelope<Overview>>;
  /** Every row matching the filters, fetched page by page. */
  allProjects(dataset: DatasetKey, filters: Params): Promise<{ list: Envelope<ProjectList>; rows: ProjectRow[]; truncated: boolean }>;
  project(dataset: DatasetKey, id: string): Promise<Envelope<ProjectDetail>>;
  district(id: string): Promise<Envelope<DistrictCard>>;
  districts(params?: Params): Promise<Envelope<DistrictList>>;
  /** Absolute URL for an API path, for "see the data" links. */
  href(path: string, params?: Params): string;
  /** GAA FY2020–2026: the departments. */
  gaaDepartments(): Promise<GaaEnvelope<GaaDepartment[]>>;
  /** GAA FY2020–2026: every program family in one department whose name matches q, all years, page by page. */
  gaaPrograms(departmentId: string, q: string): Promise<{ first: GaaEnvelope<GaaProgram[]>; rows: GaaProgram[]; truncated: boolean }>;
}

const ROOT = '/api/v1/hgab/2027';

export function createClient(base: string): Client {
  const host = base.replace(/\/+$/, '');
  const cache = new Map<string, Promise<unknown>>();

  const href = (path: string, params: Params = {}) => {
    const url = new URL(path.startsWith('/api/') ? path : ROOT + path, host + '/');
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
    }
    return url.toString();
  };

  function json<T>(path: string, params: Params = {}): Promise<T> {
    const url = href(path, params);
    let hit = cache.get(url) as Promise<T> | undefined;
    if (!hit) {
      hit = (async () => {
        const res = await fetch(url, { headers: { accept: 'application/json' } });
        if (!res.ok) {
          let message = `${res.status} ${res.statusText}`;
          try {
            const body = (await res.json()) as { error?: { message?: string } };
            if (body?.error?.message) message = body.error.message;
          } catch {
            /* not JSON */
          }
          throw new ApiError(res.status, url, message);
        }
        return (await res.json()) as T;
      })();
      // A failed request must not stick: drop it so a retry fetches again.
      hit.catch(() => cache.delete(url));
      cache.set(url, hit);
    }
    return hit;
  }

  const get = <T,>(path: string, params: Params = {}) => json<Envelope<T>>(path, params);

  async function gaaPrograms(departmentId: string, q: string) {
    const path = `/api/v1/gaa/departments/${departmentId}/programs`;
    const first = await json<GaaEnvelope<GaaProgram[]>>(path, { q, limit: GAA_PAGE_SIZE });
    const rows = [...first.data];
    let cursor = first.next_cursor;
    // The cursor chains pages, so they are fetched one after another.
    while (cursor && rows.length < MAX_GAA_PROGRAMS) {
      const page = await json<GaaEnvelope<GaaProgram[]>>(path, { q, limit: GAA_PAGE_SIZE, cursor });
      rows.push(...page.data);
      cursor = page.next_cursor;
    }
    return { first, rows, truncated: Boolean(cursor) };
  }

  async function allProjects(dataset: DatasetKey, filters: Params) {
    const path = `/datasets/${dataset}/projects`;
    const first = await get<ProjectList>(path, { ...filters, limit: PAGE_SIZE, offset: 0 });
    const total = Math.min(first.data.total, MAX_ROWS_PER_QUERY);
    const offsets: number[] = [];
    for (let o = PAGE_SIZE; o < total; o += PAGE_SIZE) offsets.push(o);
    // A few pages at a time: kind to the API, quick enough for a few thousand rows.
    const pages: Envelope<ProjectList>[] = [];
    for (let i = 0; i < offsets.length; i += 4) {
      const batch = offsets.slice(i, i + 4).map((offset) => get<ProjectList>(path, { ...filters, limit: PAGE_SIZE, offset }));
      pages.push(...(await Promise.all(batch)));
    }
    const rows = [first, ...pages].flatMap((p) => p.data.rows);
    return { list: first, rows, truncated: first.data.total > MAX_ROWS_PER_QUERY };
  }

  return {
    base: host,
    json,
    get,
    href,
    gaaDepartments: () => json<GaaEnvelope<GaaDepartment[]>>('/api/v1/gaa/departments'),
    gaaPrograms,
    overview: () => get<Overview>(''),
    allProjects,
    project: (dataset, id) => get<ProjectDetail>(`/datasets/${dataset}/projects/${encodeURIComponent(id)}`),
    district: (id) => get<DistrictCard>(`/districts/${encodeURIComponent(id)}`),
    districts: (params = {}) => get<DistrictList>('/districts', params),
  };
}
