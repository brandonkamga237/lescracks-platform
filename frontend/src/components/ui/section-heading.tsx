import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

import { Reveal } from '@/components/motion/Reveal';
import { SplitText, type TextPart } from '@/components/motion/SplitText';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  id: string;
  eyebrow: string;
  title: TextPart[];
  /** A link to the full list, at the end of the line. */
  action?: { to: string; label: string };
  tone?: 'dark' | 'light';
  className?: string;
}

/** A section's opening: a gold eyebrow, a title whose words rise in, and an optional link to see more. */
export function SectionHeading({ id, eyebrow, title, action, tone = 'dark', className }: SectionHeadingProps) {
  return (
    <div className={cn('flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div>
        <Reveal><p className={cn('text-sm font-medium', tone === 'light' ? 'text-gold-700' : 'text-gold-400')}>{eyebrow}</p></Reveal>
        <SplitText id={id} parts={title} className="mt-5 max-w-3xl text-display font-semibold" />
      </div>
      {action && (
        <Reveal>
          <Link to={action.to} className={cn('group inline-flex shrink-0 items-center gap-2 text-sm transition-colors', tone === 'light' ? 'text-black/60 hover:text-black' : 'text-white/60 hover:text-white')}>
            {action.label}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </Reveal>
      )}
    </div>
  );
}
