import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import SEO from '../components/SEO';
import PageHeader from '../components/ui/PageHeader';

const RESOURCES = [
  {
    title: 'Full Disclosure Policy Portal (DILG)',
    url: 'https://fdpp.dilg.gov.ph',
    text: 'LGUs must post their annual budget, statement of receipts and expenditures, procurement plans, bid results and other financial documents here. Search for Region IV-A, Cavite, then Naic.',
  },
  {
    title: 'Commission on Audit annual audit reports',
    url: 'https://www.coa.gov.ph',
    text: "COA audits every LGU each year. The Annual Audit Reports on local governments list findings and recommendations on how public funds were used. Look under reports for local government units in Region IV-A.",
  },
  {
    title: 'Cities and Municipalities Competitiveness Index (DTI)',
    url: 'https://cmci.dti.gov.ph',
    text: 'Yearly scores on economic dynamism, government efficiency, infrastructure, resiliency and innovation, comparable across towns.',
  },
  {
    title: 'Bureau of Local Government Finance',
    url: 'https://blgf.gov.ph',
    text: 'Statistics on LGU income, local revenue collection and spending.',
  },
  {
    title: 'PhilGEPS (government procurement)',
    url: 'https://philgeps.gov.ph',
    text: 'Bid notices and awards for government purchases and projects, including those of LGUs.',
  },
  {
    title: 'Seal of Good Local Governance (DILG)',
    url: 'https://www.dilg.gov.ph',
    text: 'DILG\'s yearly assessment of LGU performance. Naic was among the eight Cavite LGUs that received the 2022 seal (Journal News).',
  },
];

export default function Transparency() {
  const { t } = useTranslation();
  return (
    <>
      <SEO title="Transparency" description="Where to find the budget, audit reports, procurement and other public documents of the Municipality of Naic, and how to request information." />
      <PageHeader
        title={t('transparency.title', 'Transparency')}
        subtitle={t('transparency.subtitle', 'Public money, public records. Here is where Naic\'s budget, spending and audit findings are published, and how to ask for what is not.')}
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Government', href: '/government' }, { label: 'Transparency' }]}
      />
      <section className="bg-white py-10">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-xl font-bold text-gray-900">{t('transparency.where', 'Where the documents are')}</h2>
          <ul className="grid gap-4 md:grid-cols-2">
            {RESOURCES.map(r => (
              <li key={r.url} className="rounded-lg border border-gray-200 p-5">
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-primary-600 hover:text-primary-700">
                  {r.title}
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
                <p className="mt-2 text-gray-800">{r.text}</p>
              </li>
            ))}
          </ul>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg bg-primary-50 p-6">
              <h2 className="text-xl font-bold text-gray-900">{t('transparency.foiTitle', 'Ask for a public document')}</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-gray-800">
                <li>Write a short letter to the office that holds the record (for example, the Municipal Treasurer for collections, or the Sangguniang Bayan for ordinances). Say exactly what document you want and for what period.</li>
                <li>Include your name, address, contact details and a valid ID.</li>
                <li>Submit it at the Municipal Hall and keep a receiving copy, or ask whether the municipality accepts requests through the national <a href="https://www.foi.gov.ph" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">eFOI portal</a>.</li>
                <li>Follow up if you get no answer within the period the office gives you.</li>
              </ol>
              <p className="mt-3 text-gray-800">
                The Constitution guarantees the right to information on matters of public concern (Article III, Section 7).
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900">{t('transparency.helpTitle', 'Help build this page')}</h2>
              <p className="mt-3 text-gray-700">
                BetterNaic wants to publish Naic's annual budget, audit findings and ordinances in plain language. If you have copies from an official source, or links we missed, send them in.
              </p>
              <Link to="/report?category=correction&page=/transparency" className="mt-4 inline-block rounded-md bg-primary-500 px-4 py-2 font-semibold text-white hover:bg-primary-600">
                {t('transparency.send', 'Send a document or link')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
