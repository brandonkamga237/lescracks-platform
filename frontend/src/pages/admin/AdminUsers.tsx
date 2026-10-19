import { useState } from 'react';
import { Download, Eye, Search, SlidersHorizontal, Trash2 } from 'lucide-react';

import { GOAL_LABEL, SITUATION_LABEL } from '@/lib/memberProfile';
import { countryName, displayPhone } from '@/lib/phone';
import { AdminAction, AdminConfirm, AdminModal, AdminPagination, AdminRow, AdminSection, AdminState } from '@/components/admin/AdminTable';
import { Kpi } from '@/components/admin/viz';
import { useApi } from '@/hooks/useApi';
import { adminApi, type UserFilters } from '@/services/adminApi';
import type { AdminUser, AuthProvider } from '@/services/types';

const statusLabels = { ACTIVE: 'Actif', INACTIVE: 'Inactif', BANNED: 'Suspendu' };
const statusStyles = {
  ACTIVE: 'border-success/30 bg-success/10 text-success-ink',
  INACTIVE: 'border-line bg-noir-800 text-t3',
  BANNED: 'border-error/30 bg-error/10 text-error-ink',
};
const providerLabels: Record<AuthProvider, string> = { LOCAL: 'Email', GOOGLE: 'Google', GITHUB: 'GitHub' };

function fullName(user: AdminUser) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email;
}

function lastSeen(value?: string) {
  return value ? new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Jamais';
}

interface UserDetailProps {
  id: number;
  onClose: () => void;
  /** Called after a support action, so the list shows the new state. */
  onChanged: () => void;
}

