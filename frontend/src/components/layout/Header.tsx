import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  Menu, X, ArrowRight, BookOpen, Video, Code2, ChevronDown,
  User, LogOut, Shield, Crown, Award,
  Users, Compass, FileText,
} from 'lucide-react';
import LesCracksLogo from '@/components/common/LesCracksLogo';

// ─── menu config — single source of truth for desktop AND mobile ─────────────

const menuItems = [
  {
    title: 'Accompagnement',
    href: '/programme',
    pulse: true,
    alignRight: false,
    columns: [
      { title: 'Le programme', description: 'Tout ce que tu dois savoir sur l\'Accompagnement 360', href: '/programme', icon: Compass },
      { title: 'Postuler', description: 'Soumettre ta candidature — réponse sous 48h', href: '/postuler', icon: FileText },
    ],
  },
  {
    title: 'Ressources',
    href: '/ressources',
    pulse: false,
    alignRight: false,
    columns: [
      { title: 'Bibliothèque', description: 'Livres, articles et guides techniques', href: '/ressources?type=DOCUMENT', icon: BookOpen },
      { title: 'Vidéothèque', description: 'Tutoriels vidéo et formations exclusives', href: '/ressources?type=VIDEO', icon: Video },
    ],
  },
  { title: 'Événements', href: '/evenements', pulse: false, alignRight: false, columns: undefined },
  {
    title: 'Open Source',
    href: '/open-source',
    pulse: false,
    alignRight: true,
    columns: [
      { title: 'Nos Solutions', description: 'Projets open source développés par LesCracks', href: '/open-source#solutions', icon: Code2 },
      { title: 'Contributeurs', description: 'La communauté qui construit avec nous', href: '/open-source#contributors', icon: Users },
    ],
  },
  { title: 'À propos', href: '/about', pulse: false, alignRight: false, columns: undefined },
] as const;

type MenuItem = (typeof menuItems)[number];

const GoldPulse = () => (
  <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold" />
  </span>
);

// ─── desktop dropdown ─────────────────────────────────────────────────────────

