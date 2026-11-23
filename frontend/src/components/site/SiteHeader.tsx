import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import LesCracksLogo from '@/components/common/LesCracksLogo';
import AccountActions from '@/components/site/AccountActions';
import DesktopNav from '@/components/site/DesktopNav';
import MenuButton from '@/components/site/MenuButton';
import MobileMenu, { type MenuOrigin } from '@/components/site/MobileMenu';
import type { NavItem } from '@/components/site/navigation';
import { useActiveSection } from '@/hooks/useActiveSection';
import { useScrolledPast } from '@/hooks/useScrolledPast';
import { cn } from '@/lib/utils';
import type { EventSummary } from '@/services/types';

const MENU_ID = 'site-menu';

interface SiteHeaderProps {
  items: NavItem[];
  isSignedIn: boolean;
  /** Offered at the foot of the phone menu. */
  nextEvent?: EventSummary;
}

/** The site bar: full width at the top of the page, a floating island once the page moves. */
export default function SiteHeader({ items, isSignedIn, nextEvent }: SiteHeaderProps) {
  const scrolled = useScrolledPast(40);
  const active = useActiveSection(items.flatMap((item) => (item.section ? [item.section] : [])));
  const [menu, setMenu] = useState<MenuOrigin | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => setMenu(null), []);

  const toggleMenu = () => {
    if (menu || !button.current) { setMenu(null); return; }
    const box = button.current.getBoundingClientRect();
    setMenu({ at: `${box.left + box.width / 2}px ${box.top + box.height / 2}px`, radius: Math.hypot(window.innerWidth, window.innerHeight) });
  };

  const island = scrolled && !menu;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4">
        <div className={cn(
          'relative mx-auto flex h-[72px] items-center justify-between gap-4 rounded-full border pl-5 pr-3 transition-[max-width,background-color,border-color,box-shadow] duration-700 ease-out sm:pl-6',
          island ? 'max-w-[1140px] border-white/10 bg-black/90 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl' : 'max-w-[1320px] border-transparent',
        )}>
          <Link to="/" aria-label="LesCracks, accueil" className="relative z-10 shrink-0"><LesCracksLogo height={36} className="w-auto" /></Link>
          <DesktopNav items={items} active={active} />
          <div className="relative z-10 flex items-center gap-1.5">
            <AccountActions isSignedIn={isSignedIn} />
            <MenuButton ref={button} open={menu !== null} controls={MENU_ID} onClick={toggleMenu} />
          </div>
        </div>
      </header>
      <AnimatePresence>
        {menu && <MobileMenu id={MENU_ID} origin={menu} items={items} isSignedIn={isSignedIn} nextEvent={nextEvent} onClose={closeMenu} />}
      </AnimatePresence>
    </>
  );
}
