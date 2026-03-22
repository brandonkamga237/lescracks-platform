// src/pages/admin/AdminTags.tsx
import { useState, useEffect } from 'react';
import { Tags, Plus, Loader2, Trash2, Edit, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import adminApi, { AdminTag, AdminCategory, PaginatedResponse } from '@/services/adminApi';

const AdminTags = () => {
  const [tags, setTags] = useState<AdminTag[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [newTag, setNewTag] = useState({ name: '', categoryId: '' });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTag, setEditingTag] = useState({ name: '', categoryId: '' });

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tagsData, catsData] = await Promise.all([
        adminApi.getTags(page, 20),
        adminApi.getCategories(),
      ]);
      setTags(tagsData.content);
      setTotalPages(tagsData.totalPages);
      setTotalElements(tagsData.totalElements);
      setCategories(catsData);
    } catch (err) {
      console.error('Error loading tags:', err);
      setTags([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTag.name.trim() || !newTag.categoryId) return;
    setSaving(true);
    try {
      const created = await adminApi.createTag(newTag.name.trim(), parseInt(newTag.categoryId));
      setTags([created, ...tags]);
      setTotalElements(t => t + 1);
      setNewTag({ name: '', categoryId: '' });
      setShowForm(false);
    } catch (err) {
      console.error('Error creating tag:', err);
      alert('Erreur lors de la création du tag');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (tag: AdminTag) => {
    setEditingId(tag.id);
    setEditingTag({ name: tag.name, categoryId: String(tag.categoryId) });
  };

  const handleUpdate = async (id: number) => {
    if (!editingTag.name.trim() || !editingTag.categoryId) return;
    setSaving(true);
    try {
      const updated = await adminApi.updateTag(id, editingTag.name.trim(), parseInt(editingTag.categoryId));
      setTags(tags.map(t => t.id === id ? updated : t));
      setEditingId(null);
    } catch (err) {
      console.error('Error updating tag:', err);
      alert('Erreur lors de la modification du tag');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer ce tag ?')) return;
    try {
      await adminApi.deleteTag(id);
      setTags(tags.filter(t => t.id !== id));
      setTotalElements(n => n - 1);
    } catch (err) {
      console.error('Error deleting tag:', err);
      alert('Erreur lors de la suppression du tag');
    }
  };

  const getCategoryBadgeColor = (catName: string) => {
    const colors: Record<string, string> = {
      data_science: 'bg-blue-100 text-blue-700',
      dev_web: 'bg-green-100 text-green-700',
      devops: 'bg-orange-100 text-orange-700',
      security: 'bg-red-100 text-red-700',
    };
    return colors[catName] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tags</h2>
          <p className="text-gray-500 text-sm">{totalElements} tag{totalElements !== 1 ? 's' : ''} au total</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold/90 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouveau Tag
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Nouveau Tag</h3>
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={newTag.name}
              onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Nom du tag"
              className="flex-1 min-w-[160px] px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gold/50 placeholder-gray-400"
              autoFocus
            />
            <select
              value={newTag.categoryId}
              onChange={(e) => setNewTag({ ...newTag, categoryId: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gold/50"
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <button
              onClick={handleCreate}
              disabled={saving || !newTag.name.trim() || !newTag.categoryId}
              className="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold/90 font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Créer
            </button>
            <button
              onClick={() => { setShowForm(false); setNewTag({ name: '', categoryId: '' }); }}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow"
            >
              {editingId === tag.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editingTag.name}
                    onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdate(tag.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="w-full px-3 py-1.5 border border-gold rounded-lg text-gray-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                    autoFocus
                  />
                  <select
                    value={editingTag.categoryId}
                    onChange={(e) => setEditingTag({ ...editingTag, categoryId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-gray-900 bg-white text-sm focus:outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(tag.id)}
                      disabled={saving}
                      className="flex-1 py-1.5 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-1"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      OK
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{tag.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${getCategoryBadgeColor(tag.categoryName || '')}`}>
                        {tag.categoryName || 'Sans catégorie'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100 mt-2">
                    <button
                      onClick={() => startEdit(tag)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-3 h-3" />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Supprimer
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm text-gray-600">Page {page + 1} sur {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      )}

      {!loading && tags.length === 0 && (
        <div className="text-center py-16">
          <Tags className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">Aucun tag pour le moment</p>
        </div>
      )}
    </div>
  );
};

export default AdminTags;