const MegaMenu = ({ item, id, onNavigate }: { item: MenuItem; id: string; onNavigate: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 8 }}
    transition={{ duration: 0.18, ease: 'easeOut' }}
    className={`absolute top-full pt-3 z-50 ${item.alignRight ? 'right-0' : 'left-0'}`}
  >
    <div id={id} className="w-72 bg-background/95 backdrop-blur-xl border border-line rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
      <div className="h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      <ul className="py-2">
        {item.columns?.map((col, i) => {
          const Icon = col.icon;
          return (
            <li key={col.title}>
              {i > 0 && <div className="mx-4 my-1 border-t border-line-soft" />}
              <Link
                to={col.href}
                onClick={onNavigate}
                className="group flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors"
              >
                <span className="w-8 h-8 mt-0.5 rounded-lg bg-white/5 border border-line-soft flex items-center justify-center flex-shrink-0 group-hover:bg-gold/10 group-hover:border-gold/20 transition-colors">
                  <Icon className="w-4 h-4 text-t4 group-hover:text-gold transition-colors" aria-hidden="true" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-t2 group-hover:text-t1 transition-colors leading-snug">
                    {col.title}
                  </span>
                  <span className="block text-xs text-t4 mt-0.5 leading-relaxed">{col.description}</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-t4 group-hover:text-gold group-hover:translate-x-0.5 transition-all mt-1 flex-shrink-0" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="h-px bg-gradient-to-r from-transparent via-gold/15 to-transparent" />
    </div>
  </motion.div>
);

// ─── header ───────────────────────────────────────────────────────────────────

const Header = () => {
  const { isAuthenticated, isAdmin, isPremium, isLearner, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Escape always closes — a keyboard user must never be trapped in a menu.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenu(null);
        setProfileOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Outside click closes dropdowns. pointerdown covers mouse AND touch.
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (profileRef.current && !profileRef.current.contains(t)) setProfileOpen(false);
      if (navRef.current && !navRef.current.contains(t)) setActiveMenu(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
  };

  const getDisplayName = () =>
    user?.firstName || user?.username || user?.email?.split('@')[0] || 'Mon compte';

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    if (user?.username) return user.username.substring(0, 2).toUpperCase();
    if (user?.email) return user.email.substring(0, 2).toUpperCase();
    return 'U';
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 bg-background/80 backdrop-blur-lg border-b border-line">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          <Link to={isAuthenticated ? '/ressources' : '/'} className="flex items-center gap-1 flex-shrink-0">
            {/* The logo defaults to a black "Les", which is invisible on this dark header. */}
            <LesCracksLogo height={40} lesColor="#FFFFFF" className="w-auto" />
            <span className="sr-only">LesCracks — accueil</span>
          </Link>

          {/* Desktop nav */}
          <nav ref={navRef} aria-label="Navigation principale" className="hidden lg:flex items-center gap-0.5">
            {!isAuthenticated && (
              <Link to="/" className="px-3.5 py-2 text-sm text-t3 hover:text-t1 transition-colors rounded-lg hover:bg-secondary/40">
                Accueil
              </Link>
            )}

            {menuItems.map((item) => {
              const hasMenu = Boolean(item.columns);
              const open = activeMenu === item.title;
              const panelId = `menu-${item.title.replace(/\s+/g, '-').toLowerCase()}`;

              if (!hasMenu) {
                return (
                  <Link
                    key={item.title}
                    to={item.href}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-t3 hover:text-t1 transition-colors rounded-lg hover:bg-secondary/40"
                  >
                    {item.title}
                  </Link>
                );
              }

              return (
                <div
                  key={item.title}
                  className="relative"
                  onMouseEnter={() => setActiveMenu(item.title)}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  {/*
                    A real <button>: reachable with Tab, activated with Enter/Space,
                    and announced with its expanded state. Hover still works for the
                    mouse — it is simply no longer the ONLY way in.
                  */}
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-haspopup="true"
                    aria-controls={panelId}
                    onClick={() => setActiveMenu(open ? null : item.title)}
                    onFocus={() => setActiveMenu(item.title)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-sm transition-colors rounded-lg hover:bg-secondary/40 ${
                      open ? 'text-t1 bg-secondary/40' : 'text-t3 hover:text-t1'
                    }`}
                  >
                    {item.title}
                    {item.pulse && <GoldPulse />}
                    <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>

                  <AnimatePresence>
                    {open && <MegaMenu item={item} id={panelId} onNavigate={() => setActiveMenu(null)} />}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Right — auth */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                  aria-controls="menu-profil"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-secondary transition-colors border border-line"
                >
                  {user?.picture ? (
                    <img src={user.picture} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-gold/15 flex items-center justify-center" aria-hidden="true">
                      <span className="text-gold text-xs font-semibold">{getUserInitials()}</span>
                    </span>
                  )}
                  <span className="text-sm text-t1 hidden md:block">{getDisplayName()}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-t4 transition-transform ${profileOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      id="menu-profil"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-background/95 backdrop-blur-xl border border-line rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
                    >
                      <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                      <div className="p-3 border-b border-line-soft">
                        <p className="text-sm font-medium text-t1 truncate">{user?.email}</p>
                        <p className="text-xs text-t4 mt-0.5">
                          via {user?.provider === 'local' ? 'email' : user?.provider}
                        </p>
                      </div>
                      <div className="p-1.5">
                        <Link to="/profil" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-t3 hover:bg-secondary hover:text-t1 transition-colors text-sm">
                          <User className="w-4 h-4" aria-hidden="true" />Mon compte
                        </Link>
                        {isLearner && (
                          <Link to="/mon-profil-apprenant" onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gold/80 hover:bg-gold/8 hover:text-gold transition-colors text-sm font-medium">
                            <Award className="w-4 h-4" aria-hidden="true" />Mon profil apprenant
                          </Link>
                        )}
                        {!isPremium && (
                          <Link to="/premium" onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gold hover:bg-gold/8 transition-colors text-sm font-medium">
                            <Crown className="w-4 h-4" aria-hidden="true" />Passer Premium
                          </Link>
                        )}
                        {isAdmin && (
                          <Link to="/admin" onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gold hover:bg-gold/8 transition-colors text-sm">
                            <Shield className="w-4 h-4" aria-hidden="true" />Panneau Admin
                          </Link>
                        )}
                      </div>
                      <div className="p-1.5 border-t border-line-soft">
                        <button type="button" onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-400/80 hover:bg-red-500/8 hover:text-red-400 transition-colors text-sm">
                          <LogOut className="w-4 h-4" aria-hidden="true" />Déconnexion
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link to="/inscription" className="text-t3 hover:text-t1 text-sm transition-colors">
                  S'inscrire
                </Link>
                <Link
                  to="/postuler"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gold text-black text-sm font-semibold hover:bg-gold-light transition-colors rounded-sm"
                >
                  Postuler
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            )}

            <button
              type="button"
              className="p-2 lg:hidden text-t1"
              aria-expanded={mobileMenuOpen}
              aria-controls="menu-mobile"
              aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile menu — generated from the SAME config as the desktop nav.
           It used to be a hand-written duplicate, which had already drifted
           out of sync (the descriptions were missing).                        */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="menu-mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-[72px] left-0 right-0 z-40 bg-background/97 backdrop-blur-xl lg:hidden border-b border-line overflow-hidden"
          >
            <nav aria-label="Navigation mobile" className="p-5 space-y-1">
              {!isAuthenticated && (
                <Link to="/" onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 px-4 text-t3 hover:text-t1 hover:bg-secondary rounded-xl text-sm">
                  Accueil
                </Link>
              )}

              {menuItems.map((item) => (
                <div key={item.title} className="pt-2 pb-1 border-t border-line-soft">
                  {item.columns ? (
                    <>
                      <p className="text-[11px] text-t4 uppercase tracking-widest px-4 mb-1">{item.title}</p>
                      {item.columns.map((col) => (
                        <Link
                          key={col.href}
                          to={col.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 py-2.5 px-4 pl-7 text-t3 hover:text-t1 hover:bg-secondary rounded-xl text-sm"
                        >
                          {item.pulse && col.href === item.href && <GoldPulse />}
                          {col.title}
                        </Link>
                      ))}
                    </>
                  ) : (
                    <Link to={item.href} onClick={() => setMobileMenuOpen(false)}
                      className="block py-2.5 px-4 text-t3 hover:text-t1 hover:bg-secondary rounded-xl text-sm">
                      {item.title}
                    </Link>
                  )}
                </div>
              ))}

              {isAuthenticated ? (
                <div className="border-t border-line-soft mt-2 pt-3">
                  <Link to="/profil" onClick={() => setMobileMenuOpen(false)}
                    className="block py-2.5 px-4 text-gold hover:bg-gold/8 rounded-xl text-sm font-medium">
                    Mon Profil
                  </Link>
                </div>
              ) : (
                <div className="border-t border-line-soft mt-2 pt-3 space-y-2">
                  <Link to="/inscription" onClick={() => setMobileMenuOpen(false)}
                    className="block py-2.5 px-4 text-t3 hover:text-t1 hover:bg-secondary rounded-xl text-sm">
                    S'inscrire
                  </Link>
                  <Link to="/postuler" onClick={() => setMobileMenuOpen(false)}
                    className="block py-3 px-4 bg-gold text-black font-semibold rounded-xl text-sm text-center">
                    Postuler
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
