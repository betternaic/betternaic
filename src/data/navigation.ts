export interface NavItem {
  key: string; // i18n key under nav.*
  label: string; // English default
  href: string;
  children?: NavItem[];
}

export const mainNavigation: NavItem[] = [
  { key: 'services', label: 'Services', href: '/services' },
  {
    key: 'government',
    label: 'Government',
    href: '/government',
    children: [
      { key: 'officials', label: 'Officials', href: '/government/officials' },
      { key: 'offices', label: 'Offices', href: '/government/offices' },
      { key: 'barangays', label: 'Barangays', href: '/government/barangays' },
      { key: 'statistics', label: 'Statistics', href: '/statistics' },
      { key: 'transparency', label: 'Transparency', href: '/transparency' },
    ],
  },
  {
    key: 'discover',
    label: 'Discover Naic',
    href: '/tourism',
    children: [
      { key: 'tourism', label: 'Places to visit', href: '/tourism' },
      { key: 'history', label: 'History', href: '/about' },
    ],
  },
  { key: 'emergency', label: 'Emergency', href: '/emergency' },
];

export const footerLinks: { key: string; label: string; links: NavItem[] }[] = [
  {
    key: 'portal',
    label: 'BetterNaic',
    links: [
      { key: 'aboutPortal', label: 'About BetterNaic', href: '/about-betternaic' },
      { key: 'report', label: 'Report a concern', href: '/report' },
      { key: 'accessibility', label: 'Accessibility', href: '/accessibility' },
      { key: 'privacy', label: 'Privacy', href: '/privacy' },
      { key: 'terms', label: 'Terms of use', href: '/terms' },
      { key: 'sitemap', label: 'Sitemap', href: '/sitemap' },
    ],
  },
  {
    key: 'naic',
    label: 'Naic',
    links: [
      { key: 'services', label: 'Services', href: '/services' },
      { key: 'officials', label: 'Officials', href: '/government/officials' },
      { key: 'barangays', label: 'Barangays', href: '/government/barangays' },
      { key: 'emergency', label: 'Emergency hotlines', href: '/emergency' },
      { key: 'tourism', label: 'Places to visit', href: '/tourism' },
    ],
  },
  {
    key: 'national',
    label: 'Government links',
    links: [
      { key: 'govph', label: 'GOV.PH', href: 'https://www.gov.ph' },
      { key: 'cavite', label: 'Province of Cavite', href: 'https://cavite.gov.ph' },
      { key: 'foi', label: 'Freedom of Information', href: 'https://www.foi.gov.ph' },
      { key: 'fdp', label: 'Full Disclosure Policy Portal', href: 'https://fdpp.dilg.gov.ph' },
      { key: 'bettergov', label: 'BetterGov.ph', href: 'https://bettergov.ph' },
    ],
  },
];
