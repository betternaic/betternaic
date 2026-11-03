// Adapted from bettergovph/transparency-portal (MIT): src/components/Bits.tsx, restyled for BetterNaic.
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import type { BridgeGroup, Disclaimer } from './types';
import { usePortal, type Async } from './context';
import type { Reason } from './scope';

const DOT: Record<BridgeGroup, string> = {
  house_only: 'bg-accent-400',
  nep_only: 'bg-transparent ring-2 ring-inset ring-gray-500',
  unchanged: 'bg-gray-300',
  increased: 'bg-success-700',
  decreased: 'bg-error-500',
  scope_review: 'bg-primary-300',
};

export function Dot({ group }: { group: BridgeGroup }) {
  return <span className={`inline-block h-3 w-3 shrink-0 rounded-full ${DOT[group]}`} aria-hidden />;
}

export const tag = 'inline-block rounded border px-1.5 py-0.5 text-sm leading-tight';

/** The plain status, as the API words it, with the group's colour. */
export function StatusChip({ group, label, held }: { group: BridgeGroup; label: string; held?: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Dot group={group} />
      <span>{label}</span>
      {held && (
        <span className={`${tag} border-accent-600 bg-accent-50 text-accent-800`} title="Unconfirmed match: the pairing is fuzzy or ambiguous.">
          unconfirmed match
        </span>
      )}
    </span>
  );
}

export function ReasonTags({ reasons }: { reasons: Reason[] }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {reasons.map(r => (
        <span
          key={r.kind + r.label}
          className={`${tag} ${r.kind === 'office' ? 'border-gray-300 text-gray-700' : 'border-primary-200 bg-primary-50 text-primary-700'}`}
          title={r.kind === 'office' ? `Listed under ${r.label}` : `The title names ${r.label}`}
        >
          {r.kind === 'office' ? 'DPWH office' : `names ${r.label}`}
        </span>
      ))}
    </span>
  );
}

/** The API's disclaimers, verbatim: printed from the response, so the wording cannot drift. */
export function Disclaimers({ items }: { items: Disclaimer[] }) {
  if (!items.length) return null;
  return (
    <aside className="mt-8 space-y-2 rounded-lg bg-gray-50 p-5 text-gray-700" aria-label="Disclaimers">
      {items.map(d => (
        <p key={d.id}>
          <strong className="text-gray-900">{d.title}</strong> {d.body}{' '}
          <External href={d.restrictions_url ?? d.url}>Read more</External>
        </p>
      ))}
    </aside>
  );
}

/** Render `ready`, or a loading line, or the error with a retry. */
export function Await<T>({ state, children, what, onRetry }: { state: Async<T>; children: (value: T) => ReactNode; what: string; onRetry?: () => void }) {
  const { retry } = usePortal();
  if (state.status === 'ready') return <>{children(state.value)}</>;
  if (state.status === 'loading') return <Loading>Loading {what} from the Budget API…</Loading>;
  return <Failed what={what} error={state.error} onRetry={onRetry ?? retry} />;
}

export function Loading({ children }: { children: ReactNode }) {
  return (
    <p className="my-8 flex items-center gap-3 text-gray-700" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary-500" aria-hidden />
      {children}
    </p>
  );
}

export function Failed({ what, error, onRetry }: { what: string; error: Error; onRetry: () => void }) {
  return (
    <div className="my-8 rounded-lg border border-error-200 bg-error-50 p-5" role="alert">
      <p>
        <strong>Could not load {what}.</strong> {error.message}
      </p>
      <button type="button" className={`${button} mt-3`} onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

export function External({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary-600 underline underline-offset-4 hover:text-primary-800">
      {children}
      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
    </a>
  );
}

export const button = 'inline-flex min-h-11 items-center rounded-md bg-primary-500 px-4 font-semibold text-white hover:bg-primary-600';
export const quietButton = 'inline-flex min-h-11 items-center rounded-md border border-gray-400 px-4 font-semibold text-gray-900 hover:bg-gray-50';
export const field = 'min-h-11 w-full rounded-md border border-gray-500 bg-white px-3';
export const h2 = 'text-xl font-bold text-gray-900';
export const fine = 'mt-4 text-gray-700';

/** The blue banner with the three budget pages as tabs. */
export function BudgetHeader({ title, subtitle, crumb }: { title: string; subtitle?: string; crumb: string }) {
  const { t } = useTranslation();
  const tabs = [
    { to: '/budget', label: t('budget.tabProjects', '2027 projects') },
    { to: '/budget/enacted', label: t('budget.tabEnacted', 'Budgets 2020–2026') },
    { to: '/budget/about', label: t('budget.tabAbout', 'About the data') },
  ];
  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      crumbs={[{ label: 'Home', href: '/' }, { label: 'Transparency', href: '/transparency' }, { label: crumb }]}
    >
      <nav aria-label={t('budget.tabs', 'Budget pages')} className="mt-6 flex flex-wrap gap-2">
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end
            className={({ isActive }) =>
              `inline-flex min-h-11 items-center rounded-md px-4 font-semibold ${isActive ? 'bg-white text-primary-700' : 'border border-white/70 text-white hover:bg-primary-600'}`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </PageHeader>
  );
}
