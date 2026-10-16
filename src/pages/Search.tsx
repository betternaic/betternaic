import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Search as SearchIcon } from 'lucide-react';
import SEO from '../components/SEO';
import PageHeader from '../components/ui/PageHeader';
import { getCategorySubcategories, naic, offices, places, serviceCategories } from '../data/yamlLoader';

interface Entry {
  title: string;
  text: string;
  href: string;
  group: string;
}

// Client-side index of everything the site lists. Small enough to search in
// memory; no search server needed.
function buildIndex(): Entry[] {
  const entries: Entry[] = [];
  for (const c of serviceCategories.categories) {
    entries.push({ title: c.category, text: c.description, href: `/services/${c.slug}`, group: 'Services' });
    for (const p of getCategorySubcategories(c.slug).pages) {
      entries.push({ title: p.name, text: `${p.description ?? ''} ${c.category}`, href: `/services/${c.slug}/${p.slug}`, group: c.category });
    }
  }
  for (const o of offices) {
    entries.push({ title: o.name, text: `${o.short} ${o.handles.join(' ')}`, href: '/government/offices', group: 'Offices' });
  }
  for (const b of naic.barangays) {
    entries.push({ title: `Barangay ${b.name}`, text: `${b.alias ?? ''} barangay population`, href: '/government/barangays', group: 'Barangays' });
  }
  const o = naic.officials;
  for (const x of [...o.executive, ...o.councilors, ...o.exOfficio]) {
    entries.push({ title: x.name, text: `${x.position ?? 'Councilor'} ${x.party ?? ''} official`, href: '/government/officials', group: 'Officials' });
  }
  for (const p of places.places) {
    entries.push({ title: p.name, text: `${p.kind} ${p.description}`, href: `/tourism#${p.slug}`, group: 'Places' });
  }
  entries.push(
    { title: 'Emergency hotlines', text: '911 police fire ambulance red cross rescue MDRRMO flood typhoon', href: '/emergency', group: 'Pages' },
    { title: 'History of Naic', text: 'Naic Military Agreement Bonifacio Casa Hacienda 1897 history', href: '/about', group: 'Pages' },
    { title: 'Statistics', text: 'population census land area income class density', href: '/statistics', group: 'Pages' },
    { title: 'Transparency', text: 'budget audit COA full disclosure procurement FOI', href: '/transparency', group: 'Pages' },
    { title: 'Report a concern', text: 'complaint report correction feedback roads garbage', href: '/report', group: 'Pages' }
  );
  return entries;
}

const INDEX = buildIndex();

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export default function Search() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';

  const results = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return INDEX
      .map(e => {
        const title = norm(e.title);
        const hay = `${title} ${norm(e.text)}`;
        if (!words.every(w => hay.includes(w))) return null;
        const score = words.reduce((s, w) => s + (title.includes(w) ? 3 : 1), 0);
        return { e, score };
      })
      .filter((x): x is { e: Entry; score: number } => x !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40);
  }, [q]);

  return (
    <>
      <SEO title="Search" noindex={Boolean(q)} />
      <PageHeader title={t('search.title', 'Search BetterNaic')} crumbs={[{ label: 'Home', href: '/' }, { label: 'Search' }]}>
        <form role="search" className="mt-6 flex max-w-xl overflow-hidden rounded-lg bg-white" onSubmit={e => e.preventDefault()}>
          <label htmlFor="q" className="sr-only">{t('search.label', 'Search terms')}</label>
          <input
            id="q"
            type="search"
            autoFocus
            value={q}
            onChange={e => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
            placeholder={t('hero.searchPlaceholder', 'Search, e.g. cedula, PWD ID, building permit')}
            className="min-w-0 flex-1 px-4 py-3 text-gray-900 focus:outline-none"
          />
          <span className="flex items-center px-4 text-gray-500"><SearchIcon className="h-5 w-5" aria-hidden /></span>
        </form>
      </PageHeader>
      <section className="bg-white py-8">
        <div className="container mx-auto px-4">
          {q && (
            <p className="mb-4 text-gray-700" role="status">
              {results.length} {t('search.results', 'results')}
            </p>
          )}
          <ul className="max-w-3xl divide-y divide-gray-100">
            {results.map(({ e }) => (
              <li key={e.href + e.title}>
                <Link to={e.href} className="block py-4 hover:bg-gray-50">
                  <span className="text-gray-800">{e.group}</span>
                  <span className="block font-semibold text-gray-900">{e.title}</span>
                </Link>
              </li>
            ))}
          </ul>
          {q && results.length === 0 && (
            <p className="text-gray-700">
              {t('search.none', 'No matches. Try a shorter word, or browse')}{' '}
              <Link to="/services" className="font-semibold text-primary-600 underline">{t('nav.services', 'Services')}</Link>.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
