import { useState } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

import FilterChips from '@/components/common/FilterChips';
import Pagination from '@/components/common/Pagination';
import SEO from '@/components/common/SEO';
import { CardSkeletonGrid } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import Layout from '@/components/layout/Layout';
import { PageHeader, Section, Toolbar } from '@/components/layout/Page';
import { useApi } from '@/hooks/useApi';
import { api } from '@/services/api';
import type { EventFormat, EventSummary, EventType } from '@/services/types';

const types: Array<[EventType, string]> = [
  ['BOOTCAMP', 'Bootcamp'], ['WORKSHOP', 'Atelier'], ['WEBINAR', 'Webinaire'], ['CONFERENCE', 'Conférence'],
];
const formats: Array<[EventFormat, string]> = [['ONLINE', 'En ligne'], ['OFFLINE', 'Sur place'], ['HYBRID', 'Hybride']];
const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
const shortDate = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

interface EventRowProps {
  event: EventSummary;
}

function EventRow({ event }: EventRowProps) {
  const [failedImage, setFailedImage] = useState<string | undefined>(undefined);
  const location = useLocation();
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : null;
  const hasDate = !Number.isNaN(start.getTime());
  const hasEndDate = end && !Number.isNaN(end.getTime());
  const now = Date.now();
  const status = event.status === 'CANCELLED' ? 'Annulé' : event.status === 'COMPLETED' || (hasEndDate && end.getTime() < now) ? 'Terminé' : hasDate && start.getTime() > now ? 'À venir' : hasEndDate ? 'En cours' : 'Date passée';

  return (
    <Link
      to={`/evenements/${event.id}`}
      state={{ cataloguePath: `${location.pathname}${location.search}` }}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-white/[0.06] bg-noir-900 shadow-sm transition-all duration-300 hover:border-white/[0.12] hover:shadow-2xl hover:shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
    >
      <div className="aspect-[16/10] w-full overflow-hidden bg-noir-800">
        {event.coverImage && failedImage !== event.coverImage ? (
          <img src={event.coverImage} alt="" loading="lazy" onError={() => setFailedImage(event.coverImage)} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-end bg-noir-800 p-6" aria-hidden>
            <span className="font-display text-5xl font-semibold leading-none text-white/10">{types.find(([value]) => value === event.type)?.[1]}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-4 text-sm">
          {hasDate ? <time dateTime={event.startDate} className="font-medium text-gold-300">{shortDate.format(start)}</time> : <span className="text-t4">Date non renseignée</span>}
          <span className="text-xs text-t4">{status}</span>
        </div>
        <h2 className="mt-3 break-words font-display text-lg font-semibold leading-snug text-t1 transition-colors group-hover:text-gold-300">{event.title}</h2>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-t3">{event.description}</p>
        <p className="mt-auto border-t border-line-soft/50 pt-4 text-xs text-t4">
          {types.find(([value]) => value === event.type)?.[1]}
          {' · '}
          {formats.find(([value]) => value === event.format)?.[1]}
          {event.location ? ` · ${event.location}` : ''}
          {hasEndDate && <> · jusqu’au <time dateTime={event.endDate}>{dateFormat.format(end)}</time></>}
        </p>
      </div>
    </Link>
  );
}

export default function Evenements() {
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
      <Section spacing="tight">
        <PageHeader
          title="Événements"
          description="Des rendez-vous pour pratiquer, poser tes questions et rencontrer la communauté."
          meta={!events.loading && !events.error ? `${total} événement${total > 1 ? 's' : ''}` : undefined}
        />

        <Toolbar>
          <FilterChips legend="Type de rendez-vous" allLabel="Tous les types" options={types} value={type} onChange={(value) => setParam('type', value ?? null)} />
          <span className="hidden h-6 w-px bg-line-soft sm:block" aria-hidden />
          <FilterChips legend="Format" allLabel="Tous les formats" options={formats} value={format} onChange={(value) => setParam('format', value ?? null)} />
          {hasFilters && (
            <button type="button" onClick={() => setParams({})} className="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm text-t3 transition-colors hover:text-t1">
              <X className="h-4 w-4" aria-hidden />Effacer
            </button>
          )}
        </Toolbar>

        <div aria-label="Événements" aria-live="polite" aria-busy={events.loading} role="region">
          {events.loading && <CardSkeletonGrid count={6} />}
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
          {!events.loading && !events.error && list.length > 0 && (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{list.map((event) => <EventRow key={event.id} event={event} />)}</div>
              <Pagination page={page} totalPages={events.data?.totalPages ?? 0} onPageChange={(value) => setParam('page', value === 1 ? null : String(value))} />
            </>
          )}
        </div>
      </Section>
    </Layout>
  );
}
