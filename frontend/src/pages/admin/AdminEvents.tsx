import { useState } from 'react';
import { CalendarDays, Plus, Search } from 'lucide-react';
import { AdminConfirm, AdminPagination, AdminRow, AdminSection, AdminState, StatusBadge } from '@/components/admin/AdminTable';
import EventForm from '@/components/admin/EventForm';
import { useApi } from '@/hooks/useApi';
import { adminApi, type EventRequest } from '@/services/adminApi';
import { ApiError } from '@/services/http';
import type { EventStatus, EventSummary } from '@/services/types';

const typeLabels = { BOOTCAMP: 'Bootcamp', WORKSHOP: 'Atelier', WEBINAR: 'Webinaire', CONFERENCE: 'Conférence' };
const formatLabels = { ONLINE: 'En ligne', OFFLINE: 'Sur place', HYBRID: 'Hybride' };
const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

export default function AdminEvents() {
  const [editor, setEditor] = useState<EventSummary | 'new' | null>(null);
  const [pending, setPending] = useState<{ event: EventSummary; action: 'delete' | 'cancel' } | null>(null);
  const [busy, setBusy] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<EventStatus | ''>('');
  const events = useApi((signal) => adminApi.events(page, signal), [page]);
  const list = (events.data?.content ?? []).filter((event) => (!status || event.status === status) && `${event.title} ${event.description} ${event.location ?? ''}`.toLocaleLowerCase('fr').includes(search.trim().toLocaleLowerCase('fr')));
  const actionClass = 'rounded-full border border-line px-3 py-2 text-xs font-medium text-t2 hover:border-gold-400/40 hover:text-gold-400 disabled:opacity-40';

  async function act(event: EventSummary, action: 'publish' | 'cancel' | 'complete' | 'delete') {
    if (busy[event.id]) return;
    setBusy((value) => ({ ...value, [event.id]: action }));
    setErrors((value) => ({ ...value, [event.id]: '' }));
    setNotice('');
    try {
      if (action === 'delete') await adminApi.deleteEvent(event.id);
      else {
        const body: EventRequest = { title: event.title, description: event.description, type: event.type, format: event.format, startDate: event.startDate, endDate: event.endDate, location: event.location, status: action === 'publish' ? 'PUBLISHED' : action === 'complete' ? 'COMPLETED' : 'CANCELLED' };
        await adminApi.updateEvent(event.id, body, undefined);
      }
      setPending((value) => value?.event.id === event.id ? null : value);
      setNotice(action === 'delete' ? 'L’événement a été supprimé.' : 'Le statut de l’événement a été mis à jour.');
      if (action === 'delete' && events.data?.content.length === 1 && page > 0) setPage(page - 1);
      else events.reload();
    } catch (error) { setErrors((value) => ({ ...value, [event.id]: error instanceof ApiError ? error.message : 'L’action a échoué. Réessaie.' })); }
    finally { setBusy((value) => ({ ...value, [event.id]: '' })); }
  }

  function confirm(event: EventSummary, action: 'delete' | 'cancel') {
    setErrors((value) => ({ ...value, [event.id]: '' }));
    setPending({ event, action });
  }

  return <AdminSection title="Événements" description="Préparer les rendez-vous qui font avancer la communauté." action={<button type="button" onClick={() => setEditor('new')} className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-5 py-3 text-sm font-semibold text-black"><Plus className="h-4 w-4" aria-hidden />Nouvel événement</button>}>
    <div className="mb-6 rounded-2xl border border-line-soft bg-card p-5">
      <div className="grid items-end gap-4 sm:grid-cols-[1fr_14rem]">
        <label className="text-xs text-t3">Rechercher dans cette page<span className="relative mt-2 block"><Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-t4" aria-hidden /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Titre, description ou lieu…" aria-describedby="event-filter-scope" className="w-full rounded-2xl border border-line bg-noir-900 py-3 pl-11 pr-4 text-sm text-t1 focus:border-gold-400 focus:outline-none" /></span></label>
        <label className="text-xs text-t3">Statut dans cette page<select value={status} onChange={(event) => setStatus(event.target.value as EventStatus | '')} aria-describedby="event-filter-scope" className="mt-2 w-full rounded-2xl border border-line bg-noir-900 px-4 py-3 text-sm text-t1 focus:border-gold-400 focus:outline-none"><option value="">Tous les statuts</option><option value="DRAFT">Brouillon</option><option value="PUBLISHED">Publié</option><option value="COMPLETED">Terminé</option><option value="CANCELLED">Annulé</option></select></label>
      </div>
      <p id="event-filter-scope" className="mt-3 text-xs leading-relaxed text-t4">La recherche et le filtre s’appliquent uniquement aux événements de la page affichée. Utilise la pagination pour consulter les autres événements.</p>
      {(search || status) && <button type="button" onClick={() => { setSearch(''); setStatus(''); }} className="mt-3 text-xs text-gold-400 underline underline-offset-4">Réinitialiser les filtres</button>}
    </div>
    {notice && <p role="status" className="mb-5 text-sm text-gold-400">{notice}</p>}
    <AdminState loading={events.loading} error={events.error} empty={!list.length} emptyMessage={search || status ? 'Aucun événement correspondant sur cette page. Essaie une autre page ou efface les filtres.' : 'Aucun événement. Prépare le prochain rendez-vous.'} onRetry={events.reload}>
      {list.map((event) => <AdminRow key={event.id}>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-noir-800 text-gold-400"><CalendarDays className="h-5 w-5" aria-hidden /></span>
        <div className="min-w-0 flex-1 basis-48"><h2 className="break-words font-display font-medium text-t1">{event.title}</h2><p className="mt-1 text-xs leading-relaxed text-t3">{typeLabels[event.type]} · {formatLabels[event.format]}</p><p className="mt-1 text-xs text-t4"><time dateTime={event.startDate}>{dateFormat.format(new Date(event.startDate))}</time></p></div>
        <StatusBadge status={event.status} />
        <div className="flex flex-wrap gap-2" role="group" aria-label={`Actions pour ${event.title}`}>
          <button type="button" disabled={!!busy[event.id]} onClick={() => setEditor(event)} className={actionClass}>Modifier</button>
          {event.status !== 'PUBLISHED' && <button type="button" disabled={!!busy[event.id]} onClick={() => void act(event, 'publish')} className={actionClass}>{busy[event.id] === 'publish' ? 'Publication…' : 'Publier'}</button>}
          {event.status === 'PUBLISHED' && <button type="button" disabled={!!busy[event.id]} onClick={() => void act(event, 'complete')} className={actionClass}>{busy[event.id] === 'complete' ? 'En cours…' : 'Marquer terminé'}</button>}
          {event.status !== 'CANCELLED' && <button type="button" disabled={!!busy[event.id]} onClick={() => confirm(event, 'cancel')} className={actionClass}>Annuler l’événement</button>}
          <button type="button" disabled={!!busy[event.id]} onClick={() => confirm(event, 'delete')} className={actionClass}>Supprimer</button>
        </div>
        {errors[event.id] && !pending && <p role="alert" className="w-full text-sm text-gold-400">{errors[event.id]}</p>}
      </AdminRow>)}
    </AdminState>
    {events.data && !events.error && <AdminPagination page={page} totalPages={events.data.totalPages} totalElements={events.data.totalElements} busy={events.loading} onChange={setPage} />}
    {editor && <EventForm key={editor === 'new' ? 'new' : editor.id} event={editor === 'new' ? undefined : editor} onCancel={() => setEditor(null)} onCreated={() => { setEditor(null); setNotice('L’événement a été enregistré.'); events.reload(); }} />}
    <AdminConfirm open={!!pending} title={pending?.action === 'cancel' ? 'Annuler cet événement ?' : 'Supprimer cet événement ?'} description={pending ? `« ${pending.event.title} » : ${pending.action === 'cancel' ? 'il ne sera plus visible sur le site. Ses informations seront conservées.' : 'cette action est définitive.'}` : ''} busy={!!pending && !!busy[pending.event.id]} error={pending ? errors[pending.event.id] || null : null} onCancel={() => setPending(null)} onConfirm={() => { if (pending) void act(pending.event, pending.action); }} label={pending?.action === 'cancel' ? 'Confirmer l’annulation' : undefined} />
  </AdminSection>;
}
