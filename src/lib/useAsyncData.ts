'use client';

import { useEffect, useState } from 'react';
import { type AppError, normalizeError } from './errors';

export type AsyncDataState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: AppError; retry: () => void }
  | { status: 'success'; data: T; refetch: () => void };

/**
 * Fetches `fetcher()` whenever `deps` changes, or `retry`/`refetch` is
 * called (tracked via a version counter, bumped on demand, rather than a
 * ref mutated during render - React Compiler's stricter hook rules flag
 * the latter even though it's otherwise safe).
 */
export function useAsyncData<T>(fetcher: () => Promise<T>, deps: unknown[]): AsyncDataState<T> {
  const [state, setState] = useState<AsyncDataState<T>>({ status: 'loading' });
  const [version, setVersion] = useState(0);
  const retry = () => setVersion((v) => v + 1);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- this effect *is* the data fetch; resetting to 'loading' when deps/version change is the intended behavior, not a render-derived value.
    setState({ status: 'loading' });

    fetcher()
      .then((data) => {
        if (cancelled) return;
        setState({ status: 'success', data, refetch: retry });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setState({ status: 'error', error: normalizeError(cause), retry });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `deps` is the caller-controlled dependency list; `version` forces a re-run on retry/refetch.
  }, [...deps, version]);

  return state;
}
