import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { TYPE_LABEL } from '@/components/events/AgendaItem';
import { Magnetic } from '@/components/motion/Magnetic';
import { SplitText, type TextPart } from '@/components/motion/SplitText';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { PulseDot } from '@/components/ui/pulse-dot';
import { eventTeaser } from '@/lib/eventMoment';
import { EASE } from '@/lib/motion';
import { fillClass } from '@/lib/progress';
import { eventPath } from '@/lib/slugs';
import type { MyEvent } from '@/services/types';

const ARRIVE = { initial: { opacity: 0, y: 16, filter: 'blur(6px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)' } };
const arrive = (delay: number) => ({ ...ARRIVE, transition: { duration: 0.9, delay, ease: EASE } });

interface MemberGreetingProps {
  firstName: string;
  /** The registration happening now, or the next one. */
  next?: MyEvent;
  live: boolean;
  /** Counts the member has actually earned; a zero is left out rather than shown. */
  tally: { label: string; count: number }[];
  /** 0 to 100. */
  completion: number;
}

function headline(firstName: string, next: MyEvent | undefined, live: boolean): TextPart[] {
  const hello = firstName ? `Bonjour ${firstName}.` : 'Bonjour.';
  if (live) return [hello, { text: 'Ton rendez-vous a commencé.', className: 'text-gold-400 sm:block' }];
  if (next) return [hello, { text: 'Ton prochain rendez-vous approche.', className: 'text-gold-400 sm:block' }];
  // A member who just signed up lands here too, so nothing that says "again".
  return [hello, { text: 'Voici ton espace.', className: 'text-gold-400 sm:block' }];
}

/** The top of the member's home: who they are, what comes next for them, and what they hold. */
export default function MemberGreeting({ firstName, next, live, tally, completion }: MemberGreetingProps) {
  const earned = tally.filter((item) => item.count > 0);
  return (
    <section aria-labelledby="member-title" className="relative isolate overflow-hidden pb-16 pt-36 sm:pb-20 sm:pt-44">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh] bg-[radial-gradient(ellipse_55%_60%_at_30%_0%,rgba(212,175,55,0.10),transparent_70%)]" />
      <Container>
        <motion.p {...arrive(0)} className="text-sm font-medium text-gold-400">Mon espace</motion.p>
        <SplitText as="h1" id="member-title" onMount delay={0.1} parts={headline(firstName, next, live)} className="mt-5 max-w-4xl text-display-hero font-semibold" />

        {next && (
          <motion.div {...arrive(0.3)} className="mt-10 flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm text-gold-400">
                {live && <PulseDot />}
                {live ? 'En direct' : eventTeaser(next.startDate)} · {TYPE_LABEL[next.type]}
              </p>
              <p className="mt-2 text-xl font-medium tracking-tight sm:text-2xl">{next.title}</p>
            </div>
            <Magnetic className="w-full shrink-0 sm:w-auto">
              <Button asChild size="lg" className="w-full font-semibold">
                <Link to={eventPath(next)}>
                  {live ? 'Rejoindre' : 'Voir le rendez-vous'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </Button>
            </Magnetic>
          </motion.div>
        )}

        <motion.div {...arrive(0.4)} className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {earned.length > 0 && (
            <ul className="flex flex-wrap gap-x-8 gap-y-3">
              {earned.map((item) => (
                <li key={item.label} className="text-sm text-white/55">
                  <span className="mr-2 text-2xl font-semibold tabular-nums text-white">{item.count}</span>{item.label}
                </li>
              ))}
            </ul>
          )}
          {completion < 100 && (
            <Link to="/profil#informations" className="group w-full max-w-xs text-sm text-white/55 transition-colors hover:text-white sm:ml-auto">
              <span className="flex items-baseline justify-between gap-3">
                <span>Profil complété à <span className="tabular-nums text-gold-400">{completion} %</span></span>
                <span className="inline-flex items-center gap-1">Compléter<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
              </span>
              <span aria-hidden="true" className="mt-2 block h-1 rounded-full bg-white/10"><span className={`block h-full rounded-full bg-gold-400 ${fillClass(completion / 100)}`} /></span>
            </Link>
          )}
        </motion.div>
      </Container>
    </section>
  );
}
