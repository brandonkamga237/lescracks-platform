// src/pages/admin/AdminOpenSource.tsx
import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, X, Loader2, Star, GitFork, Code2, Eye, EyeOff, Upload } from 'lucide-react';
import adminApi from '@/services/adminApi';
import apiService from '@/services/api';

interface OsProject {
  id: number;
  name: string;
  description: string;
  repoUrl: string;
  language: string;
  logoUrl: string;
  techStack: string;
  stars: number;
  forks: number;
  featured: boolean;
  featuredOrder: number;
  visible: boolean;
}

const empty = (): Omit<OsProject, 'id'> => ({
  name: '', description: '', repoUrl: '', language: '', logoUrl: '',
  techStack: '', stars: 0, forks: 0, featured: false, featuredOrder: 0, visible: true,
});

const AdminOpenSource = () => {
  const [projects, setProjects] = useState<OsProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(empty());
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getOpenSourceProjects();
      setProjects(data);
    } catch { setProjects([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(empty());
    setShowModal(true);
  };

  const openEdit = (p: OsProject) => {
    setEditingId(p.id);
    setForm({ name: p.name, description: p.description, repoUrl: p.repoUrl, language: p.language,
      logoUrl: p.logoUrl, techStack: p.techStack, stars: p.stars, forks: p.forks,
      featured: p.featured, featuredOrder: p.featuredOrder, visible: p.visible });
    setShowModal(true);
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await apiService.uploadImage(file);
      setForm(prev => ({ ...prev, logoUrl: url }));
    } catch (err: any) { alert(err.message || 'Erreur upload logo'); }
    finally { setUploadingLogo(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { alert('Le nom est requis'); return; }
    setSaving(true);
    try {
      if (editingId) {
        const updated = await adminApi.updateOpenSourceProject(editingId, form);
        setProjects(ps => ps.map(p => p.id === editingId ? updated : p));
      } else {
        const created = await adminApi.createOpenSourceProject(form);
        setProjects(ps => [created, ...ps]);
      }
      setShowModal(false);
    } catch (err: any) { alert(err.message || 'Erreur lors de la sauvegarde'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce projet ?')) return;
    try {
      await adminApi.deleteOpenSourceProject(id);
      setProjects(ps => ps.filter(p => p.id !== id));
    } catch (err: any) { alert(err.message || 'Erreur suppression'); }
  };

  const toggleVisibility = async (p: OsProject) => {
    try {
      const updated = await adminApi.updateOpenSourceProject(p.id, { ...p, visible: !p.visible });
      setProjects(ps => ps.map(x => x.id === p.id ? updated : x));
    } catch { /* silent */ }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Projets Open Source</h2>
          <p className="text-gray-500 text-sm">{projects.length} projet{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold/90">
          <Plus className="w-4 h-4" />Nouveau projet
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Code2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Aucun projet — créez-en un !</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <div key={p.id} className={`bg-white border rounded-xl p-5 ${p.visible ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {p.logoUrl ? (
                    <img src={p.logoUrl} alt={p.name} className="w-9 h-9 rounded-lg object-cover" />
                  ) : (
                    <div className="w-9 h-9 bg-gold/10 rounded-lg flex items-center justify-center">
                      <Code2 className="w-4 h-4 text-gold" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                    {p.language && <span className="text-xs text-gray-500">{p.language}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {p.featured && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20 font-medium">★ Featured</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 mb-3">{p.description || 'Pas de description.'}</p>
              <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                <span className="flex items-center gap-1"><Star className="w-3 h-3" />{p.stars}</span>
                <span className="flex items-center gap-1"><GitFork className="w-3 h-3" />{p.forks}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(p)} className="flex-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700">Modifier</button>
                <button onClick={() => toggleVisibility(p)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title={p.visible ? 'Masquer' : 'Afficher'}>
                  {p.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingId ? 'Modifier le projet' : 'Nouveau projet'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold/50 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold/50 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">URL du repo</label>
                  <input type="url" value={form.repoUrl} onChange={e => setForm(f => ({ ...f, repoUrl: e.target.value }))}
                    placeholder="https://github.com/..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold/50 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Langage</label>
                  <input value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                    placeholder="Java, Python..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold/50 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tech Stack</label>
                <input value={form.techStack} onChange={e => setForm(f => ({ ...f, techStack: e.target.value }))}
                  placeholder="Spring Boot, React, PostgreSQL..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold/50 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Étoiles</label>
                  <input type="number" min={0} value={form.stars} onChange={e => setForm(f => ({ ...f, stars: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold/50 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Forks</label>
                  <input type="number" min={0} value={form.forks} onChange={e => setForm(f => ({ ...f, forks: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold/50 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Logo du projet</label>
                {form.logoUrl ? (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={form.logoUrl} alt="logo" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setForm(f => ({ ...f, logoUrl: '' }))}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gold"
                    onClick={() => logoRef.current?.click()}>
                    {uploadingLogo ? <Loader2 className="w-5 h-5 animate-spin text-gold" /> : <Upload className="w-5 h-5 text-gray-400" />}
                    <span className="text-sm text-gray-500">{uploadingLogo ? 'Upload...' : 'Uploader un logo'}</span>
                    <input ref={logoRef} type="file" accept=".png,.jpg,.jpeg,.svg,.webp" onChange={handleLogoChange} className="hidden" />
                  </label>
                )}
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                    className="w-4 h-4 accent-yellow-500" />
                  Mis en avant (homepage)
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={form.visible} onChange={e => setForm(f => ({ ...f, visible: e.target.checked }))}
                    className="w-4 h-4 accent-blue-500" />
                  Visible
                </label>
              </div>
              {form.featured && (
                <div>
                  <label className="block text-sm font-medium mb-1">Ordre d'affichage</label>
                  <input type="number" min={0} value={form.featuredOrder} onChange={e => setForm(f => ({ ...f, featuredOrder: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold/50 outline-none" />
                </div>
              )}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Annuler</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold/90 flex items-center gap-2 text-sm">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingId ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOpenSource;
