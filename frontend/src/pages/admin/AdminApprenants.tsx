// src/pages/admin/AdminApprenants.tsx
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, StarOff, Linkedin, Globe, Mail } from 'lucide-react';
import adminApi, { AdminLearner, AdminLearnerRequest, LearnerStatus } from '@/services/adminApi';
import apiService from '@/services/api';

const STATUS_LABELS: Record<LearnerStatus, string> = {
  EN_COURS: 'En cours',
  TERMINE_AVEC_CERTIFICAT: 'Terminé · Certificat',
  TERMINE_SANS_CERTIFICAT: 'Terminé · Sans certificat',
};

const STATUS_COLORS: Record<LearnerStatus, string> = {
  EN_COURS: 'bg-blue-100 text-blue-700',
  TERMINE_AVEC_CERTIFICAT: 'bg-green-100 text-green-700',
  TERMINE_SANS_CERTIFICAT: 'bg-gray-100 text-gray-600',
};

const EMPTY_FORM: AdminLearnerRequest = {
  firstName: '',
  lastName: '',
  bio: '',
  photoUrl: '',
  email: '',
  linkedinUrl: '',
  portfolioUrl: '',
  status: 'EN_COURS',
  cohort: '',
  showcased: false,
  visible: true,
  displayOrder: 0,
};

