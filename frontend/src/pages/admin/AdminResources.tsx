import { useState } from 'react';
import { Link } from 'react-router-dom';

import { AdminRow, AdminSection, AdminState } from '@/components/admin/AdminTable';
import { useApi } from '@/hooks/useApi';
import { KIND_LABEL, effortLabel } from '@/lib/effort';
import { adminApi } from '@/services/adminApi';
import { ApiError } from '@/services/http';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' });

/**
 * The catalogue, from the other side.
 *
 * Publishing is its own act, separate from editing: a half-written article saved by mistake
 * must not appear on the public catalogue because somebody hit save.
 */
export default function AdminResources() {
  const [busy, setBusy] = useState<number | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const resources = useApi((signal) => adminApi.resources(0, signal), []);
  const list = resources.data?.content ?? [];

  async function act(id: number, work: () => Promise<unknown>) {
    setBusy(id);
    setFailure(null);
    try {
      await work();
      resources.reload();
    } catch (error) {
      setFailure(error instanceof ApiError ? error.message : 'L’action a échoué.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminSection
      title="Ressources"
      description="Publier est une action distincte de la modification."
    >
      {failure && (
        <p role="alert" className="mb-6 rounded border border-line px-4 py-3 text-t2">
          {failure}
        </p>
      )}

      <AdminState
        loading={resources.loading}
        error={resources.error}
        empty={list.length === 0}
        emptyMessage="Le catalogue est vide."
        onRetry={resources.reload}
      >
        {list.map((resource) => (
          <AdminRow key={resource.id}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-t1">{resource.title}</p>
              <p className="mt-0.5 text-sm text-t4">
                {KIND_LABEL[resource.kind]} · {resource.categoryName}
                {effortLabel(resource) && ` · ${effortLabel(resource)}`}
                {' · '}
                {dateFormat.format(new Date(resource.createdAt))}
                {resource.viewCount > 0 && ` · ${resource.viewCount} vues`}
              </p>
            </div>

            <span
              className={`shrink-0 text-sm ${resource.published ? 'text-gold-400' : 'text-t4'}`}
            >
              {resource.published ? 'Publiée' : 'Brouillon'}
            </span>

            <div className="flex shrink-0 items-center gap-4 text-sm">
              {resource.published && (
                <Link
                  to={`/ressources/${resource.slug}`}
                  className="text-t4 hover:text-t2"
                >
                  Voir
                </Link>
              )}
              <button
                type="button"
                disabled={busy === resource.id}
                onClick={() =>
                  void act(resource.id, () =>
                    adminApi.publishResource(resource.id, !resource.published),
                  )
                }
                className="text-t2 hover:text-t1 disabled:opacity-50"
              >
                {resource.published ? 'Dépublier' : 'Publier'}
              </button>
              <button
                type="button"
                disabled={busy === resource.id}
                onClick={() => {
                  if (window.confirm(`Supprimer « ${resource.title} » ?`)) {
                    void act(resource.id, () => adminApi.deleteResource(resource.id));
                  }
                }}
                className="text-t4 hover:text-error disabled:opacity-50"
              >
                Supprimer
              </button>
            </div>
          </AdminRow>
        ))}
      </AdminState>
    </AdminSection>
  );
}
