import BadgeIcon from '@/components/recognition/BadgeIcon';
import type { MemberBadge } from '@/services/types';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

interface BadgeListProps {
  badges: MemberBadge[];
  /** compact: medallion and name only, for a profile preview. */
  compact?: boolean;
}

/** A member's badges: medallion, name, and on hover what it recognises and since when. */
export default function BadgeList({ badges, compact = false }: BadgeListProps) {
  return (
    <ul className={compact ? 'flex flex-wrap gap-2' : 'grid grid-cols-2 gap-3 sm:grid-cols-3'}>
      {badges.map((badge) => (
        <li key={badge.code} title={`${badge.description}${badge.reason ? ` · ${badge.reason}` : ''}`}
          className={compact ? 'flex items-center gap-1.5 rounded-full bg-noir-800 py-1 pl-1 pr-3' : 'flex min-w-0 items-center gap-3 rounded-lg border border-line-soft bg-card p-3'}>
          <BadgeIcon icon={badge.icon} size={compact ? 'sm' : 'lg'} />
          <span className="min-w-0">
            <span className={`block truncate font-medium text-t1 ${compact ? 'text-xs' : 'text-sm'}`}>{badge.name}</span>
            {!compact && <span className="block truncate text-xs text-t4">depuis {dateFormat.format(new Date(badge.awardedAt))}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
