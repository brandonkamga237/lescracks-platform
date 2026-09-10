import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import SEO from '@/components/common/SEO';
import { CardSkeletonGrid } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import Layout from '@/components/layout/Layout';
import { Section, SectionHeader } from '@/components/layout/Page';
import ResourceCard from '@/components/resources/ResourceCard';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { api } from '@/services/api';
import { eventPath } from '@/lib/slugs';

const dayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

const reveal = (reduced: boolean | null) => (reduced ? {} : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-80px' }, transition: { duration: 0.55, ease: 'easeOut' } });

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

      {/* The hero is above the fold, so the page-level entrance transition is enough. */}
      <Section spacing="loose" className="border-b border-line-soft/50">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
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
              <Link to="/evenements" className="btn-secondary">Voir les événements</Link>
              {isSignedIn && isAdmin && (
                <Link to="/admin" className="btn-secondary border-gold-400/30 text-gold-400 hover:bg-gold-400/10">Administration</Link>
              )}
            </div>
          </div>

          <img
            src="/images/community-1.jpg"
            alt="Des membres de la communauté LesCracks réunis autour d’un ordinateur"
            className="aspect-[4/3] w-full rounded-3xl border border-white/[0.06] object-cover shadow-2xl shadow-black/20"
            loading="eager"
          />
        </div>
      </Section>

      <motion.div {...reveal(reduced)}>
        <Section aria-labelledby="latest-heading">
          <SectionHeader
            id="latest-heading"
            title="Publié récemment"
            description="En accès libre, sans compte."
            action={<Link to="/ressources" className="text-sm font-medium text-gold-400 underline-offset-4 hover:text-gold-300 hover:underline">Toute la bibliothèque</Link>}
          />

          {recent.loading ? (
            <CardSkeletonGrid count={3} />
          ) : recent.error ? (
            <ErrorState title="La bibliothèque est momentanément indisponible." onRetry={recent.reload} />
          ) : recent.data?.content.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recent.data.content.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}
            </div>
          ) : (
            <EmptyState title="Les premières ressources arrivent." description="Les vidéos et les ebooks apparaîtront ici dès leur publication." />
          )}

          {!!categories.data?.length && (
            <nav aria-label="Explorer par sujet" className="mt-10 border-t border-line-soft/50 pt-8">
              <p className="mb-4 text-sm text-t3">Explorer par sujet</p>
              <div className="flex flex-wrap gap-2">
                {categories.data.slice(0, 10).map((category) => (
                  <Link
                    key={category.id}
                    to={`/ressources?categoryId=${category.id}`}
                    className="inline-flex min-h-11 items-center rounded-full border border-line-soft/70 bg-noir-900/50 px-4 text-sm text-t2 transition hover:border-gold-400/50 hover:text-gold-300"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </Section>
      </motion.div>

      <motion.div {...reveal(reduced)}>
        <Section aria-labelledby="events-heading" muted bordered>
          <SectionHeader
            id="events-heading"
            title="Prochains rendez-vous"
            description="Ateliers, webinaires, conférences — en ligne ou sur place."
            action={<Link to="/evenements" className="text-sm font-medium text-gold-400 underline-offset-4 hover:text-gold-300 hover:underline">Tout l’agenda</Link>}
          />

          {upcoming.loading ? (
            <div role="status" className="divide-y divide-line-soft rounded-3xl border border-line-soft/50 bg-card">
              {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse bg-white/[0.02]" />)}
              <span className="sr-only">Chargement des événements…</span>
            </div>
          ) : upcoming.error ? (
            <ErrorState title="L’agenda est momentanément indisponible." onRetry={upcoming.reload} />
          ) : upcoming.data?.content.length ? (
            <ul className="divide-y divide-line-soft/50 overflow-hidden rounded-3xl border border-line-soft/50 bg-card">
              {upcoming.data.content.map((event) => (
                <li key={event.id}>
                  {/* Date above the title on mobile: a fixed side column left the title barely readable at 375px. */}
                  <Link to={eventPath(event)} className="group block px-5 py-5 transition-colors hover:bg-white/[0.03] sm:px-6">
                    <time dateTime={event.startDate} className="block text-sm text-gold-300 sm:hidden">
                      {dayFormat.format(new Date(event.startDate))}
                    </time>
                    <div className="sm:flex sm:flex-wrap sm:items-baseline sm:gap-x-6">
                      <time dateTime={event.startDate} className="hidden shrink-0 text-sm text-gold-300 sm:block sm:w-44">
                        {dayFormat.format(new Date(event.startDate))}
                      </time>
                      <span className="mt-1 block min-w-0 font-medium text-t1 transition-colors group-hover:text-gold-300 sm:mt-0 sm:flex-1">
                        {event.title}
                      </span>
                      <span className="mt-1 block text-sm text-t4 sm:mt-0">
                        {event.format === 'ONLINE' ? 'En ligne' : event.format === 'HYBRID' ? 'Hybride' : 'Sur place'}
                        {event.location ? ` · ${event.location}` : ''}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Le prochain rendez-vous se prépare." description="Aucun événement n’est publié pour le moment. Les dates seront annoncées ici." />
          )}
        </Section>
      </motion.div>

      <motion.div {...reveal(reduced)}>
        <Section>
          <div className="rounded-3xl border border-line-soft/50 bg-gradient-to-br from-gold-400/[0.08] to-transparent px-6 py-14 text-center sm:px-12 sm:py-20">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-t1 sm:text-4xl">Prêt à monter en compétence ?</h2>
            <p className="mx-auto mt-4 max-w-xl text-t3">Rejoins les membres qui apprennent chaque semaine. C’est gratuit et tu progresses à ton rythme.</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/inscription" className="btn-primary">Créer un compte</Link>
              <Link to="/ressources" className="btn-secondary">Explorer sans compte</Link>
            </div>
          </div>
        </Section>
      </motion.div>
    </Layout>
  );
}
