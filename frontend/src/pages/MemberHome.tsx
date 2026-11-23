import ArticleRow from '@/components/blog/ArticleRow';
import SEO from '@/components/common/SEO';
import EventRow from '@/components/events/EventRow';
import DashSection from '@/components/member/DashSection';
import MemberGreeting from '@/components/member/MemberGreeting';
import MyAgenda from '@/components/member/MyAgenda';
import MyRecognition from '@/components/member/MyRecognition';
import { Container } from '@/components/ui/container';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { withoutHackathons } from '@/lib/events';
import { nextOfMine, splitMyEvents } from '@/lib/myEvents';
import { api } from '@/services/api';

/** The member's dashboard: their figures and their rendez-vous first, then what is new on the platform. */
export default function MemberHome() {
  const { user } = useSession();
  const mine = useApi((signal) => api.myEvents(signal), []);
  const certificates = useApi((signal) => api.myCertificates(signal), []);
  const badges = useApi((signal) => api.myBadges(signal), []);
  const upcoming = useApi((signal) => api.upcomingEvents(0, 9, signal), []);
  const recent = useApi((signal) => api.articles(0, 4, signal), []);

  const agenda = mine.data ? splitMyEvents(mine.data) : null;
  const next = agenda ? nextOfMine(agenda) : undefined;
  const registered = new Set(mine.data?.map((event) => event.id));
  const suggestions = withoutHackathons(upcoming.data?.content ?? []).filter((event) => !registered.has(event.id)).slice(0, 3);
  const issued = certificates.data?.filter((certificate) => !certificate.revoked).length ?? 0;
  const articles = recent.data?.content ?? [];
  const count = (value: number | undefined) => (value === undefined ? '–' : String(value));

  return (
    <>
      <SEO title="Dashboard" url="/" />
      <MemberGreeting
        firstName={user?.firstName ?? ''}
        next={next}
        live={Boolean(agenda?.live.length)}
        tiles={[
          { label: 'Rendez-vous à venir', value: count(agenda ? agenda.live.length + agenda.coming.length : undefined), to: '#mes-rendez-vous' },
          { label: issued > 1 ? 'Attestations' : 'Attestation', value: count(certificates.data ? issued : undefined), to: '#attestations' },
          { label: (badges.data?.length ?? 0) > 1 ? 'Badges' : 'Badge', value: count(badges.data?.length), to: '#attestations' },
        ]}
        completion={user?.completion ?? 100}
      />

      <Container className="grid gap-10 pb-20 xl:grid-cols-2 xl:gap-12">
        <div id="mes-rendez-vous" className="scroll-mt-20 space-y-10">
          <MyAgenda agenda={agenda} loading={mine.loading} failed={Boolean(mine.error)} onRetry={mine.reload} />
          {suggestions.length > 0 && (
            <DashSection id="suggestions-title" title="À venir sur LesCracks" more={{ to: '/rendez-vous', label: 'Tout voir' }}>
              <ul className="border-t border-white/10">
                {suggestions.map((event) => <li key={event.id}><EventRow event={event} dense /></li>)}
              </ul>
            </DashSection>
          )}
        </div>
        <div className="space-y-10">
          {articles.length > 0 && (
            <DashSection id="reading-title" title="À lire" more={{ to: '/blog', label: 'Blog' }}>
              <ul className="border-t border-white/10">
                {articles.map((article) => <li key={article.id}><ArticleRow article={article} dense /></li>)}
              </ul>
            </DashSection>
          )}
          <div id="attestations" className="scroll-mt-20">
            <MyRecognition certificates={certificates.data ?? []} badges={badges.data ?? []} />
          </div>
        </div>
      </Container>
    </>
  );
}
