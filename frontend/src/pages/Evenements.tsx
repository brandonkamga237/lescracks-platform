import { useSearchParams } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';

import SEO from '@/components/common/SEO';
import EventCard from '@/components/events/EventCard';
import EventFeature from '@/components/events/EventFeature';
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
    `events:${view}:${page}`,
  );
  const nothingAhead = view === 'upcoming' && !events.loading && !events.error && (events.data?.content.length ?? 0) === 0;
  // Nothing announced yet: the page still shows something to look at, the latest ones that took place.
  const lately = useApi((signal) => (nothingAhead ? api.pastEvents(0, 6, signal) : Promise.resolve(null)), [nothingAhead], nothingAhead ? 'events:past:lately' : undefined);
  const mine = useApi((signal) => (member ? api.myEvents(signal) : Promise.resolve([])), [member], member ? `my-events:${user?.id}` : undefined);
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
          <div role="tablist" aria-label="Période" className="flex w-full rounded-full border border-white/10 bg-white/[0.03] p-1 sm:inline-flex sm:w-auto">
            {VIEWS.map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={view === key} onClick={() => show(key)}
                className={cn('h-9 flex-1 whitespace-nowrap rounded-full px-5 text-sm transition-[color,background-color] duration-200 active:scale-95 motion-reduce:active:scale-100 sm:flex-none', view === key ? 'bg-gold-400 font-medium text-black' : 'text-white/60 hover:text-white')}>
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
          {!events.loading && !events.error && list.length === 0 && view === 'past' && (
            <EmptyPanel title="Aucun rendez-vous passé pour l’instant." description="Les rendez-vous terminés apparaîtront ici." />
          )}
          {nothingAhead && (
            <>
              <p className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white/65">
                <CalendarClock className="h-5 w-5 shrink-0 text-gold-400" aria-hidden="true" />
                Le prochain rendez-vous se prépare. En attendant, retrouve les derniers ci-dessous.
              </p>
              {!!lately.data?.content.length && (
                <section aria-labelledby="lately-title" className="mt-8">
                  <h2 id="lately-title" className="mb-3 text-lg font-semibold tracking-tight">Les derniers rendez-vous</h2>
                  <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {lately.data.content.map((event) => <li key={event.id}><EventCard event={event} past registered={registered.has(event.id)} /></li>)}
                  </ul>
                </section>
              )}
            </>
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