function UserDetail({ id, onClose, onChanged }: UserDetailProps) {
  const { data, loading, error, reload } = useApi((signal) => adminApi.user(id, signal), [id]);
  const [busy, setBusy] = useState<'resend' | 'verify' | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function act(action: 'resend' | 'verify') {
    setBusy(action);
    setMessage(null);
    try {
      if (action === 'resend') await adminApi.resendUserVerification(id);
      else await adminApi.verifyUser(id);
      setMessage({ ok: true, text: action === 'resend' ? 'Nouveau lien envoyé.' : 'Adresse confirmée.' });
      reload();
      onChanged();
    } catch (cause) {
      setMessage({ ok: false, text: cause instanceof Error ? cause.message : 'L’action a échoué.' });
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminModal open onClose={onClose} title="Fiche utilisateur" description="Détails du compte" busy={loading}>
      {loading ? <p className="py-8 text-center text-t3">Chargement…</p> : null}
      {error ? <p role="alert" className="rounded-lg border border-error/30 bg-error/10 p-4 text-sm text-t1">{error.message}</p> : null}
      {data && data.hasAccount && !data.verified && (
        <div className="mb-5 rounded-lg border border-gold-400/25 bg-gold-400/5 p-4">
          <p className="text-sm text-t1">Adresse pas encore confirmée.</p>
          <p className="mt-1 text-xs text-t3">Si la personne dit ne rien recevoir : renvoie le lien, ou confirme l’adresse si elle t’a écrit depuis celle-ci.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={Boolean(busy)} onClick={() => void act('resend')} className="btn-secondary">{busy === 'resend' ? 'Envoi…' : 'Renvoyer le lien'}</button>
            <button type="button" disabled={Boolean(busy)} onClick={() => void act('verify')} className="btn-secondary">{busy === 'verify' ? 'Confirmation…' : 'Confirmer l’adresse'}</button>
          </div>
        </div>
      )}
      {message && <p role={message.ok ? 'status' : 'alert'} className={`mb-4 text-sm ${message.ok ? 'text-success-ink' : 'text-error-ink'}`}>{message.text}</p>}
      {data && (
        <dl className="mt-2 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-t4">Type</dt>
            <dd className="mt-1 text-sm text-t1">{data.hasAccount ? 'Membre' : 'Contact newsletter (sans compte)'}</dd>
          </div>
          <div>
            <dt className="text-xs text-t4">Dernière visite</dt>
            <dd className="mt-1 text-sm text-t1">{lastSeen(data.lastSeenAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-t4">Questions de bienvenue</dt>
            <dd className="mt-1 text-sm text-t1">{data.onboarded ? 'Faites' : 'Pas encore'}</dd>
          </div>
          <div>
            <dt className="text-xs text-t4">Arrivé par</dt>
            <dd className="mt-1 break-all text-sm text-t1">{data.signupPath ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-t4">Nom</dt>
            <dd className="mt-1 text-sm font-medium text-t1">{fullName(data)}</dd>
          </div>
          <div>
            <dt className="text-xs text-t4">Email</dt>
            <dd className="mt-1 text-sm text-t1">{data.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-t4">Statut</dt>
            <dd className="mt-1 text-sm text-t1">{statusLabels[data.status]}</dd>
          </div>
          <div>
            <dt className="text-xs text-t4">Connexion</dt>
            <dd className="mt-1 text-sm text-t1">{providerLabels[data.provider]}</dd>
          </div>
          <div>
            <dt className="text-xs text-t4">Email vérifié</dt>
            <dd className="mt-1 text-sm text-t1">{data.verified ? 'Oui' : 'Non'}</dd>
          </div>
          <div>
            <dt className="text-xs text-t4">Inscrit le</dt>
            <dd className="mt-1 text-sm text-t1">{new Date(data.createdAt).toLocaleDateString('fr-FR')}</dd>
          </div>
          <div>
            <dt className="text-xs text-t4">Téléphone</dt>
            <dd className="mt-1 text-sm text-t1">{data.phone ? displayPhone(data.phone) : '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-t4">Pays · ville</dt>
            <dd className="mt-1 text-sm text-t1">{[countryName(data.country), data.location].filter(Boolean).join(' · ') || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-t4">Situation</dt>
            <dd className="mt-1 text-sm text-t1">{data.situation ? SITUATION_LABEL[data.situation] : '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-t4">Objectif</dt>
            <dd className="mt-1 text-sm text-t1">{data.goal ? GOAL_LABEL[data.goal] : '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-t4">Nouveautés WhatsApp / SMS</dt>
            <dd className="mt-1 text-sm text-t1">{data.marketingConsent ? 'Accepté' : 'Non'}</dd>
          </div>
          <div>
            <dt className="text-xs text-t4">Profil complété</dt>
            <dd className="mt-1 font-mono text-sm tabular-nums text-t1">{data.completion} %</dd>
          </div>
        </dl>
      )}
    </AdminModal>
  );
}

export default function AdminUsers() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const [filters, setFilters] = useState<UserFilters>({});
  const users = useApi((signal) => adminApi.users(page, debounced, filters, signal), [page, debounced, filters]);
  const overview = useApi((signal) => adminApi.overview(signal), []);
  const list = users.data?.content ?? [];
  const totalPages = users.data?.totalPages ?? 1;
  const totalElements = users.data?.totalElements ?? 0;

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    setPage(0);
    setDebounced(search.trim());
  }

  async function updateStatus(id: number, status: AdminUser['status']) {
    setBusy(id);
    setError('');
    setNotice('');
    try {
      await adminApi.updateUserStatus(id, status);
      setNotice('Statut mis à jour.');
      await users.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La mise à jour a échoué.');
    } finally {
      setBusy(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteError('');
    setBusy(deleteTarget.id);
    try {
      await adminApi.deleteUser(deleteTarget.id);
      setNotice('Utilisateur supprimé.');
      setDeleteTarget(null);
      await users.reload();
    } catch (cause) {
      setDeleteError(cause instanceof Error ? cause.message : 'La suppression a échoué.');
    } finally {
      setBusy(null);
    }
  }

  function askRemove(user: AdminUser) {
    setDeleteError('');
    setDeleteTarget({ id: user.id, name: fullName(user) });
  }

  const activeFilters = Number(filters.kind !== undefined) + Number(filters.verified !== undefined);
  // On a phone the search stays in view and the rest folds behind « Filtres »; from sm up the
  // wrappers dissolve (display: contents) into the one row the desktop always had.
  const headerAction = (
    <div className="flex w-full max-w-2xl flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex gap-2 sm:contents">
      <form onSubmit={submitSearch} className="relative min-w-0 flex-1 sm:min-w-[12rem]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-t4" aria-hidden />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher par email ou nom…"
          className="input w-full pl-9"
        />
      </form>
      <button type="button" onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen} aria-controls="member-filters"
        className="btn-secondary inline-flex shrink-0 items-center gap-2 sm:hidden">
        <SlidersHorizontal className="h-4 w-4" aria-hidden />Filtres{activeFilters > 0 && <span className="font-mono text-xs text-gold-ink">{activeFilters}</span>}
      </button>
      </div>
      <div id="member-filters" className={`${filtersOpen ? 'grid' : 'hidden'} grid-cols-2 gap-2 sm:contents`}>
      <select aria-label="Type" value={filters.kind ?? ''} className="input w-full sm:w-auto"
        onChange={(event) => { setPage(0); setFilters({ ...filters, kind: (event.target.value || undefined) as UserFilters['kind'] }); }}>
        <option value="">Tous</option>
        <option value="MEMBER">Membres</option>
        <option value="CONTACT">Contacts newsletter</option>
      </select>
      <select aria-label="Email" value={filters.verified === undefined ? '' : String(filters.verified)} className="input w-full sm:w-auto"
        onChange={(event) => { setPage(0); setFilters({ ...filters, verified: event.target.value === '' ? undefined : event.target.value === 'true' }); }}>
        <option value="">Email : tous</option>
        <option value="true">Confirmé</option>
        <option value="false">Non confirmé</option>
      </select>
      <button
        type="button"
        onClick={() => void adminApi.exportUsers()}
        className="btn-secondary col-span-2 inline-flex shrink-0 items-center justify-center gap-2"
      >
        <Download className="h-4 w-4" aria-hidden /> CSV
      </button>
      </div>
    </div>
  );

  return (
    <AdminSection title="Membres" description="Les comptes inscrits et les contacts newsletter." action={headerAction}>
      {error && <p role="alert" className="mb-5 rounded-lg border border-error/25 bg-error/5 p-3 text-sm text-error-ink">{error}</p>}
      {notice && <p role="status" className="mb-5 rounded-lg border border-success/25 bg-success/5 p-3 text-sm text-success-ink">{notice}</p>}

      {/* On a phone the list comes first: the figures follow it instead of pushing it three screens down. */}
      <div className="flex flex-col">
      {overview.data && (
        <div className="order-2 mt-6 grid grid-cols-2 gap-3 sm:order-none sm:mb-6 sm:mt-0 sm:gap-4 xl:grid-cols-4">
          <Kpi label="Membres" value={overview.data.users.toLocaleString('fr-FR')}
            hint={`${overview.data.verifiedUsers.toLocaleString('fr-FR')} emails confirmés · ${overview.data.newsletterContacts.toLocaleString('fr-FR')} contacts newsletter à part`} />
          <Kpi label="Nouveaux · 30 jours" value={overview.data.usersNewLast30d.toLocaleString('fr-FR')}
            hint="inscriptions récentes" />
          <Kpi label="Actifs · 7 jours" value={overview.data.usersActiveLast7d.toLocaleString('fr-FR')}
            hint="ont utilisé la plateforme cette semaine" />
          <Kpi label="Actifs · 30 jours" value={overview.data.usersActiveLast30d.toLocaleString('fr-FR')}
            hint="ont utilisé la plateforme ce mois-ci" />
        </div>
      )}

      {overview.data && overview.data.signupFunnel.signedUp > 0 && (
        <section aria-labelledby="funnel-title" className="order-3 mt-6 rounded-lg border border-line-soft bg-card p-4 sm:order-none sm:mb-6 sm:mt-0 sm:p-5">
          <h2 id="funnel-title" className="text-sm font-medium text-t1">Inscriptions des 30 derniers jours</h2>
          <p className="mt-1 text-xs text-t4">Là où le chiffre chute, c’est là qu’on perd les gens.</p>
          <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([
              ['Inscrits', overview.data.signupFunnel.signedUp],
              ['Email confirmé', overview.data.signupFunnel.verified],
              ['Bienvenue faite', overview.data.signupFunnel.onboarded],
              ['Revenus après J+1', overview.data.signupFunnel.returned],
            ] as [string, number][]).map(([label, value]) => (
              <li key={label} className="rounded border border-line-soft p-3">
                <p className="font-display text-2xl font-semibold tabular-nums text-t1">{value.toLocaleString('fr-FR')}</p>
                <p className="mt-1 text-xs text-t3">{label}
                  <span className="ml-1 font-mono tabular-nums text-t4">{Math.round((value / overview.data!.signupFunnel.signedUp) * 100)} %</span></p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="order-1 sm:order-none">
      <AdminState
        loading={users.loading}
        error={users.error}
        empty={!users.loading && !users.error && list.length === 0}
        emptyMessage="Aucun utilisateur trouvé."
        onRetry={users.reload}
      >
        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-lg border border-line-soft bg-card sm:block">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-line-soft bg-noir-950/50 text-t4">
              <tr>
                <th className="px-5 py-3 font-medium">Nom</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium">Connexion</th>
                <th className="px-5 py-3 font-medium">Dernière visite</th>
                <th className="px-5 py-3 font-medium">Profil</th>
                <th className="px-5 py-3 font-medium">Inscrit le</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((user) => (
                <tr key={user.id} className="border-b border-line-soft last:border-b-0">
                  <td className="px-5 py-3 text-t1">{fullName(user)}
                    {!user.hasAccount && <span className="ml-2 rounded border border-line px-1.5 py-0.5 text-xs text-t4">Contact newsletter</span>}</td>
                  <td className="px-5 py-3 text-t3">{user.email}
                    {user.hasAccount && !user.verified && <span className="ml-2 text-xs text-warning-ink">non confirmé</span>}</td>
                  <td className="px-5 py-3">
                    <select
                      value={user.status}
                      disabled={busy === user.id}
                      onChange={(event) => void updateStatus(user.id, event.target.value as AdminUser['status'])}
                      className={`rounded border px-2.5 py-1 text-xs font-medium outline-none focus:border-gold-400 ${statusStyles[user.status]}`}
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-t3">{providerLabels[user.provider]}</td>
                  <td className="px-5 py-3 text-t3">{user.hasAccount ? lastSeen(user.lastSeenAt) : '—'}</td>
                  <td className="px-5 py-3 font-mono tabular-nums text-t3">{user.completion} %</td>
                  <td className="px-5 py-3 text-t3">{new Date(user.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelected(user.id)}
                        className="text-sm text-gold-ink hover:underline"
                      >
                        Détails
                      </button>
                      <button
                        type="button"
                        disabled={busy === user.id}
                        onClick={() => askRemove(user)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded border border-line text-t3 transition-colors hover:border-error/40 hover:text-error-ink disabled:opacity-40"
                        aria-label={`Supprimer ${fullName(user)}`}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden">
          {list.map((user) => (
            <AdminRow key={user.id}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-t1">{fullName(user)}</p>
                <p className="truncate text-xs text-t3">{user.email}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select
                    value={user.status}
                    disabled={busy === user.id}
                    onChange={(event) => void updateStatus(user.id, event.target.value as AdminUser['status'])}
                    className={`rounded border px-2.5 py-1 text-xs font-medium outline-none focus:border-gold-400 ${statusStyles[user.status]}`}
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <span className="text-xs text-t3">{providerLabels[user.provider]}</span>
                  {user.hasAccount
                    ? <span className="text-xs text-t3">{user.verified ? 'Email confirmé' : 'Email non confirmé'}</span>
                    : <span className="text-xs text-t4">Contact newsletter</span>}
                  {user.country && <span className="text-xs text-t3">{countryName(user.country)}</span>}
                  <span className="font-mono text-xs tabular-nums text-t3">Profil {user.completion} %</span>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2" role="group" aria-label={`Actions pour ${fullName(user)}`}>
                <AdminAction icon={Eye} label="Détails" onClick={() => setSelected(user.id)} />
                <AdminAction icon={Trash2} label="Supprimer" danger disabled={busy === user.id} onClick={() => askRemove(user)} />
              </div>
            </AdminRow>
          ))}
        </div>

        <AdminPagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          busy={users.loading}
          onChange={setPage}
        />
      </AdminState>
      </div>
      </div>

      {selected && <UserDetail id={selected} onClose={() => setSelected(null)} onChanged={users.reload} />}

      <AdminConfirm
        open={deleteTarget !== null}
        title="Supprimer cet utilisateur ?"
        description={`Le compte de ${deleteTarget?.name ?? ''} sera définitivement supprimé.`}
        busy={!!busy}
        error={deleteError}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </AdminSection>
  );
}
