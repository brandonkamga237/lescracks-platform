import { useState } from 'react';
import { motion } from 'framer-motion';

import NavItemLink from '@/components/site/NavItemLink';
import type { NavItem } from '@/components/site/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DesktopNavProps {
  items: NavItem[];
  /** The section being read, to mark its link. */
  active: string | null;
}

/** The links in a capsule; a highlight slides under the hovered one and a gold dot marks the current section. */
export default function DesktopNav({ items, active }: DesktopNavProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <nav aria-label="Principale" onMouseLeave={() => setHovered(null)} className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center rounded-full border border-white/10 bg-white/[0.045] p-1 text-[15px] font-medium text-white/75 backdrop-blur-md lg:flex">
      {items.map((item) => {
        const current = item.section !== undefined && item.section === active;
        return (
          <NavItemLink key={item.label} item={item} onMouseEnter={() => setHovered(item.label)} className={cn('relative flex h-10 items-center gap-1.5 rounded-full px-4 transition-colors hover:text-white', current && 'text-white')}>
            {hovered === item.label && (
              <motion.span layoutId="site-nav-hover" aria-hidden="true" className="absolute inset-0 rounded-full bg-white/[0.09]" transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }} />
            )}
            <span className="relative">{item.label}</span>
            {item.soon && <Badge className="relative">Bientôt</Badge>}
            <span aria-hidden="true" className={cn('absolute bottom-[3px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold-400 transition-transform duration-300 ease-out', current ? 'scale-100' : 'scale-0')} />
          </NavItemLink>
        );
      })}
    </nav>
  );
}
