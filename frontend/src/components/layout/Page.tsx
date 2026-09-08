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
  tight: 'py-10 sm:py-14',
  normal: 'py-14 sm:py-20',
  loose: 'py-16 sm:py-24',
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
  /** Escape hatch for full-bleed content that manages its own container. */
  bleed?: boolean;
}

export function Section({
  children,
  spacing = 'normal',
  muted = false,
  bordered = false,
  bleed = false,
  className = '',
  ...rest
}: SectionProps) {
  const surface = [
    muted ? 'bg-noir-900/30' : '',
    bordered ? 'border-t border-line-soft/50' : '',
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
    <header className="mb-8 sm:mb-10">
      {eyebrow && <p className="mb-3 text-sm font-medium tracking-wide text-gold-400">{eyebrow}</p>}
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-t1 sm:text-4xl">{title}</h1>
          {description && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-t3 sm:text-base">{description}</p>}
        </div>
        {(meta || actions) && (
          <div className="flex flex-wrap items-center gap-3">
            {meta && <span className="text-sm text-t4">{meta}</span>}
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  /** Usually a "see everything" link. */
  action?: ReactNode;
  id?: string;
}

export function SectionHeader({ title, description, action, id }: SectionHeaderProps) {
  return (
    <div className="mb-8 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 sm:mb-10">
      <div className="min-w-0">
        <h2 id={id} className="font-display text-2xl font-semibold tracking-tight text-t1 sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 text-sm leading-relaxed text-t3">{description}</p>}
      </div>
      {action}
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
    <div className="mb-8 flex flex-col gap-4 sm:mb-10">
      {lead}
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
