import { ArrowRight, type LucideIcon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// Tailwind only sees whole class names, so each hover group gets its own spelled-out set.
const HOVER = {
  group: 'group-hover:-rotate-45 group-hover:border-gold-400 group-hover:bg-gold-400 group-hover:text-black',
  link: 'group-hover/link:-rotate-45 group-hover/link:border-gold-400 group-hover/link:bg-gold-400 group-hover/link:text-black',
} as const;

const circleVariants = cva('grid shrink-0 place-items-center rounded-full border transition-[background-color,border-color,color,transform] duration-300 ease-out', {
  variants: {
    tone: { dark: 'border-white/20', light: 'border-black/20' },
    size: { sm: 'h-9 w-9', md: 'h-11 w-11' },
  },
  defaultVariants: { tone: 'dark', size: 'md' },
});

interface ArrowCircleProps extends VariantProps<typeof circleVariants> {
  /** The `group` the circle reacts to: the whole row, or a `group/link` inside it. */
  hover?: keyof typeof HOVER;
  icon?: LucideIcon;
  className?: string;
}

/** The round arrow that ends a row or a link; it fills with gold and turns when its group is hovered. */
export function ArrowCircle({ tone, size, hover = 'group', icon: Icon = ArrowRight, className }: ArrowCircleProps) {
  return (
    <span aria-hidden="true" className={cn(circleVariants({ tone, size }), HOVER[hover], className)}>
      <Icon className="h-4 w-4" />
    </span>
  );
}
