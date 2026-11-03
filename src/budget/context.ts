// Adapted from bettergovph/transparency-portal (MIT): src/lib/portal-context.ts.
import { createContext, useContext } from 'react';
import type { PortalConfig } from './config';
import type { Client } from './client';
import type { DistrictCard, Envelope, Overview } from './types';
import type { ScopeResult } from './scope';

export type Async<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ready'; value: T };

export interface PortalState {
  config: PortalConfig;
  client: Client;
  overview: Async<Envelope<Overview>>;
  scope: Async<ScopeResult>;
  districts: Async<Envelope<DistrictCard>[]>;
  retry(): void;
}

export const PortalContext = createContext<PortalState | null>(null);

export function usePortal(): PortalState {
  const state = useContext(PortalContext);
  if (!state) throw new Error('usePortal() outside <BudgetLayout>');
  return state;
}

export const toError = (e: unknown) => (e instanceof Error ? e : new Error(String(e)));

/** "Cavite 2nd District Engineering Office" → "Cavite 2nd DEO", for tight spaces. */
export const shortOffice = (office: string) => office.replace(/ District Engineering Office$/, ' DEO');
