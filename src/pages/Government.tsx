import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Building, ChartColumn, FileSearch, MapPinned, Users } from 'lucide-react';
import SEO from '../components/SEO';
import PageHeader, { SourceNote } from '../components/ui/PageHeader';
import { naic, offices, type Official } from '../data/yamlLoader';

const crumbsFor = (label: string) => [
  { label: 'Home', href: '/' },
  { label: 'Government', href: '/government' },
  { label },
];

export function GovernmentHub() {
  const { t } = useTranslation();
  const cards = [
    { href: '/government/officials', icon: Users, title: t('nav.officials', 'Officials'), text: 'The Mayor, Vice Mayor, and the Sangguniang Bayan for 2025–2028.' },
    { href: '/government/offices', icon: Building, title: t('nav.offices', 'Offices'), text: 'Which municipal office handles what, with links to the related guides.' },
    { href: '/government/barangays', icon: MapPinned, title: t('nav.barangays', 'Barangays'), text: 'All 30 barangays of Naic with their census population.' },
    { href: '/statistics', icon: ChartColumn, title: t('nav.statistics', 'Statistics'), text: 'Population growth, land area, and other figures with sources.' },
    { href: '/transparency', icon: FileSearch, title: t('nav.transparency', 'Transparency'), text: 'Where to find budgets, audit reports, procurement, and how to file an FOI request.' },
  ];
  return (
    <>
      <SEO title="Government" description="Officials, offices, barangays, statistics and transparency information for the Municipality of Naic, Cavite." />
      <PageHeader
        title={t('gov.title', 'Government of Naic')}
        subtitle={t('gov.subtitle', 'Naic is a first-class municipality in Cavite, governed by an elected Mayor, Vice Mayor and Sangguniang Bayan.')}
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Government' }]}
      />
      <section className="bg-white py-10">
        <div className="container mx-auto grid gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(c => (
            <Link key={c.href} to={c.href} className="flex gap-4 rounded-lg border border-gray-300 p-5 hover:shadow-md">
              <c.icon className="h-8 w-8 shrink-0 text-primary-500" aria-hidden />
              <span>
                <span className="block text-lg font-semibold text-gray-900">{c.title}</span>
                <span className="mt-1 block text-gray-700">{c.text}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

// First and last name initials, skipping middle initials and suffixes.
function initials(name: string) {
  const words = name
    .replace(/\s+(Jr|Sr|II|III)\.?$/, '')
    .split(/\s+/)
    .filter(w => !/^[A-Z]\.$/.test(w));
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : '')).toUpperCase();
}

function OfficialCard({ o, role }: { o: Official; role?: string }) {
  return (
    <li className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
      <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-50 font-bold text-primary-600">
        {initials(o.name)}
      </span>
      <span>
        <span className="block text-gray-800">{o.position ?? role}</span>
        <span className="block font-semibold text-gray-900">{o.name}</span>
        {(o.party || o.note) && (
          <span className="block text-gray-700">{[o.party, o.note].filter(Boolean).join(' · ')}</span>
        )}
      </span>
    </li>
  );
}

export function Officials() {
  const { t } = useTranslation();
  const o = naic.officials;
  return (
    <>
      <SEO title="Officials" description={`Elected officials of the Municipality of Naic, Cavite for ${o.term}: Mayor, Vice Mayor, and Sangguniang Bayan members.`} />
      <PageHeader
        title={t('officials.title', 'Elected officials')}
        subtitle={t('officials.subtitle', `Elected on May 12, 2025, serving until June 30, 2028.`)}
        crumbs={crumbsFor('Officials')}
      />
      <section className="bg-white py-10">
        <div className="container mx-auto space-y-10 px-4">
          <div>
            <h2 className="mb-4 text-xl font-bold text-gray-900">{t('officials.executive', 'Executive')}</h2>
            <ul className="grid gap-4 md:grid-cols-2">
              {o.executive.map(x => <OfficialCard key={x.name} o={x} />)}
            </ul>
          </div>
          <div>
            <h2 className="mb-1 text-xl font-bold text-gray-900">{t('officials.sb', 'Sangguniang Bayan (municipal council)')}</h2>
            <p className="mb-4 text-gray-700">
              {t('officials.sbText', 'Eight councilors elected at large, in no particular order, plus two ex-officio members. The Vice Mayor presides.')}
            </p>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {o.councilors.map(x => <OfficialCard key={x.name} o={x} role="Councilor" />)}
              {o.exOfficio.map(x => <OfficialCard key={x.name} o={x} />)}
            </ul>
          </div>
          <div>
            <h2 className="mb-4 text-xl font-bold text-gray-900">{t('officials.congress', 'In Congress')}</h2>
            <ul className="grid gap-4 md:grid-cols-2">
              <OfficialCard o={o.congress} />
            </ul>
          </div>
          <SourceNote {...o.source} />
          <p className="text-gray-700">
            {t('officials.contact', 'To reach an official, visit the Office of the Mayor or the Sangguniang Bayan at the Naic Municipal Hall, Poblacion.')}
          </p>
        </div>
      </section>
    </>
  );
}

