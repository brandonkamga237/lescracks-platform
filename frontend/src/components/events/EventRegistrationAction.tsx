import { Link, useLocation } from 'react-router-dom';

import ShareButton from '@/components/common/ShareButton';
import { eventPath } from '@/lib/slugs';
import { ArrowRight, Check, Loader2, Send, Users } from 'lucide-react';

import type { EventRegistrationState } from '@/hooks/useEventRegistration';
import type { EventSummary } from '@/services/types';

interface EventRegistrationActionProps {
  event: EventSummary;
  state: EventRegistrationState;
  /** The block under the title, or the bar that follows the reader. */
  variant: 'hero' | 'bar';
}

const dayFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });

function scrollToProject() {
  document.getElementById('project-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * The one thing an event page asks: « Je participe ». A member registers in one tap; a visitor
 * creates an account and comes back here. Once registered, a hackathon's next step is the project.
 */
export default function EventRegistrationAction({ event, state, variant }: EventRegistrationActionProps) {
  const { pathname } = useLocation();
  const bar = variant === 'bar';
  const size = bar ? 'shrink-0' : 'min-h-14 w-full px-8 text-base shadow-[0_0_0_6px_rgba(212,175,55,0.15)] sm:w-auto';
  const deadline = event.acceptsSubmissions && event.submissionsCloseAt ? `Projets jusqu’au ${dayFormat.format(new Date(event.submissionsCloseAt))}` : null;
  const people = state.count > 0 ? `${state.count.toLocaleString('fr-FR')} ${state.count > 1 ? 'inscrits' : 'inscrit'}` : null;

  let action;
  if (state.isAdmin) {
    action = bar ? null : <p className="text-sm text-t3">Les inscriptions se suivent dans l’administration.</p>;
  } else if (state.member && state.registered) {
    action = event.acceptsSubmissions ? (
      <button type="button" onClick={scrollToProject} className={`btn-primary ${size}`}><Send className="h-4 w-4" aria-hidden />Soumettre mon projet</button>
    ) : (
      <span className={`inline-flex items-center gap-2 rounded border border-gold-400/40 bg-gold-400/10 px-4 py-2.5 text-sm font-semibold text-gold-ink ${bar ? 'shrink-0' : ''}`}><Check className="h-4 w-4" aria-hidden />Tu participes</span>
    );
  } else if (state.member) {
    action = (
      <button type="button" disabled={state.busy || state.pending} onClick={() => void state.toggle()} className={`btn-primary ${size}`}>
        {state.busy ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : null}Je participe{!state.busy && <ArrowRight className="h-4 w-4" aria-hidden />}
      </button>
    );
  } else {
    action = <Link to="/inscription" state={{ from: pathname }} className={`btn-primary ${size}`}>Je participe<ArrowRight className="h-4 w-4" aria-hidden /></Link>;
  }

  if (bar) {
    return (
      <>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-t1">{event.title}</p>
          <p className="truncate text-xs text-t3">{[state.member && state.registered ? 'Tu participes' : people, deadline].filter(Boolean).join(' · ') || 'Inscription en un clic'}</p>
        </div>
        {action}
      </>
    );
  }

  return (
    <div className="mt-7 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <div className="flex items-center gap-3">
          {action}
          <ShareButton title={event.title} path={eventPath(event)} label="Partager le rendez-vous" iconOnly className="shrink-0" />
        </div>
        {(people || deadline) && (
          <p className="flex items-center gap-2 text-sm text-t2">
            {people && <><Users className="h-4 w-4 shrink-0 text-gold-ink" aria-hidden />{people}</>}
            {people && deadline && <span aria-hidden className="text-t4">·</span>}
            {deadline}
          </p>
        )}
      </div>
      {state.member && state.registered && (
        <p className="text-sm text-t3">
          {event.acceptsSubmissions && <span className="mr-2 inline-flex items-center gap-1.5 font-medium text-gold-ink"><Check className="h-4 w-4" aria-hidden />Inscription confirmée.</span>}
          <button type="button" disabled={state.busy} onClick={() => void state.toggle()} className="underline-offset-4 hover:text-t1 hover:underline disabled:opacity-50">
            {state.busy ? 'Annulation…' : 'Annuler ma participation'}
          </button>
        </p>
      )}
      {!state.member && !state.isAdmin && (
        <p className="text-sm text-t3">Il faut un compte LesCracks. Déjà membre ? <Link to="/connexion" state={{ from: pathname }} className="link">Se connecter</Link></p>
      )}
      {state.failure && <p role="alert" className="text-sm text-error-ink">{state.failure}</p>}
    </div>
  );
}
