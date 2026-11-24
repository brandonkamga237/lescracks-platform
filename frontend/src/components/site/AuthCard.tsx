import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

import { SplitText } from '@/components/motion/SplitText';
import { EASE } from '@/lib/motion';

interface AuthCardProps {
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
}

/** The card every airlock screen opens with: who it is for, the title, then its form or its answer. */
export default function AuthCard({ eyebrow, title, lead, children }: AuthCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
      aria-labelledby="auth-title"
      className="w-full rounded-[2rem] border border-white/10 bg-black/60 p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-10"
    >
      <p className="text-sm font-medium text-gold-400">{eyebrow}</p>
      <SplitText as="h1" id="auth-title" onMount delay={0.15} parts={[title]} className="mt-4 text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.04em]" />
      <p className="mt-3 text-[15px] leading-relaxed text-white/55">{lead}</p>
      {children}
    </motion.section>
  );
}
