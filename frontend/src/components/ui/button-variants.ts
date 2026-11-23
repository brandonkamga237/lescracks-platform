import { cva } from 'class-variance-authority';

// Pills, for the redesigned pages; the older 4px `.btn-primary` stays with the pages not yet moved over.
export const buttonVariants = cva(
  'group inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-medium transition-[background-color,border-color,color] duration-200 ease-out disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        primary: 'bg-gold-400 text-black hover:bg-gold-300',
        outline: 'border border-white/15 text-white/85 hover:border-white/40 hover:text-white',
        ghost: 'text-white/80 hover:text-white',
      },
      size: {
        sm: 'h-10 px-4 text-sm',
        md: 'h-11 px-6 text-[15px]',
        lg: 'h-12 px-7 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);
