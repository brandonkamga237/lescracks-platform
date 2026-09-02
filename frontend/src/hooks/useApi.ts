import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '@/services/http';

interface State<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

/**
 * One call, with the three states every screen has to render anyway.
 *
 * The request is aborted when the inputs change or the screen leaves, so a slow answer to a
 * filter nobody is looking at any more cannot overwrite the one they are.
 */
export function useApi<T>(
  call: (signal: AbortSignal) => Promise<T>,
  deps: React.DependencyList,
): State<T> & { reload: () => void } {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null });
  const [nonce, setNonce] = useState(0);

  // The caller passes a fresh closure on every render; deps are what actually decide.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(call, deps);

  useEffect(() => {
    const controller = new AbortController();
    let live = true;

    setState((previous) => ({ ...previous, loading: true, error: null }));

    run(controller.signal)
      .then((data) => {
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
  }, [run, nonce]);

  return { ...state, reload: () => setNonce((n) => n + 1) };
}

export default useApi;
