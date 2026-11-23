import { ArrowRight, ArrowUpRight } from 'lucide-react';

import SEO from '@/components/common/SEO';
import Faq from '@/components/landing/Faq';
import Hero from '@/components/landing/Hero';
import LandingFooter from '@/components/landing/LandingFooter';
import LandingNav from '@/components/landing/LandingNav';
import LatestArticles from '@/components/landing/LatestArticles';
import MagneticLink from '@/components/landing/MagneticLink';
import { Reveal } from '@/components/motion/Reveal';
import { SplitText } from '@/components/motion/SplitText';
import Platform from '@/components/landing/Platform';
import Ribbons from '@/components/landing/Ribbons';
import { ParallaxImage } from '@/components/motion/Parallax';
import { ScaleInSection } from '@/components/motion/ScaleInSection';
import Subjects from '@/components/landing/Subjects';
import UpcomingEvents from '@/components/landing/UpcomingEvents';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { api } from '@/services/api';

const WHATSAPP = 'https://chat.whatsapp.com/BQvJNnAxAWw3NWCkqCfhQK';

function JoinCall({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <ScaleInSection labelledBy="join-title" className="relative z-20 -mt-8 overflow-hidden rounded-t-[2rem] bg-black sm:rounded-t-[3rem]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_70%_100%,rgba(212,175,55,0.10),transparent_70%)]" />
      <span className="pointer-events-none absolute right-[8%] top-1/2 hidden -translate-y-1/2 md:block">
        <ParallaxImage src="/images/illustrations/handshake.webp" rotate={-8} className="w-44 xl:w-60" />
      </span>
      <div className="relative mx-auto max-w-[1320px] px-4 pb-24 pt-24 sm:px-8 sm:pt-32">
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
          <MagneticLink to={isSignedIn ? '/profil' : '/inscription'} className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gold-400 px-7 font-medium text-black transition-colors hover:bg-gold-300">
            {isSignedIn ? 'Mon espace' : 'Créer mon compte'}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </MagneticLink>
          <MagneticLink href={WHATSAPP} external ariaLabel="Le groupe WhatsApp, nouvel onglet" className="group inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 px-7 transition-colors hover:border-white/40">
            Le groupe WhatsApp
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </MagneticLink>
        </Reveal>
      </div>
    </ScaleInSection>
  );
}

/**
 * The public front door. It has its own bar and footer instead of the shared layout: the bar
 * turns into a floating island and the footer carries the newsletter and the certificate check.
 */
export default function Landing() {
  useSmoothScroll();
  const { isSignedIn } = useSession();
  const upcoming = useApi((signal) => api.upcomingEvents(0, 6, signal), []);
  const recent = useApi((signal) => api.articles(0, 3, signal), []);

  // LesCracks no longer runs hackathons; past ones can still come back from the API.
  const events = (upcoming.data?.content ?? []).filter((event) => event.type !== 'HACKATHON').slice(0, 3);
  const articles = recent.data?.content ?? [];

  return (
    <div id="top" className="min-h-screen bg-black font-geist text-white antialiased">
      <SEO description="LesCracks : articles techniques, ateliers en direct et le Talk pour apprendre la tech avec ceux qui la font." url="/" />
      <a href="#main-content" className="sr-only z-[60] rounded-full bg-gold-400 px-5 py-3 font-medium text-black focus:not-sr-only focus:fixed focus:left-5 focus:top-3">Aller au contenu</a>
      <LandingNav isSignedIn={isSignedIn} nextEvent={events[0]} />
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <Hero nextEvent={events[0]} isSignedIn={isSignedIn} />
        <Subjects />
        <Platform />
        {events.length > 0 && <UpcomingEvents events={events} />}
        <Ribbons />
        {articles.length > 0 && <LatestArticles articles={articles} />}
        <Faq />
        <JoinCall isSignedIn={isSignedIn} />
      </main>
      <LandingFooter />
    </div>
  );
}
