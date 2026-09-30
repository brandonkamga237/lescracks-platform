import { CalendarDays, X } from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';

import AgendaItem from '@/components/events/AgendaItem';
import EventSpotlight from '@/components/events/EventSpotlight';
import FilterChips from '@/components/common/FilterChips';
import Pagination from '@/components/common/Pagination';
import SEO from '@/components/common/SEO';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import Layout from '@/components/layout/Layout';
import { PageHeader, Section, Toolbar } from '@/components/layout/Page';
import { useApi } from '@/hooks/useApi';
import { api } from '@/services/api';
import type { EventFormat, EventType } from '@/services/types';

const types: Array<[EventType, string]> = [
  ['BOOTCAMP', 'Bootcamp'], ['WORKSHOP', 'Atelier'], ['WEBINAR', 'Webinaire'], ['CONFERENCE', 'Conférence'],
];
const formats: Array<[EventFormat, string]> = [['ONLINE', 'En ligne'], ['OFFLINE', 'Sur place'], ['HYBRID', 'Hybride']];

/**
 * The events page as a magazine agenda.
 *
 * Unfiltered, it announces the next rendez-vous like a headline, then lists the
 * rest chronologically; the archive sits quietly at the bottom. Filtered, the
 * page collapses to the ruled agenda list alone.
 */
export default function Evenements() {
  const location = useLocation();
  const cataloguePath = `${location.pathname}${location.search}`;
  const [params, setParams] = useSearchParams();
  const type = types.find(([value]) => value === params.get('type'))?.[0];
  const format = formats.find(([value]) => value === params.get('format'))?.[0];
  const rawPage = params.get('page') ?? '';
  const parsedPage = Number(rawPage);
  const page = /^[1-9]\d*$/.test(rawPage) && Number.isSafeInteger(parsedPage) && parsedPage <= 2147483647 ? parsedPage : 1;
  const events = useApi((signal) => api.events({ type, format, page: page - 1, size: 12 }, signal), [type, format, page]);
  const list = events.data?.content ?? [];
  const hasFilters = Boolean(type || format);
  const total = events.data?.totalElements ?? 0;
  const discovery = !hasFilters && page === 1;
  // The archive only exists on the discovery view; no point fetching it under filters.
  const past = useApi((signal) => discovery ? api.pastEvents(0, 4, signal) : Promise.resolve(null), [discovery]);
  const spotlight = discovery ? list[0] : undefined;
  const agenda = spotlight ? list.slice(1) : list;
  const spotlightDate = spotlight ? new Date(spotlight.startDate).getTime() : 0;

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  }

  return (
    <Layout>
      <SEO title="Événements et ateliers tech" description="Bootcamps, ateliers, webinaires et conférences : découvre les rendez-vous LesCracks pour apprendre et pratiquer ensemble." url="/evenements" />
      <Section tone="light" spacing="tight">
        <PageHeader
          eyebrow="En ligne et sur place"
          title="Agenda"
          description="Des rendez-vous pour pratiquer, poser tes questions et rencontrer la communauté."
          meta={!events.loading && !events.error ? `${total} événement${total > 1 ? 's' : ''}` : undefined}
        />

        <Toolbar>
          <FilterChips legend="Type de rendez-vous" allLabel="Tous les types" options={types} value={type} onChange={(value) => setParam('type', value ?? null)} />
          <FilterChips legend="Format" allLabel="Tous les formats" options={formats} value={format} onChange={(value) => setParam('format', value ?? null)} />
          {hasFilters && (
            <button type="button" onClick={() => setParams({})} className="inline-flex min-h-11 items-center gap-1.5 pb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-t3 transition-colors hover:text-t1">
              <X className="h-4 w-4" aria-hidden />Effacer
            </button>
          )}
        </Toolbar>
      </Section>

      <Section>
        <div aria-label="Événements" aria-live="polite" aria-busy={events.loading} role="region">
          {events.loading && list.length === 0 && (
            <div role="status" className="space-y-5">
              {discovery && <Skeleton className="h-40 sm:h-56" />}
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
              <span className="sr-only">Chargement des événements…</span>
            </div>
          )}
          {events.error && <ErrorState title="L’agenda est momentanément indisponible." message={events.error.message} onRetry={events.reload} />}
          {!events.loading && !events.error && list.length === 0 && (
            <EmptyState
              icon={<CalendarDays className="h-8 w-8" aria-hidden />}
              title={page > 1 ? 'Cette page ne contient aucun rendez-vous.' : hasFilters ? 'Aucun rendez-vous ne correspond à ces filtres.' : 'Les prochains rendez-vous se préparent.'}
              description={hasFilters ? 'Essaie un autre type ou un autre format pour découvrir les événements disponibles.' : page > 1 ? 'Retrouve les événements disponibles sur la première page.' : 'Aucun événement n’est publié pour le moment. Reviens bientôt consulter l’agenda.'}
              action={(hasFilters || page > 1) && (
                <button type="button" onClick={page > 1 ? () => setParam('page', null) : () => setParams({})} className="btn-secondary">
                  {page > 1 ? 'Revenir à la première page' : 'Voir tous les événements'}
                </button>
              )}
            />
          )}
          {!events.error && list.length > 0 && (
            <div className={`transition-opacity ${events.loading ? 'opacity-60' : ''}`}>
              {spotlight && (
                <div className="mb-12">
                  <EventSpotlight
                    event={spotlight}
                    kicker={spotlightDate > Date.now() ? 'Prochain rendez-vous' : 'À l’affiche'}
                    cataloguePath={cataloguePath}
                  />
                </div>
              )}
              {agenda.length > 0 && (
                <ul className="border-b border-line">
                  {agenda.map((event) => <AgendaItem key={event.id} event={event} cataloguePath={cataloguePath} />)}
                </ul>
              )}
              <Pagination page={page} totalPages={events.data?.totalPages ?? 0} onPageChange={(value) => setParam('page', value === 1 ? null : String(value))} />
            </div>
          )}
        </div>
      </Section>

      {/* The archive: quiet, unfiltered view only — the past never competes with what's next. */}
      {discovery && !!past.data?.content.length && (
        <Section tone="light" aria-labelledby="past-events-heading">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <h2 id="past-events-heading" className="font-display text-4xl font-bold leading-[0.96] tracking-tight text-t1 sm:text-5xl">Déjà passés</h2>
            <span className="label">Les rendez-vous précédents</span>
          </div>
          <ul aria-label="Événements passés" className="border-b border-line opacity-80">
            {past.data.content.map((event) => <AgendaItem key={event.id} event={event} cataloguePath={cataloguePath} />)}
          </ul>
        </Section>
      )}
    </Layout>
  );
}
