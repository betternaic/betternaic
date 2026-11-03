// Adapted from bettergovph/transparency-portal (MIT): src/pages/About.tsx, restyled for BetterNaic.
import { useTranslation } from 'react-i18next';
import SEO from '../../components/SEO';
import type { Disclaimer, Overview } from '../../budget/types';
import { NATIONAL_URL, SOURCE_CODE_URL } from '../../budget/config';
import { Await, BudgetHeader, Disclaimers, External, Loading, fine, h2 } from '../../budget/Bits';
import { count, date, plural } from '../../budget/format';
import { usePortal } from '../../budget/context';
import type { ScopeResult } from '../../budget/scope';
import { departmentShort } from '../../budget/gaa';
import { useGaa } from '../../budget/useGaa';

/** The API's `rules`, in words for readers rather than developers. */
const READING_RULES = [
  'These are amounts in the budget documents, not money spent.',
  'Amounts are pesos, as each document publishes them. A dash means that document has no such line; it does not mean zero.',
  'The NEP and the House bill are two versions of one budget. Compare them; never add them together.',
  '“In the House bill only” and “In the NEP only” are candidates: leads to check, not confirmed insertions or deletions. Some are lines that were renamed or re-scoped.',
  '“Unconfirmed match” marks a pairing made on a similar name rather than an exact one.',
  'A DPWH office that serves several districts (Tier B) is shown whole; its money is never split between them. Money under the DPWH Central Office or a regional office is on no district card.',
];

const th = 'py-2 pr-3 text-left font-semibold text-gray-900';
const td = 'py-2 pr-3 align-top';

export default function About() {
  const { t } = useTranslation();
  const { scope, overview } = usePortal();
  return (
    <>
      <SEO title="About the budget data" description="Every question the BetterNaic budget pages ask the BetterGov.ph Budget API, with counts and links to check each one." />
      <BudgetHeader
        title={t('budget.aboutTitle', 'Where these figures come from')}
        crumb={t('budget.tabAbout', 'About the data')}
        subtitle={t('budget.aboutSubtitle', 'Every figure comes from the BetterGov.ph Budget API, which sets the House bill against the NEP project by project. These pages ask the API the questions below and show every line it returns.')}
      />
      <div className="bg-white py-10">
        <div className="container mx-auto px-4">
          <Await state={scope} what="the questions">
            {s => (
              <Await state={overview} what="the data notes">
                {ov => <AboutView scope={s} overview={ov.data} />}
              </Await>
            )}
          </Await>
        </div>
      </div>
    </>
  );
}

