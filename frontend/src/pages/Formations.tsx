import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';

import SEO from '@/components/common/SEO';
import Layout from '@/components/layout/Layout';
import { PageHeader, Section } from '@/components/layout/Page';
import { useSession } from '@/hooks/useSession';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';

const PROMISES = [
  'Des parcours complets, du premier pas jusqu’au projet.',
  'Des chapitres courts, des exercices et un fil conducteur.',
  'Ta progression suivie d’un chapitre à l’autre.',
] as const;

/**
 * Courses are not built yet. The page states what is coming and collects the people who want
 * to know when it opens, through the newsletter they would get the announcement from anyway.
 */
export default function Formations() {
  const { isSignedIn, isAdmin } = useSession();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState('');

  async function notifyMe(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setState('busy');
    setError('');
    try {
      if (isSignedIn) await api.newsletterSubscribe();
      else await api.newsletterPublicSubscribe({ email: email.trim() });
      setState('done');
    } catch (cause) {
      setState('idle');
      setError(cause instanceof ApiError ? cause.message : 'Impossible de joindre le serveur. Réessaie dans un instant.');
    }
  }

  return (
    <Layout>
      <SEO title="Formations" description="Les formations LesCracks arrivent : des parcours complets, étape par étape, pour passer à la pratique en tech." url="/formations" />
      <Section tone="raised" spacing="header">
        <PageHeader eyebrow="Bientôt disponible" title="Formations" description="Des parcours complets, étape par étape, pour apprendre une technologie et passer à la pratique." />
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start lg:gap-16">
          <ul className="space-y-4">
            {PROMISES.map((promise) => (
              <li key={promise} className="flex gap-3 text-base leading-relaxed text-t2">
                <Check className="mt-1 h-4 w-4 shrink-0 text-gold-ink" strokeWidth={3} aria-hidden />
                {promise}
              </li>
            ))}
          </ul>

          <div className="rounded-lg border border-line bg-card p-6 sm:p-8">
            <h2 className="font-display text-2xl font-bold text-t1">Être prévenu à l’ouverture</h2>
            {state === 'done' ? (
              <p role="status" className="mt-4 text-sm leading-relaxed text-gold-ink">
                {isSignedIn ? 'C’est noté : tu recevras l’annonce par email.' : 'Presque fini : confirme ton adresse avec le lien reçu par email.'}
              </p>
            ) : isAdmin ? (
              <p className="mt-4 text-sm text-t3">L’annonce partira par la newsletter.</p>
            ) : isSignedIn ? (
              <>
                <p className="mt-3 text-sm leading-relaxed text-t3">L’annonce partira par la newsletter. Un clic pour la recevoir.</p>
                <button type="button" onClick={() => void notifyMe()} disabled={state === 'busy'} className="btn-primary mt-6 w-full">
                  {state === 'busy' && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />}
                  Me prévenir
                </button>
              </>
            ) : (
              <form onSubmit={(event) => void notifyMe(event)} className="mt-5">
                <label htmlFor="formations-email" className="text-sm font-medium text-t2">Ton adresse email</label>
                <input id="formations-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="input mt-2" />
                <button type="submit" disabled={state === 'busy'} className="btn-primary mt-4 w-full">
                  {state === 'busy' && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />}
                  Me prévenir
                </button>
              </form>
            )}
            {error && <p role="alert" className="mt-4 text-sm text-error-ink">{error}</p>}
            <p className="mt-6 border-t border-line-soft pt-5 text-sm text-t3">En attendant, <Link to="/blog" className="link">lis le blog</Link> ou <Link to="/cracklab" className="link">relève un challenge</Link>.</p>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
