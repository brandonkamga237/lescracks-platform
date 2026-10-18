import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';

import SEO from '@/components/common/SEO';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import ArticleCard from '@/components/blog/ArticleCard';
import AgendaItem from '@/components/events/AgendaItem';
import EpisodeRow from '@/components/talks/EpisodeRow';
import DuotonePhoto from '@/components/illustrations/DuotonePhoto';
import LineArt from '@/components/illustrations/LineArt';
import Layout from '@/components/layout/Layout';
import { Section, SectionHeader } from '@/components/layout/Page';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { api } from '@/services/api';

/**
 * Poster-studio landing: a split hero, then full-bleed bands that alternate pure black and
 * raised black. The shade change is the only section separator.
 */

const PROMISES = [
  'Des articles pour comprendre et progresser.',
  'Ateliers et conférences, en ligne ou sur place.',
  'Une communauté qui avance ensemble.',
] as const;

const WHY = [
  'Des contenus choisis, pas une avalanche de liens.',
  'Pensés pour débuter comme pour progresser.',
  'Des rendez-vous réguliers pour pratiquer en vrai.',
  'Le Talk : la tech africaine racontée par celles et ceux qui la font.',
] as const;

const WHATSAPP = 'https://chat.whatsapp.com/BQvJNnAxAWw3NWCkqCfhQK';

// Marketing surface, fired once. Full transform strings stay on the GPU; MotionConfig drops the movement under reduced motion and keeps the fade.
const REVEAL = { initial: { opacity: 0, transform: 'translateY(16px)' }, whileInView: { opacity: 1, transform: 'translateY(0px)' }, viewport: { once: true, margin: '-80px' }, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } } as const;

