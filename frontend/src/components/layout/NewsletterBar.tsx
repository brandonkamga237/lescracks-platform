import { useState } from 'react';

import { useNewsletter } from '@/hooks/useNewsletter';

/** The newsletter offer, once per page, after the content: a strip above the header cost every page its first lines. */
export default function NewsletterBar() {
  const { audience, subscribed, busy, emailSent, failure, subscribeMember, subscribeEmail } = useNewsletter();
  const [email, setEmail] = useState('');

  if (!audience || subscribed === true) return null;

  async function subscribePublic(event: React.FormEvent) {
    event.preventDefault();
    if (await subscribeEmail(email)) setEmail('');
  }

  return (
    <section aria-label="Newsletter" className="border-t border-line-soft bg-black">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-t2 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <p className="text-sm text-t2">
          <span className="font-medium text-t1">Les nouveaux articles et rendez-vous arrivent par email.</span>
          {audience === 'member' ? ' Ne manque rien.' : ' Inscris-toi pour les recevoir.'}
        </p>
        {audience === 'member' && subscribed === false && (
          <button type="button" disabled={busy} onClick={() => void subscribeMember()} className="btn-primary shrink-0 self-start lg:self-auto">
            {busy ? 'Abonnement…' : 'M’abonner à la newsletter'}
          </button>
        )}
        {audience === 'member' && subscribed === null && <span className="sr-only">Vérification de ton abonnement…</span>}
        {audience === 'visitor' && !emailSent && (
          <form onSubmit={subscribePublic} className="flex w-full gap-2 lg:w-auto">
            {/* 16px text: anything smaller makes iOS zoom the page on focus. */}
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ton@email.com"
              aria-label="Ton adresse email"
              className="input min-w-0 flex-1 text-base lg:w-72 lg:flex-none"
              disabled={busy}
            />
            <button type="submit" disabled={busy} className="btn-primary shrink-0">
              {busy ? '…' : 'M’abonner'}
            </button>
          </form>
        )}
        {audience === 'visitor' && emailSent && (
          <p role="status" className="text-sm font-medium text-gold-ink">Presque fini : confirme ton inscription avec le lien reçu par email.</p>
        )}
        {failure && <p role="alert" className="text-sm text-error-ink">{failure}</p>}
      </div>
    </section>
  );
}
