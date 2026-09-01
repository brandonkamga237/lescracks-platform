import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Gold is the accent and carries the primary action alone. A destructive action uses the
 * error state, never the accent, so "delete" never looks like "the thing we want you to do".
 */
const button = cva(
  'inline-flex items-center justify-center gap-2 font-medium rounded-lg whitespace-nowrap ' +
    'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 ' +
    'focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
    'disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-gold text-black hover:bg-gold-light',
        secondary: 'bg-transparent border border-line-strong text-t1 hover:border-gold/50 hover:text-gold',
        ghost: 'bg-transparent text-t3 hover:bg-surface-2 hover:text-t1',
        danger: 'bg-error-subtle text-error border border-error/30 hover:bg-error hover:text-error-foreground',
      },
      /** compact belongs to the back office, comfortable to the reading pages. */
      density: {
        compact: 'h-row-compact px-3 text-data',
        comfortable: 'h-row-comfortable px-6 text-sm',
      },
    },
    defaultVariants: { variant: 'primary', density: 'compact' },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  /** Shows a spinner and blocks the click, so no caller re-implements that pairing. */
  loading?: boolean;
}

const Button = ({ variant, density, loading, disabled, className, children, ...props }: ButtonProps) => (
  <button
    className={cn(button({ variant, density }), className)}
    disabled={disabled || loading}
    {...props}
  >
    {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
    {children}
  </button>
);

export default Button;
export type { ButtonProps };
