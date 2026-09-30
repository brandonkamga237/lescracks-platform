import { useState } from 'react';
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3, MapPin, Radio } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import SEO from '@/components/common/SEO';
import Layout from '@/components/layout/Layout';
import { useApi } from '@/hooks/useApi';
import { api } from '@/services/api';
import { eventPath } from '@/lib/slugs';

const typeLabels = { BOOTCAMP: 'Bootcamp', WORKSHOP: 'Atelier', WEBINAR: 'Webinaire', CONFERENCE: 'Conférence' } as const;
const formatLabels = { ONLINE: 'En ligne', OFFLINE: 'Sur place', HYBRID: 'Hybride' } as const;
const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

export default function EvenementDetail() {
  const { id = '' } = useParams();
  const location = useLocation();
  const hasParam = id.trim().length > 0;
  const event = useApi((signal) => hasParam ? api.event(id, signal) : Promise.resolve(null), [id, hasParam]);
  const loaded = hasParam && !event.loading && !event.error && event.data ? event.data : null;
  const [failedImage, setFailedImage] = useState<string | undefined>(undefined);
  const missing = !hasParam || event.error?.status === 404;
  const previousPath: unknown = location.state?.cataloguePath;
  const cataloguePath = typeof previousPath === 'string' && /^\/evenements(?:\?.*)?$/.test(previousPath) ? previousPath : '/evenements';
  const start = loaded ? new Date(loaded.startDate) : null;
  const end = loaded?.endDate ? new Date(loaded.endDate) : null;
  const hasDate = start && !Number.isNaN(start.getTime());
  const hasEndDate = end && !Number.isNaN(end.getTime());
  const now = Date.now();
  const status = loaded?.status === 'CANCELLED' ? 'Annulé' : loaded?.status === 'COMPLETED' || (hasEndDate && end.getTime() < now) ? 'Terminé' : hasDate && start.getTime() > now ? 'À venir' : hasEndDate ? 'En cours' : 'Date passée';

  return (
    <Layout>
      <SEO title={loaded?.title ?? (missing ? 'Événement introuvable' : 'Événement')} description={loaded?.description ?? 'Découvre les rendez-vous LesCracks pour apprendre et pratiquer la tech ensemble.'} image={loaded?.coverImage || undefined} url={loaded ? eventPath(loaded) : '/evenements'} />
      <article>
        <div className="mode-raised">
        <div className="mx-auto max-w-7xl px-5 pb-14 pt-8 sm:px-8 sm:pb-20 sm:pt-10">
        <nav aria-label="Fil d’Ariane" className="flex flex-wrap items-center gap-3 text-sm text-t3">
          <Link to={cataloguePath} className="inline-flex min-h-11 items-center gap-2 rounded-lg hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"><ArrowLeft className="h-4 w-4" aria-hidden />Tous les événements</Link>
          {loaded && <><span aria-hidden>/</span><span className="min-w-0 truncate text-t2" aria-current="page">{loaded.title}</span></>}
        </nav>
        {hasParam && event.loading && <p className="py-24 text-center text-t3" role="status">Chargement du rendez-vous…</p>}
        {(missing || event.error) && <div className="my-12 rounded-lg border border-line bg-noir-900 px-6 py-16 text-center" role="alert"><h1 className="font-display text-3xl font-bold text-t1">{missing ? 'Ce rendez-vous est introuvable.' : 'Impossible de charger cet événement.'}</h1><p className="mx-auto mt-4 max-w-lg text-t3">{missing ? 'Il n’est peut-être plus publié. Retrouve les autres rendez-vous dans l’agenda.' : event.error?.message}</p>{!missing && <button type="button" onClick={event.reload} className="btn-primary mt-6">Réessayer</button>}<Link to={cataloguePath} className="mx-auto mt-5 block w-fit py-2 text-sm text-gold-ink underline underline-offset-4">Retour à l’agenda</Link></div>}

        {loaded && <>
          <header className="mt-8 max-w-5xl sm:mt-12">
            <div className="flex flex-wrap items-center gap-3"><span className="rounded-full bg-gold-400 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-black">{typeLabels[loaded.type]}</span><span className="label">{formatLabels[loaded.format]}</span><span className="label">· {status}</span></div>
            <h1 className="mt-5 break-words font-display text-5xl font-bold leading-[0.94] tracking-tight text-t1 sm:text-6xl lg:text-7xl lg:leading-[0.9]">{loaded.title}</h1>
            {hasDate && <p className="mt-6 text-lg font-semibold text-t2"><time dateTime={loaded.startDate}>{dateFormat.format(start)}</time></p>}
          </header>
        </>}
        </div>
        </div>

        {loaded && <>
          <div className="aspect-[21/9] w-full overflow-hidden bg-noir-800">
            {loaded.coverImage && failedImage !== loaded.coverImage ? <img src={loaded.coverImage} alt="" onError={() => setFailedImage(loaded.coverImage)} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center"><span className="font-display text-5xl font-bold text-t4 opacity-30">{typeLabels[loaded.type]}</span></div>}
          </div>
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">

          {status === 'Annulé' && <p className="mb-10 rounded bg-card px-6 py-5 text-sm leading-relaxed text-t2" role="status">Cet événement a été annulé. Les informations ci-dessous sont conservées à titre de référence.</p>}
          {status === 'Terminé' && <p className="mb-10 rounded bg-card px-6 py-5 text-sm leading-relaxed text-t3">Cet événement est terminé. Explore l’agenda pour découvrir les prochains rendez-vous.</p>}
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-16">
            <section aria-labelledby="event-description" className="min-w-0"><h2 id="event-description" className="font-display text-3xl font-bold leading-tight text-t1">Au programme</h2><p className="mt-5 whitespace-pre-line break-words text-base leading-relaxed text-t2 sm:text-lg">{loaded.description}</p></section>
            <aside className="rounded-lg bg-card p-6 sm:p-7" aria-label="Informations pratiques">
              <h2 className="font-display text-xl font-bold text-t1">Le rendez-vous en détail</h2>
              <dl className="mt-6 space-y-6">
                <div className="flex gap-3"><CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-gold-ink" aria-hidden /><div><dt className="label">Début</dt><dd className="mt-2 text-sm leading-relaxed text-t1">{hasDate ? <time dateTime={loaded.startDate}>{dateFormat.format(start)}</time> : 'Date non renseignée'}</dd></div></div>
                {hasEndDate && <div className="flex gap-3"><Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-gold-ink" aria-hidden /><div><dt className="label">Fin</dt><dd className="mt-2 text-sm leading-relaxed text-t1"><time dateTime={loaded.endDate}>{dateFormat.format(end)}</time></dd></div></div>}
                <div className="flex gap-3"><Radio className="mt-0.5 h-5 w-5 shrink-0 text-gold-ink" aria-hidden /><div><dt className="label">Format</dt><dd className="mt-2 text-sm text-t1">{formatLabels[loaded.format]}</dd></div></div>
                {loaded.location && <div className="flex gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold-ink" aria-hidden /><div className="min-w-0"><dt className="label">Lieu</dt><dd className="mt-2 break-words text-sm leading-relaxed text-t1">{loaded.location}</dd></div></div>}
              </dl>
              <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-t3">Les horaires sont affichés dans ton fuseau horaire.</p>
            </aside>
          </div>
          <div className="mt-16 flex flex-col justify-between gap-5 rounded-lg bg-card p-6 sm:flex-row sm:items-center sm:p-8"><div><h2 className="font-display text-2xl font-bold text-t1">Un autre rendez-vous à découvrir ?</h2><p className="mt-2 text-sm text-t3">Retrouve tous les formats dans l’agenda LesCracks.</p></div><Link to={cataloguePath} className="btn-primary shrink-0">Explorer l’agenda<ArrowUpRight className="h-4 w-4" aria-hidden /></Link></div>
          </div>
        </>}
      </article>
    </Layout>
  );
}
