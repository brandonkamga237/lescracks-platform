import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import NextEventCard from '@/components/events/NextEventCard';
import NavItemLink from '@/components/site/NavItemLink';
import type { NavItem } from '@/components/site/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { illustrationSrc, SOCIAL_LINKS } from '@/config/site';
import { useScrollLock } from '@/hooks/useScrollLock';
import { EASE } from '@/lib/motion';
import type { EventSummary } from '@/services/types';

const LIST: Variants = { closed: {}, open: { transition: { staggerChildren: 0.05, delayChildren: 0.25 } } };
const ITEM: Variants = { closed: { opacity: 0, y: 24 }, open: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } };
const CURTAIN = [0.76, 0, 0.24, 1] as const;

export interface MenuOrigin {
  /** Centre of the button that opened it, as a CSS position. */
  at: string;
  /** Enough to cover the screen from there. */
  radius: number;
}

interface MobileMenuProps {
  id: string;
  origin: MenuOrigin;
  items: NavItem[];
  isSignedIn: boolean;
  nextEvent?: EventSummary;
  onClose: () => void;
}

/** The phone menu, opened as a circle from its button; mount it inside AnimatePresence so it closes the same way. */
export default function MobileMenu({ id, origin, items, isSignedIn, nextEvent, onClose }: MobileMenuProps) {
  useScrollLock(true);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    const onResize = () => { if (window.innerWidth >= 1024) onClose(); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [onClose]);

  return (
    <motion.div
      id={id}
      data-lenis-prevent
      initial={{ clipPath: `circle(0px at ${origin.at})` }}
      animate={{ clipPath: `circle(${origin.radius}px at ${origin.at})` }}
      exit={{ clipPath: `circle(0px at ${origin.at})`, transition: { duration: 0.55, ease: CURTAIN } }}
      transition={{ duration: 0.75, ease: CURTAIN }}
      className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-noir-900 px-5 pb-8 pt-28 sm:px-8 lg:hidden"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_70%_60%_at_85%_0%,rgba(212,175,55,0.14),transparent_70%)]" />
      <motion.ul variants={LIST} initial="closed" animate="open" className="relative space-y-1">
        {items.map((item) => (
          <motion.li key={item.label} variants={ITEM}>
            <NavItemLink item={item} onClick={onClose} className="-mx-3 flex items-center gap-4 rounded-2xl p-3 transition-colors active:bg-white/[0.05]">
              {item.illustration && (
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <img src={illustrationSrc(item.illustration)} alt="" className="h-9 w-9" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                  {item.label}
                  {item.soon && <Badge size="sm">Bientôt</Badge>}
                </span>
                {item.summary && <span className="block truncate text-sm text-white/50">{item.summary}</span>}
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-white/35" aria-hidden="true" />
            </NavItemLink>
          </motion.li>
        ))}
      </motion.ul>

      {nextEvent && (
        <motion.div variants={ITEM} initial="closed" animate="open" transition={{ delay: 0.55 }} className="relative mt-6">
          <NextEventCard event={nextEvent} onNavigate={onClose} />
        </motion.div>
      )}

      <motion.div variants={ITEM} initial="closed" animate="open" transition={{ delay: 0.6 }} className="relative mt-auto pt-8">
        {isSignedIn ? (
          <Button asChild size="lg" className="w-full font-semibold"><Link to="/profil" onClick={onClose}>Mon compte</Link></Button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button asChild size="lg" variant="outline"><Link to="/connexion" onClick={onClose}>Se connecter</Link></Button>
            <Button asChild size="lg" className="font-semibold"><Link to="/inscription" onClick={onClose}>Rejoindre</Link></Button>
          </div>
        )}
        <div className="mt-6 flex items-center justify-between text-sm text-white/40">
          <span>© {new Date().getFullYear()} LesCracks</span>
          <span className="flex gap-4">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label}, nouvel onglet`} className="transition-colors hover:text-white"><Icon className="h-4 w-4" /></a>
            ))}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