function AboutView({ scope, overview }: { scope: ScopeResult; overview: Overview }) {
  const { districts } = usePortal();
  const label = (k: string) => overview.datasets.find(d => d.key === k)?.short ?? k.toUpperCase();
  const disclaimers = new Map<string, Disclaimer>();
  for (const d of scope.disclaimers) disclaimers.set(d.id, d);
  if (districts.status === 'ready') for (const env of districts.value) for (const d of env.disclaimers) disclaimers.set(d.id, d);
  const meta = scope.meta;

  return (
    <>
      <section aria-labelledby="q-h">
        <h2 id="q-h" className={h2}>The questions for the 2027 budget</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse">
            <thead className="border-b-2 border-gray-300">
              <tr>
                <th className={th}>Lines that…</th>
                <th className={th}>Program</th>
                <th className={`${th} text-right`}>Found</th>
                <th className={`${th} text-right`}>Kept</th>
                <th className={th}>Check it</th>
              </tr>
            </thead>
            <tbody>
              {scope.queries.map((q, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className={td}>
                    {q.kind === 'office' ? <>are listed under <strong>{q.label}</strong></> : <>have a title naming <strong>{String(q.params.q)}</strong></>}
                    {q.region && <span className="text-gray-700"> · kept to region {q.region}, or giving no region</span>}
                  </td>
                  <td className={td}>{label(q.dataset)}</td>
                  <td className={`${td} text-right tabular-nums`}>{count(q.total)}</td>
                  <td className={`${td} text-right tabular-nums`}>{count(q.kept)}</td>
                  <td className={td}><External href={q.api}>API</External></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={fine}>
          A line found by more than one question is shown once, with every reason. Searching by name finds titles that spell Naic
          out; a project whose title does not name it is found only through its DPWH office, whose list also covers the other towns
          of Cavite’s 8th District.
        </p>
      </section>

      <GaaQuestions />

      <section className="mt-12" aria-labelledby="x-h">
        <h2 id="x-h" className={h2}>2027 lines removed by hand: {count(scope.excluded.length)}</h2>
        {scope.excluded.length === 0 ? (
          <p className="mt-2 text-gray-800">None. Every line the questions return is shown.</p>
        ) : (
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {scope.excluded.map(({ exclusion, project }) => (
              <li key={exclusion.key}>
                {project ? <External href={project.url}>{project.title}</External> : <code>{exclusion.key}</code>}: {exclusion.reason}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className={h2}>How to read the figures</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-800">
            {READING_RULES.map(r => <li key={r}>{r}</li>)}
          </ul>
        </div>
        <div>
          <h2 className={h2}>Words used here</h2>
          <dl className="mt-3 space-y-3">
            {Object.entries(overview.terms).map(([k, term]) => (
              <div key={k}>
                <dt className="font-semibold text-gray-900">{term.term}</dt>
                <dd className="text-gray-800">{term.meaning}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mt-12" aria-labelledby="d-h">
        <h2 id="d-h" className={h2}>The documents</h2>
        <ul className="mt-3 space-y-2">
          {overview.documents.map(d => (
            <li key={d.key}>
              <External href={d.pdf_url}>{d.title}</External>
              {d.source_url && <> · <External href={d.source_url}>where it was published</External></>}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="n-h">
        <h2 id="n-h" className={h2}>Notices</h2>
        <Disclaimers items={[...disclaimers.values()]} />
        <p className={fine}>
          Data version: comparison <External href={`${meta.source_repo}/tree/${meta.source_commit}`}>{meta.source_commit.slice(0, 7)}</External>, built{' '}
          {date(meta.built_at)}. Every project nationwide: <External href={NATIONAL_URL}>budget.bettergov.ph</External>.
        </p>
      </section>

      <section className="mt-12 rounded-lg border border-gray-200 p-6" aria-labelledby="b-h">
        <h2 id="b-h" className={h2}>Run pages like these for your town</h2>
        <p className="mt-2 text-gray-800">
          These pages are adapted from the BetterGov.ph Transparency Portal, open source under the MIT licence. Fork it, pick your
          province, city, municipality or DPWH district office, and deploy it anywhere: it needs no database.{' '}
          <External href={SOURCE_CODE_URL}>Source code</External>
        </p>
      </section>
    </>
  );
}

/** The 2020–2026 searches, published like the 2027 ones. */
function GaaQuestions() {
  const { state } = useGaa();
  return (
    <section className="mt-12" aria-labelledby="g-h">
      <h2 id="g-h" className={h2}>The questions for the 2020–2026 budgets</h2>
      {state.status === 'loading' ? (
        <Loading>Loading the searches…</Loading>
      ) : state.status === 'error' ? (
        <p className="mt-2 text-error-600">Could not load the searches: {state.error.message}</p>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse">
              <thead className="border-b-2 border-gray-300">
                <tr>
                  <th className={th}>Programs whose name has…</th>
                  <th className={th}>Department</th>
                  <th className={`${th} text-right`}>Found</th>
                  <th className={`${th} text-right`}>Loaded</th>
                  <th className={th}>Check it</th>
                </tr>
              </thead>
              <tbody>
                {state.value.queries.map(q => (
                  <tr key={q.place + q.department_id} className="border-b border-gray-200">
                    <td className={td}><strong>{q.q}</strong></td>
                    <td className={td}>{departmentShort(q.department)}</td>
                    <td className={`${td} text-right tabular-nums`}>{count(q.matched)}</td>
                    <td className={`${td} text-right tabular-nums`}>{count(q.fetched)}</td>
                    <td className={td}><External href={q.api}>API</External></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={fine}>
            Every one of the {count(state.value.searched)} departments in the GAA was searched; those not listed matched nothing.
            {state.value.excluded.length > 0 ? ` ${plural(state.value.excluded.length, 'program')} removed by hand:` : ' None removed by hand.'}
          </p>
          {state.value.excluded.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {state.value.excluded.map(({ exclusion, row }) => (
                <li key={exclusion.key}>{row ? row.name : <code>{exclusion.key}</code>}: {exclusion.reason}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
