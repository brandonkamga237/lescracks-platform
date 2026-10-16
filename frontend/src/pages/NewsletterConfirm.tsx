import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import Layout from '@/components/layout/Layout';
import SEO from '@/components/common/SEO';
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

  return <Layout>
    <SEO title="Confirmer l’inscription" description="Confirme ton inscription à la newsletter LesCracks." url="/newsletter/confirmer" />
    <div className="mx-auto max-w-lg px-5 py-16 sm:py-24">
      <section className="mode-raised rounded-lg p-6 sm:p-9">
        <p className="kicker">LesCracks / Newsletter</p>
        <h1 className="mt-4 font-display text-3xl font-bold">{state === 'done' ? 'Bienvenue.' : 'Confirmer ton inscription'}</h1>
        {state === 'done' ? (
          <p role="status" className="mt-4 text-sm leading-relaxed text-t3">C’est confirmé : les nouvelles ressources et les prochains ateliers arriveront dans ta boîte mail.</p>
        ) : (
          <>
            <p className="mt-4 text-sm leading-relaxed text-t3">Un clic pour recevoir la newsletter LesCracks.</p>
            {error && <p role="alert" className="mt-5 rounded border border-error/20 p-3 text-sm text-error-ink">{error}</p>}
            {token && (
              <button type="button" onClick={() => void confirm()} disabled={state === 'busy'} className="btn-primary mt-7 w-full">
                {state === 'busy' && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />}
                {state === 'busy' ? 'Confirmation…' : 'Confirmer mon inscription'}
              </button>
            )}
          </>
        )}
        <Link to="/ressources" className="mt-6 block text-center text-sm font-medium text-gold-ink underline-offset-4 hover:underline">Voir les ressources</Link>
      </section>
    </div>
  </Layout>;
}
