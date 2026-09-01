import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { PageHeader } from '@/components/admin/viz';
import adminApi, { AdminTag, AdminCategory } from '@/services/adminApi';
import { errorMessage } from '@/lib/utils';
import AsyncState from '@/components/ui/AsyncState';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Field, { controlClass } from '@/components/ui/Field';
import Pagination from '@/components/ui/Pagination';

const PAGE_SIZE = 20;

/**
 * A tag's tone tells the reader which family it belongs to at a glance. Unknown categories
 * fall back to neutral rather than inventing a colour nobody can decode.
 */
const CATEGORY_TONE: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
  data_science: 'info',
  dev_web: 'success',
  devops: 'warning',
  security: 'error',
};

const AdminTags = () => {
  const [tags, setTags] = useState<AdminTag[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [newTag, setNewTag] = useState({ name: '', categoryId: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTag, setEditingTag] = useState({ name: '', categoryId: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [tagsData, catsData] = await Promise.all([
        adminApi.getTags(page, PAGE_SIZE),
        adminApi.getCategories(),
      ]);
      setTags(tagsData.content);
      setTotalPages(tagsData.totalPages);
      setTotalElements(tagsData.totalElements);
      setCategories(catsData);
    } catch (err) {
      setLoadError(errorMessage(err, 'Les tags n\'ont pas pu être chargés.'));
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    if (!newTag.name.trim() || !newTag.categoryId) return;
    setSaving(true);
    setFormError(null);
    try {
      const created = await adminApi.createTag(newTag.name.trim(), parseInt(newTag.categoryId));
      setTags([created, ...tags]);
      setTotalElements(n => n + 1);
      setNewTag({ name: '', categoryId: '' });
      setShowForm(false);
    } catch (err) {
      setFormError(errorMessage(err, 'Le tag n\'a pas pu être créé.'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editingTag.name.trim() || !editingTag.categoryId) return;
    setSaving(true);
    try {
      const updated = await adminApi.updateTag(id, editingTag.name.trim(), parseInt(editingTag.categoryId));
      setTags(tags.map(t => (t.id === id ? updated : t)));
      setEditingId(null);
    } catch (err) {
      alert(errorMessage(err, 'Le tag n\'a pas pu être modifié.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tag: AdminTag) => {
    if (!confirm(`Supprimer le tag « ${tag.name} » ?`)) return;
    try {
      await adminApi.deleteTag(tag.id);
      setTags(tags.filter(t => t.id !== tag.id));
      setTotalElements(n => Math.max(0, n - 1));
    } catch (err) {
      alert(errorMessage(err, 'La suppression a échoué.'));
    }
  };

  const categorySelect = (value: string, onChange: (v: string) => void, id?: string) => (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={controlClass}>
      <option value="">Choisir une catégorie</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  );

  const columns: Column<AdminTag>[] = [
    {
      header: 'Nom',
      cell: (tag) =>
        editingId === tag.id ? (
          <input
            type="text"
            value={editingTag.name}
            onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUpdate(tag.id);
              if (e.key === 'Escape') setEditingId(null);
            }}
            aria-label={`Renommer ${tag.name}`}
            className={controlClass}
            autoFocus
          />
        ) : (
          <span className="text-t1">{tag.name}</span>
        ),
    },
    {
      header: 'Catégorie',
      cell: (tag) =>
        editingId === tag.id ? (
          categorySelect(editingTag.categoryId, (v) => setEditingTag({ ...editingTag, categoryId: v }))
        ) : (
          <Badge tone={CATEGORY_TONE[tag.categoryName ?? ''] ?? 'neutral'}>{tag.categoryName ?? '—'}</Badge>
        ),
    },
    {
      header: 'Actions',
      cell: (tag) => (
        <div className="flex items-center gap-1">
          {editingId === tag.id ? (
            <>
              <Button onClick={() => handleUpdate(tag.id)} loading={saving} className="px-2" aria-label="Enregistrer">
                <Check className="w-4 h-4" />
              </Button>
              <Button variant="ghost" onClick={() => setEditingId(null)} className="px-2" aria-label="Annuler">
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => { setEditingId(tag.id); setEditingTag({ name: tag.name, categoryId: String(tag.categoryId) }); }}
                className="px-2"
                aria-label={`Modifier ${tag.name}`}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleDelete(tag)}
                className="px-2 hover:text-error"
                aria-label={`Supprimer ${tag.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Tags"
        subtitle={`${totalElements} tag${totalElements !== 1 ? 's' : ''}`}
        actions={
          <Button onClick={() => { setShowForm(true); setFormError(null); }}>
            <Plus className="w-4 h-4" />
            Nouveau tag
          </Button>
        }
      />

      {showForm && (
        <div className="mb-gutter p-gutter bg-surface-1 border border-line rounded-xl">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <Field label="Nom" required error={formError ?? undefined} className="flex-1">
              {(field) => (
                <input
                  {...field}
                  type="text"
                  value={newTag.name}
                  onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="spring-boot"
                  className={controlClass}
                  autoFocus
                />
              )}
            </Field>
            <Field label="Catégorie" required className="flex-1">
              {(field) => categorySelect(newTag.categoryId, (v) => setNewTag({ ...newTag, categoryId: v }), field.id)}
            </Field>
            <div className="flex gap-2">
              <Button onClick={handleCreate} loading={saving} disabled={!newTag.name.trim() || !newTag.categoryId}>
                <Check className="w-4 h-4" />
                Créer
              </Button>
              <Button variant="secondary" onClick={() => { setShowForm(false); setNewTag({ name: '', categoryId: '' }); }}>
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-surface-1 border border-line rounded-xl overflow-hidden">
        <AsyncState
          loading={loading}
          error={loadError}
          onRetry={fetchData}
          empty={tags.length === 0}
          emptyLabel="Aucun tag pour le moment."
        >
          <DataTable rows={tags} columns={columns} rowKey={(t) => t.id} offset={page * PAGE_SIZE} />
        </AsyncState>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
};

export default AdminTags;
