import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';

import SEO from '@/components/common/SEO';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Notice, TextField } from '@/components/ui/field';
import { PageHero } from '@/components/ui/page-hero';
import { useSession } from '@/hooks/useSession';
import { track } from '@/lib/analytics';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';

const PROMISES = [
  { title: 'Des parcours complets', text: 'Du premier pas jusqu’au projet, sans trou entre deux tutoriels.' },
  { title: 'Des chapitres courts', text: 'Des exercices et un fil conducteur, à ton rythme.' },
  { title: 'Ta progression suivie', text: 'Tu reprends là où tu t’es arrêté, d’un chapitre à l’autre.' },
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
      track('Abonnement newsletter', { compte: isSignedIn ? 'membre' : 'visiteur', depuis: 'formations' });
    } catch (cause) {
      setState('idle');
      setError(cause instanceof ApiError ? cause.message : 'Impossible de joindre le serveur. Réessaie dans un instant.');
    }
  }

  const busy = state === 'busy' && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />;

  return (
    <>
      <SEO title="Cours" description="Les cours LesCracks arrivent : des parcours complets, étape par étape, pour passer à la pratique en tech." url="/cours" />
      <PageHero
        id="courses-title"
        eyebrow="Cours"
        title={['Apprendre pas à pas.', { text: 'Bientôt ici.', className: 'text-white/40' }]}
        lead="Des parcours complets, leçon après leçon, pour apprendre une technologie et passer à la pratique. Certains en accès libre, d’autres en premium."
      >
        <Badge>Bientôt</Badge>
      </PageHero>

      <Container className="pb-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-16">
          <Stagger className="border-t border-white/10">
            {PROMISES.map((promise) => (
              <StaggerItem key={promise.title} className="flex gap-5 border-b border-white/10 py-7">
                <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-400/15 text-gold-400"><Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /></span>
                <span>
                  <span className="block text-xl font-medium tracking-tight sm:text-2xl">{promise.title}</span>
                  <span className="mt-1.5 block text-[15px] leading-relaxed text-white/55">{promise.text}</span>
                </span>
              </StaggerItem>
            ))}
          </Stagger>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <p className="text-sm font-medium text-gold-400">À l’ouverture</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Sois prévenu en premier.</h2>
            {state === 'done' && <Notice tone="info" className="mt-5">{isSignedIn ? 'C’est noté : tu recevras l’annonce par email.' : 'Presque fini : confirme ton adresse avec le lien reçu par email.'}</Notice>}
            {state !== 'done' && isAdmin && <p className="mt-4 text-sm text-white/55">L’annonce partira par la newsletter.</p>}
            {state !== 'done' && !isAdmin && isSignedIn && (
              <>
                <p className="mt-3 text-sm leading-relaxed text-white/55">L’annonce partira par la newsletter. Un clic pour la recevoir.</p>
                <Button type="button" size="lg" onClick={() => void notifyMe()} disabled={state === 'busy'} className="mt-6 w-full font-semibold">{busy}Me prévenir</Button>
              </>
            )}
            {state !== 'done' && !isSignedIn && (
              <form onSubmit={(event) => void notifyMe(event)} className="mt-6 space-y-4">
                <TextField id="courses-email" label="Ton adresse email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                <Button type="submit" size="lg" disabled={state === 'busy'} className="w-full font-semibold">{busy}Me prévenir</Button>
              </form>
            )}
            {error && <Notice tone="error" className="mt-4">{error}</Notice>}
            <p className="mt-6 border-t border-white/10 pt-5 text-sm text-white/55">En attendant, <Link to="/blog" className="text-gold-400 underline-offset-4 hover:underline">lis le blog</Link> ou <Link to="/talk" className="text-gold-400 underline-offset-4 hover:underline">regarde le Talk</Link>.</p>
          </div>
        </div>
      </Container>
    </>
  );
}
