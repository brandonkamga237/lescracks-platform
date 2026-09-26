import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Users } from 'lucide-react';

import SEO from '@/components/common/SEO';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import AgendaItem from '@/components/events/AgendaItem';
import Layout from '@/components/layout/Layout';
import { Section, SectionHeader } from '@/components/layout/Page';
import ResourceIndexItem from '@/components/resources/ResourceIndexItem';
import ResourceSpotlight from '@/components/resources/ResourceSpotlight';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { api } from '@/services/api';

/**
 * The platform as an issue: masthead, headline piece, agenda, subject index.
 *
 * Three questions answered in order — where am I (a francophone tech
 * publication), what can I do now (open the featured resource, join the next
 * rendez-vous), why come back (the issue keeps publishing).
 */

const PROMISES = [
  { index: '01', icon: BookOpen, title: 'Bibliothèque ouverte', body: 'Vidéos, ebooks, articles — sans compte.' },
  { index: '02', icon: CalendarDays, title: 'Rendez-vous réguliers', body: 'Ateliers et conférences, en ligne ou sur place.' },
  { index: '03', icon: Users, title: 'Communauté francophone', body: 'On avance ensemble, sur WhatsApp et au Talk.' },
] as const;

const reveal = (reduced: boolean | null) => (reduced ? {} : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-80px' }, transition: { duration: 0.55, ease: 'easeOut' } });

export default function Landing() {
  const reduced = useReducedMotion();
  const recent = useApi((signal) => api.resources({ size: 4 }, signal), []);
  const upcoming = useApi((signal) => api.upcomingEvents(0, 5, signal), []);
  const categories = useApi((signal) => api.categories(signal), []);
  const { isSignedIn, isAdmin, name } = useSession();
  const firstName = name?.trim().split(/\s+/)[0];

  const featured = recent.data?.content[0];
  const next = recent.data?.content.slice(1) ?? [];

  return (
    <Layout>
      <SEO title="Apprendre la tech, concrètement" description="Des vidéos, des ebooks et des événements pour développer tes compétences tech, à ton rythme. Une bibliothèque ouverte, une communauté francophone." url="/" />

      {/* ── Masthead ─────────────────────────────────────────────── */}
      <Section spacing="loose" className="border-b border-line-soft/50">
        <p className="kicker">La plateforme tech francophone</p>
        <h1 className="mt-8 max-w-4xl font-display text-5xl font-medium leading-[1.02] tracking-tight text-t1 sm:text-7xl xl:text-[5.5rem]">
          {isSignedIn
            ? <>Bon retour{firstName ? <>, {firstName}</> : ''}. <em className="italic text-gold-300">La suite</em> est dans la bibliothèque.</>
            : <>Deviens aussi un <em className="italic text-gold-300">crack</em> de la tech.</>}
        </h1>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-t3">
          {isSignedIn
            ? 'Reprends ta lecture ou trouve le prochain rendez-vous.'
            : 'Vidéos, ebooks et ateliers pour apprendre la tech en français — en accès libre.'}
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link to="/ressources" className="btn-primary">
            Explorer la bibliothèque
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link to="/evenements" className="btn-secondary">Voir l’agenda</Link>
          {isSignedIn && isAdmin && (
            <Link to="/admin" className="btn-secondary border-gold-400/30 text-gold-400 hover:bg-gold-400/10">Administration</Link>
          )}
        </div>

        {/* The promises as a numbered strip — not cards. */}
        <dl className="mt-16 grid gap-x-10 gap-y-6 border-t border-line-soft/50 pt-8 sm:grid-cols-3">
          {PROMISES.map(({ index, icon: Icon, title, body }) => (
            <div key={index} className="flex gap-4">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" aria-hidden />
              <div>
                <dt className="flex items-baseline gap-3 text-sm font-medium text-t1">
                  <span className="kicker-muted">{index}</span>
                  {title}
                </dt>
                <dd className="mt-2 pl-9 text-sm leading-relaxed text-t4">{body}</dd>
              </div>
            </div>
          ))}
        </dl>
      </Section>

      {/* ── 01 · À la une ────────────────────────────────────────── */}
      <motion.div {...reveal(reduced)}>
        <Section aria-labelledby="featured-heading">
          <SectionHeader
            index="01"
            eyebrow="La bibliothèque"
            id="featured-heading"
            title="À la une"
            action={<Link to="/ressources" className="text-sm font-medium text-gold-400 underline-offset-4 hover:text-gold-300 hover:underline">Toute la bibliothèque</Link>}
          />

          {recent.loading ? (
            <div role="status" className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
              <Skeleton className="aspect-[16/10]" />
              <div className="space-y-4 self-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-4/5" />
                <Skeleton className="h-10 w-3/5" />
                <Skeleton className="h-4 w-full" />
              </div>
              <span className="sr-only">Chargement des ressources…</span>
            </div>
          ) : recent.error ? (
            <ErrorState title="La bibliothèque est momentanément indisponible." onRetry={recent.reload} />
          ) : featured ? (
            <>
              <ResourceSpotlight resource={featured} cataloguePath="/ressources" />
              {next.length > 0 && (
                <ul className="mt-12">
                  {next.map((resource, i) => (
                    <ResourceIndexItem key={resource.id} resource={resource} index={String(i + 2).padStart(2, '0')} cataloguePath="/ressources" />
                  ))}
                </ul>
              )}
            </>
          ) : (
            <EmptyState title="Les premières ressources arrivent." description="Les vidéos et les ebooks apparaîtront ici dès leur publication." />
          )}
        </Section>
      </motion.div>

      {/* ── 02 · L'agenda ────────────────────────────────────────── */}
      <motion.div {...reveal(reduced)}>
        <Section aria-labelledby="agenda-heading" bordered>
          <SectionHeader
            index="02"
            eyebrow="En ligne et sur place"
            id="agenda-heading"
            title="L’agenda"
            description="Les prochains rendez-vous pour pratiquer ensemble."
            action={<Link to="/evenements" className="text-sm font-medium text-gold-400 underline-offset-4 hover:text-gold-300 hover:underline">Tout l’agenda</Link>}
          />

          {upcoming.loading ? (
            <div role="status" className="space-y-5">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
              <span className="sr-only">Chargement des événements…</span>
            </div>
          ) : upcoming.error ? (
            <ErrorState title="L’agenda est momentanément indisponible." onRetry={upcoming.reload} />
          ) : upcoming.data?.content.length ? (
            <ul>
              {upcoming.data.content.map((event) => <AgendaItem key={event.id} event={event} cataloguePath="/evenements" />)}
            </ul>
          ) : (
            <EmptyState title="Le prochain rendez-vous se prépare." description="Aucun événement n’est publié pour le moment. Les dates seront annoncées ici." />
          )}
        </Section>
      </motion.div>

      {/* ── 03 · Par sujet ───────────────────────────────────────── */}
      {!!categories.data?.length && (
        <motion.div {...reveal(reduced)}>
          <Section aria-labelledby="subjects-heading" bordered>
            <SectionHeader
              index="03"
              eyebrow="Le sommaire"
              id="subjects-heading"
              title="Explorer par sujet"
            />
            <ul className="grid gap-x-14 sm:grid-cols-2">
              {categories.data.slice(0, 8).map((category, i) => (
                <li key={category.id}>
                  <Link
                    to={`/ressources?categoryId=${category.id}`}
                    className="group flex items-baseline gap-5 border-t border-line-soft/50 px-1 py-5 transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                  >
                    <span className="kicker-muted" aria-hidden>{String(i + 1).padStart(2, '0')}</span>
                    <span className="min-w-0 flex-1 break-words font-display text-xl font-medium text-t1 transition-colors group-hover:text-gold-300 sm:text-2xl">
                      {category.name}
                    </span>
                    <ArrowUpRight className="h-5 w-5 shrink-0 text-t4 opacity-0 transition-opacity group-hover:text-gold-300 group-hover:opacity-100" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        </motion.div>
      )}

      {/* ── Action ───────────────────────────────────────────────── */}
      <motion.div {...reveal(reduced)}>
        <Section bordered spacing="tight">
          <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-6">
            <h2 className="font-display text-3xl font-medium tracking-tight text-t1 sm:text-4xl">
              Passe à la <em className="italic text-gold-300">pratique</em>.
            </h2>
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/inscription" className="btn-primary">Créer un compte</Link>
              <Link to="/ressources" className="btn-secondary">Explorer sans compte</Link>
            </div>
          </div>
        </Section>
      </motion.div>
    </Layout>
  );
}
