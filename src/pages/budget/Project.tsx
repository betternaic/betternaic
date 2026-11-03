// Adapted from bettergovph/transparency-portal (MIT): src/pages/Project.tsx, restyled for BetterNaic.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import SEO from '../../components/SEO';
import PageHeader from '../../components/ui/PageHeader';
import type { Envelope, ProjectDetail, Version } from '../../budget/types';
import { DATASET_KEYS, type DatasetKey } from '../../budget/config';
import { Await, Disclaimers, External, ReasonTags, StatusChip, button, fine, h2 } from '../../budget/Bits';
import { phpDelta, phpFull } from '../../budget/format';
import { toError, usePortal, type Async } from '../../budget/context';
import { projectKey } from '../../budget/scope';

const VERSIONS: Version[] = ['nep', 'hgab2', 'hgab3', 'api'];
const FALLBACK_VERSION_LABELS: Record<Version, string> = {
  nep: 'NEP',
  hgab2: 'House bill, second reading',
  hgab3: 'House bill, third reading',
  api: 'DPWH transparency website listing',
};

export default function Project() {
  const { dataset = '', id = '' } = useParams();
  const { client } = usePortal();
  const valid = (DATASET_KEYS as readonly string[]).includes(dataset);
  const [state, setState] = useState<{ key: string; value: Async<Envelope<ProjectDetail>> } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = `${dataset}/${id}/${attempt}`;

  useEffect(() => {
    if (!valid) return;
    let live = true;
    client.project(dataset as DatasetKey, id).then(
      value => live && setState({ key, value: { status: 'ready', value } }),
      error => live && setState({ key, value: { status: 'error', error: toError(error) } })
    );
    return () => {
      live = false;
    };
  }, [client, dataset, id, key, valid]);

  const current: Async<Envelope<ProjectDetail>> = !valid
    ? { status: 'error', error: new Error(`There is no program called "${dataset}".`) }
    : state?.key === key
      ? state.value
      : { status: 'loading' };
  if (current.status === 'ready') return <ProjectView env={current.value} />;
  return (
    <div className="container mx-auto px-4 py-10">
      <Await state={current} what="the project" onRetry={() => setAttempt(n => n + 1)}>
        {() => null}
      </Await>
      <Link to="/budget" className="font-semibold text-primary-600 underline underline-offset-4">Back to every project</Link>
    </div>
  );
}

