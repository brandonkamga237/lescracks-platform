import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import SEO from '@/components/common/SEO';
import { CardSkeletonGrid } from '@/components/common/Skeleton';
import Layout from '@/components/layout/Layout';
import ResourceCard from '@/components/resources/ResourceCard';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { api } from '@/services/api';

const reveal = (reduced: boolean | null) => (reduced ? {} : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-80px' }, transition: { duration: 0.55, ease: 'easeOut' } });

const dayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

/**
 * The front door for the learning catalogue.
 */
export default function Landing() {
  const reduced = useReducedMotion();
  const recent = useApi((signal) => api.resources({ size: 3 }, signal), []);
  const upcoming = useApi((signal) => api.upcomingEvents(0, 4, signal), []);
  const categories = useApi((signal) => api.categories(signal), []);
  const { isSignedIn, isAdmin, name } = useSession();
  const firstName = name?.trim().split(/\s+/)[0];

  return (
    <Layout>
      <SEO title="Apprendre la tech, concrètement" description="Des vidéos, des ebooks et des événements pour développer tes compétences tech, à ton rythme. Une bibliothèque ouverte, une communauté francophone." url="/" />

      {/* Hero — editorial, image-driven, no ornament */}
      <motion.section {...reveal(reduced)} className="border-b border-line-soft/50">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-medium tracking-wide text-gold-400">L’école en ligne pour monter en compétence</p>
            <h1 className="mt-6 max-w-2xl font-display text-4xl font-semibold leading-[1.08] tracking-tight text-t1 sm:text-5xl xl:text-6xl">
              {isSignedIn
                ? `Bon retour${firstName ? `, ${firstName}` : ''}. La suite est dans la bibliothèque.`
                : 'Deviens aussi un crack de la tech.'}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-t3 sm:text-lg">
              {isSignedIn
                ? 'Reprends ta lecture, découvre les derniers contenus publiés ou trouve le prochain rendez-vous de la communauté.'
                : 'Des vidéos, des ebooks et des ateliers conçus par des gens qui font. Tu choisis un sujet, tu apprends à ton rythme, tu pratiques en communauté.'}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/ressources" className="btn-primary">
                Explorer la bibliothèque
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link to="/evenements" className="btn-secondary">
                Voir les événements
              </Link>
              {isSignedIn && isAdmin && (
                <Link to="/admin" className="btn-secondary border-gold-400/30 text-gold-400 hover:bg-gold-400/10">
                  Administration
                </Link>
              )}
            </div>
          </div>

          <div className="relative">
            <img
              src="/images/community-1.jpg"
              alt="Des membres de la communauté LesCracks réunis autour d’un ordinateur"
              className="aspect-[4/3] w-full rounded-3xl border border-white/[0.06] object-cover shadow-2xl shadow-black/20"
              loading="eager"
            />
          </div>
        </div>
      </motion.section>

      {/* Latest resources */}
      <motion.section aria-labelledby="latest-heading" {...reveal(reduced)} className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h2 id="latest-heading" className="font-display text-2xl font-semibold tracking-tight text-t1 sm:text-3xl">
              Publié récemment
            </h2>
            <p className="mt-2 text-sm text-t3">En accès libre, sans compte.</p>
          </div>
          <Link to="/ressources" className="text-sm font-medium text-gold-400 underline-offset-4 hover:text-gold-300 hover:underline">
            Toute la bibliothèque
          </Link>
        </div>

        {recent.loading ? (
          <CardSkeletonGrid count={3} />
        ) : recent.error ? (
          <div role="alert" className="rounded-3xl border border-line bg-card p-6">
            <p className="text-sm text-t3">La bibliothèque est momentanément indisponible.</p>
            <button type="button" onClick={recent.reload} className="mt-4 text-sm font-medium text-gold-400 underline underline-offset-4">Réessayer</button>
          </div>
        ) : recent.data?.content.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recent.data.content.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-line-strong bg-card p-8">
            <p className="font-medium text-t1">Les premières ressources arrivent.</p>
            <p className="mt-2 max-w-lg text-sm text-t3">Les vidéos et les ebooks apparaîtront ici dès leur publication.</p>
          </div>
        )}

        {!!categories.data?.length && (
          <nav aria-label="Explorer par sujet" className="mt-10 border-t border-line-soft/50 pt-8">
            <span className="mr-3 text-sm text-t3">Par sujet :</span>
            {categories.data.slice(0, 10).map((category) => (
              <Link
                key={category.id}
                to={`/ressources?categoryId=${category.id}`}
                className="mr-2 inline-block rounded-full border border-line-soft/70 bg-noir-900/50 px-4 py-1.5 text-sm text-t2 transition hover:border-gold-400/50 hover:text-gold-300"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        )}
      </motion.section>

      {/* Events — list, not cards */}
      <motion.section aria-labelledby="events-heading" {...reveal(reduced)} className="border-t border-line-soft/50 bg-noir-900/30">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <h2 id="events-heading" className="font-display text-2xl font-semibold tracking-tight text-t1 sm:text-3xl">
                Prochains rendez-vous
              </h2>
              <p className="mt-2 text-sm text-t3">Ateliers, webinaires, conférences — en ligne ou sur place.</p>
            </div>
            <Link to="/evenements" className="text-sm font-medium text-gold-400 underline-offset-4 hover:text-gold-300 hover:underline">
              Tout l’agenda
            </Link>
          </div>

          {upcoming.loading ? (
            <div role="status" className="divide-y divide-line-soft rounded-3xl border border-line-soft/50 bg-card">
              {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse bg-white/[0.02]" />)}
              <span className="sr-only">Chargement des événements…</span>
            </div>
          ) : upcoming.error ? (
            <div role="alert" className="rounded-3xl border border-line bg-card p-6">
              <p className="text-sm text-t3">L’agenda est momentanément indisponible.</p>
              <button type="button" onClick={upcoming.reload} className="mt-4 text-sm font-medium text-gold-400 underline underline-offset-4">Réessayer</button>
            </div>
          ) : upcoming.data?.content.length ? (
            <ul className="divide-y divide-line-soft/50 rounded-3xl border border-line-soft/50 bg-card">
              {upcoming.data.content.map((event) => (
                <li key={event.id}>
                  <Link to={`/evenements/${event.id}`} className="group flex flex-wrap items-baseline gap-x-6 gap-y-1 rounded-3xl px-6 py-5 transition-colors hover:bg-white/[0.03]">
                    <time dateTime={event.startDate} className="w-48 shrink-0 text-sm text-gold-300">
                      {dayFormat.format(new Date(event.startDate))}
                    </time>
                    <span className="min-w-0 flex-1 font-medium text-t1 transition-colors group-hover:text-gold-300">
                      {event.title}
                    </span>
                    <span className="text-sm text-t4">
                      {event.format === 'ONLINE' ? 'En ligne' : event.format === 'HYBRID' ? 'Hybride' : 'Sur place'}
                      {event.location ? ` · ${event.location}` : ''}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-3xl border border-dashed border-line-strong bg-card p-8">
              <p className="font-medium text-t1">Le prochain rendez-vous se prépare.</p>
              <p className="mt-2 max-w-lg text-sm text-t3">Aucun événement n’est publié pour le moment. Les dates seront annoncées ici.</p>
            </div>
          )}
        </div>
      </motion.section>

      {/* Closing CTA */}
      <motion.section {...reveal(reduced)} className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="rounded-3xl border border-line-soft/50 bg-gradient-to-br from-gold-400/[0.08] to-transparent px-6 py-14 text-center sm:px-12 sm:py-20">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-t1 sm:text-4xl">Prêt à monter en compétence ?</h2>
          <p className="mx-auto mt-4 max-w-xl text-t3">Rejoins les membres qui apprennent chaque semaine. C’est gratuit et tu progresses à ton rythme.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/inscription" className="btn-primary">Créer un compte</Link>
            <Link to="/ressources" className="btn-secondary">Explorer sans compte</Link>
          </div>
        </div>
      </motion.section>
    </Layout>
  );
}
