import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Shared page primitives.
 *
 * Every screen used to hand-roll its own container width, vertical padding and heading
 * markup, which is why no two pages shared a rhythm. These are the only building blocks
 * pages should compose with, so spacing decisions live in one place.
 */

const CONTAINER = 'mx-auto w-full max-w-7xl px-5 sm:px-8';

/** Vertical rhythm scale. Pages pick an intent, never raw padding values. */
const SPACING = {
  tight: 'py-14 sm:py-16',
  normal: 'py-20 lg:py-28',
  loose: 'py-24 lg:py-32',
} as const;

type Spacing = keyof typeof SPACING;

interface ContainerProps extends ComponentPropsWithoutRef<'div'> {
  children: ReactNode;
}

export function Container({ children, className = '', ...rest }: ContainerProps) {
  return <div className={`${CONTAINER} ${className}`} {...rest}>{children}</div>;
}

interface SectionProps extends Omit<ComponentPropsWithoutRef<'section'>, 'children'> {
  children: ReactNode;
  spacing?: Spacing;
  /** Sets the section apart from the page background without adding a card. */
  muted?: boolean;
  bordered?: boolean;
  /** MODE BLACK or MODE WHITE band. The colour change is the separator: no border needed. */
  tone?: 'dark' | 'light';
  /** Escape hatch for full-bleed content that manages its own container. */
  bleed?: boolean;
}

export function Section({
  children,
  spacing = 'normal',
  muted = false,
  bordered = false,
  bleed = false,
  tone = 'dark',
  className = '',
  ...rest
}: SectionProps) {
  const surface = [
    tone === 'light' ? 'mode-light' : 'bg-black',
    muted ? 'bg-noir-900' : '',
    bordered && tone === 'dark' ? 'border-t border-line-soft' : '',
  ].filter(Boolean).join(' ');

  if (bleed) {
    return <section className={`${surface} ${className}`} {...rest}>{children}</section>;
  }

  return (
    <section className={`${surface} ${className}`} {...rest}>
      <div className={`${CONTAINER} ${SPACING[spacing]}`}>{children}</div>
    </section>
  );
}

interface PageHeaderProps {
  title: string;
  /** Small gold label above the title. Positions the page, never repeats the title. */
  eyebrow?: string;
  description?: string;
  /** Result count or status, aligned with the title on wide screens. */
  meta?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, eyebrow, description, meta, actions }: PageHeaderProps) {
  return (
    <header className="mb-10 sm:mb-14">
      {eyebrow && <p className="kicker mb-5">{eyebrow}</p>}
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
        <div className="min-w-0">
          <h1 className="font-display text-[2.75rem] font-bold leading-[0.94] tracking-tight text-t1 sm:text-6xl lg:text-7xl lg:leading-[0.9]">{title}</h1>
          {description && <p className="mt-6 max-w-2xl text-lg leading-normal text-t3">{description}</p>}
        </div>
        {(meta || actions) && (
          <div className="flex flex-wrap items-center gap-3 pb-1">
            {meta && <span className="label">{meta}</span>}
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

interface SectionHeaderProps {
  title: string;
  /** Optional gold label above the title. */
  eyebrow?: string;
  description?: string;
  /** Usually a "see everything" link. */
  action?: ReactNode;
  id?: string;
}

export function SectionHeader({ title, eyebrow, description, action, id }: SectionHeaderProps) {
  return (
    <div className="mb-10 sm:mb-12">
      {eyebrow && <p className="kicker mb-4">{eyebrow}</p>}
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div className="min-w-0">
          <h2 id={id} className="font-display text-4xl font-bold leading-[0.96] tracking-tight text-t1 sm:text-5xl">{title}</h2>
          {description && <p className="mt-4 max-w-xl text-base leading-normal text-t3">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

interface ToolbarProps {
  children: ReactNode;
  /** Search field or anything that should take the remaining width. */
  lead?: ReactNode;
}

/** The one filter row shape. Wraps instead of overflowing, so it survives 375px. */
export function Toolbar({ children, lead }: ToolbarProps) {
  return (
    <div className="mb-10 flex flex-col gap-5 sm:mb-12">
      {lead}
      {children && <div className="flex flex-wrap items-center gap-x-8 gap-y-3">{children}</div>}
    </div>
  );
}
