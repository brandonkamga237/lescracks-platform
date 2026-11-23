import type { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { ScaleInSection } from '@/components/motion/ScaleInSection';
import { cn } from '@/lib/utils';

const bandVariants = cva('relative rounded-t-4xl sm:rounded-t-6xl', {
  variants: {
    tone: {
      ivory: 'bg-ivory text-[#0a0a0a]',
      black: 'bg-black text-white',
    },
    // A band laid over the previous one tucks under its rounded corners and sits above it.
    overlap: { true: 'z-20 -mt-8', false: 'z-10' },
  },
  defaultVariants: { tone: 'black', overlap: false },
});

interface BandProps extends VariantProps<typeof bandVariants> {
  children: ReactNode;
  id?: string;
  labelledBy: string;
  className?: string;
}

/** A full-width section with rounded top corners that grows into place, stacked over the one before. */
export function Band({ children, tone, overlap, id, labelledBy, className }: BandProps) {
  return (
    <ScaleInSection id={id} labelledBy={labelledBy} className={cn(bandVariants({ tone, overlap }), className)}>
      {children}
    </ScaleInSection>
  );
}