export function Offices() {
  const { t } = useTranslation();
  return (
    <>
      <SEO title="Offices" description="Municipal offices of Naic, Cavite and the transactions each one handles." />
      <PageHeader
        title={t('offices.title', 'Municipal offices')}
        subtitle={t('offices.subtitle', 'Most offices are at the Naic Municipal Hall in Poblacion, open on weekdays during government office hours. Confirm schedules before you go.')}
        crumbs={crumbsFor('Offices')}
      />
      <section className="bg-white py-10">
        <div className="container mx-auto px-4">
          <ul className="grid gap-4 md:grid-cols-2">
            {offices.map(office => (
              <li key={office.name} className="rounded-lg border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold text-gray-900">{office.name}</h2>
                  <span className="shrink-0 rounded bg-primary-50 px-2 py-0.5 text-sm font-semibold text-primary-700">{office.short}</span>
                </div>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-gray-800">
                  {office.handles.map(h => <li key={h}>{h}</li>)}
                </ul>
                {office.services.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {office.services.map(s => (
                      <Link key={s} to={s} className="text-sm font-semibold text-primary-600 underline hover:text-primary-700">
                        {s.startsWith('/services/') ? t('offices.guides', 'Related guides') : t('offices.more', 'More')}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-gray-700">
            {t('offices.note', 'Office heads and direct phone numbers are not listed until they are confirmed with the municipality.')}{' '}
            <Link to="/report?category=correction&page=/government/offices" className="font-semibold text-primary-600 underline">
              {t('offices.help', 'Help us confirm them')}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}

export function Barangays() {
  const { t } = useTranslation();
  const list = [...naic.barangays].sort((a, b) => a.name.localeCompare(b.name));
  const total2020 = list.reduce((s, b) => s + b.pop2020, 0);
  return (
    <>
      <SEO title="Barangays" description="The 30 barangays of Naic, Cavite with their 2015 and 2020 census population." />
      <PageHeader
        title={t('barangays.title', 'The 30 barangays of Naic')}
        subtitle={t('barangays.subtitle', 'Population from the PSA 2015 and 2020 censuses. Per-barangay figures from the 2024 census are not yet in a source we could verify.')}
        crumbs={crumbsFor('Barangays')}
      />
      <section className="bg-white py-10">
        <div className="container mx-auto px-4">
          <div className="overflow-x-auto rounded-lg border border-gray-300" tabIndex={0} role="region" aria-label="Barangay population table">
            <table className="w-full min-w-[560px] text-left text-base">
              <caption className="sr-only">Barangay population, 2015 and 2020</caption>
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th scope="col" className="px-4 py-3">Barangay</th>
                  <th scope="col" className="px-4 py-3 text-right">2015</th>
                  <th scope="col" className="px-4 py-3 text-right">2020</th>
                  <th scope="col" className="px-4 py-3 text-right">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map(b => {
                  const change = ((b.pop2020 - b.pop2015) / b.pop2015) * 100;
                  return (
                    <tr key={b.name} className="hover:bg-gray-50">
                      <th scope="row" className="px-4 py-2.5 font-medium text-gray-900">
                        {b.name}
                        {b.poblacion && <span className="ml-2 rounded bg-accent-100 px-1.5 py-0.5 text-sm font-semibold text-accent-800">Poblacion</span>}
                        {b.alias && <span className="block text-sm font-normal text-gray-700">also called {b.alias}</span>}
                      </th>
                      <td className="px-4 py-2.5 text-right tabular-nums">{b.pop2015.toLocaleString('en-PH')}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{b.pop2020.toLocaleString('en-PH')}</td>
                      <td className={`px-4 py-2.5 text-right tabular-nums ${change >= 0 ? 'text-success-700' : 'text-error-700'}`}>
                        {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <th scope="row" className="px-4 py-3">Total</th>
                  <td className="px-4 py-3 text-right tabular-nums">{list.reduce((s, b) => s + b.pop2015, 0).toLocaleString('en-PH')}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{total2020.toLocaleString('en-PH')}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          <SourceNote {...naic.barangaysSource} />
          <p className="mt-2 text-gray-700">
            {t('barangays.flood', 'Some coastal and low-lying barangays flooded badly in 2018.')}{' '}
            <Link to="/services/disaster-preparedness/know-the-flood-affected-barangays" className="font-semibold text-primary-600 underline">
              {t('barangays.floodLink', 'See the list')}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
