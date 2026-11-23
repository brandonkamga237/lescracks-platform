import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { TYPE_LABEL } from '@/components/events/AgendaItem';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { PulseDot } from '@/components/ui/pulse-dot';
import { eventTeaser } from '@/lib/eventMoment';
import { fillClass } from '@/lib/progress';
import { eventPath } from '@/lib/slugs';
import type { MyEvent } from '@/services/types';

const TILE = 'block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 transition-colors hover:border-white/25';

interface MemberGreetingProps {
  firstName: string;
  /** The registration happening now, or the next one. */
  next?: MyEvent;
  live: boolean;
  /** Each one points at its block further down the dashboard. */
  tiles: { label: string; value: string; to: `#${string}` }[];
  /** 0 to 100. */
  completion: number;
}

/** The top of the dashboard: the figures that matter at a glance, then what comes next. */
export default function MemberGreeting({ firstName, next, live, tiles, completion }: MemberGreetingProps) {
  return (
    <Container className="pb-8 pt-8 sm:pt-10">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{firstName ? `Bonjour ${firstName}` : 'Bonjour'}</h1>

      <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.label}>
            {/* A block further down this page: a plain anchor scrolls to it. */}
            <a href={tile.to} className={TILE}>
              <span className="block text-2xl font-semibold tabular-nums">{tile.value}</span>
              <span className="mt-0.5 block text-sm text-white/50">{tile.label}</span>
            </a>
          </li>
        ))}
        <li>
          <Link to="/profil#informations" className={TILE}>
            <span className="block text-2xl font-semibold tabular-nums">{completion} %</span>
            <span className="mt-0.5 block text-sm text-white/50">Profil complété</span>
            <span aria-hidden="true" className="mt-2 block h-1 rounded-full bg-white/10"><span className={`block h-full rounded-full bg-gold-400 ${fillClass(completion / 100)}`} /></span>
          </Link>
        </li>
      </ul>

      {next && (
        <div className="mt-3 flex flex-col gap-4 rounded-2xl border border-gold-400/25 bg-gold-400/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm text-gold-400">{live && <PulseDot />}{live ? 'En direct' : `Ton prochain rendez-vous · ${eventTeaser(next.startDate)}`}</p>
            <p className="mt-1 truncate font-medium">{next.title} <span className="text-white/45">· {TYPE_LABEL[next.type]}</span></p>
          </div>
          <Button asChild size="sm" className="shrink-0 font-semibold">
            <Link to={eventPath(next)}>{live ? 'Rejoindre' : 'Voir'}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>
          </Button>
        </div>
      )}
    </Container>
  );
}
