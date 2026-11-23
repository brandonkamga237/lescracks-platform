import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import { EASE } from '@/lib/motion';
import { cn } from '@/lib/utils';

export interface AccordionItem {
  title: string;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  /** Index open on arrival; null keeps every panel closed. */
  defaultOpen?: number | null;
  tone?: 'dark' | 'light';
  className?: string;
}

/** Questions and answers, one panel open at a time, the height animated. */
export function Accordion({ items, defaultOpen = 0, tone = 'dark', className }: AccordionProps) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const base = useId();
  const line = tone === 'light' ? 'border-black/10' : 'border-white/10';

  return (
    <div className={cn('border-t', line, className)}>
      {items.map((item, index) => {
        const expanded = open === index;
        const buttonId = `${base}-question-${index}`;
        const panelId = `${base}-answer-${index}`;
        return (
          <div key={item.title} className={cn('border-b', line)}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : index)}
                className="flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-medium tracking-tight sm:text-xl"
              >
                {item.title}
                <span aria-hidden="true" className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-transform duration-300 ease-out', tone === 'light' ? 'border-black/20' : 'border-white/20', expanded && 'rotate-45')}>
                  <Plus className="h-4 w-4" />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div className={cn('max-w-2xl pb-6 leading-relaxed', tone === 'light' ? 'text-black/65' : 'text-white/65')}>{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
