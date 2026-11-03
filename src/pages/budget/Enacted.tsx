// Adapted from bettergovph/transparency-portal (MIT): src/pages/Enacted.tsx, restyled for BetterNaic.
// The enacted budgets (GAA) 2020–2026: the DPWH office's whole budget by year,
// and every program in any department whose name names Naic.
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import SEO from '../../components/SEO';
import type { DistrictCard, DistrictOffice, Envelope } from '../../budget/types';
import { GAA_YEARS } from '../../budget/types';
import { Await, BudgetHeader, Disclaimers, External, Failed, Loading, button, field, fine, h2, quietButton, tag } from '../../budget/Bits';
import { downloadText } from '../../budget/csv';
import { count, php, phpFull, plural } from '../../budget/format';
import { departmentShort, gaaCsv, gaaYearTotals, hasYear, type GaaResult, type GaaRow } from '../../budget/gaa';
import { usePortal } from '../../budget/context';
import { useGaa } from '../../budget/useGaa';

const PAGE = 100;
const FIRST = GAA_YEARS[0];
const LAST = GAA_YEARS[GAA_YEARS.length - 1];

export default function Enacted() {
  const { t } = useTranslation();
  const { state, progress, retry } = useGaa();
  return (
    <>
      <SEO title={`Enacted budgets ${FIRST}–${LAST}`} description="Naic, Cavite in the General Appropriations Acts of 2020 to 2026: the DPWH office's yearly budget and every program whose name names Naic." />
      <BudgetHeader
        title={
          state.status === 'ready'
            ? t('budget.gaaTitle', '{{count}} programs and projects in the {{first}}–{{last}} budgets name Naic', { count: state.value.rows.length, first: FIRST, last: LAST })
            : t('budget.gaaTitleLoading', 'Naic in the enacted budgets, {{first}}–{{last}}', { first: FIRST, last: LAST })
        }
        crumb={t('budget.tabEnacted', 'Budgets 2020–2026')}
        subtitle={t('budget.gaaSubtitle', 'The General Appropriations Act (GAA) is the budget Congress passes and the President signs each year: the authority to spend, not the money spent. The 2027 budget is still a bill.')}
      />
      <div className="bg-white py-10">
        <div className="container mx-auto px-4">
          <OfficeHistories />
          {state.status === 'loading' ? (
            <Loading>
              Searching every department’s programs for Naic{progress && progress.total > 0 && <> · {count(progress.done)} of {count(progress.total)}</>}…
            </Loading>
          ) : state.status === 'error' ? (
            <Failed what="the enacted budgets" error={state.error} onRetry={retry} />
          ) : (
            <Programs result={state.value} />
          )}

          <section className="mt-12" aria-labelledby="gaa-notes-h">
            <h2 id="gaa-notes-h" className={h2}>{t('budget.reading', 'Reading these figures')}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-800">
              <li>Amounts are the appropriations in each year’s GAA, in pesos. The GAA publishes them in thousands.</li>
              <li>A program is listed when its name includes Naic. Names are matched, not places surveyed; a project whose name does not say where it is will not be here.</li>
              <li>One row is one name in one agency across the years. A renamed or re-scoped project shows as a new row. A dash means no appropriation under that name that year.</li>
              <li>The DPWH office’s yearly figure is its whole budget, as the GAA lists it under that office, for every town it serves.</li>
              <li>The 2027 figures are the NEP and the House bill, not law. They are shown beside the enacted years, never added to them.</li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

function OfficeHistories() {
  const { districts } = usePortal();
  return (
    <Await state={districts} what="DPWH office budgets">
      {list => <OfficeHistoryList list={list} />}
    </Await>
  );
}

function OfficeHistoryList({ list }: { list: Envelope<DistrictCard>[] }) {
  const offices = useMemo(() => {
    const byId = new Map<string, DistrictOffice>();
    for (const env of list) for (const o of env.data.offices) if (!byId.has(o.id)) byId.set(o.id, o);
    return [...byId.values()];
  }, [list]);
  const officeDisclaimer = list.flatMap(e => e.disclaimers).filter(d => d.id === 'disclaimer-offices').slice(0, 1);
  if (!offices.length) return null;
  return (
    <section aria-labelledby="office-years-h">
      <h2 id="office-years-h" className={h2}>The DPWH office’s budget, year by year</h2>
      <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-gray-800">
        <span className="inline-flex items-center gap-2"><i className="h-3 w-3 bg-primary-700" aria-hidden /> Enacted (GAA), whole office</span>
        <span className="inline-flex items-center gap-2"><i className="h-3 w-3 bg-primary-300" aria-hidden /> 2027 NEP, whole office</span>
        <span className="inline-flex items-center gap-2"><i className="h-3 w-3 bg-accent-400" aria-hidden /> 2027 House bill, named projects only</span>
      </p>
      <div className="mt-4 grid gap-4">
        {offices.map(o => <OfficeHistory key={o.id} office={o} />)}
      </div>
      <Disclaimers items={officeDisclaimer} />
    </section>
  );
}

const BAR = { gaa: 'bg-primary-700', nep: 'bg-primary-300', house: 'bg-accent-400' } as const;

function OfficeHistory({ office }: { office: DistrictOffice }) {
  const years = office.years ?? [];
  const slot = (fy: number, stage: string) => years.find(y => y.fy === fy && y.stage === stage);
  const bars = [
    ...GAA_YEARS.map(fy => ({ key: `${fy}`, label: String(fy), kind: 'gaa' as const, v: slot(fy, 'gaa') })),
    { key: '2027-nep', label: '2027 NEP', kind: 'nep' as const, v: slot(2027, 'nep') },
    { key: '2027-house', label: '2027 House', kind: 'house' as const, v: slot(2027, 'hgab3') },
  ];
  const max = Math.max(1, ...bars.map(b => b.v?.php ?? 0));
  return (
    <article className="rounded-lg border border-gray-200 p-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-bold text-gray-900">DPWH {office.name}</h3>
        <span className={`${tag} border-gray-500 text-gray-900`}>{office.tier_text}</span>
      </header>
      <div className="mt-4 overflow-x-auto">
        <div
          className="flex min-w-[36rem] items-end gap-2"
          role="img"
          aria-label={`Budget by year: ${bars.map(b => `${b.label} ${b.v?.php != null ? phpFull(b.v.php) : 'not found'}`).join('; ')}`}
        >
          {bars.map(b => (
            <div key={b.key} className={`flex flex-1 flex-col items-center gap-1 ${b.kind === 'nep' ? 'ml-3' : ''}`} title={b.v?.php != null ? `${b.v.stage_label} ${b.key.slice(0, 4)}: ${phpFull(b.v.php)} (${b.v.scope})` : 'The office was not found that year'}>
              <span className="text-sm tabular-nums text-gray-800">{b.v?.php != null ? php(b.v.php).replace('₱', '') : '-'}</span>
              <span className="flex h-32 w-full items-end rounded-t bg-gray-100">
                <span className={`block w-full rounded-t ${BAR[b.kind]}`} style={{ height: `${((b.v?.php ?? 0) / max) * 100}%` }} />
              </span>
              <span className="text-center text-sm text-gray-700">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function Programs({ result }: { result: GaaResult }) {
  const { t } = useTranslation();
  const { config } = usePortal();
  const all = result.rows;
  const totals = useMemo(() => gaaYearTotals(all), [all]);
  const maxTotal = Math.max(1, ...totals.map(x => x.amount));

  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const dept = params.get('dept') ?? '';
  const yearParam = Number(params.get('year'));
  const year = (GAA_YEARS as readonly number[]).includes(yearParam) ? yearParam : null;
  const [shown, setShown] = useState(PAGE);
  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
    setShown(PAGE);
  };

  const departments = useMemo(() => {
    const n = new Map<string, { label: string; rows: number }>();
    for (const r of all) {
      const d = n.get(r.department_id) ?? { label: departmentShort(r.department), rows: 0 };
      d.rows++;
      n.set(r.department_id, d);
    }
    return [...n.entries()].sort((a, b) => b[1].rows - a[1].rows);
  }, [all]);

  const filtered = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const y = year ? String(year) : null;
    const rows = all.filter(r => {
      if (dept && r.department_id !== dept) return false;
      if (y && !hasYear(r, y)) return false;
      if (words.length) {
        const hay = `${r.name} ${r.department}`.toLowerCase();
        if (!words.every(w => hay.includes(w))) return false;
      }
      return true;
    });
    return y ? [...rows].sort((a, b) => (b.years[y]?.amount ?? 0) - (a.years[y]?.amount ?? 0)) : rows;
  }, [all, q, dept, year]);
  const narrowed = filtered.length !== all.length;

  return (
    <>
      <section className="mt-12" aria-labelledby="gaa-years-h">
        <h2 id="gaa-years-h" className={h2}>{t('budget.byYear', 'By year: the programs that name Naic')}</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7" role="group" aria-label="Pick a year">
          {totals.map(x => (
            <button
              key={x.year}
              type="button"
              aria-pressed={year === x.year}
              onClick={() => setParam('year', year === x.year ? '' : String(x.year))}
              className={`flex flex-col rounded-lg border p-3 text-left ${year === x.year ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500' : 'border-gray-200 hover:border-primary-300'}`}
            >
              <span className="font-semibold text-gray-900">{x.year}</span>
              <span className="mt-2 flex h-16 items-end bg-gray-100">
                <span className="block w-full bg-primary-700" style={{ height: `${(x.amount / maxTotal) * 100}%` }} />
              </span>
              <span className="mt-2 font-semibold tabular-nums text-gray-900">{php(x.amount)}</span>
              <span className="text-gray-700">{plural(x.programs, 'program')}</span>
            </button>
          ))}
        </div>
        <p className={fine}>Each year’s total covers only that year’s programs that name Naic. Years are shown side by side, not added up.</p>
      </section>

      <section className="mt-12" aria-labelledby="gaa-list-h">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="gaa-list-h" className={h2}>
            {narrowed ? `${count(filtered.length)} of ${plural(all.length, 'program')}` : `${t('budget.everyProgram', 'Every program and project')} (${count(all.length)})`}
          </h2>
          <button type="button" className={quietButton} onClick={() => downloadText(`${config.id}-gaa-${FIRST}-${LAST}.csv`, gaaCsv(filtered))}>
            {t('budget.csv', 'Download CSV')}{narrowed ? ` (${count(filtered.length)})` : ''}
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block sm:col-span-2">
            <span className="font-semibold text-gray-900">{t('budget.search', 'Search')}</span>
            <input type="search" value={q} placeholder="Road, school, barangay, agency…" onChange={e => setParam('q', e.target.value)} className={`${field} mt-1`} />
          </label>
          <label className="block">
            <span className="font-semibold text-gray-900">{t('budget.department', 'Department')}</span>
            <select value={dept} onChange={e => setParam('dept', e.target.value)} className={`${field} mt-1`}>
              <option value="">All departments</option>
              {departments.map(([id, d]) => <option key={id} value={id}>{d.label} ({count(d.rows)})</option>)}
            </select>
          </label>
          <label className="block">
            <span className="font-semibold text-gray-900">{t('budget.year', 'Year')}</span>
            <select value={year ?? ''} onChange={e => setParam('year', e.target.value)} className={`${field} mt-1`}>
              <option value="">All years</option>
              {totals.map(x => <option key={x.year} value={x.year}>{x.year} ({count(x.programs)})</option>)}
            </select>
          </label>
        </div>
        {narrowed && (
          <p className="mt-4 text-gray-800">
            {year ? <>{year}: {php(filtered.reduce((a, r) => a + (r.years[String(year)]?.amount ?? 0), 0))} across these {count(filtered.length)}</> : <>{count(filtered.length)} shown</>} ·{' '}
            <button type="button" className="font-semibold text-primary-600 underline underline-offset-4" onClick={() => { setParams(new URLSearchParams(), { replace: true }); setShown(PAGE); }}>
              {t('budget.clear', 'Clear filters')}
            </button>
          </p>
        )}

        {filtered.length > 0 && (
          <div className="mt-6" role="table" aria-label="Programs and projects, by year">
            <div className="hidden border-b-2 border-gray-300 pb-2 font-semibold text-gray-900 lg:grid lg:grid-cols-[minmax(0,1fr)_repeat(7,6rem)] lg:gap-2" role="row">
              <span role="columnheader">Program or project</span>
              {GAA_YEARS.map(y => <span role="columnheader" key={y} className="text-right">{y}</span>)}
            </div>
            {filtered.slice(0, shown).map(r => <ProgramRow key={r.key} r={r} year={year} />)}
          </div>
        )}
        {filtered.length === 0 && <p className="mt-6 text-gray-700">No program matches. Try fewer words or clear the filters.</p>}
        {filtered.length > shown && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-gray-700">Showing {count(shown)} of {count(filtered.length)}</span>
            <button type="button" className={button} onClick={() => setShown(n => n + PAGE)}>Show {count(Math.min(PAGE, filtered.length - shown))} more</button>
            <button type="button" className={quietButton} onClick={() => setShown(filtered.length)}>Show all</button>
          </div>
        )}
        {result.queries.some(x => x.truncated) && <p className={fine}>Some searches matched more programs than this page loads; see About the data.</p>}
      </section>
    </>
  );
}

function ProgramRow({ r, year }: { r: GaaRow; year: number | null }) {
  return (
    <div className="border-b border-gray-200 py-3 lg:grid lg:grid-cols-[minmax(0,1fr)_repeat(7,6rem)] lg:gap-2" role="row">
      <span role="cell" className="block min-w-0">
        <span className="font-semibold break-words text-gray-900">{r.name}</span>
        <span className="mt-1 flex flex-wrap gap-x-3 text-gray-700">
          <span className="font-semibold">{departmentShort(r.department)}</span>
          <External href={`https://budget.bettergov.ph/d/${r.department_id}`}>department</External>
        </span>
      </span>
      <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 lg:contents">
        {GAA_YEARS.map(y => {
          const has = hasYear(r, y);
          const amount = r.years[String(y)]?.amount ?? 0;
          return (
            <span
              role="cell"
              key={y}
              // On phones only the funded years show; the grid on wide screens keeps every column.
              className={`tabular-nums lg:block lg:text-right ${has ? 'text-gray-900' : 'hidden text-gray-700'} ${year === y ? 'font-bold' : ''}`}
              title={has ? phpFull(amount) : `No appropriation under this name in ${y}`}
            >
              <span className="text-gray-700 lg:hidden">{y}: </span>
              {has ? php(amount) : '-'}
            </span>
          );
        })}
      </span>
    </div>
  );
}
