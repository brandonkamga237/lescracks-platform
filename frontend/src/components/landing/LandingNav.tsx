import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValueEvent, useScroll, type Variants } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import LesCracksLogo from '@/components/common/LesCracksLogo';
import { GitHubIcon, LinkedInIcon, YouTubeIcon } from '@/components/icons/BrandIcons';
import MagneticLink from '@/components/landing/MagneticLink';
import { EASE } from '@/lib/motion';
import { eventTeaser } from '@/lib/eventMoment';
import { deriveEventStatus } from '@/lib/eventStatus';
import { eventPath } from '@/lib/slugs';
import type { EventSummary } from '@/services/types';

interface NavItem {
  label: string;
  /** An app route, or an anchor on the landing itself. */
  to?: string;
  href?: string;
  /** The landing section that lights this link up while it is read. */
  section?: string;
  soon?: boolean;
  image: string;
  hint: string;
}

const ITEMS: NavItem[] = [
  { label: 'Blog', to: '/blog', section: 'blog', image: 'memo', hint: 'Notions et retours d’expérience' },
  { label: 'Rendez-vous', to: '/evenements', section: 'rendez-vous', image: 'calendar', hint: 'Ateliers, webinaires et conférences' },
  { label: 'Le Talk', to: '/talk', image: 'mic', hint: 'Des parcours réels, en vidéo' },
  { label: 'Cours', to: '/formations', soon: true, image: 'cap', hint: 'Des parcours pas à pas' },
  { label: 'FAQ', href: '#faq', section: 'faq', image: 'speech', hint: 'Les questions fréquentes' },
];

const SOCIALS = [
  { label: 'LinkedIn', href: 'https://linkedin.com/company/lescracks', Icon: LinkedInIcon },
  { label: 'GitHub', href: 'https://github.com/lescracks', Icon: GitHubIcon },
  { label: 'YouTube', href: 'https://youtube.com/@lescracks', Icon: YouTubeIcon },
];

const MENU_LIST: Variants = { closed: {}, open: { transition: { staggerChildren: 0.05, delayChildren: 0.25 } } };
const MENU_ITEM: Variants = { closed: { opacity: 0, y: 24 }, open: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } };
const CURTAIN = [0.76, 0, 0.24, 1] as const;

interface ItemLinkProps {
  item: NavItem;
  className: string;
  children: ReactNode;
  onClick?: () => void;
  onMouseEnter?: () => void;
}

function ItemLink({ item, children, ...props }: ItemLinkProps) {
  if (item.to) return <Link to={item.to} {...props}>{children}</Link>;
  return <a href={item.href} {...props}>{children}</a>;
}

/** Follows which landing section sits in the middle of the screen. */
function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
        else setActive((current) => (current === entry.target.id ? null : current));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ids.forEach((id) => { const section = document.getElementById(id); if (section) observer.observe(section); });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

const SECTIONS = ITEMS.flatMap((item) => (item.section ? [item.section] : []));

interface LandingNavProps {
  isSignedIn: boolean;
  nextEvent?: EventSummary;
}

/**
 * The landing's own bar: full width over the hero, then a floating island once the page moves.
 * On a phone the menu opens as a circle from its button.
 */
