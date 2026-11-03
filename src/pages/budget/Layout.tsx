// Adapted from bettergovph/transparency-portal (MIT): src/components/PortalProvider.tsx.
import { useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import { createClient } from '../../budget/client';
import { DEFAULT_API, SOURCE_CODE_URL, portal } from '../../budget/config';
import { PortalContext, toError, type Async, type PortalState } from '../../budget/context';
import { resolveScope, type ScopeResult } from '../../budget/scope';
import { External } from '../../budget/Bits';
import { date } from '../../budget/format';

/** The settled state of `promise`; "loading" until it settles. */
function useSettled<T>(promise: Promise<T>): Async<T> {
  const [state, setState] = useState<{ promise: Promise<T>; value: Async<T> } | null>(null);
  useEffect(() => {
    let live = true;
    promise.then(
      value => live && setState({ promise, value: { status: 'ready', value } }),
      error => live && setState({ promise, value: { status: 'error', error: toError(error) } })
    );
    return () => {
      live = false;
    };
  }, [promise]);
  return state?.promise === promise ? state.value : { status: 'loading' };
}

/** Every district an in-scope DPWH office serves, plus any the config names. */
function districtIds(scope: ScopeResult, configured: string[]): string[] {
  const ids = new Set(configured);
  for (const q of scope.queries) for (const o of q.officeLens?.offices ?? []) for (const d of o.districts) ids.add(d.id);
  return [...ids];
}

const client = createClient(import.meta.env.VITE_BUDGET_API || DEFAULT_API);

export default function BudgetLayout() {
  const { t } = useTranslation();
  const [attempt, setAttempt] = useState(0);

  // One set of requests per attempt; "Try again" makes a new set (failed requests are not cached).
  const loads = useMemo(() => {
    const scope = resolveScope(client, portal);
    return {
      attempt,
      overview: client.overview(),
      scope,
      districts: scope.then(s => Promise.all(districtIds(s, portal.scope.districts ?? []).map(id => client.district(id)))),
    };
  }, [attempt]);

  const overview = useSettled(loads.overview);
  const scope = useSettled(loads.scope);
  const districts = useSettled(loads.districts);
  const value: PortalState = { config: portal, client, overview, scope, districts, retry: () => setAttempt(n => n + 1) };
  const meta = scope.status === 'ready' ? scope.value.meta : null;

  return (
    <PortalContext.Provider value={value}>
      <Outlet />
      <section className="border-t border-gray-200 bg-gray-50 py-8">
        <div className="container mx-auto space-y-3 px-4 text-gray-700">
          <p>
            {t('budget.source', 'Data from the')} <External href="https://budget.bettergov.ph/docs">BetterGov.ph Budget API</External>
            {meta && <> · {t('budget.built', 'built')} {date(meta.built_at)}</>}.{' '}
            {t('budget.credit', 'These pages are adapted from the')} <External href={SOURCE_CODE_URL}>BetterGov.ph Transparency Portal</External>{' '}
            {t('budget.license', '(MIT licence, © 2026 BetterGov.ph).')}
          </p>
          {meta && <p className="text-base">{meta.notice}</p>}
        </div>
      </section>
    </PortalContext.Provider>
  );
}
