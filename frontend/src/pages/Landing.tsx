import SEO from '@/components/common/SEO';
import Faq from '@/components/landing/Faq';
import Hero from '@/components/landing/Hero';
import JoinCall from '@/components/landing/JoinCall';
import LatestArticles from '@/components/landing/LatestArticles';
import Platform from '@/components/landing/Platform';
import Ribbons from '@/components/landing/Ribbons';
import Subjects from '@/components/landing/Subjects';
import UpcomingEvents from '@/components/landing/UpcomingEvents';
import type { NavItem } from '@/components/site/navigation';
import SiteShell from '@/components/site/SiteShell';
import { SPACES } from '@/config/site';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { withoutHackathons } from '@/lib/events';
import { api } from '@/services/api';

// The landing's own sections light up the matching links while they are read.
const SECTION_OF: Record<string, string> = { Blog: 'blog', 'Rendez-vous': 'rendez-vous' };

const NAV_ITEMS: NavItem[] = [
  ...SPACES.map((space) => ({ ...space, section: SECTION_OF[space.label] })),
  { label: 'FAQ', href: '#faq', section: 'faq', illustration: 'speech', summary: 'Les questions fréquentes' },
];

/** The public front door: it composes the site chrome and the landing sections around live data. */
export default function Landing() {
  useSmoothScroll();
  const { isSignedIn } = useSession();
  const upcoming = useApi((signal) => api.upcomingEvents(0, 6, signal), []);
  const recent = useApi((signal) => api.articles(0, 3, signal), []);

  const events = withoutHackathons(upcoming.data?.content ?? []).slice(0, 3);
  const articles = recent.data?.content ?? [];

  return (
    <SiteShell items={NAV_ITEMS} nextEvent={events[0]} flush>
      <SEO description="LesCracks : articles techniques, ateliers en direct et le Talk pour apprendre la tech avec ceux qui la font." url="/" />
      <Hero nextEvent={events[0]} isSignedIn={isSignedIn} />
      <Subjects />
      <Platform />
      {events.length > 0 && <UpcomingEvents events={events} />}
      <Ribbons />
      {articles.length > 0 && <LatestArticles articles={articles} />}
      <Faq />
      <JoinCall isSignedIn={isSignedIn} />
    </SiteShell>
  );
}
