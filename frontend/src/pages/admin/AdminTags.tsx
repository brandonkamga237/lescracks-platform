import { useState } from 'react';

import { AdminRow, AdminSection, AdminState } from '@/components/admin/AdminTable';
import { useApi } from '@/hooks/useApi';
import { adminApi } from '@/services/adminApi';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';

export default function AdminTags() {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const categories = useApi((signal) => api.categories(signal), []);
  const tags = useApi((signal) => api.tags(undefined, signal), []);
  const list = tags.data ?? [];

  async function act(work: () => Promise<unknown>) {
    setBusy(true);
    setFailure(null);
    try {
      await work();
      tags.reload();
    } catch (error) {
      setFailure(error instanceof ApiError ? error.message : 'L’action a échoué.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminSection
      title="Tags"
      description="Un tag appartient à une catégorie. Le même nom peut exister dans deux catégories différentes."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim() || categoryId === '') return;
          void act(() => adminApi.createTag(name.trim(), Number(categoryId))).then(() => setName(''));
        }}
        className="mb-8 flex flex-wrap gap-3"
      >
        <label className="min-w-40 flex-1">
          <span className="sr-only">Nom du tag</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nouveau tag"
            className="w-full border-b border-line bg-transparent py-2 text-t1 placeholder:text-t4 focus:border-gold-400 focus:outline-none"
          />
        </label>
        <label>
          <span className="sr-only">Catégorie</span>
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value ? Number(event.target.value) : '')}
            className="border-b border-line bg-transparent py-2 text-t1 focus:border-gold-400 focus:outline-none"
          >
            <option value="">Catégorie…</option>
            {(categories.data ?? []).map((category) => (
              <option key={category.id} value={category.id} className="bg-card">
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={busy || !name.trim() || categoryId === ''}
          className="rounded-full bg-gold-400 px-5 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          Ajouter
        </button>
      </form>

      {failure && (
        <p role="alert" className="mb-6 rounded border border-line px-4 py-3 text-t2">
          {failure}
        </p>
      )}

      <AdminState
        loading={tags.loading}
        error={tags.error}
        empty={list.length === 0}
        emptyMessage="Aucun tag."
        onRetry={tags.reload}
      >
        {list.map((tag) => (
          <AdminRow key={tag.id}>
            <span className="flex-1 text-t1">{tag.name}</span>
            <span className="text-sm text-t4">{tag.categoryName}</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const next = window.prompt('Nouveau nom', tag.name);
                if (next && next !== tag.name) {
                  void act(() => adminApi.updateTag(tag.id, next, tag.categoryId));
                }
              }}
              className="text-sm text-t4 hover:text-t2"
            >
              Renommer
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void act(() => adminApi.deleteTag(tag.id))}
              className="text-sm text-t4 hover:text-error"
            >
              Supprimer
            </button>
          </AdminRow>
        ))}
      </AdminState>
    </AdminSection>
  );
}
