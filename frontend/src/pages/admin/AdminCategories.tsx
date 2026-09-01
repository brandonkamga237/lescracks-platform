import { useState, useEffect, useCallback } from 'react';
import { FolderOpen, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { PageHeader } from '@/components/admin/viz';
import adminApi, { AdminCategory } from '@/services/adminApi';
import { errorMessage } from '@/lib/utils';
import AsyncState from '@/components/ui/AsyncState';
import Button from '@/components/ui/Button';
import Field, { controlClass } from '@/components/ui/Field';

const AdminCategories = () => {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setCategories(await adminApi.getCategories());
    } catch (err) {
      setLoadError(errorMessage(err, 'Les catégories n\'ont pas pu être chargées.'));
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = async () => {
    if (!newCategory.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      const created = await adminApi.createCategory(newCategory.trim());
      setCategories([...categories, { ...created, resourceCount: 0 }]);
      setNewCategory('');
      setShowForm(false);
    } catch (err) {
      setFormError(errorMessage(err, 'La catégorie n\'a pas pu être créée.'));
    } finally {
      setSaving(false);
    }
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
      setCategories(categories.map(c => (c.id === id ? { ...c, name: updated.name } : c)));
      cancelEdit();
    } catch (err) {
      alert(errorMessage(err, 'La catégorie n\'a pas pu être modifiée.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: AdminCategory) => {
    if (!confirm(`Supprimer la catégorie « ${category.name} » ?`)) return;
    try {
      await adminApi.deleteCategory(category.id);
      setCategories(categories.filter(c => c.id !== category.id));
    } catch (err) {
      alert(errorMessage(err, 'La suppression a échoué.'));
    }
  };

  return (
    <div>
      <PageHeader title="Catégories"
        subtitle={`${categories.length} catégorie${categories.length !== 1 ? 's' : ''}`}
        actions={
          <Button onClick={() => { setShowForm(true); cancelEdit(); setFormError(null); }}>
            <Plus className="w-4 h-4" />
            Nouvelle catégorie
          </Button>
        }
      />

      {showForm && (
        <div className="mb-gutter p-gutter bg-surface-1 border border-line rounded-xl">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <Field label="Nom de la catégorie" required error={formError ?? undefined} className="flex-1">
              {(field) => (
                <input
                  {...field}
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="Développement web"
                  className={controlClass}
                  autoFocus
                />
              )}
            </Field>
            <div className="flex gap-2">
              <Button onClick={handleCreate} loading={saving} disabled={!newCategory.trim()}>
                <Check className="w-4 h-4" />
                Créer
              </Button>
              <Button variant="secondary" onClick={() => { setShowForm(false); setNewCategory(''); }}>
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      <AsyncState
        loading={loading}
        error={loadError}
        onRetry={fetchCategories}
        empty={categories.length === 0}
        emptyLabel="Aucune catégorie. Créez la première ci-dessus."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-surface-1 border border-line rounded-xl p-gutter hover:border-line-strong transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gold/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="w-5 h-5 text-gold" aria-hidden="true" />
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
                      aria-label={`Renommer ${category.name}`}
                      className={controlClass}
                      autoFocus
                    />
                  ) : (
                    <>
                      <h3 className="font-medium text-t1 truncate">{category.name}</h3>
                      <p className="text-data text-t4 tabular-nums">
                        {category.resourceCount || 0} ressource{(category.resourceCount || 0) !== 1 ? 's' : ''}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-line-soft">
                {editingId === category.id ? (
                  <>
                    <Button onClick={() => handleUpdate(category.id)} loading={saving} className="flex-1">
                      <Check className="w-4 h-4" />
                      Enregistrer
                    </Button>
                    <Button variant="secondary" onClick={cancelEdit} className="flex-1">
                      <X className="w-4 h-4" />
                      Annuler
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => { setEditingId(category.id); setEditingName(category.name); }}
                      className="flex-1"
                    >
                      <Pencil className="w-4 h-4" />
                      Renommer
                    </Button>
                    <Button variant="ghost" onClick={() => handleDelete(category)} className="flex-1 hover:text-error">
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </AsyncState>
    </div>
  );
};

export default AdminCategories;
