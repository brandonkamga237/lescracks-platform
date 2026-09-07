import { useState } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import Pagination from '@/components/common/Pagination';
import SEO from '@/components/common/SEO';
import Layout from '@/components/layout/Layout';
import { useApi } from '@/hooks/useApi';
import { api } from '@/services/api';
import type { EventFormat, EventSummary, EventType } from '@/services/types';

const types: Array<[EventType, string]> = [
  ['BOOTCAMP', 'Bootcamp'], ['WORKSHOP', 'Atelier'], ['WEBINAR', 'Webinaire'], ['CONFERENCE', 'Conférence'],
];
const formats: Array<[EventFormat, string]> = [['ONLINE', 'En ligne'], ['OFFLINE', 'Sur place'], ['HYBRID', 'Hybride']];
const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

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
    <Link to={`/evenements/${event.id}`} state={{ cataloguePath: `${location.pathname}${location.search}` }} className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-noir-900 transition-colors hover:border-line-strong hover:bg-noir-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400">
      <div className="aspect-[21/9] w-full overflow-hidden bg-noir-800">
        {event.coverImage && failedImage !== event.coverImage ? <img src={event.coverImage} alt="" onError={() => setFailedImage(event.coverImage)} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-end bg-noir-800 p-5" aria-hidden><span className="font-display text-4xl font-semibold leading-none text-white/10">{types.find(([value]) => value === event.type)?.[1]}</span></div>}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between gap-4 text-sm">
          {hasDate ? <time dateTime={event.startDate} className="font-medium text-gold-300">{new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).format(start)}</time> : <span className="text-t4">Date non renseignée</span>}
          <span className="text-xs text-t4">{status}</span>
        </div>
        <h2 className="mt-4 break-words font-display text-xl font-semibold leading-snug text-t1 transition-colors group-hover:text-gold-300">{event.title}</h2>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-t3">{event.description}</p>
        <p className="mt-5 border-t border-line-soft pt-4 text-xs text-t4">
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
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <header className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-t1 sm:text-4xl">Événements</h1>
          {!events.loading && !events.error && <p className="text-sm text-t4">{total} événement{total > 1 ? 's' : ''}</p>}
        </header>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-t3">Des rendez-vous pour pratiquer, poser tes questions et rencontrer la communauté.</p>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4 border-y border-line-soft py-4">
          <fieldset className="flex flex-wrap items-center gap-1.5">
            <legend className="sr-only">Type de rendez-vous</legend>
            {[undefined, 'BOOTCAMP' as EventType, 'WORKSHOP' as EventType].map((value) => (
              <button
                key={value ?? 'all'}
                type="button"
                aria-pressed={type === value}
                onClick={() => setParam('type', value ?? null)}
                className={`rounded-md border-b-2 px-2.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${type === value ? 'border-gold-400 text-t1' : 'border-transparent text-t3 hover:text-t1'}`}
              >
                {value ? types.find(([option]) => option === value)![1] : 'Tous les types'}
              </button>
            ))}
          </fieldset>
          <fieldset className="flex flex-wrap items-center gap-1.5 border-l border-line-soft pl-6">
            <legend className="sr-only">Format</legend>
            {[undefined, ...formats.map(([value]) => value)].map((value) => (
              <button
                key={value ?? 'all'}
                type="button"
                aria-pressed={format === value}
                onClick={() => setParam('format', value ?? null)}
                className={`rounded-md border-b-2 px-2.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 ${format === value ? 'border-gold-400 text-t1' : 'border-transparent text-t3 hover:text-t1'}`}
              >
                {value ? formats.find(([option]) => option === value)![1] : 'Tous les formats'}
              </button>
            ))}
          </fieldset>
          {hasFilters && <button type="button" onClick={() => setParams({})} className="inline-flex items-center gap-1.5 text-sm text-t3 transition-colors hover:text-t1"><X className="h-3.5 w-3.5" aria-hidden />Effacer</button>}
        </div>
        <section className="mt-8" aria-label="Événements" aria-live="polite" aria-busy={events.loading}>
          {events.loading && <p className="py-20 text-center text-sm text-t3" role="status">Chargement des rendez-vous…</p>}
          {events.error && <div className="rounded-2xl border border-line bg-noir-900 px-6 py-16 text-center"><h3 className="font-display text-xl text-t1">L’agenda est momentanément indisponible.</h3><p className="mt-3 text-sm text-t3">{events.error.message}</p><button type="button" onClick={events.reload} className="mt-6 min-h-11 rounded-xl bg-gold-400 px-5 font-medium text-noir-950">Réessayer</button></div>}
          {!events.loading && !events.error && list.length === 0 && <div className="rounded-2xl border border-dashed border-line-strong bg-noir-900 px-6 py-16 text-center"><CalendarDays className="mx-auto mb-5 h-8 w-8 text-gold-400" aria-hidden /><h3 className="font-display text-2xl text-t1">{page > 1 ? 'Cette page ne contient aucun rendez-vous.' : hasFilters ? 'Aucun rendez-vous ne correspond à ces filtres.' : 'Les prochains rendez-vous se préparent.'}</h3><p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-t3">{hasFilters ? 'Essaie un autre type ou un autre format pour découvrir les événements disponibles.' : page > 1 ? 'Retrouve les événements disponibles sur la première page.' : 'Aucun événement n’est publié pour le moment. Reviens bientôt consulter l’agenda.'}</p>{(hasFilters || page > 1) && <button type="button" onClick={page > 1 ? () => setParam('page', null) : () => setParams({})} className="mt-6 min-h-11 rounded-xl border border-gold-400 px-5 text-sm font-medium text-gold-400">{page > 1 ? 'Revenir à la première page' : 'Voir tous les événements'}</button>}</div>}
          {!events.loading && !events.error && list.length > 0 && <><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{list.map((event) => <EventRow key={event.id} event={event} />)}</div><Pagination page={page} totalPages={events.data?.totalPages ?? 0} onPageChange={(value) => setParam('page', value === 1 ? null : String(value))} /></>}
        </section>
      </div>
    </Layout>
  );
}
