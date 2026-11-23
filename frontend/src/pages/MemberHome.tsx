import SEO from '@/components/common/SEO';
import LatestArticles from '@/components/landing/LatestArticles';
import UpcomingEvents from '@/components/landing/UpcomingEvents';
import MemberGreeting from '@/components/member/MemberGreeting';
import MyAgenda from '@/components/member/MyAgenda';
import MyRecognition from '@/components/member/MyRecognition';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { withoutHackathons } from '@/lib/events';
import { nextOfMine, splitMyEvents } from '@/lib/myEvents';
import { api } from '@/services/api';

/** The front door once signed in: the member's own rendez-vous and attestations first, then what is new. */
export default function MemberHome() {
  const { user } = useSession();
  const mine = useApi((signal) => api.myEvents(signal), []);
  const certificates = useApi((signal) => api.myCertificates(signal), []);
  const badges = useApi((signal) => api.myBadges(signal), []);
  const upcoming = useApi((signal) => api.upcomingEvents(0, 9, signal), []);
  const recent = useApi((signal) => api.articles(0, 3, signal), []);

  const agenda = mine.data ? splitMyEvents(mine.data) : null;
  const next = agenda ? nextOfMine(agenda) : undefined;
  const registered = new Set(mine.data?.map((event) => event.id));
  const suggestions = withoutHackathons(upcoming.data?.content ?? []).filter((event) => !registered.has(event.id)).slice(0, 3);
  const issued = certificates.data?.filter((certificate) => !certificate.revoked) ?? [];
  const articles = recent.data?.content ?? [];

  return (
    <>
      <SEO title="Dashboard" url="/" />
      <MemberGreeting
        firstName={user?.firstName ?? ''}
        next={next}
        live={Boolean(agenda?.live.length)}
        tally={[
          { label: 'rendez-vous à venir', count: agenda?.coming.length ?? 0 },
          { label: issued.length > 1 ? 'attestations' : 'attestation', count: issued.length },
          { label: (badges.data?.length ?? 0) > 1 ? 'badges' : 'badge', count: badges.data?.length ?? 0 },
        ]}
        completion={user?.completion ?? 100}
      />
      <MyAgenda agenda={agenda} loading={mine.loading} failed={Boolean(mine.error)} onRetry={mine.reload} />
      {suggestions.length > 0 && <UpcomingEvents events={suggestions} />}
      <MyRecognition certificates={certificates.data ?? []} badges={badges.data ?? []} />
      {articles.length > 0 && <LatestArticles articles={articles} />}
    </>
  );
}
