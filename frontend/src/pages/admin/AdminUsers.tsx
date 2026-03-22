// src/pages/admin/AdminUsers.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ChevronLeft, ChevronRight, Loader2, Trash2, Edit, Crown, Shield, X, Save } from 'lucide-react';
import adminApi, { AdminUser, PaginatedResponse } from '@/services/adminApi';

const AdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Edit modal state
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data: PaginatedResponse<AdminUser> = await adminApi.getUsers(page, 20);
        setUsers(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      } catch (err) {
        console.error('Error loading users:', err);
        setUsers([]);
        setTotalPages(0);
        setTotalElements(0);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [page]);

  const getRoleBadge = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full flex items-center gap-1"><Shield className="w-3 h-3" /> Admin</span>;
      case 'PREMIUM_USER':
      case 'PREMIUM':
        return <span className="px-2 py-1 text-xs bg-gold/20 text-gold rounded-full flex items-center gap-1"><Crown className="w-3 h-3" /> Premium</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">Free</span>;
    }
  };

  const getProviderBadge = (provider: string) => {
    return <span className="text-xs text-gray-500">{provider}</span>;
  };

  const handleEditClick = (user: AdminUser) => {
    setEditingUser(user);
    setNewRole(user.roleName);
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      await adminApi.updateUserRole(editingUser.id, newRole);
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, roleName: newRole as 'ADMIN' | 'PREMIUM' | 'FREE' } : u));
      setEditingUser(null);
    } catch (err) {
      console.error('Error updating user role:', err);
      alert('Erreur lors de la mise à jour du rôle');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cet utilisateur?')) return;
    try {
      await adminApi.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Utilisateurs</h2>
          <p className="text-gray-500 text-sm">{totalElements} utilisateur{totalElements !== 1 ? 's' : ''} au total</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{user.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.username || '-'}</td>
                    <td className="px-6 py-4">{getRoleBadge(user.roleName)}</td>
                    <td className="px-6 py-4">{getProviderBadge(user.providerName)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.createdAt}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditClick(user)} 
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" 
                          title="Modifier le role"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {user.roleName !== 'ADMIN' && (
                          <button 
                            onClick={() => handleDelete(user.id)} 
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" 
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600">
            Page {page + 1} sur {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Modifier le role</h3>
              <button 
                onClick={() => setEditingUser(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Utilisateur: <strong>{editingUser.email}</strong></p>
              <label className="block text-sm font-medium mb-2">Nouveau role:</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
              >
                <option value="USER">Free</option>
                <option value="PREMIUM_USER">Premium</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveRole}
                disabled={saving}
                className="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold/90 flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
