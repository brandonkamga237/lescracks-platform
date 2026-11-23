import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

import { Magnetic } from '@/components/motion/Magnetic';
import { ParallaxImage } from '@/components/motion/Parallax';
import { Reveal } from '@/components/motion/Reveal';
import { SplitText } from '@/components/motion/SplitText';
import { Band } from '@/components/ui/band';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { COMMUNITY_URL, illustrationSrc } from '@/config/site';

/** The last call: join, or for a member, the community where the conversation goes on. */
export default function JoinCall({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <Band overlap labelledBy="join-title" className="overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_70%_100%,rgba(212,175,55,0.10),transparent_70%)]" />
      <span className="pointer-events-none absolute right-[8%] top-1/2 hidden -translate-y-1/2 md:block">
        <ParallaxImage src={illustrationSrc('handshake')} rotate={-8} className="w-44 xl:w-60" />
      </span>
      <Container className="relative pb-24 pt-24 sm:pt-32">
        <SplitText
          id="join-title"
          parts={isSignedIn ? ['La conversation', { text: 'continue.', className: 'text-gold-400' }] : ['Rejoins', { text: 'la communauté.', className: 'text-gold-400' }]}
          className="max-w-3xl text-[clamp(2.25rem,5.6vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.045em]"
        />
        <Reveal>
          <p className="mt-6 max-w-lg text-lg text-white/55">
            {isSignedIn
              ? 'La communauté échange chaque jour sur WhatsApp : questions, entraide et annonces des prochains rendez-vous.'
              : 'Crée ton compte en une minute pour t’inscrire aux rendez-vous et garder tes attestations au même endroit.'}
          </p>
        </Reveal>
        <Reveal className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Magnetic>
            <Button asChild size="lg">
              <Link to={isSignedIn ? '/profil' : '/inscription'}>
                {isSignedIn ? 'Mon espace' : 'Créer mon compte'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </Button>
          </Magnetic>
          <Magnetic>
            <Button asChild size="lg" variant="outline">
              <a href={COMMUNITY_URL} target="_blank" rel="noopener noreferrer" aria-label="Le groupe WhatsApp, nouvel onglet">
                Le groupe WhatsApp
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
            </Button>
          </Magnetic>
        </Reveal>
      </Container>
    </Band>
  );
}
