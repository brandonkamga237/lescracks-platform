import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Sparkles, Target } from 'lucide-react';

import ArticleCard from '@/components/blog/ArticleCard';
import SEO from '@/components/common/SEO';
import InterestShelf from '@/components/dashboard/InterestShelf';
import NextUp from '@/components/dashboard/NextUp';
import PlatformNews, { type NewsItem } from '@/components/dashboard/PlatformNews';
import DashSection from '@/components/member/DashSection';
import MyAgenda from '@/components/member/MyAgenda';
import { CardRail } from '@/components/ui/card-rail';
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
  const mine = useApi((signal) => api.myEvents(signal), [], `my-events:${user?.id}`);
  const reading = useApi((signal) => api.myReading(4, signal), [], `my-reading:${user?.id}`);
  const upcoming = useApi((signal) => api.upcomingEvents(0, 9, signal), [], 'events:upcoming:dashboard');
  const recent = useApi((signal) => api.articles(0, 5, signal), [], 'articles:latest');
  const talks = useApi((signal) => api.talks(0, 2, signal), [], 'talks:latest');
  const themes = useApi((signal) => api.themes(signal), [], 'themes');

  const agenda = mine.data ? splitMyEvents(mine.data) : null;
  const next = agenda ? nextOfMine(agenda) : undefined;
  const registered = new Set(mine.data?.map((event) => event.id));
  const open = withoutHackathons(upcoming.data?.content ?? []).filter((event) => !registered.has(event.id));
  const read = new Set(reading.data?.map((article) => article.id));
  // Nothing read yet: the newest articles stand in, so the first visit already offers something to open.
  const starters = (recent.data?.content ?? []).slice(0, 4);
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

        {/* A phone reads top to bottom by importance; a wide screen puts the feeds beside the reading. */}
        <div className="grid gap-10 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:gap-x-12">
          <div className="min-w-0 xl:col-start-1 xl:row-start-1">
            {reading.data?.length ? (
              <DashSection id="reading-title" title="Reprendre ta lecture" Icon={BookOpen} more={{ to: '/blog', label: 'Blog' }}>
                <CardRail label="Articles ouverts récemment">{reading.data.map((article) => <ArticleCard key={article.id} article={article} />)}</CardRail>
              </DashSection>
            ) : !!starters.length && (
              <DashSection id="reading-title" title="À lire en premier" Icon={BookOpen} more={{ to: '/blog', label: 'Blog' }}>
                <CardRail label="Derniers articles">{starters.map((article) => <ArticleCard key={article.id} article={article} />)}</CardRail>
              </DashSection>
            )}
          </div>

          <div className="min-w-0 xl:col-start-2 xl:row-start-1">
            <DashSection id="news-title" title="Nouveau sur LesCracks" Icon={Sparkles}>
              <PlatformNews items={news} now={now} />
            </DashSection>
          </div>

          <div className="min-w-0 xl:col-start-2 xl:row-start-2">
            <MyAgenda agenda={agenda} loading={mine.loading} failed={Boolean(mine.error)} onRetry={mine.reload} />
          </div>

          <div className="min-w-0 space-y-10 xl:col-start-1 xl:row-start-2">
            {shelves.length > 0
              ? shelves.map((theme) => <InterestShelf key={theme.id} theme={theme} read={read} />)
              : themes.data && (
                <Link to="/profil#a-propos" className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-gold-400/40 active:scale-[0.99] motion-reduce:active:scale-100">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-400/10 text-gold-400"><Target className="h-5 w-5" aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">Choisis tes thèmes</span>
                    <span className="mt-0.5 block text-xs text-white/55">Ton dashboard te proposera les articles qui vont avec.</span>
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-gold-400" aria-hidden="true" />
                </Link>
              )}
          </div>
        </div>
      </Container>
    </>
  );
}
