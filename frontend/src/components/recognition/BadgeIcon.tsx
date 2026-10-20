import { BADGE_ICONS } from '@/lib/badgeIcons';

interface BadgeIconProps {
  icon: string;
  /** Small in a list or a profile preview, large on a profile. */
  size?: 'sm' | 'lg';
}

/** The gold medallion every badge wears; an unknown key falls back to the award ribbon. */
export default function BadgeIcon({ icon, size = 'lg' }: BadgeIconProps) {
  const Icon = BADGE_ICONS[icon] ?? BADGE_ICONS.award;
  return (
    <span aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-full border border-gold-400/40 bg-gold-400/10 text-gold-ink ${size === 'lg' ? 'h-12 w-12' : 'h-8 w-8'}`}>
      <Icon className={size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'} />
    </span>
  );
}
