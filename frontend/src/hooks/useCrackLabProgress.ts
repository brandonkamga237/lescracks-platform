import { useCallback, useEffect, useState } from 'react';

import { useSession } from '@/hooks/useSession';
import { api } from '@/services/api';
import type { CrackLabProgress } from '@/services/types';

// Shared across screens: the header chip and the page under it ask for the same numbers,
// and moving between CrackLab pages should not blank the XP bar while it reloads.
let cache: { key: string; progress: CrackLabProgress } | null = null;
const listeners = new Set<(progress: CrackLabProgress | null) => void>();

function publish(key: string, progress: CrackLabProgress) {
  cache = { key, progress };
  listeners.forEach((listener) => listener(progress));
}

/** The signed-in member's CrackLab standing; null for visitors and administrators, who do not play. */
export function useCrackLabProgress() {
  const { isLoading, isSignedIn, isAdmin, email } = useSession();
  const key = isSignedIn && !isAdmin && email ? email : '';
  const [progress, setProgress] = useState<CrackLabProgress | null>(() => (key && cache?.key === key ? cache.progress : null));
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    listeners.add(setProgress);
    return () => { listeners.delete(setProgress); };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!key) {
      setProgress(null);
      return;
    }
    const controller = new AbortController();
    api.cracklab.progress(controller.signal)
      .then((next) => publish(key, next))
      .catch(() => { /* the chip is a bonus: the page works without it */ });
    return () => controller.abort();
  }, [isLoading, key, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);
  return { progress, playing: Boolean(key), reload };
}
