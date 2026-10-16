import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Bus, MapPin } from 'lucide-react';
import SEO from '../components/SEO';
import PageHeader from '../components/ui/PageHeader';
import { places, type Credit } from '../data/yamlLoader';

export function PhotoCredit({ credit }: { credit: Credit }) {
  return (
    <a href={credit.url} target="_blank" rel="noopener noreferrer" className="text-gray-800 underline underline-offset-2 hover:text-gray-900">
      Photo: {credit.author}, {credit.license}, via Wikimedia Commons
    </a>
  );
}

export default function Tourism() {
  const { t } = useTranslation();
  return (
    <>
      <SEO
        title="Places to visit"
        description="Heritage sites and landmarks of Naic, Cavite: Casa Hacienda de Naic, the Naic Church, the town plaza, and the Labac coast."
        image="/images/naic/casa-hacienda.webp"
      />
      <PageHeader
        title={t('tourism.title', 'Places to visit in Naic')}
        subtitle={t('tourism.subtitle', 'A coastal town on Manila Bay where a turning point of the Philippine Revolution happened in 1897.')}
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Places to visit' }]}
      />
      <section className="bg-white py-10">
        <div className="container mx-auto px-4">
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {places.places.map(p => (
              <li key={p.slug} id={p.slug} className="flex flex-col overflow-hidden rounded-lg border border-gray-300">
                {p.photo ? (
                  <img src={p.photo} alt={p.name} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[4/3] w-full items-center justify-center bg-primary-700 p-6 text-center text-white">
                    <span className="text-lg font-semibold">{p.name}</span>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-gray-800">{p.kind}</p>
                  <h2 className="mt-1 text-lg font-semibold text-gray-900">{p.name}</h2>
                  <p className="mt-1 flex items-center gap-1 text-gray-700">
                    <MapPin className="h-4 w-4" aria-hidden /> {p.location}
                  </p>
                  <p className="mt-3 flex-1 text-gray-800">{p.description}</p>
                  {p.credit && <div className="mt-3"><PhotoCredit credit={p.credit} /></div>}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-12 rounded-lg bg-gray-50 p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <Bus className="h-6 w-6 text-primary-500" aria-hidden />
              {t('tourism.getting', 'Getting to Naic')}
            </h2>
            <dl className="mt-4 grid gap-4 md:grid-cols-3">
              {places.gettingThere.map(g => (
                <div key={g.mode}>
                  <dt className="font-semibold text-gray-900">{g.mode}</dt>
                  <dd className="mt-1 text-gray-800">{g.text}</dd>
                </div>
              ))}
            </dl>
          </div>

          <p className="mt-6 text-gray-700">
            {t('tourism.history', 'Want the story behind these places?')}{' '}
            <Link to="/about" className="font-semibold text-primary-600 underline">
              {t('tourism.historyLink', 'Read a short history of Naic')}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
