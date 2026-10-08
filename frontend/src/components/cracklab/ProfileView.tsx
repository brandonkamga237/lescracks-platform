import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Clock3, Flame } from 'lucide-react';

import Avatar from '@/components/cracklab/Avatar';
import Badges from '@/components/cracklab/Badges';
import Difficulty from '@/components/cracklab/Difficulty';
import LevelChip from '@/components/cracklab/LevelChip';
import XpBar from '@/components/cracklab/XpBar';
import ShareButton from '@/components/common/ShareButton';
import { EmptyState } from '@/components/common/States';
import LineArt from '@/components/illustrations/LineArt';
import { challengePath, memberPath, ordinal, plural, resultPath } from '@/lib/cracklab';
import type { CrackLabProgress } from '@/services/types';

interface ProfileViewProps {
  progress: CrackLabProgress;
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

/** One member's CrackLab card, public: level, standing, badges and scores. Answers themselves stay private. */
export default function ProfileView({ progress }: ProfileViewProps) {
  const name = progress.member.displayName;
  const unlocked = progress.badges.filter((badge) => badge.unlocked).length;
  const stats: Array<[string, string, string?]> = [
    ['XP', String(progress.xp)],
    ['Rang', progress.rank ? ordinal(progress.rank) : '—', progress.rank ? `sur ${progress.rankedMembers}` : 'pas encore classé'],
    ['Série', `${progress.streak} sem.`, `record ${progress.bestStreak}`],
    ['Moyenne', progress.graded ? `${progress.averagePercent} %` : '—', plural(progress.graded, 'note')],
    ['Meilleur', progress.graded ? `${progress.bestPercent} %` : '—'],
    ['Relevés', String(progress.answered), plural(progress.answered, 'challenge')],
  ];
  const shareText = progress.me
    ? `Niveau ${progress.level.name} sur CrackLab avec ${progress.xp} XP${progress.rank ? `, ${ordinal(progress.rank)} du classement` : ''}. Viens te mesurer à moi :`
    : `${name} est ${progress.level.name} sur CrackLab avec ${progress.xp} XP. Tu ferais mieux ?`;

  return (
    <>
      <header className="relative overflow-hidden border-b border-line-soft">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,175,55,0.16),transparent_60%)]" />
        <div className="relative mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <span className="w-fit rounded-full bg-gradient-to-b from-gold-300 to-gold-600 p-0.5 shadow-gold"><Avatar member={progress.member} size="xl" className="border-0" /></span>
            <div className="min-w-0 flex-1">
              <p className="kicker font-mono">{progress.me ? '// ton profil public' : '// profil crack'}</p>
              <h1 className="mt-3 truncate font-display text-4xl font-bold tracking-tight text-t1 sm:text-5xl">{name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-t3">
                <LevelChip level={progress.level} />
                {progress.rank > 0 && <span>{ordinal(progress.rank)} du classement{progress.rank > 1 && progress.rankedMembers > 1 ? ` · mieux que ${progress.betterThanPercent} % des cracks` : ''}</span>}
                {progress.streak > 0 && <span className="inline-flex items-center gap-1 text-gold-ink"><Flame className="h-4 w-4" aria-hidden />{plural(progress.streak, 'semaine')} d’affilée</span>}
              </div>
            </div>
          </div>
          <XpBar xp={progress.xp} level={progress.level} nextLevel={progress.nextLevel} className="mt-8 max-w-xl" />
          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            <ShareButton className="sm:w-auto" variant={progress.me ? 'primary' : 'secondary'} title={`${name} · CrackLab`} path={memberPath(progress.member.id)}
              label={progress.me ? 'Partager mon profil' : 'Partager ce profil'} text={shareText} />
            {!progress.me && <Link to="/cracklab#challenges" className="btn-primary">Mesure-toi à ce profil<ArrowRight className="h-4 w-4" aria-hidden /></Link>}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-12 px-5 py-10 sm:px-8 sm:py-14">
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map(([label, value, hint]) => (
            <div key={label} className="rounded-lg border border-line bg-noir-900 p-4">
              <dt className="text-[11px] uppercase tracking-[0.08em] text-t4">{label}</dt>
              <dd className="mt-1 font-mono text-2xl font-bold tabular-nums text-t1">{value}</dd>
              {hint && <dd className="text-xs text-t4">{hint}</dd>}
            </div>
          ))}
        </dl>

        <section aria-labelledby="badges-heading">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 id="badges-heading" className="font-display text-2xl font-bold tracking-tight text-t1">Badges</h2>
            <span className="font-mono text-sm text-t4">{unlocked} / {progress.badges.length}</span>
          </div>
          <Badges badges={progress.badges} />
        </section>

        <section aria-labelledby="history-heading">
          <h2 id="history-heading" className="mb-4 font-display text-2xl font-bold tracking-tight text-t1">{progress.me ? 'Tes challenges' : 'Challenges relevés'}</h2>
          {progress.history.length ? (
            <ul className="space-y-2">
              {progress.history.map((item) => (
                <li key={item.submissionId}>
                  <Link to={progress.me ? challengePath(item.challengeSlug) : item.status === 'GRADED' ? resultPath(item.submissionId) : challengePath(item.challengeSlug)}
                    className="group flex items-center gap-4 rounded-lg border border-line bg-noir-900 p-4 transition-colors hover:border-gold-400/40">
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 font-semibold text-t1 group-hover:text-gold-ink">{item.challengeTitle}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-t4"><Difficulty value={item.difficulty} />{item.category} · {dateFormat.format(new Date(item.createdAt))}</span>
                    </span>
                    {item.status === 'GRADED'
                      ? <span className="font-mono text-lg font-bold tabular-nums text-gold-ink">{item.score}<span className="text-xs font-normal text-t4"> / {item.totalPoints}</span></span>
                      : <span className="inline-flex items-center gap-1.5 text-xs text-t3"><Clock3 className="h-3.5 w-3.5" aria-hidden />En notation</span>}
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-t4 group-hover:text-gold-ink" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<LineArt motif="path" className="h-20 text-gold-400" />} title="Pas encore de challenge relevé."
              description="Choisis un premier challenge : ta note, ton niveau et tes badges arrivent juste après."
              action={<Link to="/cracklab#challenges" className="btn-primary">Voir les challenges</Link>} />
          )}
        </section>
      </div>
    </>
  );
}
