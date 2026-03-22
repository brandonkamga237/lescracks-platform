// src/pages/admin/AdminDashboard.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, Calendar, FolderOpen, Tags, TrendingUp, Loader2, Activity, BarChart3, PieChart, UserPlus, FilePlus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend } from 'recharts';
import adminApi, { DashboardStats } from '@/services/adminApi';

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4'];

const StatCard = ({ title, value, icon: Icon, color, link, trend }: { title: string; value: number; icon: any; color: string; link?: string; trend?: number }) => (
  <Link
    to={link || '#'}
    className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all hover:border-gold/50 group"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value?.toLocaleString() || 0}</p>
        {trend !== undefined && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}% ce mois
          </p>
        )}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </Link>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminApi.getDashboardStats();
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-gold mx-auto mb-4" />
          <p className="text-gray-500">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const usersByRole = stats?.usersByRole ? Object.entries(stats.usersByRole).map(([name, value]) => ({ name, value })) : [];
  const usersByProvider = stats?.usersByProvider ? Object.entries(stats.usersByProvider).map(([name, value]) => ({ name, value })) : [];
  const resourcesByType = stats?.resourcesByType ? Object.entries(stats.resourcesByType).map(([name, value]) => ({ name, value })) : [];
  const resourcesByCategory = stats?.resourcesByCategory || [];
  const eventsByStatus = stats?.eventsByStatus ? Object.entries(stats.eventsByStatus).map(([name, value]) => ({ name, value })) : [];

  // Calculate growth metrics
  const userGrowth = stats?.totalUsers ? Math.round((stats.newUsersLast30Days / stats.totalUsers) * 100) : 0;
  const resourceGrowth = stats?.totalResources ? Math.round((stats.newResourcesLast30Days / stats.totalResources) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Analytics</h2>
          <p className="text-gray-500 text-sm">Vue d'ensemble de votre plateforme</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Dernière mise à jour</p>
          <p className="text-sm font-medium text-gray-900">{new Date().toLocaleDateString('fr-FR', { 
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
          })}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Utilisateurs"
          value={stats?.totalUsers || 0}
          icon={Users}
          color="bg-blue-100 text-blue-600"
          link="/admin/users"
          trend={userGrowth}
        />
        <StatCard
          title="Total Ressources"
          value={stats?.totalResources || 0}
          icon={FileText}
          color="bg-amber-100 text-amber-600"
          link="/admin/resources"
          trend={resourceGrowth}
        />
        <StatCard
          title="Total Événements"
          value={stats?.totalEvents || 0}
          icon={Calendar}
          color="bg-green-100 text-green-600"
          link="/admin/events"
        />
        <StatCard
          title="Catégories"
          value={stats?.totalCategories || 0}
          icon={FolderOpen}
          color="bg-purple-100 text-purple-600"
          link="/admin/categories"
        />
        <StatCard
          title="Tags"
          value={stats?.totalTags || 0}
          icon={Tags}
          color="bg-pink-100 text-pink-600"
          link="/admin/tags"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Role */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-gold" />
              Utilisateurs par Rôle
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={usersByRole}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {usersByRole.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {usersByRole.map((item, index) => (
              <div key={item.name} className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">{item.name}</p>
                <p className="text-lg font-bold" style={{ color: COLORS[index % COLORS.length] }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Users by Provider */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-500" />
              Connexions par Provider
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usersByProvider}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resources by Type */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FilePlus className="w-5 h-5 text-green-500" />
              Ressources par Type
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={resourcesByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {resourcesByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resources by Category */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              Ressources par Catégorie
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourcesByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="categoryName" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Events Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-500" />
              Événements par Statut
            </h3>
          </div>
          <div className="space-y-3">
            {eventsByStatus.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">{item.name}</span>
                <span className="text-lg font-bold" style={{ color: COLORS[index % COLORS.length] }}>{item.value}</span>
              </div>
            ))}
            {eventsByStatus.length === 0 && (
              <p className="text-gray-500 text-center py-4">Aucun événement</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gold" />
            Actions Rapides
          </h3>
          <div className="space-y-2">
            <Link
              to="/admin/resources?action=new"
              className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <FileText className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-gray-900">Nouvelle Ressource</span>
            </Link>
            <Link
              to="/admin/events?action=new"
              className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Calendar className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-900">Nouvel Événement</span>
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Gérer Utilisateurs</span>
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Croissance (30 jours)</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-amber-100">Nouveaux utilisateurs</span>
              <span className="text-2xl font-bold">{stats?.newUsersLast30Days || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-100">Nouvelles ressources</span>
              <span className="text-2xl font-bold">{stats?.newResourcesLast30Days || 0}</span>
            </div>
            <div className="pt-4 border-t border-amber-400">
              <p className="text-sm text-amber-100">Ratio utilisateurs premium</p>
              <p className="text-xl font-bold">
                {stats?.totalUsers && stats.usersByRole?.PREMIUM 
                  ? Math.round((stats.usersByRole.PREMIUM / stats.totalUsers) * 100) 
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Utilisateurs Récents
          </h3>
          <div className="space-y-3">
            {stats?.recentUsers && stats.recentUsers.length > 0 ? (
              stats.recentUsers.slice(0, 5).map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.email || user.username}</p>
                    <p className="text-xs text-gray-500">{user.roleName}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Aucun utilisateur récent</p>
            )}
          </div>
        </div>

        {/* Recent Resources */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gold" />
            Ressources Récentes
          </h3>
          <div className="space-y-3">
            {stats?.recentResources && stats.recentResources.length > 0 ? (
              stats.recentResources.slice(0, 5).map((resource: any) => (
                <div key={resource.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{resource.title}</p>
                    <p className="text-xs text-gray-500">{resource.resourceTypeName}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(resource.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Aucune ressource récente</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
