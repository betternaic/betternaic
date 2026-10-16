import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageSquareWarning } from 'lucide-react';
import SEO from '../components/SEO';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import NotFound from './NotFound';
import { serviceCategories } from '../data/yamlLoader';
import {
  loadPageMarkdown,
  loadServiceMarkdown,
  type MarkdownContent,
} from '../lib/markdownLoader';
import { markdownComponents } from '../lib/markdownComponents';

type State =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; doc: MarkdownContent };

function useMarkdown(load: () => Promise<MarkdownContent>, key: string) {
  const [state, setState] = useState<State>({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    setState({ status: 'loading' });
    load()
      .then(doc => alive && setState({ status: 'ready', doc }))
      .catch(() => alive && setState({ status: 'missing' }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
}

function Article({ doc }: { doc: MarkdownContent }) {
  return (
    <article className="prose prose-gray max-w-3xl prose-headings:scroll-mt-28 prose-a:text-primary-600 prose-blockquote:border-l-accent-400 prose-blockquote:bg-accent-50 prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:not-italic prose-blockquote:font-normal prose-li:my-1 [&_blockquote_p]:before:content-none [&_blockquote_p]:after:content-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {doc.content}
      </ReactMarkdown>
    </article>
  );
}

function Loading() {
  return (
    <div className="container mx-auto px-4 py-12" aria-busy="true">
      <div className="h-8 w-2/3 animate-pulse rounded bg-gray-200" />
      <div className="mt-6 h-4 w-full animate-pulse rounded bg-gray-200" />
      <div className="mt-3 h-4 w-5/6 animate-pulse rounded bg-gray-200" />
    </div>
  );
}

/** A service guide: /services/:category/:documentSlug */
export function ServiceDocument() {
  const { category = '', documentSlug = '' } = useParams();
  const { t } = useTranslation();
  const state = useMarkdown(
    () => loadServiceMarkdown(category, documentSlug),
    `${category}/${documentSlug}`
  );
  const cat = serviceCategories.categories.find(c => c.slug === category);

  if (state.status === 'loading') return <Loading />;
  if (state.status === 'missing' || !cat) return <NotFound />;
  const { doc } = state;

  return (
    <>
      <SEO title={doc.title} description={doc.description} />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: 'Home', href: '/' },
            { label: 'Services', href: '/services' },
            { label: cat.category, href: `/services/${cat.slug}` },
            { label: doc.title ?? documentSlug },
          ]}
        />
        <Article doc={doc} />
        <div className="mt-10 flex max-w-3xl items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-gray-800">
          <MessageSquareWarning className="h-5 w-5 shrink-0 text-primary-500" aria-hidden />
          <p>
            {t('doc.outdated', 'Is something here wrong or out of date?')}{' '}
            <Link
              to={`/report?category=correction&page=${encodeURIComponent(`/services/${category}/${documentSlug}`)}`}
              className="font-semibold text-primary-600 underline"
            >
              {t('doc.tellUs', 'Tell us')}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

/** A standalone page from content/pages (about, privacy, terms...). */
export function StaticPage({ slug }: { slug: string }) {
  const state = useMarkdown(() => loadPageMarkdown(slug), slug);
  if (state.status === 'loading') return <Loading />;
  if (state.status === 'missing') return <NotFound />;
  const { doc } = state;
  return (
    <>
      <SEO title={doc.title} description={doc.description} />
      <div className="container mx-auto px-4 py-8 md:py-12">
        <Breadcrumbs className="mb-6" items={[{ label: 'Home', href: '/' }, { label: doc.title ?? slug }]} />
        <Article doc={doc} />
      </div>
    </>
  );
}
