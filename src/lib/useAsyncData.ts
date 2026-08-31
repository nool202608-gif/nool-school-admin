'use client';

import useSWR from 'swr';
import { type AppError, normalizeError } from './errors';

export type AsyncDataState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: AppError; retry: () => void }
  | { status: 'success'; data: T; refetch: () => void };

/**
 * Thin wrapper around SWR so every call site keeps the same {status,...}
 * shape it always had, but now backed by a real cross-navigation cache -
 * revisiting a page you fetched a moment ago shows the last-good data
 * immediately (no loading flash) while SWR silently revalidates behind
 * it, instead of every navigation re-fetching from a blank slate.
 *
 * `key` is the cache identity - include every value the fetch actually
 * depends on (e.g. `students:${classFilter}`), the same way a dependency
 * array used to. Two call sites that pass the same key share one cache
 * entry (and one in-flight request) - that's a feature, not a collision,
 * as long as the key really does capture everything the result depends
 * on. Pass `null` to skip fetching entirely (e.g. while a required id
 * isn't known yet).
 */
export function useAsyncData<T>(key: string | null, fetcher: () => Promise<T>): AsyncDataState<T> {
  const { data, error, isLoading, mutate } = useSWR<T>(key, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const retry = () => {
    void mutate();
  };

  if (error) {
    return { status: 'error', error: normalizeError(error), retry };
  }
  if (isLoading || data === undefined) {
    return { status: 'loading' };
  }
  return { status: 'success', data, refetch: retry };
}
