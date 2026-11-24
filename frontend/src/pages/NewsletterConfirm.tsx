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

/** Reached from the confirmation email after a sign-up on the public form. */
export default function NewsletterConfirm() {
  const token = new URLSearchParams(useLocation().search).get('token');
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState(token ? '' : 'Ce lien est incomplet.');

  async function confirm() {
    if (!token) return;
    setState('busy');
    setError('');
    try {
      await api.newsletterConfirm(token);
      setState('done');
    } catch (cause) {
      setState('idle');
      setError(cause instanceof ApiError ? cause.message : 'Impossible de joindre le serveur. Réessaie dans un instant.');
    }
  }

  return (
    <AuthShell>
      <SEO title="Confirmer l’inscription" description="Confirme ton inscription à la newsletter LesCracks." url="/newsletter/confirmer" />
      <div className="w-full max-w-md">
        <AuthCard
          eyebrow="Newsletter"
          title={state === 'done' ? 'Bienvenue.' : 'Confirme ton inscription.'}
          lead={state === 'done' ? 'C’est confirmé : les nouveaux articles et les prochains ateliers arriveront dans ta boîte mail.' : 'Un clic pour recevoir la newsletter LesCracks.'}
        >
          {error && <Notice tone="error" className="mt-6">{error}</Notice>}
          {state !== 'done' && token && (
            <Button type="button" size="lg" onClick={() => void confirm()} disabled={state === 'busy'} className="mt-8 w-full font-semibold">
              {state === 'busy' && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
              {state === 'busy' ? 'Confirmation…' : 'Confirmer mon inscription'}
            </Button>
          )}
          <p className="mt-8 border-t border-white/10 pt-6 text-center text-sm"><Link to="/blog" className="font-medium text-gold-400 underline-offset-4 hover:underline">Lire le blog</Link></p>
        </AuthCard>
      </div>
    </AuthShell>
  );
}
