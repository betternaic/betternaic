import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Menu, Phone, Search, X } from 'lucide-react';
import { mainNavigation, type NavItem } from '../../data/navigation';
import { LANGUAGES, type LanguageType } from '../../i18n/languages';
import { cn } from '../../lib/utils';

function LanguageSwitch({ className }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const current: LanguageType = i18n.language?.startsWith('fil') ? 'fil' : 'en';
  return (
    <div
      className={cn('inline-flex rounded-md border border-gray-300', className)}
      role="group"
      aria-label={t('nav.language', 'Language')}
    >
      {(Object.keys(LANGUAGES) as LanguageType[]).map(code => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={current === code}
          onClick={() => i18n.changeLanguage(code)}
          className={cn(
            'min-h-11 min-w-11 px-3 text-sm font-semibold first:rounded-l-md last:rounded-r-md',
            current === code
              ? 'bg-primary-500 text-white'
              : 'bg-white text-gray-800 hover:bg-gray-100'
          )}
        >
          {LANGUAGES[code].short}
        </button>
      ))}
    </div>
  );
}

const LARGE_TEXT_KEY = 'bn.largeText';

/** Bigger text and line spacing for seniors; remembered in this browser. */
function TextSizeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { t } = useTranslation();
  const [on, setOn] = useState(() => document.documentElement.classList.contains('large-text'));
  const toggle = () => {
    const next = !on;
    document.documentElement.classList.toggle('large-text', next);
    try {
      localStorage.setItem(LARGE_TEXT_KEY, next ? '1' : '0');
    } catch {
      /* private mode: still works for this visit */
    }
    setOn(next);
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      title={t('nav.largeText', 'Large text')}
      className={cn(
        'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md border px-3 font-semibold',
        on ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-500 bg-white text-gray-900 hover:bg-gray-100'
      )}
    >
      <span aria-hidden className="leading-none">
        <span className="text-sm">A</span>
        <span className="text-xl">A</span>
      </span>
      <span className={showLabel ? 'text-sm' : 'sr-only'}>{t('nav.largeText', 'Large text')}</span>
    </button>
  );
}

