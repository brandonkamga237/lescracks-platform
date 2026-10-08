import { Link } from 'react-router-dom';
import { ArrowRight, Clock3 } from 'lucide-react';

import Avatar from '@/components/cracklab/Avatar';
import Badges from '@/components/cracklab/Badges';
import Difficulty from '@/components/cracklab/Difficulty';
import LevelChip from '@/components/cracklab/LevelChip';
import Schematic from '@/components/cracklab/Schematic';
import WeekGrid from '@/components/cracklab/WeekGrid';
import XpBar from '@/components/cracklab/XpBar';
import ShareButton from '@/components/common/ShareButton';
import { EmptyState } from '@/components/common/States';
import { challengePath, fillClass, memberPath, ordinal, plural, resultPath } from '@/lib/cracklab';
import type { CrackLabHistoryItem, CrackLabProgress } from '@/services/types';

interface ProfileViewProps {
  progress: CrackLabProgress;
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const label = 'font-mono text-[11px] uppercase tracking-[0.08em] text-t4';

/** Average share of the points per category, strongest first: where the member is solid, where to work. */
function mastery(history: CrackLabHistoryItem[]) {
  const byCategory = new Map<string, { points: number; total: number; count: number }>();
  for (const item of history) {
    if (item.status !== 'GRADED' || item.score == null) continue;
    const entry = byCategory.get(item.category) ?? { points: 0, total: 0, count: 0 };
    byCategory.set(item.category, { points: entry.points + item.score, total: entry.total + item.totalPoints, count: entry.count + 1 });
  }
  return [...byCategory.entries()]
    .map(([category, { points, total, count }]) => ({ category, percent: total ? Math.round((points / total) * 100) : 0, count }))
    .sort((a, b) => b.percent - a.percent);
}

/** One member's CrackLab record, public: level, standing, activity, badges and scores. Answers stay private. */
export default function ProfileView({ progress }: ProfileViewProps) {
  const name = progress.member.displayName;
  const unlocked = progress.badges.filter((badge) => badge.unlocked).length;
  const categories = mastery(progress.history);
  const figures: Array<[string, string, string?]> = [
    ['XP', String(progress.xp)],
    ['Rang', progress.rank ? ordinal(progress.rank) : '–', progress.rank ? `/${progress.rankedMembers}` : undefined],
    ['Série', String(progress.streak), `sem. · record ${progress.bestStreak}`],
    ['Moyenne', progress.graded ? `${progress.averagePercent} %` : '–'],
    ['Meilleure', progress.graded ? `${progress.bestPercent} %` : '–'],
    ['Relevés', String(progress.answered)],
  ];
  const shareText = progress.me
    ? `Niveau ${progress.level.name} sur CrackLab avec ${progress.xp} XP${progress.rank ? `, ${ordinal(progress.rank)} du classement` : ''}. Viens te mesurer à moi :`
    : `${name} est ${progress.level.name} sur CrackLab avec ${progress.xp} XP. Tu ferais mieux ?`;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="flex flex-col gap-6 border-b border-line-soft pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-center gap-5">
          <Avatar member={progress.member} size="xl" />
          <div className="min-w-0">
            <p className="font-mono text-xs text-gold-ink">{progress.me ? 'cracklab / ton profil public' : 'cracklab / profil'}</p>
            <h1 className="mt-2 truncate font-display text-3xl font-bold tracking-tight text-t1 sm:text-4xl">{name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-t3">
              <LevelChip level={progress.level} />
              {progress.rank > 0 && <span>{ordinal(progress.rank)} du classement{progress.rank > 1 && progress.rankedMembers > 1 ? `, devant ${progress.betterThanPercent} % des membres` : ''}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ShareButton className="sm:w-auto" variant={progress.me ? 'primary' : 'secondary'} title={`${name} · CrackLab`} path={memberPath(progress.member.id)}
            label={progress.me ? 'Partager mon profil' : 'Partager'} text={shareText} />
          {!progress.me && <Link to="/cracklab#challenges" className="btn-primary">Se mesurer à ce profil<ArrowRight className="h-4 w-4" aria-hidden /></Link>}
        </div>
      </header>

      <dl className="grid grid-cols-3 gap-px border-b border-line-soft bg-line-soft sm:grid-cols-6">
        {figures.map(([name, value, hint]) => (
          <div key={name} className="bg-black px-4 py-4">
            <dt className={label}>{name}</dt>
            <dd className="mt-1 font-mono text-xl tabular-nums text-t1">{value}{hint && <span className="ml-1 text-xs text-t4">{hint}</span>}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-12">
          <section aria-labelledby="activity-heading" className="grid gap-8 sm:grid-cols-2">
            <div>
              <h2 id="activity-heading" className={label}>Activité · 12 semaines</h2>
              <WeekGrid history={progress.history} className="mt-4" />
            </div>
            <div>
              <h2 className={label}>Maîtrise par catégorie</h2>
              {categories.length ? (
                <ul className="mt-4 space-y-3">
                  {categories.map((item) => (
                    <li key={item.category}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-t2">{item.category}</span>
                        <span className="font-mono tabular-nums text-t1">{item.percent} %<span className="ml-1 text-xs text-t4">· {plural(item.count, 'note')}</span></span>
                      </div>
                      <div aria-hidden className="mt-1.5 h-0.5 bg-line"><div className={`h-full bg-gold-400 ${fillClass(item.percent / 100)}`} /></div>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-4 text-sm text-t4">Apparaît avec la première note.</p>}
            </div>
          </section>

          <section aria-labelledby="history-heading">
            <h2 id="history-heading" className={label}>{progress.me ? 'Tes challenges' : 'Challenges relevés'}</h2>
            {progress.history.length ? (
              <ul className="mt-4 divide-y divide-line-soft overflow-hidden rounded-lg border border-line">
                {progress.history.map((item) => (
                  <li key={item.submissionId}>
                    <Link to={progress.me ? challengePath(item.challengeSlug) : item.status === 'GRADED' ? resultPath(item.submissionId) : challengePath(item.challengeSlug)}
                      className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3.5 transition-colors duration-150 hover:bg-noir-800/60 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:px-5">
                      <span className="hidden overflow-hidden rounded border border-line-soft bg-noir-950 sm:block">
                        <Schematic seed={item.challengeSlug} category={item.category} labels={false} className="block h-auto w-full" />
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 text-t1 transition-colors duration-150 group-hover:text-gold-ink">{item.challengeTitle}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-t4"><Difficulty value={item.difficulty} /><span className="font-mono">{item.category} · {dateFormat.format(new Date(item.createdAt))}</span></span>
                      </span>
                      {item.status === 'GRADED'
                        ? <span className="font-mono tabular-nums text-t1">{item.score}<span className="text-t4">/{item.totalPoints}</span></span>
                        : <span className="inline-flex items-center gap-1.5 font-mono text-xs text-t3"><Clock3 className="h-3.5 w-3.5" aria-hidden />notation</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={<Schematic seed="profil" category="backend" labels={false} className="h-20 w-auto" />} title="Pas encore de challenge relevé."
                description="Une première réponse, et la note, le niveau et les badges suivent."
                action={<Link to="/cracklab#challenges" className="btn-primary">Voir les challenges</Link>} />
            )}
          </section>
        </div>

        <aside className="space-y-10" aria-label="Niveau et badges">
          <section>
            <h2 className={label}>Niveau</h2>
            <XpBar xp={progress.xp} level={progress.level} nextLevel={progress.nextLevel} className="mt-4" />
          </section>
          <section aria-labelledby="badges-heading">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="badges-heading" className={label}>Badges</h2>
              <span className="font-mono text-xs text-t4">{unlocked}/{progress.badges.length}</span>
            </div>
            <Badges badges={progress.badges} className="mt-4" />
          </section>
        </aside>
      </div>
    </div>
  );
}
