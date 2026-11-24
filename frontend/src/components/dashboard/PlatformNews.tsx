import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight, Mic, Newspaper, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface NewsItem {
  key: string;
  kind: 'Article' | 'Talk' | 'Rendez-vous';
  title: string;
  /** When it appeared on the platform. */
  at: string;
  to: string;
  /** One detail after the date: a theme, a guest, a day. */
  detail?: string;
}

const KIND: Record<NewsItem['kind'], { Icon: LucideIcon; tile: string }> = {
  Article: { Icon: Newspaper, tile: 'bg-white/[0.06] text-white/75' },
  Talk: { Icon: Mic, tile: 'bg-white/[0.06] text-white/75' },
  'Rendez-vous': { Icon: CalendarDays, tile: 'bg-gold-400/15 text-gold-400' },
};

const relative = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });
const DAY = 24 * 60 * 60 * 1000;

function ago(iso: string, now: number): string {
  const days = Math.round((new Date(iso).getTime() - now) / DAY);
  if (days > -1) return 'aujourd’hui';
  if (days > -7) return relative.format(days, 'day');
  if (days > -35) return relative.format(Math.round(days / 7), 'week');
  return relative.format(Math.round(days / 30), 'month');
}

/** What was published lately on the platform, articles, episodes and rendez-vous mixed, newest first. */
export default function PlatformNews({ items, now }: { items: NewsItem[]; now: number }) {
  if (items.length === 0) return <p className="rounded-2xl bg-white/[0.03] px-4 py-4 text-sm text-white/55">Rien de neuf pour l’instant. Les prochaines publications apparaîtront ici.</p>;
  return (
    <ul className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      {items.map((item) => {
        const { Icon, tile } = KIND[item.kind];
        return (
          <li key={item.key} className="border-b border-white/[0.06] last:border-b-0">
            <Link to={item.to} className="group flex items-center gap-3 px-3 py-3 transition-colors hover:bg-white/[0.04] active:bg-white/[0.06]">
              <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', tile)}><Icon className="h-[18px] w-[18px]" aria-hidden="true" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium transition-colors group-hover:text-gold-400">{item.title}</span>
                <span className="mt-0.5 block truncate text-xs text-white/45">{item.kind} · <time dateTime={item.at}>{ago(item.at, now)}</time>{item.detail && ` · ${item.detail}`}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/25 transition-transform group-hover:translate-x-0.5 group-hover:text-gold-400 motion-reduce:transition-none" aria-hidden="true" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