export default function Landing() {
  const recent = useApi((signal) => api.articles(0, 3, signal), []);
  const upcoming = useApi((signal) => api.upcomingEvents(0, 3, signal), []);
  const talks = useApi((signal) => api.talks(0, 3, signal), []);
  const { isSignedIn, isAdmin, name } = useSession();
  const firstName = name?.trim().split(/\s+/)[0];

  // A figure only shows once it is real and above zero: a dash or a 0 tells a visitor nothing.
  const figures = ([
    [recent.data?.totalElements, 'article', 'articles'],
    [talks.data?.totalElements, 'épisode du Talk', 'épisodes du Talk'],
    [upcoming.data?.totalElements, 'rendez-vous à venir', 'rendez-vous à venir'],
  ] as const).filter(([value]) => value != null && value > 0) as ReadonlyArray<readonly [number, string, string]>;

  return (
    <Layout>
      <SEO description="LesCracks : articles, ateliers et le Talk pour apprendre la tech et passer à la pratique, avec une communauté qui apprend en faisant." url="/" />

      {/* ── Hero: raised headline panel · photo action panel ────── */}
      <section className="grid lg:grid-cols-[55fr_45fr]">
        <div className="mode-raised flex items-center px-5 py-10 sm:px-8 sm:py-16 lg:py-24 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:pr-16">
          <div className="max-w-2xl">
            <p className="kicker animate-rise motion-reduce:animate-page-in">Apprendre, pratiquer, avancer</p>
            <h1 className="mt-3 animate-rise motion-reduce:animate-page-in font-display text-4xl font-bold leading-[0.95] tracking-tight text-t1 sm:mt-5 sm:text-6xl xl:text-7xl [animation-delay:50ms]">
              {isSignedIn
                ? <>Bon retour{firstName ? <>, {firstName}</> : ''}. La suite t’attend.</>
                : <>Deviens aussi un crack de la tech.</>}
            </h1>
            <p className="mt-4 max-w-lg animate-rise motion-reduce:animate-page-in text-base leading-normal text-t3 sm:mt-6 sm:text-lg [animation-delay:100ms]">
              {isSignedIn
                ? 'Reprends ta lecture ou trouve le prochain rendez-vous.'
                : 'Articles, ateliers et le Talk pour apprendre la tech et passer à la pratique.'}
            </p>
            <div className="mt-6 flex animate-rise motion-reduce:animate-page-in flex-wrap items-center gap-x-6 gap-y-4 [animation-delay:150ms]">
              <Link to="/blog" className="btn-primary">
                Lire le blog <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link to="/evenements" className="link inline-flex items-center gap-1.5 text-sm">Voir l’agenda <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            </div>
          </div>
        </div>

        {/* The card straddles the seam on wide screens so the two halves read as one poster. */}
        <div className="relative bg-black pb-12 lg:pb-0">
          <DuotonePhoto src="/images/community-1.webp" loading="eager" className="h-48 sm:h-80 lg:absolute lg:inset-0 lg:h-auto" />
          <div className="relative mx-5 -mt-12 sm:mx-8 lg:absolute lg:bottom-12 lg:-left-16 lg:mx-0 lg:mt-0 lg:w-[22rem]">
            <div className="mode-raised animate-rise motion-reduce:animate-page-in rounded-lg border border-line p-5 sm:p-7 [animation-delay:200ms] sm:max-w-sm lg:max-w-none">
              {isSignedIn ? (
                <>
                  <h2 className="text-2xl font-bold leading-tight text-t1">Ton espace</h2>
                  <p className="mt-2 text-sm text-t3">Tout ce qu’il te faut pour continuer.</p>
                  <Link to={isAdmin ? '/admin' : '/profil'} className="btn-secondary mt-6 w-full">{isAdmin ? 'Administration' : 'Mon compte'}</Link>
                  <p className="mt-4 text-center text-sm text-t3">
                    Ou regarde <Link to="/talk" className="link">LesCracks Talk</Link>
                  </p>
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
                  <Link to="/inscription" className="btn-secondary mt-7 w-full">Créer mon compte</Link>
                  <p className="mt-4 text-center text-sm text-t3">
                    Déjà inscrit ? <Link to="/connexion" className="link">Se connecter</Link>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {figures.length > 0 && (
        <section aria-label="LesCracks en chiffres" className="border-b border-line-soft bg-black">
          <ul className="mx-auto flex max-w-7xl flex-wrap items-baseline gap-x-8 gap-y-2 px-5 py-5 sm:px-8 sm:py-6">
            {figures.map(([value, one, many]) => (
              <li key={many} className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-bold tabular-nums leading-none text-t1 sm:text-3xl">{value.toLocaleString('fr-FR')}</span>
                <span className="label">{value > 1 ? many : one}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Derniers articles — noir relevé ─────────────────────── */}
      <motion.div {...REVEAL}>
        <Section tone="raised" aria-labelledby="articles-heading">
          <SectionHeader
            eyebrow="Le blog"
            id="articles-heading"
            title="Derniers articles"
            action={<Link to="/blog" className="link inline-flex items-center gap-1.5 text-sm">Tout le blog <ArrowRight className="h-4 w-4" aria-hidden /></Link>}
          />
          {recent.loading ? (
            <div role="status" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-72 rounded-lg" />)}
              <span className="sr-only">Chargement des articles…</span>
            </div>
          ) : recent.error ? (
            <ErrorState title="Le blog est momentanément indisponible." onRetry={recent.reload} />
          ) : recent.data?.content.length ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recent.data.content.map((article) => <ArticleCard key={article.id} article={article} />)}
            </ul>
          ) : (
            <EmptyState title="Les premiers articles arrivent." description="Ils apparaîtront ici dès leur publication." />
          )}
        </Section>
      </motion.div>

      {/* ── Le Talk — noir: the latest episodes, played on the site ── */}
      {!!talks.data?.content.length && (
        <motion.div {...REVEAL}>
          <Section bordered aria-labelledby="talk-heading">
            <SectionHeader
              eyebrow="Sur YouTube"
              id="talk-heading"
              title="Le Talk"
              description="Des conversations avec celles et ceux qui construisent la tech africaine."
              action={<Link to="/talk" className="link inline-flex items-center gap-1.5 text-sm">Tous les épisodes <ArrowRight className="h-4 w-4" aria-hidden /></Link>}
            />
            <ul className="border-b border-line">
              {talks.data.content.map((video) => <EpisodeRow key={video.id} video={video} />)}
            </ul>
          </Section>
        </motion.div>
      )}

      {/* ── L'agenda — noir relevé, only when a date is announced ── */}
      {!!upcoming.data?.content.length && (
        <motion.div {...REVEAL}>
          <Section tone="raised" aria-labelledby="agenda-heading">
            <SectionHeader
              eyebrow="En ligne et sur place"
              id="agenda-heading"
              title="Prochains rendez-vous"
              action={<Link to="/evenements" className="link inline-flex items-center gap-1.5 text-sm">Tout l’agenda <ArrowRight className="h-4 w-4" aria-hidden /></Link>}
            />
            <ul className="border-b border-line">
              {upcoming.data.content.map((event) => <AgendaItem key={event.id} event={event} cataloguePath="/evenements" />)}
            </ul>
          </Section>
        </motion.div>
      )}

      {/* ── Pourquoi — full-bleed photo + checklist on black ────── */}
      <section className="relative overflow-hidden bg-black">
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.2fr_1fr] lg:py-24">
          <div>
            <p className="kicker">Pourquoi LesCracks</p>
            <h2 className="mt-3 font-display text-2xl font-bold leading-tight tracking-tight text-t1 sm:text-4xl">
              Apprendre seul, c’est long. Ensemble, ça avance.
            </h2>
            <ul className="mt-10 space-y-5">
              {WHY.map((reason) => (
                <li key={reason} className="flex gap-4 text-base leading-normal text-t2 sm:text-lg">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-gold-ink" strokeWidth={3} aria-hidden />
                  {reason}
                </li>
              ))}
            </ul>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="btn-primary mt-10">
              Rejoindre sur WhatsApp <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
          <LineArt motif="network" className="mx-auto hidden w-full max-w-md text-gold-400 lg:block" />
        </div>
      </section>

      {/* ── Action — noir ─────────────────────────────────── */}
      <Section spacing="loose" bordered>
        <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="max-w-3xl font-display text-3xl font-bold leading-[0.95] tracking-tight text-t1 sm:text-5xl lg:text-6xl">
            Passe à la <span className="text-gold-400">pratique.</span>
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <Link to={isSignedIn ? '/blog' : '/inscription'} className="btn-primary">{isSignedIn ? 'Lire le blog' : 'Créer un compte'}</Link>
            <Link to="/evenements" className="btn-secondary">Voir l’agenda</Link>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
