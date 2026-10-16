import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CircleCheck, ShieldCheck, TriangleAlert } from 'lucide-react';
import SEO from '../components/SEO';
import PageHeader from '../components/ui/PageHeader';
import Turnstile from '../components/Turnstile';
import { api, ApiError, REPORT_CATEGORIES } from '../lib/api';
import { naic } from '../data/yamlLoader';

const BARANGAYS = naic.barangays.map(b => b.name).sort((a, b) => a.localeCompare(b));
const MIN = 20;
const MAX = 2000;

const field =
  'mt-1 block min-h-11 w-full rounded-md border-2 border-gray-500 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200';

export default function Report() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const initialCategory = REPORT_CATEGORIES.some(c => c.value === params.get('category'))
    ? params.get('category')!
    : '';
  const page = params.get('page')?.slice(0, 200) ?? '';

  const [category, setCategory] = useState(initialCategory);
  const [barangay, setBarangay] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [website, setWebsite] = useState(''); // honeypot, hidden from people
  const [token, setToken] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  const tooShort = message.trim().length < MIN;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!category || !barangay || tooShort) {
      setError(t('report.incomplete', 'Please choose a category and barangay, and describe the concern in at least 20 characters.'));
      return;
    }
    if (!token) {
      setError(t('report.verify', 'Please complete the verification check first.'));
      return;
    }
    setStatus('sending');
    try {
      await api.submitReport({
        category,
        barangay,
        message: message.trim(),
        name: name.trim() || undefined,
        contact: contact.trim() || undefined,
        page: page || undefined,
        website,
        turnstileToken: token,
      });
      setStatus('sent');
    } catch (err) {
      setStatus('idle');
      setError(err instanceof ApiError ? err.message : t('report.failed', 'Something went wrong. Please try again.'));
      setToken('');
      setResetKey(k => k + 1); // tokens are single-use
    }
  }

  return (
    <>
      <SEO title="Report a concern" description="Send BetterNaic a correction, or report a local concern such as roads, drainage, garbage or flooding in Naic, Cavite." />
      <PageHeader
        title={t('report.title', 'Report a concern')}
        subtitle={t('report.subtitle', 'Send a correction to BetterNaic, or tell us about a problem in your barangay. Volunteers review every report and point it to the office that can act.')}
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Report a concern' }]}
      />
      <section className="bg-white py-10">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-6 flex gap-3 rounded-lg border border-error-200 bg-error-50 p-4 text-sm text-error-800">
              <TriangleAlert className="h-5 w-5 shrink-0" aria-hidden />
              <p>
                <strong>{t('report.notEmergency', 'This is not an emergency line.')}</strong>{' '}
                {t('report.call911', 'For fire, crime, or medical emergencies, call 911.')}
              </p>
            </div>

            {status === 'sent' ? (
              <div className="rounded-lg border border-success-200 bg-success-50 p-6" role="status">
                <h2 className="flex items-center gap-2 text-xl font-bold text-success-800">
                  <CircleCheck className="h-6 w-6" aria-hidden />
                  {t('report.thanks', 'Salamat! Your report was sent.')}
                </h2>
                <p className="mt-2 text-gray-800">
                  {t('report.next', 'A volunteer will review it. BetterNaic is not the LGU, so for urgent action, also contact your barangay or the office concerned.')}
                </p>
                <Link to="/" className="mt-4 inline-block font-semibold text-primary-600 underline">
                  {t('report.home', 'Back to the home page')}
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="space-y-5">
                <div>
                  <label htmlFor="category" className="font-semibold text-gray-900">
                    {t('report.category', 'What is it about?')} <span className="text-error-600">*</span>
                  </label>
                  <select id="category" required value={category} onChange={e => setCategory(e.target.value)} className={field}>
                    <option value="">{t('report.choose', 'Choose one')}</option>
                    {REPORT_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{t(`report.cat.${c.value}`, c.label)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="barangay" className="font-semibold text-gray-900">
                    {t('report.barangay', 'Barangay')} <span className="text-error-600">*</span>
                  </label>
                  <select id="barangay" required value={barangay} onChange={e => setBarangay(e.target.value)} className={field}>
                    <option value="">{t('report.choose', 'Choose one')}</option>
                    {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
                    <option value="Not specific">{t('report.notSpecific', 'Not specific to a barangay')}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="font-semibold text-gray-900">
                    {t('report.message', 'Describe the concern')} <span className="text-error-600">*</span>
                  </label>
                  <p id="message-hint" className="text-gray-700">
                    {t('report.messageHint', 'Where exactly, what happened, and since when. Do not include other people\'s private information.')}
                  </p>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    maxLength={MAX}
                    aria-describedby="message-hint message-count"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className={field}
                  />
                  <p id="message-count" className={`mt-1 text-right text-sm ${tooShort && message ? 'text-error-600' : 'text-gray-700'}`}>
                    {message.trim().length}/{MAX}
                  </p>
                  {page && (
                    <p className="text-gray-700">
                      {t('report.aboutPage', 'About the page:')} <code className="rounded bg-gray-100 px-1">{page}</code>
                    </p>
                  )}
                </div>

                <fieldset className="rounded-lg border border-gray-200 p-4">
                  <legend className="px-1 font-semibold text-gray-900">{t('report.optional', 'Your details (optional)')}</legend>
                  <p className="text-gray-700">
                    {t('report.optionalHint', 'Only if you want a volunteer to follow up. Only moderators can see these.')}
                  </p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="text-sm font-medium text-gray-800">{t('report.name', 'Name')}</label>
                      <input id="name" maxLength={80} autoComplete="name" value={name} onChange={e => setName(e.target.value)} className={field} />
                    </div>
                    <div>
                      <label htmlFor="contact" className="text-sm font-medium text-gray-800">{t('report.contact', 'Email or mobile number')}</label>
                      <input id="contact" maxLength={120} autoComplete="email" value={contact} onChange={e => setContact(e.target.value)} className={field} />
                    </div>
                  </div>
                </fieldset>

                {/* Honeypot: real people never see or fill this. */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor="website">Website</label>
                  <input id="website" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} />
                </div>

                <Turnstile action="report" onToken={setToken} resetKey={resetKey} />

                {error && (
                  <p role="alert" className="rounded-md bg-error-50 p-3 text-sm text-error-800">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="rounded-md bg-primary-500 px-6 py-3 font-semibold text-white hover:bg-primary-600 disabled:cursor-wait disabled:opacity-60"
                >
                  {status === 'sending' ? t('report.sending', 'Sending...') : t('report.send', 'Send report')}
                </button>
              </form>
            )}
          </div>

          <aside className="space-y-4 text-gray-800">
            <div className="rounded-lg bg-gray-50 p-5">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                <ShieldCheck className="h-5 w-5 text-primary-500" aria-hidden />
                {t('report.safeTitle', 'How we protect this form')}
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>{t('report.safe1', 'Cloudflare Turnstile checks that you are a person, without puzzles for most people.')}</li>
                <li>{t('report.safe2', 'Each connection can only send a few reports per minute and per day.')}</li>
                <li>{t('report.safe3', 'Reports go to a private database that only moderators can open.')}</li>
              </ul>
              <Link to="/privacy" className="mt-2 inline-block font-semibold text-primary-600 underline">
                {t('report.privacy', 'Privacy details')}
              </Link>
            </div>
            <div className="rounded-lg border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900">{t('report.directTitle', 'Need action fast?')}</h2>
              <p className="mt-2">
                {t('report.directText', 'Go to your barangay hall, or the office that handles the problem. See the list of offices.')}
              </p>
              <Link to="/government/offices" className="mt-2 inline-block font-semibold text-primary-600 underline">
                {t('report.offices', 'Municipal offices')}
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
