import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Facebook, Github } from 'lucide-react';
import { footerLinks } from '../../data/navigation';
import { SITE } from '../../lib/config';

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const cls = 'text-sm text-gray-300 transition-colors hover:text-white';
  return href.startsWith('http') ? (
    <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ) : (
    <Link to={href} className={cls}>
      {children}
    </Link>
  );
}

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 pb-8 pt-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <img src="/icons/logo-256.png" alt="" width={48} height={48} className="h-12 w-12" />
              <div>
                <div className="font-bold">BetterNaic</div>
                <div className="text-sm text-gray-300">
                  {t('footer.partOf', 'Part of the BetterGov.ph LGU Directory')}
                </div>
              </div>
            </div>
            <p className="mb-4 text-sm text-gray-300">
              {t(
                'footer.about',
                'A volunteer-run portal that gathers public information about Naic, Cavite in one place. It is not affiliated with the Municipality of Naic. For official transactions, go to the Municipal Hall or the office concerned.'
              )}
            </p>
            <div className="flex gap-4">
              {SITE.facebook && (
                <a
                  href={SITE.facebook}
                  className="text-gray-400 hover:text-white"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="BetterNaic on Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              <a
                href={SITE.github}
                className="text-gray-400 hover:text-white"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="BetterNaic source code on GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {footerLinks.map(section => (
            <div key={section.key}>
              <h2 className="mb-4 text-base font-semibold">
                {t(`footer.${section.key}`, section.label)}
              </h2>
              <ul className="space-y-2">
                {section.links.map(link => (
                  <li key={link.key}>
                    <FooterLink href={link.href}>{t(`nav.${link.key}`, link.label)}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-gray-800 pt-8 text-sm text-gray-400 md:flex-row md:items-center md:justify-between">
          <p>
            {t('footer.license', 'Content is free to reuse with credit. Photos keep their Wikimedia Commons licenses.')}
          </p>
          <div className="flex gap-6">
            <a href={SITE.github} className="hover:text-white" target="_blank" rel="noopener noreferrer">
              {t('footer.contribute', 'Contribute on GitHub')}
            </a>
            <a href={SITE.directory} className="hover:text-white" target="_blank" rel="noopener noreferrer">
              {t('footer.directory', 'LGU Directory')}
            </a>
            <span>v{SITE.version}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
