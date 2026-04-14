import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  Menu, X, ArrowRight, BookOpen, Video, Code2, ChevronRight,
  User, LogOut, Shield, Crown, Award,
  Users,
} from 'lucide-react';
import LesCracksLogo from '@/components/common/LesCracksLogo';

// ─── menu config ─────────────────────────────────────────────────────────────

const menuItems = [
  {
    title: 'Accompagnement',
    href: '/postuler',
    pulse: true,
    alignRight: false,
    hasMegaMenu: false,
  },
  {
    title: 'Ressources',
    href: '/ressources',
    pulse: false,
    alignRight: false,
    hasMegaMenu: true,
    columns: [
      {
        title: 'Bibliothèque',
        description: 'Livres, articles et guides techniques',
        href: '/ressources?type=DOCUMENT',
        icon: BookOpen,
      },
      {
        title: 'Vidéothèque',
        description: 'Tutoriels vidéo et formations exclusives',
        href: '/ressources?type=VIDEO',
        icon: Video,
      },
    ],
  },
  {
    title: 'Événements',
    href: '/evenements',
    pulse: false,
    alignRight: false,
    hasMegaMenu: false,
  },
  {
    title: 'Open Source',
    href: '/open-source',
    pulse: false,
    alignRight: true,     // dropdown aligned to right edge
    hasMegaMenu: true,
    columns: [
      {
        title: 'Nos Solutions',
        description: 'Projets open source développés par LesCracks',
        href: '/open-source#solutions',
        icon: Code2,
      },
      {
        title: 'Contributeurs',
        description: 'La communauté qui construit avec nous',
        href: '/open-source#contributors',
        icon: Users,
      },
    ],
  },
  {
    title: 'À propos',
    href: '/about',
    pulse: false,
    alignRight: false,
    hasMegaMenu: false,
  },
];

// ─── mega menu dropdown ───────────────────────────────────────────────────────

