// src/components/layout/AdminLayout.tsx
import { useState } from 'react';
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

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 z-40 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
          {!sidebarCollapsed && (
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gold flex items-center justify-center">
                <span className="text-black font-bold text-lg">L</span>
              </div>
              <span className="font-display font-bold">LesCracks</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 bg-gold flex items-center justify-center mx-auto">
              <span className="text-black font-bold text-lg">L</span>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-gold text-black rounded-full flex items-center justify-center shadow-lg hover:bg-gold/80 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Menu */}
        <nav className="p-2 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const prevGroup = idx > 0 ? menuItems[idx - 1].group : item.group;
            const showSeparator = idx > 0 && item.group !== prevGroup;

            return (
              <div key={item.path}>
                {showSeparator && !sidebarCollapsed && (
                  <div className="px-3 pt-3 pb-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                      {item.group === 'content' ? 'Contenu' : item.group === 'opensource' ? 'Open Source' : item.group === 'apprenants' ? 'Communauté' : ''}
                    </p>
                  </div>
                )}
                {showSeparator && sidebarCollapsed && (
                  <div className="mx-3 my-2 border-t border-gray-800" />
                )}
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    active
                      ? 'bg-gold text-black'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-gray-800">
          {/* Return to user site */}
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            title={sidebarCollapsed ? 'Retour au site' : undefined}
          >
            <ArrowLeft className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Retour au site</span>}
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors w-full"
            title={sidebarCollapsed ? 'Deconnexion' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Deconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={`transition-all duration-300 text-gray-900 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        {/* Top header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Shield className="w-5 h-5 text-gold" />
            <h1 className="text-lg font-semibold text-gray-800">Panneau d'Administration</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Link
              to="/profil"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                <span className="text-gold text-sm font-semibold">
                  {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                </span>
              </div>
              <span>{user?.firstName || user?.email}</span>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
