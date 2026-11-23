import { useEffect, useState } from 'react';
import { Check, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useSession } from '@/hooks/useSession';
import { api } from '@/services/api';
import { track } from '@/lib/analytics';

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
      .catch(() => setSubscribed(false));
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
      if (!subscribed) track('Abonnement newsletter', { compte: 'membre' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-4 rounded-[2rem] border border-gold-400/20 bg-gold-400/[0.05] p-6 sm:p-8">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold-400/15 text-gold-400"><Mail className="h-5 w-5" aria-hidden /></div>
      <div className="flex-1">
        <h3 className="text-xl font-semibold tracking-tight">Newsletter</h3>
        <p className="mt-1 text-sm leading-relaxed text-white/55">Les nouveaux articles et rendez-vous, directement par email.</p>
        <Button
          type="button"
          size="sm"
          variant={subscribed ? 'outline' : 'primary'}
          onClick={() => void toggle()}
          disabled={busy || subscribed == null}
          className="mt-5 font-semibold"
        >
          {subscribed ? <Check className="h-4 w-4" aria-hidden /> : <Mail className="h-4 w-4" aria-hidden />}
          {subscribed ? (busy ? 'Mise à jour…' : 'Abonné · Se désabonner') : (busy ? 'Abonnement…' : 'M’abonner')}
        </Button>
      </div>
    </div>
  );
}
