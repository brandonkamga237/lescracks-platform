import { Link } from 'react-router-dom';
import { ArrowRight, Mic, Podcast, Users, Youtube } from 'lucide-react';

import NewsletterCard from '@/components/common/NewsletterCard';
import SEO from '@/components/common/SEO';
import Layout from '@/components/layout/Layout';
import { PageHeader, Section, SectionHeader } from '@/components/layout/Page';

const FORMATS = [
  {
    icon: Mic,
    title: 'Des invités qui font',
    body: 'Développeurs, fondateurs, designers, bâtisseurs de produits. Chaque épisode donne la parole à quelqu’un qui construit — et qui raconte comment il en est arrivé là.',
  },
  {
    icon: Youtube,
    title: 'La tech africaine en avant',
    body: 'Sensibiliser et promouvoir ce qui se fait sur le continent : les produits, les réalisations et les initiatives qui méritent d’être connus.',
  },
  {
    icon: Users,
    title: 'Des parcours réels',
    body: 'On parle autant de réussites que de débuts difficiles. L’objectif : montrer des chemins concrets, pas des légendes.',
  },
] as const;

/**
 * LesCracks Talk: the announcement page for the upcoming YouTube series.
 * Conversations about African tech, made for the young and the career-switchers.
 */
export default function Talk() {
  return (
    <Layout>
      <SEO
        title="LesCracks Talk"
        description="LesCracks Talk, le rendez-vous vidéo qui met en lumière la tech africaine : des conversations avec celles et ceux qui construisent, des produits et des parcours réels. Bientôt sur YouTube."
        url="/talk"
      />

      <Section spacing="loose" className="border-b border-line-soft/50">
        <div className="max-w-3xl">
          <PageHeader
            eyebrow="Nouveau · bientôt sur YouTube"
            title="LesCracks Talk"
            description="Un rendez-vous vidéo pour sensibiliser, promouvoir et raconter la tech africaine — avec celles et ceux qui la construisent."
          />
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="https://youtube.com/@lescracks"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <Youtube className="h-4 w-4" aria-hidden />
              Suivre la chaîne
            </a>
            <Link to="/ressources" className="btn-secondary">Explorer la bibliothèque</Link>
          </div>
        </div>
      </Section>

      <Section aria-labelledby="concept-heading">
        <SectionHeader
          id="concept-heading"
          title="Le concept"
          description="Des conversations filmées, publiées sur YouTube, autour de trois idées simples."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FORMATS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-3xl border border-white/[0.06] bg-noir-900 p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold-400/25 bg-gold-400/10 text-gold-400">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-t1">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-t3">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section muted bordered aria-labelledby="audience-heading">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeader
              id="audience-heading"
              title="Pensé pour toi"
              description="Deux publics au centre de chaque épisode."
            />
            <ul className="space-y-4">
              <li className="flex gap-4">
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-400/10 text-gold-400"><Podcast className="h-4 w-4" aria-hidden /></span>
                <p className="text-sm leading-relaxed text-t3"><strong className="font-medium text-t1">Les jeunes qui découvrent la tech.</strong> Des modèles accessibles, des métiers expliqués, des portes d’entrée concrètes pour commencer.</p>
              </li>
              <li className="flex gap-4">
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-400/10 text-gold-400"><Users className="h-4 w-4" aria-hidden /></span>
                <p className="text-sm leading-relaxed text-t3"><strong className="font-medium text-t1">Les personnes en reconversion.</strong> Des invités qui ont changé de voie racontent leur transition, leurs erreurs et ce qui a vraiment marché.</p>
              </li>
            </ul>
          </div>
          <div className="rounded-3xl border border-gold-400/20 bg-gradient-to-br from-gold-400/[0.08] to-transparent p-8 sm:p-10">
            <p className="font-display text-xl font-semibold leading-relaxed text-t1 sm:text-2xl">
              « La tech africaine manque de projecteurs. LesCracks Talk en est un. »
            </p>
            <p className="mt-4 text-sm text-t3">Le premier épisode est en préparation. Abonne-toi à la chaîne pour ne pas le rater.</p>
            <a
              href="https://youtube.com/@lescracks"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gold-400 underline-offset-4 hover:text-gold-300 hover:underline"
            >
              youtube.com/@lescracks
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-2xl">
          <NewsletterCard />
          <p className="mt-6 text-center text-sm text-t4">
            Tu construis quelque chose et tu veux en parler dans un épisode ?{' '}
            <a href="mailto:contact@lescracks.com" className="text-gold-400 underline-offset-4 hover:text-gold-300 hover:underline">Écris-nous</a>.
          </p>
        </div>
      </Section>
    </Layout>
  );
}
