import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * A badge states a fact about a row: a role, a type, a status. Its colour is the meaning,
 * which is why the accent is not among the tones — gold marks the brand, not a value.
 */
const badge = cva(
  'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap px-2.5 py-0.5 text-label uppercase',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-3 text-t3',
        success: 'bg-success-subtle text-success',
        warning: 'bg-warning-subtle text-warning',
        error: 'bg-error-subtle text-error',
        info: 'bg-info-subtle text-info',
        accent: 'bg-gold/15 text-gold',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {}

const Badge = ({ tone, className, children, ...props }: BadgeProps) => (
  <span className={cn(badge({ tone }), className)} {...props}>
    {children}
  </span>
);

export default Badge;
export type { BadgeProps };
