import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';

import SEO from '@/components/common/SEO';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import AgendaItem from '@/components/events/AgendaItem';
import Layout from '@/components/layout/Layout';
import { Section, SectionHeader } from '@/components/layout/Page';
import ResourceCard from '@/components/resources/ResourceCard';
import ResourceSpotlight from '@/components/resources/ResourceSpotlight';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { api } from '@/services/api';

/**
 * Poster-studio landing: a white/black split hero, then full-bleed bands that alternate
 * MODE WHITE and MODE BLACK. The colour change is the only section separator.
 */

const PROMISES = [
  'Vidéos, ebooks et articles en accès libre, sans compte.',
  'Ateliers et conférences, en ligne ou sur place.',
  'Une communauté francophone qui avance ensemble.',
] as const;

const WHY = [
  'Des contenus choisis, pas une avalanche de liens.',
  'En français, pensés pour débuter comme pour progresser.',
  'Des rendez-vous réguliers pour pratiquer en vrai.',
  'Le Talk : la tech africaine racontée par celles et ceux qui la font.',
] as const;

const WHATSAPP = 'https://chat.whatsapp.com/BQvJNnAxAWw3NWCkqCfhQK';

const reveal = (reduced: boolean | null) => (reduced ? {} : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-80px' }, transition: { duration: 0.55, ease: 'easeOut' } });

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="stat-tile">
      <p className="font-display text-4xl font-bold leading-none tracking-tight text-t1 sm:text-[2.375rem]">{value}</p>
      <p className="label mt-3">{label}</p>
    </div>
  );
}

