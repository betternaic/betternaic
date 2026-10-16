import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import PageHeader, { SourceNote } from '../components/ui/PageHeader';
import { latestPopulation, naic } from '../data/yamlLoader';
import { nf } from '../lib/config';

function PopulationChart() {
  const data = naic.population;
  const max = Math.max(...data.map(d => d.count));
  return (
    <figure>
      <div className="flex h-64 items-end gap-1 border-b border-l border-gray-300 px-1 pt-6 sm:gap-3 sm:px-2" role="img" aria-label="Population of Naic by census year">
        {data.map(d => (
          <div key={d.year} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-sm font-semibold tabular-nums text-gray-800">{(d.count / 1000).toFixed(0)}k</span>
            <div className="w-full max-w-16 rounded-t bg-primary-500" style={{ height: `${(d.count / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="flex gap-1 px-1 pt-2 sm:gap-3 sm:px-2">
        {data.map(d => (
          <span key={d.year} className="min-w-0 flex-1 text-center text-sm text-gray-800">{d.year}</span>
        ))}
      </div>
      <figcaption className="sr-only">
        {data.map(d => `${d.year}: ${nf.format(d.count)}`).join(', ')}
      </figcaption>
    </figure>
  );
}

export default function Statistics() {
  const { t } = useTranslation();
  const p = naic.profile;
  const density = Math.round(latestPopulation.count / p.landAreaKm2);
  const pop2020 = naic.population.find(d => d.year === 2020)!;
  const growth = ((latestPopulation.count - pop2020.count) / pop2020.count) * 100;
  const largest = [...naic.barangays].sort((a, b) => b.pop2020 - a.pop2020).slice(0, 5);

  const rows: [string, string][] = [
    ['Official name', `${p.officialName} (${p.localName})`],
    ['Province / Region', `${p.province}, ${p.region}`],
    ['Congressional district', p.district],
    ['Income class', p.incomeClass],
    ['Barangays', String(p.barangays)],
    ['Land area', `${p.landAreaKm2} km²`],
    [`Population (${latestPopulation.year})`, nf.format(latestPopulation.count)],
    ['Population density', `${nf.format(density)} per km²`],
    ['ZIP code', p.zipCode],
    ['PSGC code', p.psgc],
    ['Coordinates', `${p.coordinates.lat}° N, ${p.coordinates.lng}° E`],
    ['Coast', p.coast],
    ['Neighbors', p.neighbors.map(n => `${n.name} (${n.direction.toLowerCase()})`).join(', ')],
    ['Town fiesta', p.fiesta],
  ];

  return (
    <>
      <SEO title="Statistics" description="Population, land area, income class and other figures for Naic, Cavite, with sources." />
      <PageHeader
        title={t('stats.title', 'Naic in numbers')}
        subtitle={t('stats.subtitle', 'Key figures about the municipality, each with its source.')}
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Government', href: '/government' }, { label: 'Statistics' }]}
      />
      <section className="bg-white py-10">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-2">
          <div className="min-w-0">
            <h2 className="mb-2 text-xl font-bold text-gray-900">{t('stats.growth', 'Population growth')}</h2>
            <p className="mb-6 text-gray-700">
              Naic grew from {nf.format(pop2020.count)} people in 2020 to {nf.format(latestPopulation.count)} in {latestPopulation.year}, up {growth.toFixed(0)}% in four years, as new subdivisions filled up in barangays such as Halang, Calubcob, Sabang and Timalan Balsahan.
            </p>
            <PopulationChart />
            <SourceNote {...naic.populationSource} />

            <h2 className="mb-3 mt-10 text-xl font-bold text-gray-900">{t('stats.largest', 'Largest barangays (2020)')}</h2>
            <ol className="space-y-3">
              {largest.map((b, i) => (
                <li key={b.name}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-gray-900">
                      {i + 1}. {b.name}
                    </span>
                    <span className="tabular-nums text-gray-800">{nf.format(b.pop2020)}</span>
                  </div>
                  <div aria-hidden className="mt-1 h-3 rounded bg-accent-400" style={{ width: `${(b.pop2020 / largest[0].pop2020) * 100}%` }} />
                </li>
              ))}
            </ol>
            <SourceNote {...naic.barangaysSource} />
          </div>

          <div>
            <h2 className="mb-4 text-xl font-bold text-gray-900">{t('stats.profile', 'Municipal profile')}</h2>
            <dl className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
              {rows.map(([k, v]) => (
                <div key={k} className="grid grid-cols-3 gap-4 px-4 py-3">
                  <dt className="font-medium text-gray-600">{k}</dt>
                  <dd className="col-span-2 text-gray-900">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-gray-700">
              Sources: PSA, PhilAtlas, and the{' '}
              <a href="https://en.wikipedia.org/wiki/Naic" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">
                Naic article on Wikipedia
              </a>
              . Distances: {p.distances.map(d => `${d.km} km to ${d.to}`).join('; ')}.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
