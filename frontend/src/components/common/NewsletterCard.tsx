import { useEffect, useState } from 'react';
import { Check, Mail } from 'lucide-react';

import { useSession } from '@/hooks/useSession';
import { api } from '@/services/api';

export default function NewsletterCard() {
  const { user } = useSession();
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setSubscribed(null);
      return;
    }
    const controller = new AbortController();
    api.newsletterStatus(controller.signal)
      .then((response) => setSubscribed(response.status === 'SUBSCRIBED'))
      .catch(() => setSubscribed(null));
    return () => controller.abort();
  }, [user]);

  if (!user) return null;

  async function toggle() {
    if (subscribed == null || busy) return;
    setBusy(true);
    try {
      const response = subscribed
        ? await api.newsletterUnsubscribe()
        : await api.newsletterSubscribe();
      setSubscribed(response.status === 'SUBSCRIBED');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-4 rounded-2xl border border-gold-400/20 bg-gold-400/[0.06] p-6">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold-400/25 bg-gold-400/10 text-gold-400"><Mail className="h-5 w-5" aria-hidden /></div>
      <div className="flex-1">
        <h3 className="font-display text-lg font-semibold text-t1">Newsletter LesCracks</h3>
        <p className="mt-1 text-sm leading-relaxed text-t4">Soyez informé des nouveaux contenus, événements et ressources directement par email.</p>
        <button
          type="button"
          onClick={() => void toggle()}
          disabled={busy || subscribed == null}
          className={`mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${subscribed ? 'border border-line text-t3 hover:text-t1' : 'bg-gold-400 text-noir-950 hover:bg-gold-300'}`}
        >
          {subscribed ? <Check className="h-4 w-4" aria-hidden /> : <Mail className="h-4 w-4" aria-hidden />}
          {subscribed ? (busy ? 'Mise à jour…' : 'Abonné · Se désabonner') : (busy ? 'Abonnement…' : 'M’abonner')}
        </button>
      </div>
    </div>
  );
}
