import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

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

const KIND_STYLE: Record<NewsItem['kind'], string> = {
  Article: 'bg-white/[0.06] text-white/70',
  Talk: 'bg-white/[0.06] text-white/70',
  'Rendez-vous': 'bg-gold-400/15 text-gold-400',
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
  if (items.length === 0) return <p className="rounded-2xl border border-dashed border-white/15 px-4 py-4 text-sm text-white/55">Rien de neuf pour l’instant. Les prochaines publications apparaîtront ici.</p>;
  return (
    <ul className="divide-y divide-white/10 border-y border-white/10">
      {items.map((item) => (
        <li key={item.key}>
          <Link to={item.to} className="group flex items-start gap-3 py-3.5">
            <span className={cn('mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium', KIND_STYLE[item.kind])}>{item.kind}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium transition-colors group-hover:text-gold-400">{item.title}</span>
              <span className="mt-0.5 block text-xs text-white/45"><time dateTime={item.at}>{ago(item.at, now)}</time>{item.detail && ` · ${item.detail}`}</span>
            </span>
            <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-white/25 transition-colors group-hover:text-gold-400" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
