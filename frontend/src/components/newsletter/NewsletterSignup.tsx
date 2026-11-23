import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { ArrowRight, CircleCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useNewsletter } from '@/hooks/useNewsletter';
import { EASE } from '@/lib/motion';

const NOTE = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, ease: EASE } };

/**
 * Subscribing to the newsletter the way the viewer can: a member in one click, a visitor with
 * an email they confirm. Nothing is offered to an admin.
 */
export default function NewsletterSignup({ id = 'newsletter-email' }: { id?: string }) {
  const { audience, subscribed, busy, emailSent, failure, subscribeMember, subscribeEmail } = useNewsletter();
  const [email, setEmail] = useState('');
  const [invalid, setInvalid] = useState(false);
  const field = useAnimationControls();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!event.currentTarget.checkValidity()) {
      setInvalid(true);
      void field.start({ x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.4 } });
      return;
    }
    setInvalid(false);
    if (await subscribeEmail(email)) setEmail('');
  };

  if (!audience) return null;

  const note = emailSent || subscribed
    ? { key: 'done', className: 'flex items-center gap-2 text-gold-400', text: subscribed ? 'Tu reçois déjà la newsletter.' : 'C’est noté : confirme ton inscription depuis l’e-mail reçu.', role: 'status' }
    : failure || invalid
      ? { key: 'error', className: 'text-error-ink', text: invalid ? 'Saisis une adresse e-mail valide.' : failure, role: 'alert' }
      : { key: 'help', className: 'text-white/45', text: audience === 'member' ? 'Un clic, et tu les reçois. Désinscription en un clic.' : 'Un e-mail de confirmation t’est envoyé. Désinscription en un clic.', role: undefined };

  return (
    <div className="mt-6">
      {audience === 'member' ? (
        !subscribed && (
          <Button type="button" size="lg" disabled={busy || subscribed === null} onClick={() => void subscribeMember()}>
            {busy ? 'Abonnement…' : 'M’abonner à la newsletter'}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Button>
        )
      ) : (
        !emailSent && (
          <form onSubmit={submit} noValidate>
            <label htmlFor={id} className="sr-only">Adresse e-mail</label>
            <motion.div animate={field} className="flex items-center gap-2 rounded-full border border-white/12 bg-black/60 p-1.5 transition-colors focus-within:border-gold-400/60">
              {/* 16px text: anything smaller makes iOS zoom the page on focus. */}
              <input
                id={id}
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ton@email.com"
                aria-describedby={`${id}-note`}
                aria-invalid={invalid || undefined}
                className="min-w-0 flex-1 bg-transparent px-4 text-base text-white placeholder:text-white/35 focus:outline-none"
              />
              <Button type="submit" size="md" disabled={busy} className="text-sm font-semibold">
                {busy ? 'Envoi…' : 'S’inscrire'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Button>
            </motion.div>
          </form>
        )
      )}
      <div id={`${id}-note`} aria-live="polite" className="mt-3 min-h-5 text-[13px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={note.key} {...NOTE} role={note.role} className={note.className}>
            {note.key === 'done' && <CircleCheck className="h-4 w-4 shrink-0" aria-hidden="true" />}
            {note.text}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
