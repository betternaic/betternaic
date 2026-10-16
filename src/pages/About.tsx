import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import PageHeader, { SourceNote } from '../components/ui/PageHeader';
import { PhotoCredit } from './Tourism';
import { naic, places } from '../data/yamlLoader';

export default function About() {
  const { t } = useTranslation();
  const casa = places.places.find(p => p.slug === 'casa-hacienda-de-naic');
  return (
    <>
      <SEO
        title="History of Naic"
        description="A short history of Naic, Cavite: from a Jesuit visita of Maragondon to the site of the 1897 Naic Military Agreement and a town of nearly 237,000 people."
        image="/images/naic/casa-hacienda.webp"
      />
      <PageHeader
        title={t('history.title', 'A short history of Naic')}
        subtitle={t('history.subtitle', 'From a riverside visita of Maragondon to a town of nearly 237,000 people.')}
        crumbs={[{ label: 'Home', href: '/' }, { label: 'History' }]}
      />
      <section className="bg-white py-10">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="mb-2 text-xl font-bold text-gray-900">{t('history.name', 'Where the name comes from')}</h2>
            <p className="text-gray-700">
              There are several accounts. One traces "Naic" to an old word meaning "town near one another" or "the other side", pointing to its mother town Maragondon across the river. Another says it means suburb or countryside. A popular story reads it as an acronym of the patroness, <em>Nuestra Adorada Inmaculada Concepción</em>, whose feast on December 8 is the town fiesta. During the Revolution the name was written Naik.
            </p>

            <h2 className="mb-4 mt-8 text-xl font-bold text-gray-900">{t('history.timeline', 'Timeline')}</h2>
            <ol className="relative space-y-6 border-l-2 border-primary-100 pl-6">
              {naic.history.events.map(e => (
                <li key={e.year + e.text.slice(0, 12)} className="relative">
                  <span aria-hidden className="absolute -left-[33px] top-1 h-4 w-4 rounded-full border-2 border-white bg-primary-500" />
                  <p className="text-sm font-bold text-primary-600">{e.year}</p>
                  <p className="mt-1 text-gray-800">{e.text}</p>
                </li>
              ))}
            </ol>
            <SourceNote {...naic.history.source} />
            <p className="mt-2 text-gray-700">
              Some early dates come from local histories that Wikipedia marks as needing citations. If you can point us to a primary source, please send it.
            </p>
          </div>

          <aside className="space-y-6">
            {casa?.photo && casa.credit && (
              <figure className="overflow-hidden rounded-lg border border-gray-200">
                <img src={casa.photo} alt="Casa Hacienda de Naic, now Naic Elementary School" loading="lazy" className="w-full" />
                <figcaption className="p-3 text-gray-800">
                  Casa Hacienda de Naic, where the Naic Military Agreement was signed in April 1897.
                  <div className="mt-1"><PhotoCredit credit={casa.credit} /></div>
                </figcaption>
              </figure>
            )}
            <figure className="overflow-hidden rounded-lg border border-gray-200">
              <img src={places.markerPhoto.src} alt={places.markerPhoto.alt} loading="lazy" className="w-full" />
              <figcaption className="p-3 text-gray-800">
                The marker at Naic Elementary School tells the story in Filipino.
                <div className="mt-1"><PhotoCredit credit={places.markerPhoto.credit} /></div>
              </figcaption>
            </figure>
          </aside>
        </div>
      </section>
    </>
  );
}
