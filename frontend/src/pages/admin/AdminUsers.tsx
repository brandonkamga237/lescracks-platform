import { useState, useEffect, useCallback } from 'react';
import { Users, Trash2, Pencil, Shield, GraduationCap } from 'lucide-react';
import adminApi, { AdminUser, PaginatedResponse } from '@/services/adminApi';
import { PageHeader } from '@/components/admin/viz';
import { errorMessage } from '@/lib/utils';
import AsyncState from '@/components/ui/AsyncState';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Field, { controlClass } from '@/components/ui/Field';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';

const PAGE_SIZE = 20;

const ROLE_OPTIONS = [
  { value: 'USER', label: 'Membre' },
  { value: 'LEARNER', label: 'Apprenant' },
  { value: 'ADMIN', label: 'Administrateur' },
];

const RoleBadge = ({ role }: { role: string }) => {
  switch (role?.toUpperCase()) {
    case 'ADMIN':
      return <Badge tone="accent"><Shield className="w-3 h-3" aria-hidden="true" />Admin</Badge>;
    case 'LEARNER':
      return <Badge tone="info"><GraduationCap className="w-3 h-3" aria-hidden="true" />Apprenant</Badge>;
    default:
      return <Badge>Membre</Badge>;
  }
};

const AdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data: PaginatedResponse<AdminUser> = await adminApi.getUsers(page, PAGE_SIZE);
      setUsers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      // A failed load used to leave an empty table, indistinguishable from no users at all.
      setLoadError(errorMessage(err, 'Les utilisateurs n\'ont pas pu être chargés.'));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSaveRole = async () => {
    if (!editingUser) return;
    setSaving(true);
    setSaveError(null);
    try {
      await adminApi.updateUserRole(editingUser.id, newRole);
      setUsers(users.map(u =>
        u.id === editingUser.id ? { ...u, roleName: newRole as AdminUser['roleName'] } : u,
      ));
      setEditingUser(null);
    } catch (err) {
      setSaveError(errorMessage(err, 'Le rôle n\'a pas pu être modifié.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Supprimer définitivement le compte ${user.email} ?`)) return;
    try {
      await adminApi.deleteUser(user.id);
      setUsers(users.filter(u => u.id !== user.id));
      setTotalElements(n => Math.max(0, n - 1));
    } catch (err) {
      alert(errorMessage(err, 'La suppression a échoué.'));
    }
  };

  const columns: Column<AdminUser>[] = [
    {
      header: 'Email',
      cell: (u) => <span className="text-t1">{u.email}</span>,
      className: 'max-w-[16rem] truncate',
    },
    {
      header: 'Identifiant',
      cell: (u) => u.username || '—',
      className: 'hidden lg:table-cell',
    },
    { header: 'Rôle', cell: (u) => <RoleBadge role={u.roleName} /> },
    {
      header: 'Connexion',
      cell: (u) => <span className="text-t4">{u.providerName}</span>,
      className: 'hidden md:table-cell',
    },
    {
      header: 'Inscrit le',
      cell: (u) => u.createdAt,
      className: 'hidden sm:table-cell whitespace-nowrap',
    },
    {
      header: 'Actions',
      cell: (u) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            onClick={() => { setEditingUser(u); setNewRole(u.roleName); setSaveError(null); }}
            aria-label={`Modifier le rôle de ${u.email}`}
            className="px-2"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          {u.roleName !== 'ADMIN' && (
            <Button
              variant="ghost"
              onClick={() => handleDelete(u)}
              aria-label={`Supprimer ${u.email}`}
              className="px-2 hover:text-error"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        icon={Users}
        title="Utilisateurs"
        subtitle={`${totalElements} compte${totalElements !== 1 ? 's' : ''}`}
      />

      <div className="bg-surface-1 border border-line rounded-xl overflow-hidden">
        <AsyncState
          loading={loading}
          error={loadError}
          onRetry={fetchUsers}
          empty={users.length === 0}
          emptyLabel="Aucun utilisateur pour le moment."
        >
          <DataTable rows={users} columns={columns} rowKey={(u) => u.id} offset={page * PAGE_SIZE} />
        </AsyncState>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal
        open={editingUser !== null}
        onClose={() => setEditingUser(null)}
        title="Modifier le rôle"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingUser(null)}>Annuler</Button>
            <Button onClick={handleSaveRole} loading={saving}>Enregistrer</Button>
          </>
        }
      >
        <p className="text-data text-t3 mb-gutter">
          Compte <span className="text-t1">{editingUser?.email}</span>
        </p>
        <Field label="Rôle" error={saveError ?? undefined}>
          {(field) => (
            <select
              {...field}
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className={controlClass}
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}
        </Field>
      </Modal>
    </div>
  );
};

export default AdminUsers;
