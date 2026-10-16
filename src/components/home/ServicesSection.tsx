import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { serviceCategories } from '../../data/yamlLoader';
import { NamedIcon } from '../../lib/icons';

export default function ServicesSection({
  heading = true,
}: {
  heading?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <section className="bg-white py-12" aria-labelledby={heading ? 'services-heading' : undefined}>
      <div className="container mx-auto px-4">
        {heading && (
          <>
            <h2 id="services-heading" className="text-2xl font-bold text-gray-900 md:text-3xl">
              {t('services.title', 'Services and requirements')}
            </h2>
            <p className="mt-2 max-w-3xl text-gray-700">
              {t(
                'services.description',
                'Step-by-step guides for common transactions in Naic: what to bring, where to go, and what to expect.'
              )}
            </p>
          </>
        )}
        <ul className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
          {serviceCategories.categories.map(category => (
            <li key={category.slug} className="flex gap-3">
              <NamedIcon name={category.icon} className="mt-1 h-6 w-6 shrink-0 text-primary-500" />
              <div>
                <Link
                  to={`/services/${category.slug}`}
                  className="text-lg font-bold text-primary-600 underline underline-offset-4 hover:text-primary-800"
                >
                  {t(`services.cat.${category.slug}`, category.category)}
                </Link>
                <p className="mt-1 text-gray-700">{category.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
