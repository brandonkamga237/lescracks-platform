import { useState } from 'react';

import { AdminRow, AdminSection, AdminState } from '@/components/admin/AdminTable';
import { useApi } from '@/hooks/useApi';
import { adminApi } from '@/services/adminApi';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';

export default function AdminCategories() {
  const [name, setName] = useState('');
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const categories = useApi((signal) => api.categories(signal), []);
  const list = categories.data ?? [];

  async function act(work: () => Promise<unknown>) {
    setBusy(true);
    setFailure(null);
    try {
      await work();
      categories.reload();
    } catch (error) {
      setFailure(error instanceof ApiError ? error.message : 'L’action a échoué.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminSection
      title="Catégories"
      description="Une catégorie regroupe des tags. Elle ne peut pas être supprimée tant qu’elle en contient."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          void act(() => adminApi.createCategory(name.trim())).then(() => setName(''));
        }}
        className="mb-8 flex gap-3"
      >
        <label className="flex-1">
          <span className="sr-only">Nom de la catégorie</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nouvelle catégorie"
            className="w-full border-b border-line bg-transparent py-2 text-t1 placeholder:text-t4 focus:border-gold-400 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={busy || !name.trim()}
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
        loading={categories.loading}
        error={categories.error}
        empty={list.length === 0}
        emptyMessage="Aucune catégorie."
        onRetry={categories.reload}
      >
        {list.map((category) => (
          <AdminRow key={category.id}>
            <span className="flex-1 text-t1">{category.name}</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const next = window.prompt('Nouveau nom', category.name);
                if (next && next !== category.name) {
                  void act(() => adminApi.renameCategory(category.id, next));
                }
              }}
              className="text-sm text-t4 hover:text-t2"
            >
              Renommer
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void act(() => adminApi.deleteCategory(category.id))}
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
