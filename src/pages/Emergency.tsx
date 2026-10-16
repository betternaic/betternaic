import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Building2, Phone, ShieldAlert } from 'lucide-react';
import SEO from '../components/SEO';
import PageHeader from '../components/ui/PageHeader';
import { hotlines } from '../data/yamlLoader';

export default function Emergency() {
  const { t } = useTranslation();
  const prep = hotlines.preparedness;
  const phases: [string, string, string[]][] = [
    ['before', 'Before', prep.before],
    ['during', 'During', prep.during],
    ['after', 'After', prep.after],
  ];
  return (
    <>
      <SEO title="Emergency hotlines" description="Emergency numbers and flood and typhoon preparedness for Naic, Cavite. In an emergency, call 911." />
      <PageHeader
        title={t('emergency.title', 'Emergency hotlines')}
        subtitle={t('emergency.subtitle', 'In any emergency, call 911. It connects you to police, fire and medical help anywhere in the Philippines.')}
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Emergency' }]}
      />
      <section className="bg-white py-10">
        <div className="container mx-auto px-4">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {hotlines.national.map(h => (
              <li key={h.tel}>
                <a href={`tel:${h.tel}`} className="flex h-full flex-col rounded-lg border-2 border-error-200 p-5 hover:border-error-500 hover:bg-error-50">
                  <span className="flex items-center gap-2 text-3xl font-bold text-error-700">
                    <Phone className="h-6 w-6" aria-hidden /> {h.number}
                  </span>
                  <span className="mt-2 font-semibold text-gray-900">{h.name}</span>
                  <span className="mt-1 text-gray-800">{h.note}</span>
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-lg border border-accent-300 bg-accent-50 p-5">
            <h2 className="flex items-center gap-2 font-bold text-gray-900">
              <ShieldAlert className="h-5 w-5 text-accent-700" aria-hidden />
              {t('emergency.localTitle', 'Where are the Naic numbers?')}
            </h2>
            <p className="mt-2 text-gray-800">
              {t(
                'emergency.localText',
                'We only publish local numbers for the MDRRMO, police, fire station and Municipal Hall once they are confirmed with the office itself. A wrong emergency number is worse than none. Until then, use 911.'
              )}{' '}
              <Link to="/report?category=correction&page=/emergency" className="font-semibold text-primary-600 underline">
                {t('emergency.confirm', 'Know an official number? Send it with its source.')}
              </Link>
            </p>
          </div>

          <h2 className="mb-4 mt-10 flex items-center gap-2 text-xl font-bold text-gray-900">
            <Building2 className="h-6 w-6 text-primary-500" aria-hidden />
            {t('emergency.facilities', 'Health and safety facilities in Naic')}
          </h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {hotlines.facilities.map(f => (
              <li key={f.name} className="rounded-lg border border-gray-200 p-5">
                <p className="text-gray-800">{f.kind}</p>
                <p className="mt-1 font-semibold text-gray-900">{f.name}</p>
                <p className="mt-1 text-gray-800">{f.address}</p>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-gray-700">
            {t('emergency.facilitiesNote', 'Addresses from public directories. Confirm before going, and call 911 in an emergency.')}
          </p>

          <h2 className="mb-4 mt-10 text-xl font-bold text-gray-900">{t('emergency.prepTitle', 'Floods and typhoons: what to do')}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {phases.map(([key, label, items]) => (
              <div key={key} className="rounded-lg bg-gray-50 p-5">
                <h3 className="font-semibold text-gray-900">{t(`emergency.${key}`, label)}</h3>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-gray-800">
                  {items.map(i => <li key={i}>{i}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-lg border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900">{t('emergency.goBag', 'What to pack in a go-bag')}</h3>
            <ul className="mt-3 grid gap-2 text-gray-800 sm:grid-cols-2">
              {prep.goBag.map(i => <li key={i} className="flex gap-2"><span aria-hidden>☐</span>{i}</li>)}
            </ul>
          </div>
          <p className="mt-6 text-gray-700">
            <Link to="/services/disaster-preparedness/prepare-for-floods-and-typhoons" className="font-semibold text-primary-600 underline">
              {t('emergency.fullGuide', 'Full preparedness guide')}
            </Link>
            {' · '}
            <a href="https://hazardhunter.georisk.gov.ph" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-600 underline">
              HazardHunterPH
            </a>
            {' · '}
            <a href="https://www.pagasa.dost.gov.ph" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-600 underline">
              PAGASA
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