export default function LandingNav({ isSignedIn, nextEvent }: LandingNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ origin: string; radius: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const active = useActiveSection(SECTIONS);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 40));

  const open = menu !== null;
  const toggleMenu = () => {
    if (open || !button.current) { setMenu(null); return; }
    const box = button.current.getBoundingClientRect();
    setMenu({ origin: `${box.left + box.width / 2}px ${box.top + box.height / 2}px`, radius: Math.hypot(window.innerWidth, window.innerHeight) });
  };
  const closeMenu = () => setMenu(null);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenu(null); };
    const onResize = () => { if (window.innerWidth >= 1024) setMenu(null); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      root.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  const island = scrolled && !open;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4">
        <div className={`relative mx-auto flex h-[72px] items-center justify-between gap-4 rounded-full border pl-5 pr-3 transition-[max-width,background-color,border-color,box-shadow] duration-700 ease-[cubic-bezier(.22,1,.36,1)] sm:pl-6 ${island ? 'max-w-[1140px] border-white/10 bg-black/90 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl' : 'max-w-[1320px] border-transparent'}`}>
          <Link to="/" aria-label="LesCracks, accueil" className="relative z-10 shrink-0">
            <LesCracksLogo height={36} className="w-auto" />
          </Link>

          <nav aria-label="Principale" onMouseLeave={() => setHovered(null)} className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center rounded-full border border-white/10 bg-white/[0.045] p-1 text-[15px] font-medium text-white/75 backdrop-blur-md lg:flex">
            {ITEMS.map((item) => {
              const current = item.section !== undefined && item.section === active;
              return (
                <ItemLink key={item.label} item={item} onMouseEnter={() => setHovered(item.label)} className={`relative flex h-10 items-center gap-1.5 rounded-full px-4 transition-colors hover:text-white ${current ? 'text-white' : ''}`}>
                  {hovered === item.label && (
                    <motion.span layoutId="landing-nav-hover" className="absolute inset-0 rounded-full bg-white/[0.09]" transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }} aria-hidden="true" />
                  )}
                  <span className="relative">{item.label}</span>
                  {item.soon && <span className="relative rounded-full bg-gold-400/15 px-1.5 py-px text-[10px] font-medium text-gold-400">Bientôt</span>}
                  <span aria-hidden="true" className={`absolute bottom-[3px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold-400 transition-transform duration-300 ${current ? 'scale-100' : 'scale-0'}`} />
                </ItemLink>
              );
            })}
          </nav>

          <div className="relative z-10 flex items-center gap-1.5">
            {isSignedIn ? (
              <MagneticLink to="/profil" className="group hidden h-11 items-center gap-2 rounded-full bg-gold-400 pl-6 pr-5 text-[15px] font-semibold text-black transition-colors hover:bg-gold-300 sm:inline-flex">
                Mon espace <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </MagneticLink>
            ) : (
              <>
                <Link to="/connexion" className="hidden h-11 items-center rounded-full px-4 text-[15px] font-medium text-white/80 transition-colors hover:text-white sm:inline-flex">Se connecter</Link>
                <MagneticLink to="/inscription" className="group hidden h-11 items-center gap-2 rounded-full bg-gold-400 pl-6 pr-5 text-[15px] font-semibold text-black transition-colors hover:bg-gold-300 sm:inline-flex">
                  Rejoindre <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </MagneticLink>
              </>
            )}
            <button ref={button} type="button" onClick={toggleMenu} aria-controls="landing-menu" aria-expanded={open} aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/[0.03] transition-colors hover:border-white/40 lg:hidden">
              <span className="relative block h-3.5 w-[18px]" aria-hidden="true">
                <span className={`absolute left-0 h-[1.5px] w-full rounded bg-white transition-[top,transform] duration-[400ms] ease-[cubic-bezier(.22,1,.36,1)] ${open ? 'top-[calc(50%-0.75px)] rotate-45' : 'top-[2px]'}`} />
                <span className={`absolute left-0 h-[1.5px] w-full rounded bg-white transition-[top,transform] duration-[400ms] ease-[cubic-bezier(.22,1,.36,1)] ${open ? 'top-[calc(50%-0.75px)] -rotate-45' : 'top-[calc(100%-3.5px)]'}`} />
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div
            id="landing-menu"
            data-lenis-prevent
            initial={{ clipPath: `circle(0px at ${menu.origin})` }}
            animate={{ clipPath: `circle(${menu.radius}px at ${menu.origin})` }}
            exit={{ clipPath: `circle(0px at ${menu.origin})`, transition: { duration: 0.55, ease: CURTAIN } }}
            transition={{ duration: 0.75, ease: CURTAIN }}
            className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-[#0a0a0a] px-5 pb-8 pt-28 sm:px-8 lg:hidden"
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_70%_60%_at_85%_0%,rgba(212,175,55,0.14),transparent_70%)]" />
            <motion.ul variants={MENU_LIST} initial="closed" animate="open" className="relative space-y-1">
              {ITEMS.map((item) => (
                <motion.li key={item.label} variants={MENU_ITEM}>
                  <ItemLink item={item} onClick={closeMenu} className="-mx-3 flex items-center gap-4 rounded-2xl p-3 transition-colors active:bg-white/[0.05]">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
                      <img src={`/images/illustrations/${item.image}.webp`} alt="" className="h-9 w-9" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                        {item.label}
                        {item.soon && <span className="rounded-full bg-gold-400/15 px-2 py-0.5 text-[11px] font-medium tracking-normal text-gold-400">Bientôt</span>}
                      </span>
                      <span className="block truncate text-sm text-white/50">{item.hint}</span>
                    </span>
                    <ArrowRight className="h-5 w-5 shrink-0 text-white/35" aria-hidden="true" />
                  </ItemLink>
                </motion.li>
              ))}
            </motion.ul>

            {nextEvent && (
              <motion.div variants={MENU_ITEM} initial="closed" animate="open" transition={{ delay: 0.55 }} className="relative mt-6">
                <Link to={eventPath(nextEvent)} onClick={closeMenu} className="flex items-center justify-between gap-4 rounded-2xl border border-gold-400/20 bg-gradient-to-r from-gold-400/[0.12] to-transparent p-4">
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-gold-400">{deriveEventStatus(nextEvent.startDate, nextEvent.endDate) === 'open' ? 'En direct maintenant' : `Prochain rendez-vous · ${eventTeaser(nextEvent.startDate)}`}</span>
                    <span className="mt-1 block truncate font-medium">{nextEvent.title}</span>
                  </span>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-400 text-black"><ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
                </Link>
              </motion.div>
            )}

            <motion.div variants={MENU_ITEM} initial="closed" animate="open" transition={{ delay: 0.6 }} className="relative mt-auto pt-8">
              {isSignedIn ? (
                <Link to="/profil" onClick={closeMenu} className="flex h-12 items-center justify-center rounded-full bg-gold-400 text-sm font-semibold text-black">Mon espace</Link>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/connexion" onClick={closeMenu} className="flex h-12 items-center justify-center rounded-full border border-white/15 text-sm">Se connecter</Link>
                  <Link to="/inscription" onClick={closeMenu} className="flex h-12 items-center justify-center rounded-full bg-gold-400 text-sm font-semibold text-black">Rejoindre</Link>
                </div>
              )}
              <div className="mt-6 flex items-center justify-between text-sm text-white/40">
                <span>© {new Date().getFullYear()} LesCracks</span>
                <span className="flex gap-4">
                  {SOCIALS.map(({ label, href, Icon }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label}, nouvel onglet`} className="transition-colors hover:text-white"><Icon className="h-4 w-4" /></a>
                  ))}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
