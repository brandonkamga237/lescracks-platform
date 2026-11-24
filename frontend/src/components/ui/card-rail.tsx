import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface CardRailProps {
  children: ReactNode[];
  /** Columns from the small breakpoint up. */
  columns?: 2 | 3;
  label: string;
}

/**
 * Cards that slide sideways on a phone, one and a bit in view so the next one invites the thumb,
 * and settle into a grid on a wider screen.
 */
export function CardRail({ children, columns = 2, label }: CardRailProps) {
  return (
    <ul aria-label={label} className={cn(
      '-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0',
      columns === 3 ? 'sm:grid-cols-2 xl:grid-cols-3' : 'sm:grid-cols-2',
    )}>
      {children.map((child, index) => <li key={index} className="w-[80%] shrink-0 snap-start sm:w-auto">{child}</li>)}
    </ul>
  );
}
