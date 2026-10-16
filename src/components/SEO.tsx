import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router';
import { SITE } from '../lib/config';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  noindex?: boolean;
}

// Per-page meta. index.html carries static defaults for crawlers that do not
// run JavaScript; this updates them once the page renders.
export default function SEO({ title, description, image, noindex }: SEOProps) {
  const { pathname } = useLocation();
  const fullTitle = title
    ? `${title} | BetterNaic`
    : 'BetterNaic | Community portal for Naic, Cavite';
  const desc = description || SITE.description;
  const url = `${SITE.url}${pathname === '/' ? '/' : pathname}`;
  const img = image ? `${SITE.url}${image}` : SITE.ogImage;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={url} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={img} />
    </Helmet>
  );
}
