import { useSearchParams } from 'react-router-dom';

import SEO from '@/components/common/SEO';
import EventCard from '@/components/events/EventCard';
import EventFeature from '@/components/events/EventFeature';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Pager } from '@/components/ui/pager';
import { EmptyPanel, ErrorPanel } from '@/components/ui/panels';
import { SpaceHeader } from '@/components/ui/space-header';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { withoutHackathons } from '@/lib/events';
import { LIST_PAGE_SIZE } from '@/lib/filters';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';

type View = 'upcoming' | 'past';

const VIEWS: Array<[View, string]> = [['upcoming', 'À venir'], ['past', 'Passés']];

function pageNumber(value: string | null): number {
  if (!value || !/^[1-9]\d{0,5}$/.test(value)) return 1;
  return Number(value);
}

/** The agenda in two tabs: what is coming, the next one featured, and what already took place. */
export default function Evenements() {
  const [params, setParams] = useSearchParams();
  const view: View = params.get('vue') === 'passes' ? 'past' : 'upcoming';
  const page = pageNumber(params.get('page'));
  const { isSignedIn, isAdmin, user } = useSession();
  const member = Boolean(isSignedIn && !isAdmin && user);

  const events = useApi(
    (signal) => (view === 'past' ? api.pastEvents(page - 1, LIST_PAGE_SIZE, signal) : api.upcomingEvents(page - 1, LIST_PAGE_SIZE, signal)),
    [view, page],
  );
  const mine = useApi((signal) => (member ? api.myEvents(signal) : Promise.resolve([])), [member]);
  const registered = new Set(mine.data?.map((event) => event.id));

  // LesCracks no longer runs hackathons: the coming ones would only be leftovers.
  const list = view === 'upcoming' ? withoutHackathons(events.data?.content ?? []) : events.data?.content ?? [];
  const featured = view === 'upcoming' && page === 1 ? list[0] : undefined;
  const cards = featured ? list.slice(1) : list;
  const total = events.data?.totalElements ?? 0;

  function show(next: View) {
    setParams(next === 'past' ? { vue: 'passes' } : {});
  }

  return (
    <>
      <SEO title="Rendez-vous tech" description="Ateliers, webinaires et conférences : découvre les rendez-vous LesCracks pour apprendre et pratiquer ensemble." url="/rendez-vous" />
      <SpaceHeader
        title="Rendez-vous"
        meta={!events.loading && !events.error ? `${total} ${view === 'past' ? 'passé' : 'à venir'}${total > 1 && view === 'past' ? 's' : ''}` : undefined}
        lead="Chaque participation te vaut une attestation vérifiable."
        action={(
          <div role="tablist" aria-label="Période" className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
            {VIEWS.map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={view === key} onClick={() => show(key)}
                className={cn('h-9 rounded-full px-4 text-sm transition-colors', view === key ? 'bg-gold-400 font-medium text-black' : 'text-white/60 hover:text-white')}>
                {label}
              </button>
            ))}
          </div>
        )}
      />

      <Container className="pb-20">
        <div role="region" aria-label="Rendez-vous" aria-live="polite" aria-busy={events.loading}>
          {events.loading && list.length === 0 && (
            <div role="status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((index) => <div key={index} aria-hidden="true" className="h-80 animate-pulse rounded-3xl bg-white/[0.03] motion-reduce:animate-none" />)}
              <span className="sr-only">Chargement des rendez-vous…</span>
            </div>
          )}
          {events.error && <ErrorPanel title="L’agenda est momentanément indisponible." message={events.error.message} onRetry={events.reload} />}
          {!events.loading && !events.error && list.length === 0 && (
            <EmptyPanel
              title={view === 'past' ? 'Aucun rendez-vous passé pour l’instant.' : 'Les prochains rendez-vous se préparent.'}
              description={view === 'past' ? 'Les rendez-vous terminés apparaîtront ici.' : 'Rien n’est encore annoncé. En attendant, retrouve les rendez-vous précédents.'}
              action={view === 'upcoming' && <Button type="button" variant="outline" onClick={() => show('past')}>Voir les rendez-vous passés</Button>}
            />
          )}
          {!events.error && list.length > 0 && (
            <div className={cn('transition-opacity', events.loading && 'opacity-60')}>
              {featured && <div className="mb-6"><EventFeature event={featured} /></div>}
              {cards.length > 0 && (
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {cards.map((event) => <li key={event.id}><EventCard event={event} past={view === 'past'} registered={registered.has(event.id)} /></li>)}
                </ul>
              )}
              <Pager page={page} totalPages={events.data?.totalPages ?? 0} onPageChange={(value) => setParams({ ...(view === 'past' ? { vue: 'passes' } : {}), ...(value > 1 ? { page: String(value) } : {}) })} />
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