export default function AdminApprenants() {
  const [learners, setLearners] = useState<AdminLearner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminLearner | null>(null);
  const [form, setForm] = useState<AdminLearnerRequest>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<LearnerStatus | ''>('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchLearners();
  }, []);

  const fetchLearners = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getLearners();
      setLearners(data);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (l: AdminLearner) => {
    setEditing(l);
    setForm({
      firstName: l.firstName,
      lastName: l.lastName,
      bio: l.bio || '',
      photoUrl: l.photoUrl || '',
      email: l.email || '',
      linkedinUrl: l.linkedinUrl || '',
      portfolioUrl: l.portfolioUrl || '',
      status: l.status,
      cohort: l.cohort || '',
      showcased: l.showcased,
      visible: l.visible,
      displayOrder: l.displayOrder,
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Prénom et nom sont obligatoires.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await adminApi.updateLearner(editing.id, form);
      } else {
        await adminApi.createLearner(form);
      }
      setShowModal(false);
      fetchLearners();
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Supprimer ${name} ?`)) return;
    await adminApi.deleteLearner(id);
    fetchLearners();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await apiService.uploadImage(file);
      setForm(f => ({ ...f, photoUrl: url }));
    } catch (err: any) {
      setError(err.message || "Erreur upload photo");
    } finally {
      setUploading(false);
    }
  };

  const filtered = learners.filter(l => {
    const matchSearch = !search || l.fullName.toLowerCase().includes(search.toLowerCase())
      || (l.cohort || '').includes(search);
    const matchStatus = !filterStatus || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Apprenants</h1>
          <p className="text-sm text-gray-500 mt-1">{learners.length} apprenant(s) enregistré(s)</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-gold text-black px-4 py-2 rounded-lg font-semibold hover:bg-gold/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un apprenant
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Rechercher par nom ou cohorte..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as LearnerStatus | '')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none"
        >
          <option value="">Tous les statuts</option>
          {(Object.keys(STATUS_LABELS) as LearnerStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Chargement...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Apprenant</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Statut</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Cohorte</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Liens</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Vitrine</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">Aucun apprenant trouvé.</td></tr>
                )}
                {filtered.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {l.photoUrl ? (
                          <img src={l.photoUrl} alt={l.fullName} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">
                            {l.firstName[0]}{l.lastName[0]}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{l.fullName}</p>
                            {l.userId ? (
                              <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Compte lié</span>
                            ) : (
                              <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">Manuel</span>
                            )}
                          </div>
                          {l.email && <p className="text-xs text-gray-400">{l.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[l.status]}`}>
                        {STATUS_LABELS[l.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{l.cohort || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {l.linkedinUrl && (
                          <a href={l.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                            <Linkedin className="w-4 h-4" />
                          </a>
                        )}
                        {l.portfolioUrl && (
                          <a href={l.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700">
                            <Globe className="w-4 h-4" />
                          </a>
                        )}
                        {l.email && (
                          <a href={`mailto:${l.email}`} className="text-gray-400 hover:text-gray-600">
                            <Mail className="w-4 h-4" />
                          </a>
                        )}
                        {!l.linkedinUrl && !l.portfolioUrl && !l.email && <span className="text-gray-300 text-xs">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {l.showcased ? (
                          <span className="flex items-center gap-1 text-xs text-yellow-600 font-medium">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> Landing
                          </span>
                        ) : null}
                        {!l.visible && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <EyeOff className="w-3.5 h-3.5" /> Masqué
                          </span>
                        )}
                        {l.visible && !l.showcased && <span className="text-xs text-gray-400">Visible</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(l)}
                          className="p-1.5 rounded-lg text-gold hover:bg-gold/10 transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(l.id, l.fullName)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal create/edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editing ? 'Modifier l\'apprenant' : 'Ajouter un apprenant'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="p-6 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
              )}

              {/* Photo */}
              <div className="flex items-center gap-4">
                {form.photoUrl ? (
                  <img src={form.photoUrl} alt="photo" className="w-16 h-16 rounded-full object-cover border-2 border-gold" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-2xl font-bold">
                    {form.firstName?.[0] || '?'}{form.lastName?.[0] || ''}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Photo de profil</label>
                  <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-lg transition-colors">
                    {uploading ? 'Upload...' : 'Choisir une photo'}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                  {form.photoUrl && (
                    <button onClick={() => setForm(f => ({ ...f, photoUrl: '' }))} className="ml-2 text-xs text-red-400 hover:text-red-600">Retirer</button>
                  )}
                </div>
              </div>

              {/* Nom */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none"
                    placeholder="Brandon"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none"
                    placeholder="Kamga"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Résumé / Bio</label>
                <textarea
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none resize-none"
                  placeholder="Développeur Full Stack, passionné par le cloud..."
                />
              </div>

              {/* Statut + Cohorte */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as LearnerStatus }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none"
                  >
                    {(Object.keys(STATUS_LABELS) as LearnerStatus[]).map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cohorte (année)</label>
                  <input
                    type="text"
                    value={form.cohort}
                    onChange={e => setForm(f => ({ ...f, cohort: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none"
                    placeholder="2025"
                  />
                </div>
              </div>

              {/* Liens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none"
                  placeholder="brandon@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                <input
                  type="url"
                  value={form.linkedinUrl}
                  onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none"
                  placeholder="https://linkedin.com/in/brandon-kamga"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio / Site web</label>
                <input
                  type="url"
                  value={form.portfolioUrl}
                  onChange={e => setForm(f => ({ ...f, portfolioUrl: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none"
                  placeholder="https://brandon.dev"
                />
              </div>

              {/* Ordre + options */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ordre d'affichage</label>
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={e => setForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none"
                    min={0}
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-6">
                  <input
                    type="checkbox"
                    checked={form.visible}
                    onChange={e => setForm(f => ({ ...f, visible: e.target.checked }))}
                    className="w-4 h-4 accent-gold"
                  />
                  <span className="text-sm text-gray-700 flex items-center gap-1">
                    <Eye className="w-4 h-4" /> Visible
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer mt-6">
                  <input
                    type="checkbox"
                    checked={form.showcased}
                    onChange={e => setForm(f => ({ ...f, showcased: e.target.checked }))}
                    className="w-4 h-4 accent-gold"
                  />
                  <span className="text-sm text-gray-700 flex items-center gap-1">
                    <Star className="w-4 h-4" /> Landing page
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 text-sm bg-gold text-black font-semibold rounded-lg hover:bg-gold/80 transition-colors disabled:opacity-60"
              >
                {saving ? 'Enregistrement...' : (editing ? 'Mettre à jour' : 'Créer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
