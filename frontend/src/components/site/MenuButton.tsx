import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

interface MenuButtonProps {
  open: boolean;
  controls: string;
  onClick: () => void;
}

const LINE = 'absolute left-0 h-[1.5px] w-full rounded bg-white transition-[top,transform] duration-[400ms] ease-out';

/** Two lines that cross into a close sign while the menu is open. */
const MenuButton = forwardRef<HTMLButtonElement, MenuButtonProps>(({ open, controls, onClick }, ref) => (
  <button ref={ref} type="button" onClick={onClick} aria-controls={controls} aria-expanded={open} aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/[0.03] transition-colors hover:border-white/40 lg:hidden">
    <span aria-hidden="true" className="relative block h-3.5 w-[18px]">
      <span className={cn(LINE, open ? 'top-[calc(50%-0.75px)] rotate-45' : 'top-[2px]')} />
      <span className={cn(LINE, open ? 'top-[calc(50%-0.75px)] -rotate-45' : 'top-[calc(100%-3.5px)]')} />
    </span>
  </button>
));
MenuButton.displayName = 'MenuButton';

export default MenuButton;
