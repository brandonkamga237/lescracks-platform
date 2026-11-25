import SignupNudge from '@/components/account/SignupNudge';
import SEO from '@/components/common/SEO';
import Faq from '@/components/landing/Faq';
import InstallAppBanner from '@/components/install/InstallAppBanner';
import Hero from '@/components/landing/Hero';
import JoinCall from '@/components/landing/JoinCall';
import LatestArticles from '@/components/landing/LatestArticles';
import Platform from '@/components/landing/Platform';
import Ribbons from '@/components/landing/Ribbons';
import Subjects from '@/components/landing/Subjects';
import UpcomingEvents from '@/components/landing/UpcomingEvents';
import type { NavItem } from '@/components/site/navigation';
import SiteFooter from '@/components/site/SiteFooter';
import SiteHeader from '@/components/site/SiteHeader';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { withoutHackathons } from '@/lib/events';
import { api } from '@/services/api';

// A showcase: its bar only moves through its own sections. The platform is entered through its calls to action.
const NAV_ITEMS: NavItem[] = [
  { label: 'La plateforme', href: '#plateforme', section: 'plateforme', illustration: 'cap', summary: 'Lire, regarder, pratiquer' },
  { label: 'Agenda', href: '#rendez-vous', section: 'rendez-vous', illustration: 'calendar', summary: 'Les prochains rendez-vous' },
  { label: 'Blog', href: '#blog', section: 'blog', illustration: 'memo', summary: 'Les derniers articles' },
  { label: 'FAQ', href: '#faq', section: 'faq', illustration: 'speech', summary: 'Les questions fréquentes' },
];

/** The public front door: it composes the site chrome and the landing sections around live data. */
export default function Landing() {
  useSmoothScroll();
  const { isSignedIn, isAdmin } = useSession();
  const upcoming = useApi((signal) => api.upcomingEvents(0, 6, signal), []);
  const recent = useApi((signal) => api.articles(0, 3, signal), []);

  const events = withoutHackathons(upcoming.data?.content ?? []).slice(0, 3);
  const articles = recent.data?.content ?? [];

  return (
    <div className="min-h-screen bg-black font-geist text-white antialiased">
      <SEO description="LesCracks : articles techniques, ateliers en direct et le Talk pour apprendre la tech avec ceux qui la font." url="/" />
      <a href="#main-content" className="sr-only z-[60] rounded-full bg-gold-400 px-5 py-3 font-medium text-black focus:not-sr-only focus:fixed focus:left-5 focus:top-3">Aller au contenu</a>
      <SiteHeader items={NAV_ITEMS} isSignedIn={isSignedIn} nextEvent={events[0]} />
      <SignupNudge />
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
      <SiteFooter />
      {!isAdmin && <InstallAppBanner member={false} />}
    </div>
  );
}
