import { Link } from 'react-router-dom';

import { ParallaxImage } from '@/components/motion/Parallax';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import { ArrowCircle } from '@/components/ui/arrow-circle';
import { Badge } from '@/components/ui/badge';
import { Band } from '@/components/ui/band';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { illustrationSrc, SPACES } from '@/config/site';
import { cn } from '@/lib/utils';

// Each illustration rests at its own angle and leans the other way from its neighbour on hover.
const POSES = [
  { rotate: 8, lean: 'group-hover:-rotate-6' },
  { rotate: -6, lean: 'group-hover:rotate-6' },
];

/** The spaces of the platform, one editorial row each, on the ivory band. */
export default function Platform() {
  return (
    <Band id="plateforme" tone="ivory" labelledBy="platform-title">
      <Container className="pb-24 pt-20 sm:pt-28">
        <SectionHeading id="platform-title" tone="light" eyebrow="La plateforme" title={['Tout pour apprendre la tech.', { text: 'Lire, regarder, pratiquer, au même endroit.', className: 'text-black/40' }]} />

        <Stagger className="mt-16 border-t border-black/10">
          {SPACES.map((space, index) => {
            const pose = POSES[index % POSES.length];
            return (
              <StaggerItem key={space.label} className="group relative grid gap-5 overflow-hidden border-b border-black/10 py-12 last:border-b-0 sm:py-14 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-16">
                <h3 className="flex flex-wrap items-center gap-x-4 gap-y-2 text-3xl font-semibold tracking-[-0.035em] transition-transform duration-500 ease-out group-hover:translate-x-2 sm:text-5xl">
                  {space.label}
                  {space.soon && <Badge tone="light" size="md">En préparation</Badge>}
                </h3>
                <div className="relative z-10 max-w-xl pr-24 sm:pr-48">
                  <p className="text-lg leading-relaxed text-black/65">{space.description}</p>
                  {space.action && (
                    <Link to={space.to} className="group/link mt-6 inline-flex items-center gap-3 font-medium">
                      {space.action}
                      <ArrowCircle tone="light" size="sm" hover="link" />
                    </Link>
                  )}
                </div>
                <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2">
                  <span className={cn('block transition-transform duration-700 ease-out group-hover:scale-110', pose.lean)}>
                    <ParallaxImage src={illustrationSrc(space.illustration)} rotate={pose.rotate} className="w-24 sm:w-40 lg:w-52" />
                  </span>
                </span>
              </StaggerItem>
            );
          })}
        </Stagger>
      </Container>
    </Band>
  );
}
