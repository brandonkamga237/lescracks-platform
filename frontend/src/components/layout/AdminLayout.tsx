// src/components/layout/AdminLayout.tsx
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Tags,
  FileText,
  Calendar,
  Crown,
  ClipboardList,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  Code2,
  UserCheck,
  GraduationCap,
  Menu,
  X,
} from 'lucide-react';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const menuItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
  { path: '/admin/users', label: 'Utilisateurs', icon: Users, group: 'main' },
  { path: '/admin/applications', label: 'Candidatures', icon: ClipboardList, group: 'main' },
  { path: '/admin/premium-requests', label: 'Demandes Premium', icon: Crown, group: 'main' },
  { path: '/admin/categories', label: 'Catégories', icon: FolderOpen, group: 'content' },
  { path: '/admin/tags', label: 'Tags', icon: Tags, group: 'content' },
  { path: '/admin/resources', label: 'Ressources', icon: FileText, group: 'content' },
  { path: '/admin/events', label: 'Événements', icon: Calendar, group: 'content' },
  { path: '/admin/open-source', label: 'Projets OS', icon: Code2, group: 'opensource' },
  { path: '/admin/contributors', label: 'Contributeurs', icon: UserCheck, group: 'opensource' },
  { path: '/admin/apprenants', label: 'Apprenants', icon: GraduationCap, group: 'apprenants' },
];

const groupLabel = (g: string) =>
  g === 'content' ? 'Contenu' : g === 'opensource' ? 'Open Source' : g === 'apprenants' ? 'Communauté' : '';

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // Desktop-only visual collapse (w-64 ↔ w-16). Persisted so it survives reloads.
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('admin.sidebar.collapsed') === '1');
  // Mobile off-canvas drawer.
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('admin.sidebar.collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed left-0 top-0 h-full bg-gray-900 text-white flex flex-col z-50
          transform transition-transform duration-300 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          w-64 ${collapsed ? 'lg:w-16' : 'lg:w-64'}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800 flex-shrink-0">
          <Link to="/admin" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-gold flex items-center justify-center flex-shrink-0 rounded-md">
              <span className="text-black font-bold text-lg">L</span>
            </div>
            <span className={`font-display font-bold truncate ${collapsed ? 'lg:hidden' : ''}`}>LesCracks</span>
          </Link>
          {/* Close button (mobile only) */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 -mr-1.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-gold text-black rounded-full items-center justify-center shadow-lg hover:bg-gold/80 transition-colors z-10"
          aria-label={collapsed ? 'Déplier le menu' : 'Replier le menu'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Menu */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const prevGroup = idx > 0 ? menuItems[idx - 1].group : item.group;
            const showSeparator = idx > 0 && item.group !== prevGroup;

            return (
              <div key={item.path}>
                {showSeparator && (
                  <>
                    <div className={`px-3 pt-3 pb-1 ${collapsed ? 'lg:hidden' : ''}`}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                        {groupLabel(item.group)}
                      </p>
                    </div>
                    {collapsed && <div className="hidden lg:block mx-3 my-2 border-t border-gray-800" />}
                  </>
                )}
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    active ? 'bg-gold text-black font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className={`text-sm ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-2 border-t border-gray-800 flex-shrink-0">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            title={collapsed ? 'Retour au site' : undefined}
          >
            <ArrowLeft className="w-5 h-5 flex-shrink-0" />
            <span className={`text-sm font-medium ${collapsed ? 'lg:hidden' : ''}`}>Retour au site</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors w-full"
            title={collapsed ? 'Déconnexion' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={`text-sm font-medium ${collapsed ? 'lg:hidden' : ''}`}>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className={`transition-all duration-300 text-gray-900 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur border-b border-gray-200 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger (mobile only) */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Shield className="w-5 h-5 text-gold flex-shrink-0 hidden sm:block" />
            <h1 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
              <span className="hidden sm:inline">Panneau d'Administration</span>
              <span className="sm:hidden">Admin</span>
            </h1>
          </div>

          <Link
            to="/profil"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 min-w-0"
          >
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
              <span className="text-gold text-sm font-semibold">
                {user?.firstName?.[0] || user?.email?.[0] || 'U'}
              </span>
            </div>
            <span className="hidden sm:inline truncate max-w-[10rem]">{user?.firstName || user?.email}</span>
          </Link>
        </header>

        {/* Page content */}
        <div className="p-4 sm:p-6">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
