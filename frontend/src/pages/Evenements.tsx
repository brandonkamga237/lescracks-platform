import { useSearchParams } from 'react-router-dom';

import SEO from '@/components/common/SEO';
import { TYPE_LABEL } from '@/components/events/AgendaItem';
import EventFeature from '@/components/events/EventFeature';
import EventRow from '@/components/events/EventRow';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { PageHero } from '@/components/ui/page-hero';
import { Pager } from '@/components/ui/pager';
import { EmptyPanel, ErrorPanel, RowsLoading } from '@/components/ui/panels';
import { PillTabs } from '@/components/ui/pill-tabs';
import { useApi } from '@/hooks/useApi';
import { deriveEventStatus } from '@/lib/eventStatus';
import { LIST_PAGE_SIZE, worthFiltering } from '@/lib/filters';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import type { EventFormat, EventType } from '@/services/types';

// No more hackathons are run: offering the filter would only lead to the archive.
const types = (Object.entries(TYPE_LABEL) as Array<[EventType, string]>).filter(([value]) => value !== 'HACKATHON');
const formats: Array<[EventFormat, string]> = [['ONLINE', 'En ligne'], ['OFFLINE', 'Sur place'], ['HYBRID', 'Hybride']];

/** The agenda: the next rendez-vous as a headline, the rest as lines, the past at the bottom. */
export default function Evenements() {
  const [params, setParams] = useSearchParams();
  const type = types.find(([value]) => value === params.get('type'))?.[0];
  const format = formats.find(([value]) => value === params.get('format'))?.[0];
  const rawPage = params.get('page') ?? '';
  const parsedPage = Number(rawPage);
  const page = /^[1-9]\d*$/.test(rawPage) && Number.isSafeInteger(parsedPage) && parsedPage <= 2147483647 ? parsedPage : 1;
  const events = useApi((signal) => api.events({ type, format, page: page - 1, size: LIST_PAGE_SIZE }, signal), [type, format, page]);
  const list = events.data?.content ?? [];
  const hasFilters = Boolean(type || format);
  const total = events.data?.totalElements ?? 0;
  const discovery = !hasFilters && page === 1;
  // The archive only belongs to the unfiltered first page; no point fetching it otherwise.
  const past = useApi((signal) => (discovery ? api.pastEvents(0, 4, signal) : Promise.resolve(null)), [discovery]);
  const featured = discovery && list[0] && deriveEventStatus(list[0].startDate, list[0].endDate) !== 'closed' ? list[0] : undefined;
  const agenda = featured ? list.slice(1) : list;

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  }

  return (
    <>
      <SEO title="Rendez-vous tech" description="Ateliers, webinaires et conférences : découvre les rendez-vous LesCracks pour apprendre et pratiquer ensemble." url="/rendez-vous" />
      <PageHero
        id="agenda-title"
        eyebrow={!events.loading && !events.error ? `Agenda · ${total} rendez-vous` : 'Agenda'}
        title={['Prochains rendez-vous.', { text: 'En ligne et sur place.', className: 'text-white/40' }]}
        lead="Des ateliers, des webinaires et des conférences pour pratiquer, poser tes questions et rencontrer la communauté. Chaque participation te vaut une attestation vérifiable."
      >
        {worthFiltering(total, hasFilters) && (
          <div className="space-y-3">
            <PillTabs legend="Type de rendez-vous" allLabel="Tous les types" options={types} value={type} onChange={(value) => setParam('type', value ?? null)} />
            <PillTabs legend="Format" allLabel="Tous les formats" options={formats} value={format} onChange={(value) => setParam('format', value ?? null)} />
          </div>
        )}
      </PageHero>

      <Container className="pb-20">
        <div role="region" aria-label="Rendez-vous" aria-live="polite" aria-busy={events.loading}>
          {events.loading && list.length === 0 && <RowsLoading label="Chargement des rendez-vous…" />}
          {events.error && <ErrorPanel title="L’agenda est momentanément indisponible." message={events.error.message} onRetry={events.reload} />}
          {!events.loading && !events.error && list.length === 0 && (
            <EmptyPanel
              title={page > 1 ? 'Cette page ne contient aucun rendez-vous.' : hasFilters ? 'Aucun rendez-vous ne correspond à ces filtres.' : 'Les prochains rendez-vous se préparent.'}
              description={hasFilters ? 'Essaie un autre type ou un autre format.' : page > 1 ? 'Retrouve les rendez-vous sur la première page.' : 'Aucun rendez-vous n’est publié pour le moment. Reviens bientôt.'}
              action={(hasFilters || page > 1) && <Button type="button" variant="outline" onClick={() => setParams({})}>{page > 1 ? 'Revenir à la première page' : 'Voir tous les rendez-vous'}</Button>}
            />
          )}
          {!events.error && list.length > 0 && (
            <div className={cn('transition-opacity', events.loading && 'opacity-60')}>
              {featured && <div className="mb-14"><EventFeature event={featured} /></div>}
              {agenda.length > 0 && (
                <Stagger className="border-t border-white/10">
                  {agenda.map((event) => <StaggerItem key={event.id}><EventRow event={event} /></StaggerItem>)}
                </Stagger>
              )}
              <Pager page={page} totalPages={events.data?.totalPages ?? 0} onPageChange={(value) => setParam('page', value === 1 ? null : String(value))} />
            </div>
          )}
        </div>
      </Container>

      {/* The past never competes with what comes next: it waits at the bottom, quieter. */}
      {discovery && !!past.data?.content.length && (
        <section aria-labelledby="past-title" className="border-t border-white/10">
          <Container className="pb-24 pt-16 sm:pt-20">
            <p className="text-sm font-medium text-white/40">Archives</p>
            <h2 id="past-title" className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Déjà passés.</h2>
            <ul className="mt-10 border-t border-white/10 opacity-70 transition-opacity hover:opacity-100">
              {past.data.content.map((event) => <li key={event.id}><EventRow event={event} /></li>)}
            </ul>
          </Container>
        </section>
      )}
    </>
  );
}