export default function Landing() {
  const reduced = useReducedMotion();
  const recent = useApi((signal) => api.resources({ size: 4 }, signal), []);
  const upcoming = useApi((signal) => api.upcomingEvents(0, 5, signal), []);
  const categories = useApi((signal) => api.categories(signal), []);
  const { isSignedIn, isAdmin, name } = useSession();
  const firstName = name?.trim().split(/\s+/)[0];

  const featured = recent.data?.content[0];
  const next = recent.data?.content.slice(1) ?? [];
  const count = (value: number | undefined) => (value == null ? '—' : value.toLocaleString('fr-FR'));

  return (
    <Layout>
      <SEO title="Apprendre la tech, concrètement" description="Des vidéos, des ebooks et des événements pour développer tes compétences tech, à ton rythme. Une bibliothèque ouverte, une communauté francophone." url="/" />

      {/* ── Hero: white headline panel · black action panel ─────── */}
      <section className="grid lg:grid-cols-[55fr_45fr]">
        <div className="mode-light flex items-center px-5 py-20 sm:px-8 lg:py-28 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:pr-16">
          <div className="max-w-2xl">
            <p className="kicker">La plateforme tech francophone</p>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[0.92] tracking-tight text-t1 sm:text-6xl xl:text-[5.25rem] xl:leading-[0.9]">
              {isSignedIn
                ? <>Bon retour{firstName ? <>, {firstName}</> : ''}. La suite t’attend.</>
                : <>Deviens aussi un crack de la tech.</>}
            </h1>
            <p className="mt-8 max-w-lg text-lg leading-normal text-t3">
              {isSignedIn
                ? 'Reprends ta lecture ou trouve le prochain rendez-vous.'
                : 'Vidéos, ebooks et ateliers pour apprendre la tech en français, en accès libre.'}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link to="/ressources" className="btn-primary">
                Explorer la bibliothèque <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link to="/evenements" className="btn-secondary">Voir l’agenda</Link>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center overflow-hidden bg-black px-5 py-16 sm:px-8 lg:py-28">
          <img aria-hidden src="/images/community-1.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
          <div className="mode-light relative w-full max-w-sm rounded-lg p-7 sm:p-8">
            {isSignedIn ? (
              <>
                <h2 className="text-2xl font-bold leading-tight text-t1">Ton espace</h2>
                <p className="mt-2 text-sm text-t3">Tout ce qu’il te faut pour continuer.</p>
                <div className="mt-6 grid gap-2">
                  <Link to={isAdmin ? '/admin' : '/profil'} className="btn-primary w-full">{isAdmin ? 'Administration' : 'Mon espace'}</Link>
                  <Link to="/ressources" className="btn-secondary w-full">La bibliothèque</Link>
                  <Link to="/talk" className="btn-secondary w-full">LesCracks Talk</Link>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold leading-tight text-t1">Rejoins la communauté</h2>
                <ul className="mt-5 space-y-3">
                  {PROMISES.map((promise) => (
                    <li key={promise} className="flex gap-3 text-sm leading-normal text-t2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink" strokeWidth={3} aria-hidden />
                      {promise}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 grid gap-2">
                  <Link to="/inscription" className="btn-primary w-full">Créer un compte gratuit</Link>
                  <Link to="/connexion" className="btn-secondary w-full">J’ai déjà un compte</Link>
                </div>
                <p className="mt-4 text-center text-xs text-t4">
                  Ou <Link to="/ressources" className="link">explore sans compte</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Figures: charcoal tiles on black ────────────────────── */}
      <Section spacing="tight" aria-label="LesCracks en chiffres">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat value={count(recent.data?.totalElements)} label="Ressources" />
          <Stat value={count(categories.data?.length)} label="Sujets" />
          <Stat value={count(upcoming.data?.totalElements)} label="Rendez-vous à venir" />
          <Stat value="0 €" label="Accès à la bibliothèque" />
        </div>
      </Section>

      {/* ── À la une — MODE WHITE ───────────────────────────────── */}
      <motion.div {...reveal(reduced)}>
        <Section tone="light" aria-labelledby="featured-heading">
          <SectionHeader
            eyebrow="La bibliothèque"
            id="featured-heading"
            title="À la une"
            action={<Link to="/ressources" className="link inline-flex items-center gap-1.5 text-sm">Toute la bibliothèque <ArrowRight className="h-4 w-4" aria-hidden /></Link>}
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
                <ul className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {next.map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} cataloguePath="/ressources" />
                  ))}
                </ul>
              )}
            </>
          ) : (
            <EmptyState title="Les premières ressources arrivent." description="Les vidéos et les ebooks apparaîtront ici dès leur publication." />
          )}
        </Section>
      </motion.div>

      {/* ── L'agenda — MODE BLACK ───────────────────────────────── */}
      <motion.div {...reveal(reduced)}>
        <Section aria-labelledby="agenda-heading">
          <SectionHeader
            eyebrow="En ligne et sur place"
            id="agenda-heading"
            title="L’agenda"
            description="Les prochains rendez-vous pour pratiquer ensemble."
            action={<Link to="/evenements" className="link inline-flex items-center gap-1.5 text-sm">Tout l’agenda <ArrowRight className="h-4 w-4" aria-hidden /></Link>}
          />

          {upcoming.loading ? (
            <div role="status" className="space-y-5">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
              <span className="sr-only">Chargement des événements…</span>
            </div>
          ) : upcoming.error ? (
            <ErrorState title="L’agenda est momentanément indisponible." onRetry={upcoming.reload} />
          ) : upcoming.data?.content.length ? (
            <ul className="border-b border-line">
              {upcoming.data.content.map((event) => <AgendaItem key={event.id} event={event} cataloguePath="/evenements" />)}
            </ul>
          ) : (
            <EmptyState title="Le prochain rendez-vous se prépare." description="Aucun événement n’est publié pour le moment. Les dates seront annoncées ici." />
          )}
        </Section>
      </motion.div>

      {/* ── Pourquoi — full-bleed photo + checklist on black ────── */}
      <section className="relative overflow-hidden bg-black">
        <img src="/images/community-2.jpg" alt="La communauté LesCracks réunie" className="absolute inset-0 h-full w-full object-cover opacity-40" loading="lazy" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/40" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:py-32">
          <div>
            <p className="kicker">Pourquoi LesCracks</p>
            <h2 className="mt-5 font-display text-4xl font-bold leading-[0.96] tracking-tight text-t1 sm:text-5xl lg:text-[3.5rem] lg:leading-[0.92]">
              Apprendre seul, c’est long. Ensemble, ça avance.
            </h2>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="btn-primary mt-10">
              Rejoindre sur WhatsApp <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
          <ul className="space-y-5 self-center">
            {WHY.map((reason) => (
              <li key={reason} className="flex gap-4 text-base leading-normal text-t1 sm:text-lg">
                <Check className="mt-1 h-5 w-5 shrink-0 text-gold-ink" strokeWidth={3} aria-hidden />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Par sujet — MODE WHITE ──────────────────────────────── */}
      {!!categories.data?.length && (
        <motion.div {...reveal(reduced)}>
          <Section tone="light" aria-labelledby="subjects-heading">
            <SectionHeader eyebrow="Trouver son sujet" id="subjects-heading" title="Explorer par sujet" />
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {categories.data.slice(0, 12).map((category) => (
                <li key={category.id}>
                  <Link
                    to={`/ressources?categoryId=${category.id}`}
                    className="group flex h-full items-center justify-between gap-4 rounded border border-line px-5 py-4 transition-colors hover:border-t1 hover:bg-noir-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                  >
                    <span className="min-w-0 break-words text-base font-semibold text-t1">{category.name}</span>
                    <ArrowUpRight className="h-5 w-5 shrink-0 text-t4 transition-colors group-hover:text-gold-ink" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        </motion.div>
      )}

      {/* ── Action — MODE BLACK ─────────────────────────────────── */}
      <Section spacing="loose">
        <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="max-w-3xl font-display text-5xl font-bold leading-[0.92] tracking-tight text-t1 sm:text-6xl lg:text-7xl lg:leading-[0.9]">
            Passe à la <span className="text-gold-400">pratique.</span>
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <Link to={isSignedIn ? '/ressources' : '/inscription'} className="btn-primary">{isSignedIn ? 'Ouvrir la bibliothèque' : 'Créer un compte'}</Link>
            <Link to="/evenements" className="btn-secondary">Voir l’agenda</Link>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
