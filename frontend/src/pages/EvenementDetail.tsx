import { useState } from 'react';
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3, MapPin, Radio } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import SEO from '@/components/common/SEO';
import Layout from '@/components/layout/Layout';
import { useApi } from '@/hooks/useApi';
import { api } from '@/services/api';

const typeLabels = { BOOTCAMP: 'Bootcamp', WORKSHOP: 'Atelier', WEBINAR: 'Webinaire', CONFERENCE: 'Conférence' } as const;
const formatLabels = { ONLINE: 'En ligne', OFFLINE: 'Sur place', HYBRID: 'Hybride' } as const;
const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

export default function EvenementDetail() {
  const { id = '' } = useParams();
  const location = useLocation();
  const validId = /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id));
  const event = useApi((signal) => validId ? api.event(Number(id), signal) : Promise.resolve(null), [id, validId]);
  const loaded = validId && !event.loading && !event.error && event.data?.id === Number(id) ? event.data : null;
  const [failedImage, setFailedImage] = useState<string | undefined>(undefined);
  const missing = !validId || event.error?.status === 404;
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
      <SEO title={loaded?.title ?? (missing ? 'Événement introuvable' : 'Événement')} description={loaded?.description ?? 'Découvre les rendez-vous LesCracks pour apprendre et pratiquer la tech ensemble.'} image={loaded?.coverImage || undefined} url={validId ? `/evenements/${id}` : '/evenements'} />
      <article className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-16">
        <nav aria-label="Fil d’Ariane" className="flex flex-wrap items-center gap-3 text-sm text-t3">
          <Link to={cataloguePath} className="inline-flex min-h-11 items-center gap-2 rounded-lg hover:text-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"><ArrowLeft className="h-4 w-4" aria-hidden />Tous les événements</Link>
          {loaded && <><span aria-hidden>/</span><span className="min-w-0 truncate text-t2" aria-current="page">{loaded.title}</span></>}
        </nav>
        {validId && event.loading && <p className="py-24 text-center text-t3" role="status">Chargement du rendez-vous…</p>}
        {(missing || event.error) && <div className="my-12 rounded-2xl border border-line bg-noir-900 px-6 py-16 text-center" role="alert"><h1 className="font-display text-3xl text-t1">{missing ? 'Ce rendez-vous est introuvable.' : 'Impossible de charger cet événement.'}</h1><p className="mx-auto mt-4 max-w-lg text-t3">{missing ? 'Il n’est peut-être plus publié. Retrouve les autres rendez-vous dans l’agenda.' : event.error?.message}</p>{!missing && <button type="button" onClick={event.reload} className="mt-6 min-h-11 rounded-xl bg-gold-400 px-5 font-medium text-noir-950">Réessayer</button>}<Link to={cataloguePath} className="mx-auto mt-5 block w-fit py-2 text-sm text-gold-400 underline underline-offset-4">Retour à l’agenda</Link></div>}

        {loaded && <>
          <header className="mt-8 overflow-hidden rounded-2xl border border-line bg-noir-900 sm:mt-12">
            <div className="aspect-[21/9] w-full overflow-hidden bg-noir-800">
              {loaded.coverImage && failedImage !== loaded.coverImage ? <img src={loaded.coverImage} alt={``} onError={() => setFailedImage(loaded.coverImage)} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-noir-800 to-noir-950"><span className="font-display text-5xl text-white/10">{typeLabels[loaded.type]}</span></div>}
            </div>
            <div className="p-6 sm:p-10 lg:p-12">
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium"><span className="rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1.5 text-gold-400">{typeLabels[loaded.type]}</span><span className="text-t2">{formatLabels[loaded.format]}</span><span className="ml-auto rounded-full border border-line-strong px-3 py-1.5 text-t2">{status}</span></div>
              <p className="mt-5 text-xs font-medium tracking-wide text-t3">Un rendez-vous LesCracks</p>
              <h1 className="mt-3 max-w-4xl break-words font-display text-4xl font-semibold leading-[1.1] tracking-tight text-t1 sm:text-5xl lg:text-6xl">{loaded.title}</h1>
              {hasDate && <p className="mt-6 text-sm text-t2"><time dateTime={loaded.startDate}>{dateFormat.format(start)}</time></p>}
            </div>
          </header>

          {status === 'Annulé' && <p className="mt-6 rounded-2xl border border-line-strong bg-noir-900 px-6 py-5 text-sm leading-relaxed text-t2" role="status">Cet événement a été annulé. Les informations ci-dessous sont conservées à titre de référence.</p>}
          {status === 'Terminé' && <p className="mt-6 rounded-2xl border border-line bg-noir-900 px-6 py-5 text-sm leading-relaxed text-t3">Cet événement est terminé. Explore l’agenda pour découvrir les prochains rendez-vous.</p>}
          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-16">
            <section aria-labelledby="event-description" className="min-w-0"><h2 id="event-description" className="font-display text-2xl font-semibold text-t1">Au programme</h2><p className="mt-5 whitespace-pre-line break-words text-base leading-loose text-t2 sm:text-lg">{loaded.description}</p></section>
            <aside className="rounded-2xl border border-line bg-noir-900 p-6 sm:p-7" aria-label="Informations pratiques">
              <h2 className="font-display text-xl font-semibold text-t1">Le rendez-vous en détail</h2>
              <dl className="mt-6 space-y-6">
                <div className="flex gap-3"><CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" aria-hidden /><div><dt className="text-xs font-medium uppercase tracking-wide text-t3">Début</dt><dd className="mt-2 text-sm leading-relaxed text-t1">{hasDate ? <time dateTime={loaded.startDate}>{dateFormat.format(start)}</time> : 'Date non renseignée'}</dd></div></div>
                {hasEndDate && <div className="flex gap-3"><Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" aria-hidden /><div><dt className="text-xs font-medium uppercase tracking-wide text-t3">Fin</dt><dd className="mt-2 text-sm leading-relaxed text-t1"><time dateTime={loaded.endDate}>{dateFormat.format(end)}</time></dd></div></div>}
                <div className="flex gap-3"><Radio className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" aria-hidden /><div><dt className="text-xs font-medium uppercase tracking-wide text-t3">Format</dt><dd className="mt-2 text-sm text-t1">{formatLabels[loaded.format]}</dd></div></div>
                {loaded.location && <div className="flex gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" aria-hidden /><div className="min-w-0"><dt className="text-xs font-medium uppercase tracking-wide text-t3">Lieu</dt><dd className="mt-2 break-words text-sm leading-relaxed text-t1">{loaded.location}</dd></div></div>}
              </dl>
              <p className="mt-6 border-t border-line-soft pt-4 text-xs leading-relaxed text-t3">Les horaires sont affichés dans ton fuseau horaire.</p>
            </aside>
          </div>
          <div className="mt-14 flex flex-col justify-between gap-5 rounded-2xl border border-line bg-noir-900 p-6 sm:flex-row sm:items-center sm:p-8"><div><h2 className="font-display text-xl font-semibold text-t1">Un autre rendez-vous à découvrir ?</h2><p className="mt-2 text-sm text-t3">Retrouve tous les formats dans l’agenda LesCracks.</p></div><Link to={cataloguePath} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-3 rounded-xl border border-gold-400/50 px-5 py-3 text-sm font-medium text-gold-400 hover:bg-gold-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400">Explorer l’agenda<ArrowUpRight className="h-4 w-4" aria-hidden /></Link></div>
        </>}
      </article>
    </Layout>
  );
}
