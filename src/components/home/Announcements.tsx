import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, TriangleAlert } from 'lucide-react';
import { api, type Announcement } from '../../lib/api';
import { formatDate } from '../../lib/utils';

const KIND_STYLE: Record<Announcement['kind'], string> = {
  advisory: 'bg-error-50 text-error-700',
  news: 'bg-primary-50 text-primary-700',
  event: 'bg-success-50 text-success-700',
};

// Advisories posted by BetterNaic moderators through the Worker API.
export default function Announcements() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api
      .announcements()
      .then(r => setItems(r.items))
      .catch(() => setFailed(true));
  }, []);

  return (
    <section className="bg-gray-50 py-12" aria-labelledby="announcements-heading">
      <div className="container mx-auto px-4">
        <h2 id="announcements-heading" className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">
          {t('announcements.title', 'Announcements and advisories')}
        </h2>

        {items === null && !failed && (
          <div className="grid gap-4 md:grid-cols-3" aria-busy="true">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-36 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        )}

        {(failed || items?.length === 0) && (
          <p className="max-w-3xl text-gray-700">
            {failed
              ? t('announcements.failed', 'Announcements could not be loaded right now.')
              : t('announcements.empty', 'No advisories right now.')}{' '}
            {t(
              'announcements.official',
              'For class suspensions, weather and road advisories, follow the official channels of the Municipality of Naic and PAGASA.'
            )}
          </p>
        )}

        {items && items.length > 0 && (
          <ul className="grid gap-4 md:grid-cols-3">
            {items.slice(0, 6).map(a => (
              <li key={a.id} className="flex flex-col rounded-lg border border-gray-300 bg-white p-5">
                <p className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-sm font-semibold ${KIND_STYLE[a.kind]}`}>
                    {a.kind === 'advisory' && <TriangleAlert className="h-4 w-4" aria-hidden />}
                    {t(`announcements.kind.${a.kind}`, a.kind.charAt(0).toUpperCase() + a.kind.slice(1))}
                  </span>
                  <span className="text-sm text-gray-700">{formatDate(new Date(a.createdAt))}</span>
                </p>
                <h3 className="text-lg font-bold text-gray-900">{a.title}</h3>
                <p className="mt-1 flex-1 whitespace-pre-line text-gray-800">{a.body}</p>
                {a.link && (
                  <a
                    href={a.link}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-3 inline-flex min-h-11 items-center gap-1 font-semibold text-primary-600 underline underline-offset-4 hover:text-primary-800"
                  >
                    {t('announcements.source', 'Official source')}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