const MegaMenu = ({
  item,
}: {
  item: (typeof menuItems)[number];
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 8 }}
    transition={{ duration: 0.18, ease: 'easeOut' }}
    className={`absolute top-full pt-3 z-50 ${item.alignRight ? 'right-0' : 'left-0'}`}
  >
    <div className="w-72 bg-background/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
      {/* top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

      <div className="py-2">
        {item.columns?.map((col, i) => {
          const Icon = col.icon;
          return (
            <div key={col.title}>
              {i > 0 && <div className="mx-4 my-1 border-t border-border/30" />}
              <Link
                to={col.href}
                className="group flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors"
              >
                <div className="w-8 h-8 mt-0.5 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/10 group-hover:border-gold/20 transition-colors">
                  <Icon className="w-4 h-4 text-foreground/40 group-hover:text-gold transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground/75 group-hover:text-foreground transition-colors leading-snug">
                    {col.title}
                  </p>
                  <p className="text-xs text-foreground/35 mt-0.5 leading-relaxed">
                    {col.description}
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-foreground/15 group-hover:text-gold group-hover:translate-x-0.5 transition-all mt-1 flex-shrink-0" />
              </Link>
            </div>
          );
        })}
      </div>

      {/* bottom accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold/15 to-transparent" />
    </div>
  </motion.div>
);

// ─── header ───────────────────────────────────────────────────────────────────

const Header = () => {
  const { isAuthenticated, isAdmin, isPremium, isLearner, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setProfileDropdownOpen(false);
  };

  const getDisplayName = () => {
    if (user?.firstName) return user.firstName;
    if (user?.username) return user.username;
    if (user?.email) return user.email.split('@')[0];
    return 'Mon compte';
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    if (user?.username) return user.username.substring(0, 2).toUpperCase();
    if (user?.email) return user.email.substring(0, 2).toUpperCase();
    return 'U';
  };

  return (
    <>
      {/* ── Desktop Header ─────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* Logo — redirects to /ressources when logged in */}
          <Link to={isAuthenticated ? '/ressources' : '/'} className="flex items-center gap-1 flex-shrink-0">
            <LesCracksLogo height={40} lesColor="#000000" className="w-auto" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {!isAuthenticated && (
              <Link
                to="/"
                className="px-3.5 py-2 text-sm text-foreground/50 hover:text-foreground transition-colors rounded-lg hover:bg-secondary/40"
              >
                Accueil
              </Link>
            )}

            {menuItems.map((item) => (
              <div
                key={item.title}
                className="relative"
                onMouseEnter={() => item.hasMegaMenu && setActiveMenu(item.title)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <Link
                  to={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-sm transition-colors rounded-lg hover:bg-secondary/40 ${
                    activeMenu === item.title
                      ? 'text-foreground bg-secondary/40'
                      : 'text-foreground/50 hover:text-foreground'
                  }`}
                >
                  {item.title}
                  {/* golden blinking dot */}
                  {item.pulse && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold" />
                    </span>
                  )}
                  {item.hasMegaMenu && (
                    <ChevronRight className={`w-3 h-3 rotate-90 transition-transform ${activeMenu === item.title ? 'rotate-[270deg]' : 'rotate-90'}`} />
                  )}
                </Link>

                <AnimatePresence>
                  {item.hasMegaMenu && activeMenu === item.title && (
                    <MegaMenu item={item} />
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* Right side — auth */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-secondary transition-colors border border-border"
                >
                  {user?.picture ? (
                    <img src={user.picture} alt={getDisplayName()} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gold/15 flex items-center justify-center">
                      <span className="text-gold text-xs font-semibold">{getUserInitials()}</span>
                    </div>
                  )}
                  <span className="text-sm text-foreground hidden md:block">{getDisplayName()}</span>
                  <ChevronRight className={`w-3.5 h-3.5 text-foreground/40 transition-transform ${profileDropdownOpen ? 'rotate-90' : ''}`} />
                </button>

                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-background/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
                    >
                      <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                      <div className="p-3 border-b border-border/40">
                        <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                        <p className="text-xs text-foreground/40 mt-0.5">
                          via {user?.provider === 'local' ? 'email' : user?.provider}
                        </p>
                      </div>
                      <div className="p-1.5">
                        <Link to="/profil" onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-foreground/60 hover:bg-secondary hover:text-foreground transition-colors text-sm">
                          <User className="w-4 h-4" />Mon compte
                        </Link>
                        {isLearner && (
                          <Link to="/mon-profil-apprenant" onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gold/80 hover:bg-gold/8 hover:text-gold transition-colors text-sm font-medium">
                            <Award className="w-4 h-4" />Mon profil apprenant
                          </Link>
                        )}
                        {!isPremium && (
                          <Link to="/premium" onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gold hover:bg-gold/8 transition-colors text-sm font-medium">
                            <Crown className="w-4 h-4" />Passer Premium
                          </Link>
                        )}
                        {isAdmin && (
                          <Link to="/admin" onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gold hover:bg-gold/8 transition-colors text-sm">
                            <Shield className="w-4 h-4" />Panneau Admin
                          </Link>
                        )}
                      </div>
                      <div className="p-1.5 border-t border-border/40">
                        <button onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-400/80 hover:bg-red-500/8 hover:text-red-400 transition-colors text-sm">
                          <LogOut className="w-4 h-4" />Déconnexion
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link to="/inscription" className="text-foreground/50 hover:text-foreground text-sm transition-colors">
                  S'inscrire
                </Link>
                <Link
                  to="/postuler"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gold text-black text-sm font-semibold hover:bg-gold-light transition-colors rounded-sm"
                >
                  Postuler
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Hamburger */}
            <button className="p-2 lg:hidden text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Menu ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-[72px] left-0 right-0 z-40 bg-background/97 backdrop-blur-xl lg:hidden border-b border-border overflow-hidden"
          >
            <div className="p-5 space-y-1">
              {!isAuthenticated && (
                <Link to="/" onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 px-4 text-foreground/60 hover:text-foreground hover:bg-secondary rounded-xl text-sm">
                  Accueil
                </Link>
              )}

              {/* Accompagnement */}
              <div className="pt-2 pb-1 border-t border-border/50">
                <Link to="/postuler" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-2.5 px-4 text-gold hover:bg-gold/8 rounded-xl text-sm font-medium">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold" />
                  </span>
                  Accompagnement 360
                </Link>
              </div>

              {/* Ressources */}
              <div className="pt-2 pb-1 border-t border-border/50">
                <p className="text-[10px] text-foreground/35 uppercase tracking-widest px-4 mb-1">Ressources</p>
                <Link to="/ressources?type=DOCUMENT" onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 px-4 pl-7 text-foreground/60 hover:text-foreground hover:bg-secondary rounded-xl text-sm">
                  Bibliothèque
                </Link>
                <Link to="/ressources?type=VIDEO" onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 px-4 pl-7 text-foreground/60 hover:text-foreground hover:bg-secondary rounded-xl text-sm">
                  Vidéothèque
                </Link>
              </div>

              <Link to="/evenements" onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 px-4 text-foreground/60 hover:text-foreground hover:bg-secondary rounded-xl text-sm border-t border-border/50 mt-1">
                Événements
              </Link>
              <Link to="/open-source" onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 px-4 text-foreground/60 hover:text-foreground hover:bg-secondary rounded-xl text-sm">
                Open Source
              </Link>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 px-4 text-foreground/60 hover:text-foreground hover:bg-secondary rounded-xl text-sm">
                À propos
              </Link>

              {/* Auth */}
              {isAuthenticated ? (
                <div className="border-t border-border/50 mt-2 pt-3">
                  <Link to="/profil" onClick={() => setMobileMenuOpen(false)}
                    className="block py-2.5 px-4 text-gold hover:bg-gold/8 rounded-xl text-sm font-medium">
                    Mon Profil
                  </Link>
                </div>
              ) : (
                <div className="border-t border-border/50 mt-2 pt-3 space-y-2">
                  <Link to="/inscription" onClick={() => setMobileMenuOpen(false)}
                    className="block py-2.5 px-4 text-foreground/60 hover:text-foreground hover:bg-secondary rounded-xl text-sm">
                    S'inscrire
                  </Link>
                  <Link to="/postuler" onClick={() => setMobileMenuOpen(false)}
                    className="block py-3 px-4 bg-gold text-black font-semibold rounded-xl text-sm text-center">
                    Postuler
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
