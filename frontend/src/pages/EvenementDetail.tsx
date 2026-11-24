import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, CalendarPlus, Clock3, Download, MapPin, Radio } from 'lucide-react';

import Prose from '@/components/common/Prose';
import SEO from '@/components/common/SEO';
import ShareButton from '@/components/common/ShareButton';
import StickyActionBar from '@/components/common/StickyActionBar';
import { TYPE_LABEL } from '@/components/events/AgendaItem';
import EventRegistrationAction from '@/components/events/EventRegistrationAction';
import HackathonSteps from '@/components/events/HackathonSteps';
import ProjectSubmission from '@/components/events/ProjectSubmission';
import ViewCount from '@/components/events/ViewCount';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { EmptyPanel, ErrorPanel } from '@/components/ui/panels';
import { PulseDot } from '@/components/ui/pulse-dot';
import { useApi } from '@/hooks/useApi';
import { useEventRegistration } from '@/hooks/useEventRegistration';
import { downloadIcs, googleCalendarUrl } from '@/lib/calendar';
import { deriveEventStatus } from '@/lib/eventStatus';
import { markdownToPlainText } from '@/lib/plainText';
import { eventPath } from '@/lib/slugs';
import { browserVisitorId } from '@/lib/visitor';
import { api } from '@/services/api';

const FORMAT_LABEL = { ONLINE: 'En ligne', OFFLINE: 'Sur place', HYBRID: 'Hybride' } as const;
const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short' });

interface FactProps {
  Icon: typeof CalendarDays;
  label: string;
  children: React.ReactNode;
}

function Fact({ Icon, label, children }: FactProps) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-xs text-white/45">{label}</dt>
        <dd className="mt-1 break-words text-sm leading-relaxed text-white">{children}</dd>
      </div>
    </div>
  );
}

