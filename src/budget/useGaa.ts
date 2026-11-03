import { useEffect, useState } from 'react';
import { toError, usePortal, type Async } from './context';
import { loadGaa, type GaaResult } from './gaa';

/** The 2020–2026 searches (memoised in loadGaa), shared by the Enacted and About pages. */
export function useGaa() {
  const { client, config } = usePortal();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [state, setState] = useState<Async<GaaResult>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    loadGaa(client, config, (done, total) => live && setProgress({ done, total })).then(
      value => live && setState({ status: 'ready', value }),
      error => live && setState({ status: 'error', error: toError(error) })
    );
    return () => {
      live = false;
    };
  }, [client, config, attempt]);
  const retry = () => {
    setState({ status: 'loading' });
    setAttempt(n => n + 1);
  };
  return { state, progress, retry };
}
