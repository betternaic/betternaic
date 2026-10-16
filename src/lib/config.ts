// Site-wide settings read from the committed .env files (public values only).
const env = import.meta.env;

export const SITE = {
  name: env.VITE_SITE_NAME || 'BetterNaic',
  lgu: env.VITE_GOVERNMENT_NAME || 'Naic, Cavite',
  url: (env.VITE_WEBSITE_URL || 'https://betternaic.vercel.app').replace(
    /\/$/,
    ''
  ),
  description: env.VITE_SITE_DESCRIPTION || '',
  keywords: env.VITE_SITE_KEYWORDS || '',
  ogImage: env.VITE_OG_IMAGE_URL || '/og-image.jpg',
  facebook: env.VITE_FACEBOOK_URL || '',
  github: env.VITE_GITHUB_URL || 'https://github.com/riecodes/betternaic',
  apiUrl: (env.VITE_API_URL || '').replace(/\/$/, ''),
  turnstileSiteKey: env.VITE_TURNSTILE_SITE_KEY || '',
  directory: 'https://lgu.bettergov.ph',
  version: '0.2.0',
} as const;

export const nf = new Intl.NumberFormat('en-PH');
