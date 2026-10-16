import { Fragment } from 'react';
import { Link, useLocation } from 'react-router';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

function fromPath(pathname: string): BreadcrumbItem[] {
  const parts = pathname.split('/').filter(Boolean);
  return [
    { label: 'Home', href: '/' },
    ...parts.map((part, i) => ({
      label: part
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      href: i === parts.length - 1 ? undefined : '/' + parts.slice(0, i + 1).join('/'),
    })),
  ];
}

export default function Breadcrumbs({
  items,
  className,
  tone = 'light',
}: {
  items?: BreadcrumbItem[];
  className?: string;
  tone?: 'light' | 'dark';
}) {
  const { pathname } = useLocation();
  const list = items ?? fromPath(pathname);
  const dark = tone === 'dark';

  return (
    <nav aria-label="Breadcrumb" className={cn('text-base', className)}>
      <ol className={cn('flex flex-wrap items-center gap-1', dark ? 'text-primary-100' : 'text-gray-600')}>
        {list.map((item, i) => (
          <Fragment key={i}>
            <li className="flex items-center gap-1">
              {i === 0 && <Home className="h-4 w-4" aria-hidden />}
              {item.href ? (
                <Link to={item.href} className={dark ? 'hover:text-white' : 'hover:text-primary-600'}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className={cn('font-medium', dark ? 'text-white' : 'text-gray-900')}>
                  {item.label}
                </span>
              )}
            </li>
            {i < list.length - 1 && (
              <ChevronRight className={cn('h-4 w-4', dark ? 'text-primary-200' : 'text-gray-400')} aria-hidden />
            )}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
