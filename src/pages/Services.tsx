import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import SEO from '../components/SEO';
import PageHeader from '../components/ui/PageHeader';
import ServicesSection from '../components/home/ServicesSection';
import NotFound from './NotFound';
import { getCategorySubcategories, serviceCategories } from '../data/yamlLoader';
import { NamedIcon } from '../lib/icons';

export default function Services() {
  const { category } = useParams();
  const { t } = useTranslation();

  if (!category) {
    return (
      <>
        <SEO
          title="Services"
          description="Step-by-step guides for common transactions in Naic, Cavite: civil registration, permits, taxes, IDs, health, and social welfare."
        />
        <PageHeader
          title={t('services.pageTitle', 'Services and requirements')}
          subtitle={t(
            'services.pageSubtitle',
            'What to bring, where to go, and what to expect for common transactions in Naic.'
          )}
          crumbs={[{ label: 'Home', href: '/' }, { label: 'Services' }]}
        />
        <ServicesSection heading={false} />
      </>
    );
  }

  const data = serviceCategories.categories.find(c => c.slug === category);
  if (!data) return <NotFound />;
  const index = getCategorySubcategories(category);

  return (
    <>
      <SEO title={data.category} description={data.description} />
      <PageHeader
        title={t(`services.cat.${data.slug}`, data.category)}
        subtitle={data.description}
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Services', href: '/services' },
          { label: data.category },
        ]}
      >
        <NamedIcon name={data.icon} className="mt-4 h-8 w-8 text-accent-300" />
      </PageHeader>
      <section className="bg-white py-10">
        <div className="container mx-auto px-4">
          {index.pages.length === 0 ? (
            <p className="text-gray-600">{t('services.none', 'Guides for this category are being written.')}</p>
          ) : (
            <ul className="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200">
              {index.pages.map(page => (
                <li key={page.slug}>
                  <Link
                    to={`/services/${category}/${page.slug}`}
                    className="flex items-center justify-between gap-4 bg-white p-5 hover:bg-gray-50"
                  >
                    <span>
                      <span className="block font-semibold text-gray-900">{page.name}</span>
                      {page.description && (
                        <span className="mt-1 block text-sm text-gray-600">{page.description}</span>
                      )}
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
