import { Link } from 'react-router';
import SEO from '../components/SEO';
import PageHeader from '../components/ui/PageHeader';
import { getCategorySubcategories, serviceCategories } from '../data/yamlLoader';

const PAGES = [
  ['Home', '/'],
  ['Government', '/government'],
  ['Officials', '/government/officials'],
  ['Offices', '/government/offices'],
  ['Barangays', '/government/barangays'],
  ['Statistics', '/statistics'],
  ['Transparency', '/transparency'],
  ['Places to visit', '/tourism'],
  ['History of Naic', '/about'],
  ['Emergency hotlines', '/emergency'],
  ['Report a concern', '/report'],
  ['Search', '/search'],
  ['About BetterNaic', '/about-betternaic'],
  ['Accessibility', '/accessibility'],
  ['Privacy', '/privacy'],
  ['Terms of use', '/terms'],
];

export default function Sitemap() {
  return (
    <>
      <SEO title="Sitemap" description="Every page on BetterNaic." />
      <PageHeader title="Sitemap" crumbs={[{ label: 'Home', href: '/' }, { label: 'Sitemap' }]} />
      <section className="bg-white py-10">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <h2 className="mb-3 font-bold text-gray-900">Pages</h2>
            <ul className="space-y-1.5">
              {PAGES.map(([label, href]) => (
                <li key={href}><Link to={href} className="text-primary-600 hover:underline">{label}</Link></li>
              ))}
            </ul>
          </div>
          {serviceCategories.categories.map(c => (
            <div key={c.slug}>
              <h2 className="mb-3 font-bold text-gray-900">
                <Link to={`/services/${c.slug}`} className="hover:underline">{c.category}</Link>
              </h2>
              <ul className="space-y-1.5">
                {getCategorySubcategories(c.slug).pages.map(p => (
                  <li key={p.slug}>
                    <Link to={`/services/${c.slug}/${p.slug}`} className="text-primary-600 hover:underline">{p.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
