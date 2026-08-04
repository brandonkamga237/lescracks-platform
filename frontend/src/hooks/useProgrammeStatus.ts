import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';

/** Shown on the public pages when no custom admin message is set. */
export const DEFAULT_360_CLOSED_MESSAGE =
  "Les Accompagnements 360 ne sont pas ouverts pour le moment. De nouvelles sessions ouvriront prochainement — reviens bientôt.";

/**
 * Availability of the Accompagnement 360, for the header CTA and the public pages.
 * Optimistic: assumes open until proven otherwise, and treats any error as open, so a
 * flaky status check never hides a working funnel. `message` is always display-ready.
 */
export function useProgrammeStatus() {
  const [open, setOpen] = useState(true);
  const [rawMessage, setRawMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiService.getProgrammeStatus()
      .then((s) => { if (active) { setOpen(s.open); setRawMessage(s.message); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return {
    open,
    loading,
    message: rawMessage && rawMessage.trim() ? rawMessage : DEFAULT_360_CLOSED_MESSAGE,
  };
}
