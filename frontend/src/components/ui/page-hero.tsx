import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

import { SplitText, type TextPart } from '@/components/motion/SplitText';
import { Container } from '@/components/ui/container';
import { EASE } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface PageHeroProps {
  id: string;
  eyebrow: string;
  title: TextPart[];
  lead?: string;
  /** Under the lead: filters, a call to action. */
  children?: ReactNode;
  className?: string;
}

/** The opening of a page inside the platform, in the voice of the landing's section headings. */
export function PageHero({ id, eyebrow, title, lead, children, className }: PageHeroProps) {
  return (
    <section aria-labelledby={id} className={cn('relative isolate overflow-hidden', className)}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(ellipse_55%_70%_at_20%_0%,rgba(212,175,55,0.09),transparent_70%)]" />
      <Container className="pb-12 pt-12 sm:pb-16 sm:pt-20">
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }} className="text-sm font-medium text-gold-400">{eyebrow}</motion.p>
        <SplitText as="h1" id={id} onMount delay={0.08} parts={title} className="mt-5 max-w-4xl text-display font-semibold" />
        {lead && <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: EASE }} className="mt-6 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">{lead}</motion.p>}
        {children && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: EASE }} className="mt-10">{children}</motion.div>}
      </Container>
    </section>
  );
}
