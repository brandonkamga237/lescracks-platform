// src/pages/admin/AdminCategories.tsx
import { useState, useEffect } from 'react';
import { FolderOpen, Plus, Loader2, Trash2, Edit, Check, X } from 'lucide-react';
import adminApi, { AdminCategory } from '@/services/adminApi';

const AdminCategories = () => {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newCategory.trim()) return;
    setSaving(true);
    try {
      const created = await adminApi.createCategory(newCategory.trim());
      setCategories([...categories, { ...created, resourceCount: 0 }]);
      setNewCategory('');
      setShowForm(false);
    } catch (err) {
      console.error('Error creating category:', err);
      alert('Erreur lors de la création de la catégorie');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (cat: AdminCategory) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleUpdate = async (id: number) => {
    if (!editingName.trim()) return;
    setSaving(true);
    try {
      const updated = await adminApi.updateCategory(id, editingName.trim());
      setCategories(categories.map(c => c.id === id ? { ...c, name: updated.name } : c));
      setEditingId(null);
    } catch (err) {
      console.error('Error updating category:', err);
      alert('Erreur lors de la modification de la catégorie');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette catégorie ?')) return;
    try {
      await adminApi.deleteCategory(id);
      setCategories(categories.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Erreur lors de la suppression de la catégorie');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Catégories</h2>
          <p className="text-gray-500 text-sm">{categories.length} catégorie{categories.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold/90 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouvelle Catégorie
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Nouvelle Catégorie</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Nom de la catégorie"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gold/50 placeholder-gray-400"
              autoFocus
            />
            <button
              onClick={handleCreate}
              disabled={saving || !newCategory.trim()}
              className="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold/90 font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Créer
            </button>
            <button
              onClick={() => { setShowForm(false); setNewCategory(''); }}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="w-5 h-5 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  {editingId === category.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate(category.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="w-full px-3 py-1.5 border border-gold rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm font-medium"
                      autoFocus
                    />
                  ) : (
                    <>
                      <h3 className="font-semibold text-gray-900 truncate">{category.name}</h3>
                      <p className="text-sm text-gray-500">{category.resourceCount || 0} ressource{category.resourceCount !== 1 ? 's' : ''}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                {editingId === category.id ? (
                  <>
                    <button
                      onClick={() => handleUpdate(category.id)}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-4 h-4" />}
                      Sauvegarder
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                      Annuler
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(category)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && categories.length === 0 && (
        <div className="text-center py-16">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">Aucune catégorie pour le moment</p>
          <p className="text-sm text-gray-400 mt-1">Créez votre première catégorie ci-dessus</p>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
