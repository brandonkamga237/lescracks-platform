import type { ReactNode } from 'react';

import { Container } from '@/components/ui/container';
import { cn } from '@/lib/utils';

interface SpaceHeaderProps {
  title: string;
  /** Beside the title, in small: a count, a status. */
  meta?: ReactNode;
  /** One short line, only when the title is not enough. */
  lead?: string;
  /** At the end of the title line: the page's main action. */
  action?: ReactNode;
  /** Under the title line: filters. */
  children?: ReactNode;
  className?: string;
}

/** A page's opening inside the platform: short, so the content starts above the fold. */
export function SpaceHeader({ title, meta, lead, action, children, className }: SpaceHeaderProps) {
  return (
    <Container className={cn('pb-6 pt-8 sm:pt-10', className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-baseline gap-x-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
            {meta && <span className="text-sm font-normal tabular-nums text-white/45">{meta}</span>}
          </h1>
          {lead && <p className="mt-1.5 max-w-2xl text-sm text-white/50">{lead}</p>}
        </div>
        {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </Container>
  );
}
