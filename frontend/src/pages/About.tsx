import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

import SEO from '@/components/common/SEO';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { ArrowCircle } from '@/components/ui/arrow-circle';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { SpaceHeader } from '@/components/ui/space-header';
import { COMMUNITY_URL, CONTACT_EMAIL, illustrationSrc } from '@/config/site';

const WAYS = [
  { title: 'Le blog', body: 'Des articles pour comprendre une notion, éviter un piège ou apprendre d’un retour d’expérience. Et bientôt, des cours complets.', to: '/blog', illustration: 'memo' },
  { title: 'Les rendez-vous', body: 'Ateliers, webinaires et conférences pour pratiquer en groupe et poser tes questions en direct.', to: '/rendez-vous', illustration: 'calendar' },
  { title: 'Le Talk', body: 'Des conversations vidéo avec celles et ceux qui construisent la tech africaine : des parcours réels, pas des légendes.', to: '/talk', illustration: 'mic' },
  { title: 'La communauté', body: 'Apprendre seul, c’est difficile. La conversation continue sur WhatsApp, entre personnes qui partagent le même objectif.', href: COMMUNITY_URL, illustration: 'handshake' },
] as const;

const ROW = 'group relative isolate grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-4 border-b border-white/10 py-5 sm:grid-cols-[3.5rem_minmax(0,1fr)_auto] sm:gap-6';

/** About the work, not the founder: the promise, the four ways in, then who to write to. */
export default function About() {
  return (
    <>
      <SEO title="À propos" description="LesCracks est une plateforme tech : un blog, des rendez-vous réguliers, un talk vidéo et une communauté qui apprend en faisant." url="/a-propos" />
      <SpaceHeader title="À propos" lead="Une plateforme pour apprendre la tech : des articles choisis, des rendez-vous pour pratiquer, une communauté qui avance ensemble." />

      <Container className="pb-20">
        <div className="overflow-hidden rounded-3xl">
          <img src="/images/about.webp" alt="Un groupe réuni autour d’un ordinateur portable" className="h-40 w-full object-cover sm:h-56" />
        </div>

        <h2 className="mt-10 text-lg font-semibold tracking-tight">Quatre façons d’avancer</h2>
        <Stagger className="mt-4 border-t border-white/10">
          {WAYS.map((way) => {
            const body = (
              <>
                <span aria-hidden="true" className="absolute inset-0 -z-10 origin-left scale-x-0 bg-white/[0.03] transition-transform duration-500 ease-out group-hover:scale-x-100" />
                <img src={illustrationSrc(way.illustration)} alt="" className="ml-2 h-10 w-10 sm:h-12 sm:w-12" />
                <span className="min-w-0">
                  <span className="block text-base font-medium tracking-tight transition-[color,transform] duration-500 ease-out group-hover:translate-x-2 group-hover:text-gold-400 sm:text-lg">{way.title}</span>
                  <span className="mt-1 block max-w-xl text-sm leading-relaxed text-white/55">{way.body}</span>
                </span>
                <ArrowCircle size="sm" className="mr-2" />
              </>
            );
            return (
              <StaggerItem key={way.title}>
                {'href' in way
                  ? <a href={way.href} target="_blank" rel="noopener noreferrer" aria-label={`${way.title}, nouvel onglet`} className={ROW}>{body}</a>
                  : <Link to={way.to} className={ROW}>{body}</Link>}
              </StaggerItem>
            );
          })}
        </Stagger>

        <div className="mt-10 flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <img src="/images/photo-brandon.jpeg" alt="Brandon Kamga, fondateur de LesCracks" className="h-12 w-12 shrink-0 rounded-full object-cover" loading="lazy" />
            <div className="min-w-0">
              <p className="font-semibold">Brandon Kamga</p>
              <p className="mt-0.5 text-sm text-white/50">Fondateur</p>
            </div>
          </div>
          <Button asChild className="font-semibold"><a href={`mailto:${CONTACT_EMAIL}`}>Écrire à l’équipe<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></a></Button>
        </div>
      </Container>
    </>
  );
}