export default function Navbar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  // The mobile menu belongs to the page it was opened on, so navigating
  // closes it without an effect.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const [submenu, setSubmenu] = useState<string | null>(null);
  const open = openOn === pathname;

  const label = (item: NavItem) => t(`nav.${item.key}`, item.label);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <a href="#main" className="skip-link">
        {t('nav.skip', 'Skip to content')}
      </a>

      {/* Disclaimer strip */}
      <div className="bg-primary-700 text-white">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-1.5 text-sm">
          <p>
            <span className="sm:hidden">{t('site.disclaimerShort', 'Volunteer-run. Not the official LGU site.')}</span>
            <span className="hidden sm:inline">
              {t('site.disclaimer', 'Volunteer-run. Not an official website of the Municipality of Naic.')}
            </span>
          </p>
          <div className="flex shrink-0 items-center gap-3">
            {/* Language and text size live up here on wide screens; in the menu on phones. */}
            <div className="hidden items-center gap-2 text-gray-900 xl:flex">
              <LanguageSwitch />
              <TextSizeToggle showLabel />
            </div>
            <a
              href="tel:911"
              className="flex min-h-11 items-center gap-1.5 whitespace-nowrap font-semibold text-accent-300 underline-offset-4 hover:underline"
            >
              <Phone className="h-4 w-4" aria-hidden />
              {t('nav.call911', 'Emergency: 911')}
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <img
            src="/icons/logo-256.png"
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 shrink-0"
          />
          <div className="leading-tight max-[359px]:sr-only">
            <div className="text-lg font-bold text-gray-900">
              Better<span className="text-primary-500">Naic</span>
            </div>
            <div className="hidden text-sm text-gray-600 sm:block">
              {t('site.tagline', 'Community portal for Naic, Cavite')}
            </div>
          </div>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 xl:flex" aria-label="Main">
          {mainNavigation.map(item =>
            item.children ? (
              <div key={item.key} className="group relative">
                <button
                  type="button"
                  className="flex min-h-11 items-center gap-1 whitespace-nowrap rounded-md px-3 font-medium text-gray-800 hover:bg-gray-100 hover:text-primary-600"
                  aria-haspopup="true"
                >
                  {label(item)}
                  <ChevronDown className="h-4 w-4" aria-hidden />
                </button>
                <div className="invisible absolute left-0 top-full z-50 w-56 rounded-md border border-gray-200 bg-white py-2 opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  {item.children.map(child => (
                    <NavLink
                      key={child.key}
                      to={child.href}
                      className={({ isActive }) =>
                        cn(
                          'block px-4 py-2.5 hover:bg-gray-50 hover:text-primary-600',
                          isActive ? 'font-semibold text-primary-600' : 'text-gray-700'
                        )
                      }
                    >
                      {label(child)}
                    </NavLink>
                  ))}
                </div>
              </div>
            ) : (
              <NavLink
                key={item.key}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'inline-flex min-h-11 items-center whitespace-nowrap rounded-md px-3 font-medium hover:bg-gray-100 hover:text-primary-600',
                    isActive ? 'text-primary-600' : 'text-gray-800'
                  )
                }
              >
                {label(item)}
              </NavLink>
            )
          )}
          <Link
            to="/search"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-gray-800 hover:bg-gray-100 hover:text-primary-600"
            aria-label={t('nav.search', 'Search')}
          >
            <Search className="h-5 w-5" />
          </Link>
          <Link
            to="/report"
            className="ml-1 inline-flex min-h-11 items-center whitespace-nowrap rounded-md bg-primary-500 px-4 font-semibold text-white hover:bg-primary-600"
          >
            {t('nav.report', 'Report a concern')}
          </Link>
        </nav>

        {/* Mobile controls */}
        <div className="flex shrink-0 items-center gap-1 xl:hidden">
          <TextSizeToggle />
          <Link
            to="/search"
            className="hidden min-h-11 min-w-11 items-center justify-center rounded-md text-gray-800 hover:bg-gray-100 sm:inline-flex"
            aria-label={t('nav.search', 'Search')}
          >
            <Search className="h-6 w-6" />
          </Link>
          <button
            type="button"
            onClick={() => setOpenOn(open ? null : pathname)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-gray-800 hover:bg-gray-100"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t('nav.close', 'Close menu') : t('nav.open', 'Open menu')}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          className="max-h-[calc(100vh-7rem)] overflow-y-auto border-t border-gray-200 bg-white xl:hidden"
          aria-label="Main"
        >
          <div className="container mx-auto space-y-1 px-4 py-3">
            <Link
              to="/search"
              className="flex items-center gap-2 rounded-md px-3 py-3 font-medium text-gray-800 hover:bg-gray-50 sm:hidden"
            >
              <Search className="h-5 w-5" aria-hidden />
              {t('nav.search', 'Search')}
            </Link>
            {mainNavigation.map(item =>
              item.children ? (
                <div key={item.key}>
                  <button
                    type="button"
                    onClick={() => setSubmenu(s => (s === item.key ? null : item.key))}
                    className="flex w-full items-center justify-between rounded-md px-3 py-3 text-left font-medium text-gray-800 hover:bg-gray-50"
                    aria-expanded={submenu === item.key}
                  >
                    {label(item)}
                    <ChevronDown
                      className={cn('h-5 w-5 transition', submenu === item.key && 'rotate-180')}
                      aria-hidden
                    />
                  </button>
                  {submenu === item.key && (
                    <div className="ml-3 border-l-2 border-primary-100 pl-3">
                      {item.children.map(child => (
                        <Link
                          key={child.key}
                          to={child.href}
                          className="block rounded-md px-3 py-2.5 text-gray-700 hover:bg-gray-50"
                        >
                          {label(child)}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.key}
                  to={item.href}
                  className="block rounded-md px-3 py-3 font-medium text-gray-800 hover:bg-gray-50"
                >
                  {label(item)}
                </Link>
              )
            )}
            <Link
              to="/report"
              className="mt-2 block rounded-md bg-primary-500 px-3 py-3 text-center font-semibold text-white"
            >
              {t('nav.report', 'Report a concern')}
            </Link>
            <div className="flex items-center justify-between px-3 py-3">
              <span className="text-gray-700">{t('nav.language', 'Language')}</span>
              <LanguageSwitch />
            </div>
            <div className="flex items-center justify-between px-3 pb-3">
              <span className="text-gray-700">{t('nav.textSize', 'Text size')}</span>
              <TextSizeToggle showLabel />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
