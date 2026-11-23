import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex shrink-0 items-center rounded-full font-medium tracking-normal', {
  variants: {
    tone: {
      gold: 'bg-gold-400/15 text-gold-400',
      // On the ivory band gold-400 text falls under 3:1; the darker gold keeps it readable.
      light: 'border border-black/15 bg-white text-gold-700',
    },
    size: {
      xs: 'px-1.5 py-px text-[10px]',
      sm: 'px-2 py-0.5 text-[11px]',
      md: 'px-3 py-1 text-xs',
    },
  },
  defaultVariants: { tone: 'gold', size: 'xs' },
});

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, tone, size, className }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)}>{children}</span>;
}