/** A rendez-vous: what, when and where up front with the one action, the practical card beside the programme. */
export default function EvenementDetail() {
  const { id = '' } = useParams();
  const hasParam = id.trim().length > 0;
  const event = useApi((signal) => (hasParam ? api.event(id, signal) : Promise.resolve(null)), [id, hasParam], `event:${id}`);
  const loaded = hasParam && !event.loading && !event.error && event.data ? event.data : null;
  const [failedImage, setFailedImage] = useState<string | undefined>(undefined);
  const [views, setViews] = useState<{ id: number; count: number } | null>(null);
  // Once per event and page: the development double effect would otherwise post twice.
  const counted = useRef<number | null>(null);
  const heroAction = useRef<HTMLDivElement>(null);
  const registration = useEventRegistration(loaded);

  useEffect(() => {
    if (!loaded || loaded.status !== 'PUBLISHED' || counted.current === loaded.id) return;
    counted.current = loaded.id;
    api.recordEventView(loaded.id, browserVisitorId())
      .then(({ viewCount }) => setViews({ id: loaded.id, count: viewCount }))
      .catch(() => undefined);
  }, [loaded]);

  const viewCount = loaded ? (views?.id === loaded.id ? views.count : loaded.viewCount ?? 0) : 0;
  const missing = !hasParam || event.error?.status === 404;
  const tense = loaded ? deriveEventStatus(loaded.startDate, loaded.endDate) : 'upcoming';
  const cancelled = loaded?.status === 'CANCELLED';
  const over = !cancelled && (loaded?.status === 'COMPLETED' || tense === 'closed');
  const isOpen = Boolean(loaded) && !cancelled && !over;
  const state = cancelled ? 'Annulé' : over ? 'Terminé' : tense === 'open' ? 'En direct' : 'À venir';

  return (
    <article>
      <SEO title={loaded?.title ?? (missing ? 'Rendez-vous introuvable' : 'Rendez-vous')} description={loaded ? markdownToPlainText(loaded.description).slice(0, 300) : 'Découvre les rendez-vous LesCracks pour apprendre et pratiquer la tech ensemble.'} image={loaded?.coverImage || undefined} url={loaded ? eventPath(loaded) : '/rendez-vous'} />
      <Container className="pb-20 pt-6 sm:pt-8">
        <Link to="/rendez-vous" className="group inline-flex min-h-10 items-center gap-2 text-sm text-white/55 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />Tous les rendez-vous
        </Link>

        {hasParam && event.loading && <p role="status" className="py-24 text-center text-white/50">Chargement du rendez-vous…</p>}
        {missing && <div className="py-12"><EmptyPanel title="Ce rendez-vous est introuvable." description="Il n’est peut-être plus publié. Retrouve les autres dans l’agenda." action={<Button asChild variant="outline"><Link to="/rendez-vous">Retour à l’agenda</Link></Button>} /></div>}
        {!missing && event.error && <div className="py-12"><ErrorPanel title="Impossible de charger ce rendez-vous." message={event.error.message} onRetry={event.reload} /></div>}

        {loaded && (
          <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-12">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                <span className="rounded-full bg-gold-400 px-2.5 py-0.5 text-xs font-semibold text-black">{TYPE_LABEL[loaded.type]}</span>
                <span className="inline-flex items-center gap-2 text-white/55">{tense === 'open' && isOpen && <PulseDot />}{state}</span>
                <ViewCount count={viewCount} spelledOut className="text-white/45" />
              </div>
              <h1 className="mt-3 break-words text-2xl font-semibold leading-tight tracking-tight sm:text-4xl">{loaded.title}</h1>
              <p className="mt-3 text-white/70 first-letter:uppercase">
                <time dateTime={loaded.startDate}>{dateFormat.format(new Date(loaded.startDate))}</time> · {FORMAT_LABEL[loaded.format]}{loaded.location && ` · ${loaded.location}`}
              </p>
              {isOpen && <div ref={heroAction}><EventRegistrationAction event={loaded} state={registration} variant="hero" /></div>}
              {loaded.acceptsSubmissions && <HackathonSteps event={loaded} />}

              {cancelled && <p role="status" className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">Ce rendez-vous a été annulé. Les informations restent là pour référence.</p>}
              {over && <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/55">Ce rendez-vous est terminé. <Link to="/rendez-vous" className="text-gold-400 underline-offset-4 hover:underline">Voir les prochains</Link></p>}

              <section aria-labelledby="programme-title" className="mt-10 border-t border-white/10 pt-8">
                <h2 id="programme-title" className="text-lg font-semibold tracking-tight">Au programme</h2>
                <div className="mt-4 min-w-0 break-words"><Prose text={loaded.description} /></div>
                {loaded.acceptsSubmissions && <ProjectSubmission event={loaded} />}
              </section>
            </div>

            <aside aria-label="Informations pratiques" className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] lg:sticky lg:top-6">
              <div className="relative aspect-[16/9] bg-gradient-to-br from-gold-400/20 to-white/[0.02]">
                {loaded.coverImage && failedImage !== loaded.coverImage
                  ? <img src={loaded.coverImage} alt="" onError={() => setFailedImage(loaded.coverImage)} className="h-full w-full object-cover" />
                  : <span aria-hidden="true" className="absolute bottom-3 left-4 text-3xl font-semibold tracking-tight text-white/15">{TYPE_LABEL[loaded.type]}</span>}
              </div>
              <div className="p-5">
                <dl className="space-y-4">
                  <Fact Icon={CalendarDays} label="Début"><time dateTime={loaded.startDate}>{dateFormat.format(new Date(loaded.startDate))}</time></Fact>
                  {loaded.endDate && <Fact Icon={Clock3} label="Fin"><time dateTime={loaded.endDate}>{dateFormat.format(new Date(loaded.endDate))}</time></Fact>}
                  <Fact Icon={Radio} label="Format">{FORMAT_LABEL[loaded.format]}</Fact>
                  {loaded.location && <Fact Icon={MapPin} label="Lieu">{loaded.location}</Fact>}
                </dl>
                <p className="mt-4 text-xs text-white/40">Horaires dans ton fuseau horaire.</p>
                <div className="mt-4 grid gap-2">
                  <ShareButton title={loaded.title} path={eventPath(loaded)} label="Partager" />
                  {isOpen && (
                    <>
                      <Button asChild variant="outline" className="w-full"><a href={googleCalendarUrl(loaded, `${window.location.origin}${eventPath(loaded)}`)} target="_blank" rel="noopener noreferrer"><CalendarPlus className="h-4 w-4" aria-hidden="true" />Google Agenda</a></Button>
                      <button type="button" onClick={() => downloadIcs(loaded, `${window.location.origin}${eventPath(loaded)}`)} className="inline-flex min-h-10 items-center justify-center gap-2 text-sm text-white/55 underline-offset-4 transition-colors hover:text-white hover:underline"><Download className="h-4 w-4" aria-hidden="true" />Apple, Outlook (.ics)</button>
                    </>
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}

        {loaded && isOpen && !registration.isAdmin && (
          <StickyActionBar anchor={heroAction} label="Participer au rendez-vous">
            <EventRegistrationAction event={loaded} state={registration} variant="bar" />
          </StickyActionBar>
        )}
      </Container>
    </article>
  );
}
