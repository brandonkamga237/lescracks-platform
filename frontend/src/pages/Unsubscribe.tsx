import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import SEO from '@/components/common/SEO';
import AuthCard from '@/components/site/AuthCard';
import AuthShell from '@/components/site/AuthShell';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/field';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';

/**
 * Reached from the link at the bottom of every newsletter. It waits for a click: mail security
 * scanners open links on their own, and must not unsubscribe anyone by doing so.
 */
export default function Unsubscribe() {
  const token = new URLSearchParams(useLocation().search).get('token');
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState(token ? '' : 'Ce lien est incomplet.');

  async function confirm() {
    if (!token) return;
    setState('busy');
    setError('');
    try {
      await api.newsletterUnsubscribeByToken(token);
      setState('done');
    } catch (cause) {
      setState('idle');
      setError(cause instanceof ApiError ? cause.message : 'Impossible de joindre le serveur. Réessaie dans un instant.');
    }
  }

  return (
    <AuthShell>
      <SEO title="Se désabonner" description="Ne plus recevoir la newsletter LesCracks." url="/desabonnement" />
      <div className="w-full max-w-md">
        <AuthCard
          eyebrow="Newsletter"
          title={state === 'done' ? 'C’est fait.' : 'Se désabonner.'}
          lead={state === 'done' ? 'Tu ne recevras plus la newsletter. Le blog et les ateliers restent ouverts, à ton rythme.' : 'Tu ne recevras plus les nouveaux articles ni les prochains ateliers par email.'}
        >
          {error && <Notice tone="error" className="mt-6">{error}</Notice>}
          {state !== 'done' && token && (
            <Button type="button" size="lg" onClick={() => void confirm()} disabled={state === 'busy'} className="mt-8 w-full font-semibold">
              {state === 'busy' && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
              {state === 'busy' ? 'Désabonnement…' : 'Me désabonner'}
            </Button>
          )}
          <p className="mt-8 border-t border-white/10 pt-6 text-center text-sm"><Link to="/blog" className="font-medium text-gold-400 underline-offset-4 hover:underline">Lire le blog</Link></p>
        </AuthCard>
      </div>
    </AuthShell>
  );
}
