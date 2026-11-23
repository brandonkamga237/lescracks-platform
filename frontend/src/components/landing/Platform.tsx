import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { Reveal } from '@/components/motion/Reveal';
import { SplitText } from '@/components/motion/SplitText';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { ParallaxImage } from '@/components/motion/Parallax';

interface Space {
  title: string;
  text: string;
  link?: { to: string; label: string };
  soon?: boolean;
  image: string;
  rotate: number;
  /** Hover tilt, alternated so neighbouring illustrations lean apart. */
  lean: string;
}

const SPACES: Space[] = [
  { title: 'Blog', text: 'Des articles écrits par des praticiens : notions expliquées simplement, retours d’expérience, bonnes pratiques.', link: { to: '/blog', label: 'Lire le blog' }, image: 'memo', rotate: 8, lean: 'group-hover:-rotate-6' },
  { title: 'Rendez-vous', text: 'Ateliers, webinaires et conférences, en ligne ou sur place. Tu t’inscris en un clic, et chaque participation te vaut une attestation vérifiable.', link: { to: '/evenements', label: 'Voir l’agenda' }, image: 'calendar', rotate: -6, lean: 'group-hover:rotate-6' },
  { title: 'Le Talk', text: 'Des conversations vidéo avec celles et ceux qui construisent la tech africaine : des parcours réels, pas des légendes.', link: { to: '/talk', label: 'Regarder les épisodes' }, image: 'mic', rotate: 10, lean: 'group-hover:-rotate-6' },
  { title: 'Cours', text: 'Des parcours pour apprendre pas à pas, leçon après leçon. Certains en accès libre, d’autres en premium. Les premiers arrivent bientôt.', soon: true, image: 'cap', rotate: -10, lean: 'group-hover:rotate-6' },
];

/** The four spaces of the platform, one editorial row each, on the ivory band. */
export default function Platform() {
  return (
    <section aria-labelledby="platform-title" className="relative z-10 rounded-t-[2rem] bg-[#f4f3ee] text-[#0a0a0a] sm:rounded-t-[3rem]">
      <div className="mx-auto max-w-[1320px] px-4 pb-24 pt-20 sm:px-8 sm:pt-28">
        <Reveal><p className="text-sm font-medium text-gold-700">La plateforme</p></Reveal>
        <SplitText
          id="platform-title"
          parts={['Tout pour apprendre la tech.', { text: 'Lire, regarder, pratiquer, au même endroit.', className: 'text-black/40' }]}
          className="mt-5 max-w-3xl text-[clamp(2rem,4.6vw,3.75rem)] font-semibold leading-[1.05] tracking-[-0.04em]"
        />

        <Stagger className="mt-16 border-t border-black/10">
          {SPACES.map((space) => (
            <StaggerItem key={space.title} className="group relative grid gap-5 overflow-hidden border-b border-black/10 py-12 last:border-b-0 sm:py-14 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-16">
              <h3 className="flex flex-wrap items-center gap-x-4 gap-y-2 text-3xl font-semibold tracking-[-0.035em] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-2 sm:text-5xl">
                {space.title}
                {space.soon && <span className="rounded-full border border-black/15 bg-white px-3 py-1 text-xs font-medium tracking-normal text-gold-700">En préparation</span>}
              </h3>
              <div className="relative z-10 max-w-xl pr-24 sm:pr-48">
                <p className="text-lg leading-relaxed text-black/65">{space.text}</p>
                {space.link && (
                  <Link to={space.link.to} className="group/link mt-6 inline-flex items-center gap-3 font-medium">
                    {space.link.label}
                    <span className="grid h-9 w-9 place-items-center rounded-full border border-black/20 transition-[background-color,border-color,transform] duration-300 group-hover/link:-rotate-45 group-hover/link:border-gold-400 group-hover/link:bg-gold-400">
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </Link>
                )}
              </div>
              <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2">
                <span className={`block transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-110 ${space.lean}`}>
                  <ParallaxImage src={`/images/illustrations/${space.image}.webp`} rotate={space.rotate} className="w-24 sm:w-40 lg:w-52" />
                </span>
              </span>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
