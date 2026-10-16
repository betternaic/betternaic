import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Phone, Search } from 'lucide-react';
import SEO from '../components/SEO';
import ServicesSection from '../components/home/ServicesSection';
import Announcements from '../components/home/Announcements';
import { hotlines, latestPopulation, naic, places } from '../data/yamlLoader';
import { nf } from '../lib/config';

const POPULAR = [
  { label: 'PSA birth certificate', href: '/services/civil-registration/get-a-copy-of-a-birth-marriage-or-death-record' },
  { label: 'Business permit renewal', href: '/services/business/renew-your-business-permit' },
  { label: 'Senior citizen ID', href: '/services/social-welfare/get-a-senior-citizen-id' },
  { label: 'Barangay clearance', href: '/services/clearances-and-ids/get-a-barangay-clearance' },
  { label: 'Free documents for first-time jobseekers', href: '/services/jobs-and-livelihood/get-first-time-jobseeker-documents-for-free' },
];

const link = 'font-semibold text-primary-600 underline underline-offset-4 hover:text-primary-800';

function Hero() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const photo = places.heroPhoto;

  return (
    <section className="bg-primary-700 text-white">
      <div className="container mx-auto grid gap-10 px-4 py-10 md:py-14 lg:grid-cols-5 lg:items-center">
        <div className="min-w-0 lg:col-span-3">
          <h1 className="text-3xl font-bold leading-tight md:text-5xl">
            {t('hero.title', 'Services and information for Naic, Cavite')}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white md:text-xl">
            {t('hero.subtitle', 'What to bring, where to go, and who to call. In plain language, with sources.')}
          </p>

          <form
            role="search"
            className="mt-8 max-w-xl"
            onSubmit={e => {
              e.preventDefault();
              navigate(`/search?q=${encodeURIComponent(q.trim())}`);
            }}
          >
            <label htmlFor="hero-search" className="mb-2 block text-lg font-semibold">
              {t('hero.searchLabel', 'Search for a service')}
            </label>
            {/* Stacks on narrow screens so large text never pushes the page sideways. */}
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-0">
              <input
                id="hero-search"
                type="search"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder={t('hero.searchPlaceholder', 'e.g. cedula, PWD ID, building permit')}
                className="min-h-12 w-full min-w-0 flex-1 rounded-md border-2 border-white bg-white px-4 text-lg text-gray-900 placeholder:text-gray-500 sm:rounded-r-none"
              />
              <button
                type="submit"
                className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-accent-400 px-5 text-lg font-bold text-gray-900 hover:bg-accent-300 sm:rounded-l-none"
              >
                <Search className="h-5 w-5" aria-hidden />
                {t('hero.searchButton', 'Search')}
              </button>
            </div>
          </form>

          <h2 className="mt-8 text-lg font-semibold">{t('hero.popularTitle', 'Popular')}</h2>
          <ul className="mt-2 grid gap-x-8 sm:grid-cols-2">
            {POPULAR.map(p => (
              <li key={p.href}>
                <Link
                  to={p.href}
                  className="inline-block py-2 text-white underline underline-offset-4 hover:text-accent-300"
                >
                  {t(`hero.popular.${p.href.split('/').pop()}`, p.label)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <figure className="hidden lg:col-span-2 lg:block">
          <img src={photo.src} alt={photo.alt} className="w-full rounded-lg" />
          <figcaption className="mt-2 text-sm text-primary-100">
            {t('hero.photoCaption', 'Naic from the air.')}{' '}
            <a href={photo.credit.url} target="_blank" rel="noopener noreferrer" className="underline">
              {photo.credit.author}, {photo.credit.license}
            </a>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function EmergencyStrip() {
  const { t } = useTranslation();
  return (
    <section className="bg-error-700 text-white" aria-labelledby="emergency-strip">
      <div className="container mx-auto flex flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Phone className="h-8 w-8 shrink-0" aria-hidden />
          <div>
            <h2 id="emergency-strip" className="text-xl font-bold md:text-2xl">
              {t('emergency.stripTitle', 'In an emergency, call 911')}
            </h2>
            <p className="text-white">
              {t('emergency.stripText', 'Police, fire and medical help, nationwide, 24/7.')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {hotlines.national.slice(0, 3).map(h => (
            <a
              key={h.tel}
              href={`tel:${h.tel}`}
              className="inline-flex min-h-11 items-center rounded-md bg-white px-4 text-lg font-bold text-error-700 hover:bg-error-50"
            >
              {h.number}
              <span className="ml-2 text-base font-medium">{h.tel === '911' ? t('emergency.label911', 'Emergency') : h.name}</span>
            </a>
          ))}
          <Link
            to="/emergency"
            className="inline-flex min-h-11 items-center rounded-md border-2 border-white px-4 font-semibold underline-offset-4 hover:underline"
          >
            {t('emergency.all', 'All hotlines and preparedness')}
          </Link>
        </div>
      </div>
    </section>
  );
}

function Leaders() {
  const { t } = useTranslation();
  const [mayor, vice] = naic.officials.executive;
  return (
    <section className="bg-white py-12" aria-labelledby="leaders-heading">
      <div className="container mx-auto px-4">
        <h2 id="leaders-heading" className="text-2xl font-bold text-gray-900 md:text-3xl">
          {t('leaders.title', 'Your local officials')}
        </h2>
        <p className="mt-2 text-gray-700">
          {t('leaders.subtitle', `Elected May 2025 for the ${naic.officials.term} term.`)}
        </p>
        <dl className="mt-6 grid gap-x-10 gap-y-4 sm:grid-cols-2">
          {[mayor, vice].map(o => (
            <div key={o.name} className="border-l-4 border-primary-500 pl-4">
              <dt className="text-gray-700">{o.position}</dt>
              <dd className="text-xl font-bold text-gray-900">
                {o.name} <span className="text-base font-normal text-gray-700">({o.party})</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-6">
          <Link to="/government/officials" className={link}>
            {t('leaders.all', 'All officials, including the 8 councilors')}
          </Link>
        </p>
      </div>
    </section>
  );
}

function Discover() {
  const { t } = useTranslation();
  const picks = places.places.filter(p => p.photo).slice(0, 3);
  const facts = [
    [nf.format(latestPopulation.count), t('facts.population', `residents (${latestPopulation.year} census)`)],
    [String(naic.profile.barangays), t('facts.barangays', 'barangays')],
    [`${naic.profile.landAreaKm2} km²`, t('facts.area', 'land area')],
  ];
  return (
    <section className="bg-gray-50 py-12" aria-labelledby="discover-heading">
      <div className="container mx-auto px-4">
        <h2 id="discover-heading" className="text-2xl font-bold text-gray-900 md:text-3xl">
          {t('discover.title', 'About Naic')}
        </h2>
        <p className="mt-2 max-w-3xl text-gray-700">
          {t(
            'discover.subtitle',
            'A first-class coastal town on Manila Bay, where Andres Bonifacio signed the Naic Military Agreement in 1897.'
          )}
        </p>
        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3">
          {facts.map(([value, label]) => (
            <div key={label}>
              <dd className="text-2xl font-bold text-gray-900">{value}</dd>
              <dt className="text-gray-700">{label}</dt>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-sm text-gray-600">{t('facts.source', 'Sources: PSA 2024 Census, PhilAtlas.')}</p>

        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {picks.map(p => (
            <li key={p.slug}>
              <img src={p.photo} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-lg object-cover" />
              <p className="mt-2 font-semibold text-gray-900">{p.name}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/tourism" className={link}>{t('discover.all', 'Places to visit')}</Link>
          <Link to="/about" className={link}>{t('discover.history', 'A short history of Naic')}</Link>
          <Link to="/statistics" className={link}>{t('facts.more', 'Statistics')}</Link>
        </p>
      </div>
    </section>
  );
}

function ReportCta() {
  const { t } = useTranslation();
  return (
    <section className="bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="border-t-4 border-primary-500 pt-6">
          <h2 className="text-2xl font-bold text-gray-900">{t('cta.title', 'Saw something wrong or outdated?')}</h2>
          <p className="mt-2 max-w-3xl text-gray-700">
            {t('cta.text', 'Tell us about a correction, a broken road or drain, or a problem with a service. Volunteers review every report.')}
          </p>
          <Link
            to="/report"
            className="mt-4 inline-flex min-h-12 items-center rounded-md bg-primary-500 px-6 text-lg font-semibold text-white hover:bg-primary-700"
          >
            {t('cta.button', 'Report a concern')}
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <SEO />
      <Hero />
      <ServicesSection />
      <EmergencyStrip />
      <Announcements />
      <Leaders />
      <Discover />
      <ReportCta />
    </>
  );
}