function ProjectView({ env }: { env: Envelope<ProjectDetail> }) {
  const { overview, scope, client } = usePortal();
  const p = env.data;
  const ov = overview.status === 'ready' ? overview.value.data : null;
  const program = ov?.datasets.find(d => d.key === p.dataset);
  const versionLabel = (v: Version) => ov?.record_versions.find(r => r.key === v)?.label ?? FALLBACK_VERSION_LABELS[v];
  const inScope = scope.status === 'ready' ? scope.value.projects.find(x => x.key === projectKey(p.dataset, p.id)) : undefined;
  const versions = VERSIONS.filter(v => v !== 'api' || p.dataset === 'dpwh');
  const path = `/budget/projects/${p.dataset}/${encodeURIComponent(p.id)}`;

  const details: [string, string | null][] = [
    ['Program', program?.label ?? p.dataset.toUpperCase()],
    ['Program line', p.program],
    ['Sub-line', p.pap],
    ['DPWH office', p.office],
    ['Region', p.region],
    ['How the two versions were matched', p.labels.match?.label ?? null],
    ['Between the House readings', p.labels.reading?.label ?? null],
    ['DPWH transparency website', p.labels.dpwh_site?.label ?? null],
    ['Length', p.length_m != null ? `${Math.round(p.length_m).toLocaleString('en-US')} m` : null],
  ];

  return (
    <>
      <SEO title={p.title} description={`${p.title}: its amount in the FY 2027 NEP and House bill, with the page of each source document.`} />
      <PageHeader
        title={p.title}
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Transparency', href: '/transparency' }, { label: '2027 budget', href: '/budget' }, { label: 'Project' }]}
      >
        <p className="mt-3 text-white">
          {program?.short ?? p.dataset.toUpperCase()} · FY 2027{p.office && <> · {p.office}</>}
        </p>
      </PageHeader>
      <div className="bg-white py-10">
        <div className="container mx-auto px-4">
          <div className="rounded-lg bg-gray-50 p-5">
            <StatusChip group={p.bridge_group} label={p.status_label} held={p.held} />
            {p.labels.status.help && <p className="mt-2 text-gray-700">{p.labels.status.help}</p>}
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <section aria-labelledby="amounts-h">
              <h2 id="amounts-h" className={h2}>Amount in each version, with the page it is on</h2>
              <table className="mt-4 w-full border-collapse">
                <tbody>
                  {versions.map(v => {
                    const amount = p[`${v}_php` as const];
                    const pdf = p.pdf_url[v];
                    const page = v === 'api' ? null : p[`${v}_page` as const];
                    return (
                      <tr key={v} className="border-b border-gray-200">
                        <th scope="row" className="py-3 pr-3 text-left font-semibold text-gray-900">{versionLabel(v)}</th>
                        <td className="py-3 pr-3 text-right tabular-nums">{amount == null ? <span className="text-gray-700">not listed</span> : phpFull(amount)}</td>
                        <td className="py-3 text-right">{pdf ? <External href={pdf}>{page ? `Page ${page}` : 'Open the document'}</External> : '-'}</td>
                      </tr>
                    );
                  })}
                  <tr className="border-b-2 border-gray-300">
                    <th scope="row" className="py-3 pr-3 text-left font-semibold text-gray-900">Change, House bill against the NEP</th>
                    <td className="py-3 pr-3 text-right font-semibold tabular-nums">{phpDelta(p.delta_php)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
              <p className={fine}>
                The NEP and the House bill are two versions of one budget, so the amounts are compared, never added. Open the page to
                check the figure against the document itself.
              </p>

              {p.labels.flags.length > 0 && (
                <>
                  <h3 className="mt-8 text-lg font-bold text-gray-900">Notes on this line</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-800">
                    {p.labels.flags.map(f => <li key={f.code}>{f.label}{f.help ? <span className="text-gray-700"> {f.help}</span> : null}</li>)}
                  </ul>
                </>
              )}
            </section>

            <aside className="space-y-6">
              <dl className="space-y-3">
                {details.filter(([, v]) => v).map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-semibold text-gray-700">{k}</dt>
                    <dd className="text-gray-900">{v}</dd>
                  </div>
                ))}
                {p.lat != null && p.lon != null && (
                  <div>
                    <dt className="font-semibold text-gray-700">Coordinates in the document</dt>
                    <dd>
                      <External href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=15/${p.lat}/${p.lon}`}>
                        {p.lat.toFixed(5)}, {p.lon.toFixed(5)} on the map
                      </External>
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="font-semibold text-gray-700">Why it is listed for Naic</dt>
                  <dd>{inScope ? <ReasonTags reasons={inScope.reasons} /> : 'It is not among the Naic projects; it is shown because you followed a link to it.'}</dd>
                </div>
              </dl>

              <div className="rounded-lg bg-primary-50 p-5">
                <p className="font-semibold text-gray-900">Seen this project on the ground?</p>
                <p className="mt-1 text-gray-800">Tell BetterNaic what you saw: finished, stalled, or not there at all.</p>
                <Link to={`/report?page=${encodeURIComponent(path)}`} className={`${button} mt-3`}>Report on this project</Link>
              </div>

              <p className="space-y-1">
                <External href={p.url}>This project on budget.bettergov.ph</External>
                <br />
                <External href={client.href(p.api_url)}>The API record (JSON)</External>
              </p>
            </aside>
          </div>

          <Disclaimers items={env.disclaimers} />
        </div>
      </div>
    </>
  );
}
