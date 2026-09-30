import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarDays, MessageCircle, Podcast } from 'lucide-react';

import SEO from '@/components/common/SEO';
import Layout from '@/components/layout/Layout';
import { PageHeader, Section } from '@/components/layout/Page';

const ACTIONS = [
  {
    icon: BookOpen,
    title: 'La bibliothèque',
    body: 'Des vidéos, des ebooks et des articles en français, en accès libre. Tu choisis un sujet, tu avances à ton rythme.',
    to: '/ressources',
    link: 'Explorer la bibliothèque',
  },
  {
    icon: CalendarDays,
    title: 'Les rendez-vous',
    body: 'Ateliers, webinaires, bootcamps et conférences pour pratiquer en groupe et poser tes questions en direct.',
    to: '/evenements',
    link: 'Voir l’agenda',
  },
  {
    icon: Podcast,
    title: 'Le Talk',
    body: 'Des conversations vidéo avec celles et ceux qui construisent la tech africaine : des parcours réels, pas des légendes.',
    to: '/talk',
    link: 'Regarder les épisodes',
  },
  {
    icon: MessageCircle,
    title: 'La communauté',
    body: 'Apprendre seul, c’est difficile. La conversation continue sur WhatsApp, entre personnes qui partagent le même objectif.',
    to: 'https://chat.whatsapp.com/BQvJNnAxAWw3NWCkqCfhQK',
    link: 'Rejoindre la communauté',
    external: true,
  },
] as const;

/**
 * About the work, not the founder: what the platform does, in four moves.
 */
export default function About() {
  return (
    <Layout>
      <SEO title="À propos" description="LesCracks est une plateforme tech francophone : une bibliothèque ouverte, des rendez-vous réguliers, un talk vidéo et une communauté qui apprend en faisant." url="/a-propos" />

      <Section spacing="tight">
        <PageHeader
          eyebrow="À propos"
          title="Ce que nous faisons."
          description="Une plateforme pour apprendre la tech en français. En accès libre, à ton rythme, entouré."
        />

        <ul className="grid gap-x-14 sm:grid-cols-2">
          {ACTIONS.map(({ icon: Icon, title, body, to, link, ...rest }) => {
            const external = 'external' in rest && rest.external;
            return (
            <li key={title} className="border-t border-line-soft/50 py-8">
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded border border-gold-400/25 bg-gold-400/10 text-gold-ink">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h2 className="font-display text-2xl font-medium text-t1">{title}</h2>
              </div>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-t3">{body}</p>
              {external ? (
                <a href={to} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gold-ink transition-colors hover:text-gold-300">
                  {link}<ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              ) : (
                <Link to={to} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gold-ink transition-colors hover:text-gold-300">
                  {link}<ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              )}
            </li>
            );
          })}
        </ul>

        <div className="mt-14 flex items-center gap-5 border-t border-line-soft/50 pt-8">
          <img src="/images/photo-brandon.jpeg" alt="Brandon Kamga, fondateur de LesCracks" className="h-16 w-16 shrink-0 rounded-lg border border-line-soft/60 object-cover" loading="lazy" />
          <div className="min-w-0">
            <p className="font-display text-base font-medium text-t1">Brandon Kamga</p>
            <p className="mt-1 text-sm leading-relaxed text-t3">
              Il a lancé LesCracks et lit tout :{' '}
              <a href="mailto:contact@lescracks.com" className="text-gold-ink underline-offset-4 transition-colors hover:text-gold-300 hover:underline">contact@lescracks.com</a>
            </p>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
