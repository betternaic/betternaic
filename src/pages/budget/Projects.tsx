// Adapted from bettergovph/transparency-portal (MIT): src/pages/Home.tsx and
// src/components/OfficesSection.tsx, restyled for BetterNaic.
import { useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import SEO from '../../components/SEO';
import type { BridgeGroup, DatasetInfo, Disclaimer, DistrictCard, DistrictOffice, Envelope, GroupInfo } from '../../budget/types';
import { BRIDGE_GROUPS } from '../../budget/types';
import type { DatasetKey } from '../../budget/config';
import { Await, BudgetHeader, Disclaimers, Dot, External, ReasonTags, StatusChip, field, fine, h2, quietButton, tag, button } from '../../budget/Bits';
import { projectsCsv, downloadText } from '../../budget/csv';
import { count, php, phpDelta, plural } from '../../budget/format';
import { shortOffice, usePortal } from '../../budget/context';
import { summarise, type QueryReport, type ScopedProject, type ScopeResult, type Summary } from '../../budget/scope';

const PAGE = 100;

type Sort = 'house' | 'nep' | 'change' | 'title';
const SORTS: Record<Sort, { label: string; cmp: (a: ScopedProject, b: ScopedProject) => number }> = {
  house: { label: 'House bill amount', cmp: (a, b) => (b.house_php ?? -1) - (a.house_php ?? -1) },
  nep: { label: 'NEP amount', cmp: (a, b) => (b.nep_php ?? -1) - (a.nep_php ?? -1) },
  change: { label: 'Size of change', cmp: (a, b) => Math.abs(b.delta_php ?? 0) - Math.abs(a.delta_php ?? 0) },
  title: { label: 'Name', cmp: (a, b) => a.title.localeCompare(b.title) },
};

const scrollToList = () => requestAnimationFrame(() => document.getElementById('projects')?.scrollIntoView({ block: 'start' }));

export default function Projects() {
  const { t } = useTranslation();
  const { scope, overview } = usePortal();
  const datasets = overview.status === 'ready' ? overview.value.data.datasets : [];
  const title = scope.status === 'ready'
    ? t('budget.title', '{{count}} projects for Naic in the 2027 budget', { count: scope.value.projects.length })
    : t('budget.titleLoading', 'Naic in the 2027 national budget');
  return (
    <>
      <SEO title="2027 budget projects" description="Every DPWH, farm-to-market road, health facility and irrigation project for Naic, Cavite in the FY 2027 NEP and House bill, with the source page of each figure." />
      <BudgetHeader
        title={title}
        crumb={t('budget.crumb', '2027 budget')}
        subtitle={t('budget.subtitle', 'What the President proposed (NEP) and what the House passed (House Bill 10858) for projects in Naic and the DPWH office that builds here.')}
      />
      <div className="bg-white py-10">
        <div className="container mx-auto px-4">
          <Await state={scope} what="projects">
            {s => <ProjectsView scope={s} datasets={datasets} />}
          </Await>
        </div>
      </div>
    </>
  );
}

type GroupWords = Pick<GroupInfo, 'label' | 'sub' | 'help'>;

function groupInfo(datasets: DatasetInfo[], rows: ScopedProject[]): Record<BridgeGroup, GroupWords> {
  const fromApi = datasets[0]?.bridge.groups;
  const out = {} as Record<BridgeGroup, GroupWords>;
  for (const g of BRIDGE_GROUPS) {
    out[g] = fromApi?.[g] ?? { label: rows.find(r => r.bridge_group === g)?.group_label ?? g, sub: '', help: '' };
  }
  return out;
}

function ProjectsView({ scope, datasets }: { scope: ScopeResult; datasets: DatasetInfo[] }) {
  const { t } = useTranslation();
  const { config, districts } = usePortal();

  const disclaimers = useMemo(() => {
    const byId = new Map<string, Disclaimer>(scope.disclaimers.map(d => [d.id, d]));
    if (districts.status === 'ready') for (const env of districts.value) for (const d of env.disclaimers) if (!byId.has(d.id)) byId.set(d.id, d);
    return [...byId.values()];
  }, [scope.disclaimers, districts]);
  const all = scope.projects;
  const summary = useMemo(() => summarise(all), [all]);
  const groups = useMemo(() => groupInfo(datasets, all), [datasets, all]);
  const programName = (k: DatasetKey) => datasets.find(d => d.key === k)?.short ?? k.toUpperCase();

  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const program = (params.get('program') ?? '') as DatasetKey | '';
  const status = (params.get('status') ?? '') as BridgeGroup | '';
  const why = params.get('why') ?? '';
  const office = params.get('office') ?? '';
  const sort = (params.get('sort') as Sort) in SORTS ? (params.get('sort') as Sort) : 'house';
  const [shown, setShown] = useState(PAGE);

  const setFilters = (values: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
    setShown(PAGE);
  };
  const setParam = (key: string, value: string) => setFilters({ [key]: value });

  const offices = useMemo(() => {
    const n = new Map<string, number>();
    for (const p of all) if (p.office) n.set(p.office, (n.get(p.office) ?? 0) + 1);
    return [...n.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'en', { numeric: true }));
  }, [all]);

  const reasons = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of all) for (const r of p.reasons) seen.set(`${r.kind}:${r.label}`, r.kind === 'office' ? `Office: ${shortOffice(r.label)}` : `Title names ${r.label}`);
    return [...seen.entries()];
  }, [all]);

  const filtered = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const rows = all.filter(p => {
      if (program && p.dataset !== program) return false;
      if (status && p.bridge_group !== status) return false;
      if (why && !p.reasons.some(r => `${r.kind}:${r.label}` === why)) return false;
      if (office && p.office !== office) return false;
      if (words.length) {
        const hay = [p.title, p.program, p.pap, p.office, p.region].join(' ').toLowerCase();
        if (!words.every(w => hay.includes(w))) return false;
      }
      return true;
    });
    return rows.sort((a, b) => SORTS[sort].cmp(a, b) || a.title.localeCompare(b.title));
  }, [all, q, program, status, why, office, sort]);
  const filteredSummary = useMemo(() => summarise(filtered), [filtered]);
  const narrowed = filtered.length !== all.length;
  const naicOnly = reasons.find(([k]) => k.startsWith('place:'))?.[0];

  return (
    <>
      <Lede summary={summary} />
      <Stats summary={summary} programName={programName} />

      {naicOnly && (
        <p className="mt-6 rounded-lg bg-primary-50 p-5 text-gray-800">
          {t('budget.naicOnlyNote', 'The DPWH office for Naic also builds in the other towns of Cavite\'s 8th District, so its whole list is here. To see only the projects whose title names Naic:')}{' '}
          <button type="button" className="font-semibold text-primary-600 underline underline-offset-4" onClick={() => { setParam('why', naicOnly); scrollToList(); }}>
            {t('budget.naicOnly', 'show projects that name Naic')}
          </button>
        </p>
      )}

      <Offices onOffice={o => { setFilters({ office: o, status: '' }); scrollToList(); }} onStatus={(o, g) => { setFilters({ office: o, status: g }); scrollToList(); }} />

      <section className="mt-12" aria-labelledby="groups-h">
        <h2 id="groups-h" className={h2}>{t('budget.groups', 'What the House bill did to them')}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="group" aria-label="Filter by status">
          {BRIDGE_GROUPS.map(g => {
            const cell = summary.groups[g];
            const info = groups[g];
            const active = status === g;
            return (
              <button
                key={g}
                type="button"
                disabled={!cell.rows}
                aria-pressed={active}
                title={info.help}
                onClick={() => { setParam('status', active ? '' : g); if (!active) scrollToList(); }}
                className={`rounded-lg border p-4 text-left disabled:opacity-50 ${active ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500' : 'border-gray-200 hover:border-primary-300'}`}
              >
                <span className="flex items-center gap-2 font-semibold text-gray-900"><Dot group={g} />{info.label}</span>
                {info.sub && <span className="mt-1 block text-gray-700">{info.sub}</span>}
                <span className="mt-2 flex items-baseline justify-between gap-3">
                  <span className="text-2xl font-bold tabular-nums text-gray-900">{count(cell.rows)}</span>
                  <span className="tabular-nums text-gray-700">{groupAmount(g, cell)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-12 scroll-mt-24" id="projects" aria-labelledby="list-h">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="list-h" className={h2}>
            {narrowed ? `${count(filtered.length)} of ${plural(all.length, 'project')}` : `${t('budget.every', 'Every project')} (${count(all.length)})`}
          </h2>
          <button type="button" className={quietButton} onClick={() => downloadText(`${config.id}-fy2027-projects.csv`, projectsCsv(filtered))}>
            {t('budget.csv', 'Download CSV')}{narrowed ? ` (${count(filtered.length)})` : ''}
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block sm:col-span-2 lg:col-span-3">
            <span className="font-semibold text-gray-900">{t('budget.search', 'Search')}</span>
            <input type="search" value={q} placeholder="Barangay, road, school, office…" onChange={e => setParam('q', e.target.value)} className={`${field} mt-1`} />
          </label>
          <Select label={t('budget.program', 'Program')} value={program} onChange={v => setParam('program', v)}>
            <option value="">All programs</option>
            {(Object.keys(summary.byDataset) as DatasetKey[]).map(k => (
              <option key={k} value={k}>{programName(k)} ({count(summary.byDataset[k]!.rows)})</option>
            ))}
          </Select>
          <Select label={t('budget.status', 'Status')} value={status} onChange={v => setParam('status', v)}>
            <option value="">Any status</option>
            {BRIDGE_GROUPS.filter(g => summary.groups[g].rows).map(g => (
              <option key={g} value={g}>{groups[g].label} ({count(summary.groups[g].rows)})</option>
            ))}
          </Select>
          {offices.length > 1 && (
            <Select label={t('budget.office', 'DPWH office')} value={office} onChange={v => setParam('office', v)}>
              <option value="">Any office</option>
              {offices.map(([o, n]) => <option key={o} value={o}>{shortOffice(o)} ({count(n)})</option>)}
            </Select>
          )}
          {reasons.length > 1 && (
            <Select label={t('budget.why', 'Listed because')} value={why} onChange={v => setParam('why', v)}>
              <option value="">Any reason</option>
              {reasons.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </Select>
          )}
          <Select label={t('budget.sort', 'Sort by')} value={sort} onChange={v => setParam('sort', v === 'house' ? '' : v)}>
            {(Object.keys(SORTS) as Sort[]).map(k => <option key={k} value={k}>{SORTS[k].label}</option>)}
          </Select>
        </div>

        {narrowed && (
          <p className="mt-4 text-gray-800">
            These {count(filtered.length)}: NEP {php(filteredSummary.nep.php)} on {count(filteredSummary.nep.rows)} · House bill {php(filteredSummary.house.php)} on {count(filteredSummary.house.rows)} ·{' '}
            <button type="button" className="font-semibold text-primary-600 underline underline-offset-4" onClick={() => { setParams(new URLSearchParams(), { replace: true }); setShown(PAGE); }}>
              {t('budget.clear', 'Clear filters')}
            </button>
          </p>
        )}

        <ProjectTable rows={filtered.slice(0, shown)} programName={programName} />

        {filtered.length === 0 && <p className="mt-6 text-gray-700">No project matches. Try fewer words or clear the filters.</p>}
        {filtered.length > shown && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-gray-700">Showing {count(shown)} of {count(filtered.length)}</span>
            <button type="button" className={button} onClick={() => setShown(n => n + PAGE)}>Show {count(Math.min(PAGE, filtered.length - shown))} more</button>
            <button type="button" className={quietButton} onClick={() => setShown(filtered.length)}>Show all</button>
          </div>
        )}

        <p className={fine}>
          Amounts are in pesos, as each document publishes them. A dash means that document has no such line. The NEP and the
          House bill are two versions of one budget: their totals are compared, never added.
        </p>
      </section>

      <Disclaimers items={disclaimers} />
    </>
  );
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <label className="block">
      <span className="font-semibold text-gray-900">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className={`${field} mt-1`}>
        {children}
      </select>
    </label>
  );
}

function groupAmount(g: BridgeGroup, c: { nep_php: number; house_php: number; rows: number }): string {
  if (!c.rows) return '-';
  switch (g) {
    case 'nep_only': return php(c.nep_php);
    case 'increased':
    case 'decreased':
    case 'scope_review': return phpDelta(c.house_php - c.nep_php);
    default: return php(c.house_php);
  }
}

function Lede({ summary }: { summary: Summary }) {
  const added = summary.groups.house_only.rows;
  const dropped = summary.groups.nep_only.rows;
  return (
    <p className="max-w-3xl text-lg text-gray-800">
      The NEP lists {count(summary.nep.rows)} of them, for {php(summary.nep.php)}; the House bill lists {count(summary.house.rows)}, for{' '}
      {php(summary.house.php)}.{' '}
      {added || dropped ? (
        <>
          {plural(added, 'project is', 'projects are')} in the House bill only and {count(dropped)} in the NEP only: candidates to check, not
          confirmed changes.
        </>
      ) : (
        <>Every project is in both.</>
      )}
    </p>
  );
}

function Stats({ summary, programName }: { summary: Summary; programName: (k: DatasetKey) => string }) {
  const programs = (Object.entries(summary.byDataset) as [DatasetKey, { rows: number }][])
    .sort((a, b) => b[1].rows - a[1].rows)
    .map(([k, c]) => `${programName(k)} ${count(c.rows)}`)
    .join(' · ');
  const cells = [
    { label: 'Projects', value: count(summary.rows), sub: programs || 'none' },
    { label: 'NEP', value: php(summary.nep.php), sub: `${plural(summary.nep.rows, 'project')} · the budget the President submits` },
    { label: 'House bill', value: php(summary.house.php), sub: `${plural(summary.house.rows, 'project')} · compared with the NEP, not added` },
    { label: 'In the House bill only', value: count(summary.groups.house_only.rows), sub: `${php(summary.groups.house_only.house_php)} · insertion candidates` },
  ];
  return (
    <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cells.map(c => (
        <div key={c.label} className="rounded-lg border border-gray-200 p-4">
          <dt className="font-semibold text-gray-700">{c.label}</dt>
          <dd className="mt-1 text-3xl font-bold tabular-nums text-gray-900">{c.value}</dd>
          <dd className="mt-1 text-gray-700">{c.sub}</dd>
        </div>
      ))}
    </dl>
  );
}

function ProjectTable({ rows, programName }: { rows: ScopedProject[]; programName: (k: DatasetKey) => string }) {
  if (!rows.length) return null;
  const cols = 'md:grid md:grid-cols-[minmax(0,1fr)_12rem_7rem_7rem_7rem] md:gap-4';
  return (
    <div className="mt-6" role="table" aria-label="Projects">
      <div className={`hidden border-b-2 border-gray-300 pb-2 font-semibold text-gray-900 ${cols}`} role="row">
        <span role="columnheader">Project</span>
        <span role="columnheader">Status</span>
        <span role="columnheader" className="text-right">NEP</span>
        <span role="columnheader" className="text-right">House bill</span>
        <span role="columnheader" className="text-right">Change</span>
      </div>
      {rows.map(p => (
        <div className={`border-b border-gray-200 py-3 ${cols}`} role="row" key={p.key}>
          <span role="cell" className="block min-w-0">
            <Link to={`/budget/projects/${p.dataset}/${encodeURIComponent(p.id)}`} className="font-semibold break-words text-primary-600 underline-offset-4 hover:underline">
              {p.title}
            </Link>
            <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-700">
              <span className="font-semibold">{programName(p.dataset)}</span>
              {p.office && <span>{shortOffice(p.office)}</span>}
              <ReasonTags reasons={p.reasons} />
            </span>
          </span>
          <span role="cell" className="mt-2 block md:mt-0"><StatusChip group={p.bridge_group} label={p.status_label} held={p.held} /></span>
          <Amount label="NEP" value={php(p.nep_php)} />
          <Amount label="House bill" value={php(p.house_php)} strong />
          <Amount label="Change" value={phpDelta(p.delta_php)} tone={(p.delta_php ?? 0) > 0 ? 'text-success-700' : (p.delta_php ?? 0) < 0 ? 'text-error-600' : ''} />
        </div>
      ))}
    </div>
  );
}

function Amount({ label, value, strong, tone = '' }: { label: string; value: string; strong?: boolean; tone?: string }) {
  return (
    <span role="cell" className={`mt-1 flex justify-between gap-3 tabular-nums md:mt-0 md:block md:text-right ${strong ? 'font-semibold text-gray-900' : 'text-gray-800'} ${tone}`}>
      <span className="text-gray-700 md:hidden">{label}</span>
      {value}
    </span>
  );
}

// ---------------------------------------------------------------------------
// DPWH offices and the legislative districts they serve
// ---------------------------------------------------------------------------

interface OfficeView {
  office: DistrictOffice;
  printed: string;
  query: QueryReport | null;
  lines: number;
  districts: { id: string; label: string; card: DistrictCard | null }[];
}

function buildOffices(cards: DistrictCard[], queries: QueryReport[], projects: ScopedProject[]): OfficeView[] {
  const linesByOffice = new Map<string, number>();
  for (const p of projects) if (p.office) linesByOffice.set(p.office, (linesByOffice.get(p.office) ?? 0) + 1);
  const cardById = new Map(cards.map(c => [c.id, c]));
  const queryByOffice = new Map<string, QueryReport>();
  for (const q of queries) for (const o of q.officeLens?.offices ?? []) queryByOffice.set(o.id, q);
  const officeById = new Map<string, DistrictOffice>();
  for (const c of cards) for (const o of c.offices) if (!officeById.has(o.id)) officeById.set(o.id, o);

  return [...officeById.values()].map((office): OfficeView => {
    const query = queryByOffice.get(office.id) ?? null;
    const printed = query?.label ?? office.years?.find(y => y.fy === 2027 && y.stage === 'hgab3' && y.matched_label)?.matched_label ?? office.name;
    const labels = new Map(office.co_served_districts.map(d => [d.id, d.label]));
    const districts = office.district_ids.map(id => {
      const card = cardById.get(id) ?? null;
      return { id, label: card?.label ?? labels.get(id) ?? id, card };
    });
    return { office, printed, query, lines: linesByOffice.get(printed) ?? 0, districts };
  });
}

type OfficeActions = { onOffice: (printed: string) => void; onStatus: (printed: string, g: BridgeGroup) => void };

function Offices(actions: OfficeActions) {
  const { districts, scope } = usePortal();
  const queries = scope.status === 'ready' ? scope.value.queries.filter(q => q.kind === 'office') : [];
  const projects = scope.status === 'ready' ? scope.value.projects : [];
  return (
    <section className="mt-12" aria-labelledby="offices-h">
      <Await state={districts} what="DPWH offices and districts">
        {list => <OfficeList list={list} queries={queries} projects={projects} {...actions} />}
      </Await>
    </section>
  );
}

function OfficeList({ list, queries, projects, ...actions }: { list: Envelope<DistrictCard>[]; queries: QueryReport[]; projects: ScopedProject[] } & OfficeActions) {
  const { t } = useTranslation();
  const offices = buildOffices(list.map(e => e.data), queries, projects);
  const note = list[0]?.meta.representatives_note as string | undefined;
  return (
    <>
      <h2 id="offices-h" className={h2}>{t('budget.offices', 'The DPWH office that builds in Naic')}</h2>
      <p className="mt-2 max-w-3xl text-gray-800">
        DPWH lists its money by the district engineering office that does the work. Each office serves one or more legislative
        districts, and a shared office’s money is never split between them. The representative shown holds the seat in the 20th
        Congress.{note && <> {note}</>}
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {offices.map(o => <Office key={o.office.id} view={o} {...actions} />)}
      </div>
    </>
  );
}

function Office({ view, onOffice, onStatus }: { view: OfficeView } & OfficeActions) {
  const { office, printed, query, lines, districts } = view;
  const f = office.fy2027;
  const wholeNep = office.years?.find(y => y.fy === 2027 && y.stage === 'nep')?.php ?? null;
  const change = f && f.nep_php != null && f.hgab3_php != null ? f.hgab3_php - f.nep_php : null;
  const groups = f ? BRIDGE_GROUPS.map(g => f.bridge.groups[g]).filter(c => c && c.rows > 0) : [];
  const unconfirmed = f?.annotations?.unconfirmed_rows ?? 0;
  const link = 'font-semibold text-primary-600 underline underline-offset-4';

  return (
    <article className="rounded-lg border border-gray-200 p-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-gray-700">DPWH {office.kind_label.replace(/ \(DEO\)$/, '').toLowerCase()}{office.region && <> · {office.region}</>}</p>
          <h3 className="text-lg font-bold text-gray-900">{printed}</h3>
        </div>
        <span className={`${tag} ${office.tier === 'B' ? 'border-accent-600 bg-accent-50 text-accent-800' : 'border-gray-500 text-gray-900'}`}>{office.tier_text}</span>
      </header>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <dt className="text-gray-700">On this page</dt>
          <dd>{lines ? <button type="button" className={link} onClick={() => onOffice(printed)}>{plural(lines, 'line')}</button> : 'none'}</dd>
        </div>
        <div><dt className="text-gray-700">NEP</dt><dd className="font-semibold tabular-nums">{php(f?.nep_php)}</dd></div>
        <div><dt className="text-gray-700">House bill</dt><dd className="font-semibold tabular-nums">{php(f?.hgab3_php)}</dd></div>
        <div><dt className="text-gray-700">Change</dt><dd className="font-semibold tabular-nums">{phpDelta(change)}</dd></div>
      </dl>

      {groups.length > 0 && (
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {groups.map(c => {
            const text = <span className="inline-flex items-center gap-1.5"><Dot group={c.group} />{count(c.rows)} {c.label.charAt(0).toLowerCase() + c.label.slice(1)}</span>;
            // The counts are the whole office's: they filter the list only when all its lines are on this page.
            return query ? <button key={c.group} type="button" className="text-primary-600 underline underline-offset-4" onClick={() => onStatus(printed, c.group)}>{text}</button> : <span key={c.group}>{text}</span>;
          })}
        </p>
      )}
      <p className="mt-3 text-gray-700">
        Named projects{f ? <>: {count(f.nep_records)} in the NEP, {count(f.hgab3_records)} in the House bill</> : null}.
        {wholeNep != null && <> The whole office in the NEP: {php(wholeNep)}.</>}
        {unconfirmed > 0 && <> Includes {plural(unconfirmed, 'unconfirmed match', 'unconfirmed matches')} ({php(f?.annotations?.unconfirmed_php)}).</>}{' '}
        <Link to="/budget/enacted" className={link}>Its budget each year since 2020</Link>
      </p>

      <ul className="mt-4 space-y-3 border-t border-gray-200 pt-4">
        {districts.map(d => {
          const rep = d.card?.representative ?? null;
          return (
            <li key={d.id} className="flex gap-3">
              {rep?.portrait && (
                <img src={rep.portrait.url} alt="" title={`${rep.portrait.attribution} · ${rep.portrait.license}`} width="40" height="50" loading="lazy" className="h-[50px] w-10 rounded object-cover" />
              )}
              <div>
                <p className="font-semibold text-gray-900">{d.label}</p>
                <p className="text-gray-800">{rep ? rep.name : 'No representative listed'}</p>
                <p className="flex flex-wrap gap-x-4">
                  {rep?.bills_url && <External href={rep.bills_url}>Bills</External>}
                  {d.card && <External href={d.card.url}>District page</External>}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
