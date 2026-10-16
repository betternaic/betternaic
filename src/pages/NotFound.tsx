import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <>
      <SEO title="Page not found" noindex />
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-6xl font-bold text-primary-500">404</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">{t('notFound.title', 'We could not find that page')}</h1>
        <p className="mt-2 text-gray-600">{t('notFound.text', 'It may have moved. Try searching, or start from the home page.')}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/" className="rounded-md bg-primary-500 px-5 py-2.5 font-semibold text-white hover:bg-primary-600">
            {t('notFound.home', 'Home')}
          </Link>
          <Link to="/search" className="rounded-md border border-gray-300 px-5 py-2.5 font-semibold text-gray-800 hover:bg-gray-50">
            {t('nav.search', 'Search')}
          </Link>
        </div>
      </div>
    </>
  );
}
