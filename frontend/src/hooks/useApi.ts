import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '@/services/http';

interface State<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

const CACHE_LIMIT = 80;
const cache = new Map<string, unknown>();

function remember(key: string, data: unknown) {
  cache.delete(key);
  cache.set(key, data);
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string);
}

/** Forgets every answer kept for a key: a sign-out must not leave one member's data to the next. */
export function forgetApiCache() {
  cache.clear();
}

/**
 * One call, with the three states every screen has to render anyway.
 *
 * The request is aborted when the inputs change or the screen leaves, so a slow answer to a
 * filter nobody is looking at any more cannot overwrite the one they are.
 *
 * With a `key`, the last answer for it is shown at once while a fresh one is fetched: coming
 * back to a page shows its content instead of a skeleton. The key must name everything the call
 * depends on, the member included for their own data.
 */
export function useApi<T>(
  call: (signal: AbortSignal) => Promise<T>,
  deps: React.DependencyList,
  key?: string,
): State<T> & { reload: () => void } {
  const [state, setState] = useState<State<T>>(() => ({ data: key && cache.has(key) ? (cache.get(key) as T) : null, loading: true, error: null }));
  const [nonce, setNonce] = useState(0);

  // The caller passes a fresh closure on every render; deps are what actually decide.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(call, deps);

  useEffect(() => {
    const controller = new AbortController();
    let live = true;

    setState((previous) => ({ data: key && cache.has(key) ? (cache.get(key) as T) : previous.data, loading: true, error: null }));

    run(controller.signal)
      .then((data) => {
        if (key) remember(key, data);
        if (live) setState({ data, loading: false, error: null });
      })
      .catch((failure: unknown) => {
        if (!live || controller.signal.aborted) return;
        setState({
          data: null,
          loading: false,
          error:
            failure instanceof ApiError
              ? failure
              : new ApiError(0, { message: 'Le serveur est injoignable.' }),
        });
      });

    return () => {
      live = false;
      controller.abort();
    };
  }, [run, nonce, key]);

  return { ...state, reload: () => setNonce((n) => n + 1) };
}

export default useApi;
