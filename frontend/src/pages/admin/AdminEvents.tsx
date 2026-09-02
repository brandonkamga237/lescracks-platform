import { useState } from 'react';
import { Link } from 'react-router-dom';

import { AdminRow, AdminSection, AdminState } from '@/components/admin/AdminTable';
import { useApi } from '@/hooks/useApi';
import { adminApi } from '@/services/adminApi';
import { ApiError } from '@/services/http';
import type { EventKind, EventPhase } from '@/services/types';

const KIND_LABEL: Record<EventKind, string> = { BOOTCAMP: 'Bootcamp', WORKSHOP: 'Atelier' };
const PHASE_LABEL: Record<EventPhase, string> = {
  UPCOMING: 'À venir',
  RUNNING: 'En cours',
  PAST: 'Terminé',
};

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

export default function AdminEvents() {
  const [busy, setBusy] = useState<number | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const events = useApi((signal) => adminApi.events(0, signal), []);
  const list = events.data?.content ?? [];

  async function act(id: number, work: () => Promise<unknown>) {
    setBusy(id);
    setFailure(null);
    try {
      await work();
      events.reload();
    } catch (error) {
      setFailure(error instanceof ApiError ? error.message : 'L’action a échoué.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminSection
      title="Événements"
      description="La phase est lue des dates, jamais stockée : elle ne peut pas contredire le calendrier."
    >
      {failure && (
        <p role="alert" className="mb-6 rounded border border-line px-4 py-3 text-t2">
          {failure}
        </p>
      )}

      <AdminState
        loading={events.loading}
        error={events.error}
        empty={list.length === 0}
        emptyMessage="Aucun événement."
        onRetry={events.reload}
      >
        {list.map((event) => (
          <AdminRow key={event.id}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-t1">{event.title}</p>
              <p className="mt-0.5 text-sm text-t4">
                {KIND_LABEL[event.kind]} · {dateFormat.format(new Date(event.startsAt))}
                {event.location && ` · ${event.location}`}
              </p>
            </div>

            <span className={`shrink-0 text-sm ${event.phase === 'PAST' ? 'text-t4' : 'text-t2'}`}>
              {PHASE_LABEL[event.phase]}
            </span>

            <span className={`shrink-0 text-sm ${event.published ? 'text-gold-400' : 'text-t4'}`}>
              {event.published ? 'Publié' : 'Brouillon'}
            </span>

            <div className="flex shrink-0 items-center gap-4 text-sm">
              {event.published && (
                <Link to={`/evenements/${event.slug}`} className="text-t4 hover:text-t2">
                  Voir
                </Link>
              )}
              <button
                type="button"
                disabled={busy === event.id}
                onClick={() =>
                  void act(event.id, () => adminApi.publishEvent(event.id, !event.published))
                }
                className="text-t2 hover:text-t1 disabled:opacity-50"
              >
                {event.published ? 'Dépublier' : 'Publier'}
              </button>
              <button
                type="button"
                disabled={busy === event.id}
                onClick={() => {
                  if (window.confirm(`Supprimer « ${event.title} » ?`)) {
                    void act(event.id, () => adminApi.deleteEvent(event.id));
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
