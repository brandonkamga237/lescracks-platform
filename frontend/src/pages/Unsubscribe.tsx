import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import Layout from '@/components/layout/Layout';
import SEO from '@/components/common/SEO';
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

  return <Layout>
    <SEO title="Se désabonner" description="Ne plus recevoir la newsletter LesCracks." url="/desabonnement" />
    <div className="mx-auto max-w-lg px-5 py-16 sm:py-24">
      <section className="mode-raised rounded-lg p-6 sm:p-9">
        <p className="kicker">LesCracks / Newsletter</p>
        <h1 className="mt-4 font-display text-3xl font-bold">{state === 'done' ? 'C’est fait.' : 'Se désabonner'}</h1>
        {state === 'done' ? (
          <p role="status" className="mt-4 text-sm leading-relaxed text-t3">Tu ne recevras plus la newsletter. Le blog et les ateliers restent ouverts, à ton rythme.</p>
        ) : (
          <>
            <p className="mt-4 text-sm leading-relaxed text-t3">Tu ne recevras plus les nouveaux articles ni les prochains ateliers par email.</p>
            {error && <p role="alert" className="mt-5 rounded border border-error/20 p-3 text-sm text-error-ink">{error}</p>}
            {token && (
              <button type="button" onClick={() => void confirm()} disabled={state === 'busy'} className="btn-primary mt-7 w-full">
                {state === 'busy' && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />}
                {state === 'busy' ? 'Désabonnement…' : 'Me désabonner'}
              </button>
            )}
          </>
        )}
        <Link to="/blog" className="mt-6 block text-center text-sm font-medium text-gold-ink underline-offset-4 hover:underline">Lire le blog</Link>
      </section>
    </div>
  </Layout>;
}
