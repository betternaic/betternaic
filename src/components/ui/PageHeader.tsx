import type { ReactNode } from 'react';
import Breadcrumbs from './Breadcrumbs';

// Blue page banner shared by the inner pages.
export default function PageHeader({
  title,
  subtitle,
  crumbs,
  children,
}: {
  title: string;
  subtitle?: string;
  crumbs?: { label: string; href?: string }[];
  children?: ReactNode;
}) {
  return (
    <div className="bg-primary-700 text-white">
      <div className="container mx-auto px-4 py-8 md:py-10">
        <Breadcrumbs items={crumbs} tone="dark" className="mb-4" />
        <h1 className="text-3xl font-bold leading-tight md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-3xl text-lg text-white">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

export function SourceNote({ label, url }: { label: string; url: string }) {
  return (
    <p className="mt-4 text-gray-700">
      Source:{' '}
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary-600 underline underline-offset-4 hover:text-primary-800">
        {label}
      </a>
    </p>
  );
}
