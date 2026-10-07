import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarDays, MessageCircle, Podcast } from 'lucide-react';

import SEO from '@/components/common/SEO';
import Layout from '@/components/layout/Layout';
import { Section } from '@/components/layout/Page';

const ACTIONS = [
  {
    icon: BookOpen,
    title: 'La bibliothèque',
    body: 'Des vidéos, des ebooks et des articles en accès libre. Tu choisis un sujet, tu avances à ton rythme.',
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

/** About the work, not the founder: a raised poster band, four moves on black, a short signature. */
export default function About() {
  return (
    <Layout>
      <SEO title="À propos" description="LesCracks est une plateforme tech : une bibliothèque ouverte, des rendez-vous réguliers, un talk vidéo et une communauté qui apprend en faisant." url="/a-propos" />

      <section className="mode-raised grid lg:grid-cols-2">
        <div className="flex items-center px-5 py-20 sm:px-8 lg:py-28 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:pr-16">
          <div className="max-w-xl">
            <p className="kicker">À propos</p>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[0.92] tracking-tight text-t1 sm:text-6xl xl:text-7xl xl:leading-[0.9]">
              Apprendre la tech, entouré.
            </h1>
            <p className="mt-8 text-lg leading-normal text-t3">
              Une plateforme en accès libre : des ressources choisies, des rendez-vous pour pratiquer, une communauté qui avance ensemble.
            </p>
          </div>
        </div>
        <img src="/images/about.webp" alt="Un groupe réuni autour d’un ordinateur portable" className="h-72 w-full object-cover sm:h-96 lg:h-full" loading="eager" />
      </section>

      <Section aria-labelledby="actions-heading">
        <h2 id="actions-heading" className="mb-12 max-w-2xl font-display text-4xl font-bold leading-[0.96] tracking-tight text-t1 sm:text-5xl">
          Quatre façons d’avancer.
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {ACTIONS.map(({ icon: Icon, title, body, to, link, ...rest }) => {
            const external = 'external' in rest && rest.external;
            const linkClass = 'link mt-6 inline-flex items-center gap-2 text-sm';
            return (
              <li key={title} className="flex flex-col rounded-lg bg-card p-6 sm:p-8">
                <Icon className="h-6 w-6 text-gold-400" aria-hidden />
                <h3 className="mt-5 font-display text-2xl font-bold leading-tight text-t1">{title}</h3>
                <p className="mt-3 max-w-md text-base leading-normal text-t3">{body}</p>
                <span className="mt-auto">
                  {external ? (
                    <a href={to} target="_blank" rel="noopener noreferrer" className={linkClass}>{link}<ArrowRight className="h-4 w-4" aria-hidden /></a>
                  ) : (
                    <Link to={to} className={linkClass}>{link}<ArrowRight className="h-4 w-4" aria-hidden /></Link>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section tone="raised" spacing="tight">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <img src="/images/photo-brandon.jpeg" alt="Brandon Kamga, fondateur de LesCracks" className="h-16 w-16 shrink-0 rounded-full object-cover" loading="lazy" />
            <div className="min-w-0">
              <p className="text-base font-bold text-t1">Brandon Kamga</p>
              <p className="label mt-1">Fondateur</p>
            </div>
          </div>
          <a href="mailto:contact@lescracks.com" className="btn-primary">Écrire à l’équipe</a>
        </div>
      </Section>
    </Layout>
  );
}
