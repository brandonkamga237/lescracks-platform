import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import ArticleCard from '@/components/blog/ArticleCard';
import SEO from '@/components/common/SEO';
import InterestShelf from '@/components/dashboard/InterestShelf';
import NextUp from '@/components/dashboard/NextUp';
import PlatformNews, { type NewsItem } from '@/components/dashboard/PlatformNews';
import DashSection from '@/components/member/DashSection';
import MyAgenda from '@/components/member/MyAgenda';
import { Container } from '@/components/ui/container';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { eventTeaser } from '@/lib/eventMoment';
import { withoutHackathons } from '@/lib/events';
import { nextOfMine, splitMyEvents } from '@/lib/myEvents';
import { articlePath, eventPath } from '@/lib/slugs';
import { api } from '@/services/api';

const NEWS_SHOWN = 6;
const SHELVES = 2;
const todayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

/**
 * The member's dashboard answers three questions: what is next for me, where did I leave off,
 * and what is new on the platform. Figures and badges live on the profile.
 */
export default function MemberHome() {
  const { user } = useSession();
  const [now] = useState(() => Date.now());
  const mine = useApi((signal) => api.myEvents(signal), []);
  const reading = useApi((signal) => api.myReading(4, signal), []);
  const upcoming = useApi((signal) => api.upcomingEvents(0, 9, signal), []);
  const recent = useApi((signal) => api.articles(0, 5, signal), []);
  const talks = useApi((signal) => api.talks(0, 2, signal), []);
  const themes = useApi((signal) => api.themes(signal), []);

  const agenda = mine.data ? splitMyEvents(mine.data) : null;
  const next = agenda ? nextOfMine(agenda) : undefined;
  const registered = new Set(mine.data?.map((event) => event.id));
  const open = withoutHackathons(upcoming.data?.content ?? []).filter((event) => !registered.has(event.id));
  const read = new Set(reading.data?.map((article) => article.id));
  const shelves = (themes.data ?? []).filter((theme) => user?.interestIds.includes(theme.id)).slice(0, SHELVES);

  const news: NewsItem[] = [
    ...(recent.data?.content ?? []).map((article): NewsItem => ({ key: `a${article.id}`, kind: 'Article', title: article.title, at: article.publishedAt ?? article.createdAt, to: articlePath(article), detail: article.categoryName })),
    ...(talks.data?.content ?? []).map((talk): NewsItem => ({ key: `t${talk.id}`, kind: 'Talk', title: talk.title, at: talk.publishedAt ?? talk.createdAt, to: '/talk', detail: talk.guest ? `avec ${talk.guest}` : undefined })),
    ...open.map((event): NewsItem => ({ key: `e${event.id}`, kind: 'Rendez-vous', title: event.title, at: event.createdAt, to: eventPath(event), detail: eventTeaser(event.startDate) })),
  ].sort((left, right) => right.at.localeCompare(left.at)).slice(0, NEWS_SHOWN);

  return (
    <>
      <SEO title="Dashboard" url="/" />
      <Container className="pb-6 pt-8 sm:pt-10">
        <p className="text-sm text-white/45 first-letter:uppercase">{todayFormat.format(now)}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{user?.firstName ? `Bonjour ${user.firstName}` : 'Bonjour'}</h1>
      </Container>

      <Container className="space-y-10 pb-20">
        <NextUp mine={next} live={Boolean(agenda?.live.length)} others={agenda ? Math.max(0, agenda.live.length + agenda.coming.length - 1) : 0} suggestion={next ? undefined : open[0]} />

        <div className="grid gap-10 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:gap-12">
          <div className="min-w-0 space-y-10">
            <DashSection id="reading-title" title="Reprendre ta lecture" more={{ to: '/blog', label: 'Blog' }}>
              {reading.data && reading.data.length === 0 && (
                <p className="rounded-2xl border border-dashed border-white/15 px-4 py-4 text-sm text-white/55">Les articles que tu ouvres se retrouvent ici, pour y revenir en un clic. <Link to="/blog" className="font-medium text-gold-400 underline-offset-4 hover:underline">Parcourir le blog</Link></p>
              )}
              {!!reading.data?.length && (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {reading.data.map((article) => <li key={article.id}><ArticleCard article={article} /></li>)}
                </ul>
              )}
            </DashSection>

            {shelves.length > 0
              ? shelves.map((theme) => <InterestShelf key={theme.id} theme={theme} read={read} />)
              : themes.data && (
                <Link to="/profil#a-propos" className="group flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-gold-400/40">
                  <span>
                    <span className="block font-medium">Dis-nous ce qui t’intéresse</span>
                    <span className="mt-1 block text-sm text-white/55">Choisis tes thèmes sur ton profil : ton dashboard te proposera les articles qui vont avec.</span>
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-gold-400" aria-hidden="true" />
                </Link>
              )}
          </div>

          <div className="min-w-0 space-y-10">
            <DashSection id="news-title" title="Nouveau sur LesCracks">
              <PlatformNews items={news} now={now} />
            </DashSection>
            <MyAgenda agenda={agenda} loading={mine.loading} failed={Boolean(mine.error)} onRetry={mine.reload} />
          </div>
        </div>
      </Container>
    </>
  );
}
