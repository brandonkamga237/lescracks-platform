// src/pages/admin/AdminContributors.tsx
import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, X, Loader2, Github, Linkedin, Globe, Twitter, Upload, Eye, EyeOff, Users } from 'lucide-react';
import adminApi from '@/services/adminApi';
import apiService from '@/services/api';

interface Contributor {
  id: number;
  name: string;
  description: string;
  photoUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  websiteUrl: string;
  twitterUrl: string;
  contributedProjects: string[];
  displayOrder: number;
  visible: boolean;
}

const empty = (): Omit<Contributor, 'id'> => ({
  name: '', description: '', photoUrl: '', githubUrl: '', linkedinUrl: '',
  websiteUrl: '', twitterUrl: '', contributedProjects: [], displayOrder: 0, visible: true,
});

const AdminContributors = () => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(empty());
  const [projectInput, setProjectInput] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getContributors();
      setContributors(data);
    } catch { setContributors([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(empty());
    setProjectInput('');
    setShowModal(true);
  };

  const openEdit = (c: Contributor) => {
    setEditingId(c.id);
    setForm({ name: c.name, description: c.description, photoUrl: c.photoUrl,
      githubUrl: c.githubUrl, linkedinUrl: c.linkedinUrl, websiteUrl: c.websiteUrl,
      twitterUrl: c.twitterUrl, contributedProjects: c.contributedProjects || [],
      displayOrder: c.displayOrder, visible: c.visible });
    setProjectInput('');
    setShowModal(true);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const url = await apiService.uploadImage(file);
      setForm(prev => ({ ...prev, photoUrl: url }));
    } catch (err: any) { alert(err.message || 'Erreur upload photo'); }
    finally { setUploadingPhoto(false); }
  };

  const addProject = () => {
    const p = projectInput.trim();
    if (!p || form.contributedProjects.includes(p)) return;
    setForm(f => ({ ...f, contributedProjects: [...f.contributedProjects, p] }));
    setProjectInput('');
  };

  const removeProject = (p: string) => {
    setForm(f => ({ ...f, contributedProjects: f.contributedProjects.filter(x => x !== p) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { alert('Le nom est requis'); return; }
    setSaving(true);
    try {
      if (editingId) {
        const updated = await adminApi.updateContributor(editingId, form);
        setContributors(cs => cs.map(c => c.id === editingId ? updated : c));
      } else {
        const created = await adminApi.createContributor(form);
        setContributors(cs => [created, ...cs]);
      }
      setShowModal(false);
    } catch (err: any) { alert(err.message || 'Erreur lors de la sauvegarde'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce contributeur ?')) return;
    try {
      await adminApi.deleteContributor(id);
      setContributors(cs => cs.filter(c => c.id !== id));
    } catch (err: any) { alert(err.message || 'Erreur suppression'); }
  };

  const toggleVisibility = async (c: Contributor) => {
    try {
      const updated = await adminApi.updateContributor(c.id, { ...c, visible: !c.visible });
      setContributors(cs => cs.map(x => x.id === c.id ? updated : x));
    } catch { /* silent */ }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contributeurs Open Source</h2>
          <p className="text-gray-500 text-sm">{contributors.length} contributeur{contributors.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold/90">
          <Plus className="w-4 h-4" />Nouveau contributeur
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
      ) : contributors.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Aucun contributeur — ajoutez-en un !</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {contributors.map(c => (
            <div key={c.id} className={`bg-white border rounded-xl p-5 text-center ${c.visible ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-60'}`}>
              {c.photoUrl ? (
                <img src={c.photoUrl} alt={c.name} className="w-16 h-16 rounded-full object-cover mx-auto mb-3 ring-2 ring-gray-100" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-gold">{c.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <p className="font-semibold text-gray-900 text-sm mb-1">{c.name}</p>
              {c.description && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{c.description}</p>
              )}
              {c.contributedProjects?.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center mb-3">
                  {c.contributedProjects.slice(0, 2).map(p => (
                    <span key={p} className="text-xs px-1.5 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">{p}</span>
                  ))}
                  {c.contributedProjects.length > 2 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">+{c.contributedProjects.length - 2}</span>
                  )}
                </div>
              )}
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => openEdit(c)} className="flex-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700">Modifier</button>
                <button onClick={() => toggleVisibility(c)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg" title={c.visible ? 'Masquer' : 'Afficher'}>
                  {c.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => handleDelete(c.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
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
              <h3 className="text-lg font-semibold">{editingId ? 'Modifier le contributeur' : 'Nouveau contributeur'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo */}
              <div className="flex items-center gap-4">
                {form.photoUrl ? (
                  <div className="relative group">
                    <img src={form.photoUrl} alt="photo" className="w-20 h-20 rounded-full object-cover ring-2 ring-gray-200" />
                    <button type="button" onClick={() => setForm(f => ({ ...f, photoUrl: '' }))}
                      className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-gold"
                    onClick={() => photoRef.current?.click()}>
                    {uploadingPhoto ? <Loader2 className="w-5 h-5 animate-spin text-gold" /> : <Upload className="w-5 h-5 text-gray-400" />}
                    <span className="text-xs text-gray-400 mt-1">Photo</span>
                    <input ref={photoRef} type="file" accept=".png,.jpg,.jpeg,.webp" onChange={handlePhotoChange} className="hidden" />
                  </label>
                )}
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Nom *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold/50 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description / Bio</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  placeholder="Développeur Full Stack spécialisé en..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold/50 outline-none" />
              </div>

              {/* Social links */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Liens</label>
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4 text-gray-400 shrink-0" />
                  <input value={form.githubUrl} onChange={e => setForm(f => ({ ...f, githubUrl: e.target.value }))}
                    placeholder="https://github.com/username"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold/50 outline-none text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-blue-500 shrink-0" />
                  <input value={form.linkedinUrl} onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))}
                    placeholder="https://linkedin.com/in/username"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold/50 outline-none text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <Twitter className="w-4 h-4 text-sky-400 shrink-0" />
                  <input value={form.twitterUrl} onChange={e => setForm(f => ({ ...f, twitterUrl: e.target.value }))}
                    placeholder="https://twitter.com/username"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold/50 outline-none text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gold shrink-0" />
                  <input type="url" value={form.websiteUrl} onChange={e => setForm(f => ({ ...f, websiteUrl: e.target.value }))}
                    placeholder="https://monsite.com"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold/50 outline-none text-sm" />
                </div>
              </div>

              {/* Projects */}
              <div>
                <label className="block text-sm font-medium mb-1">Projets contribués</label>
                <div className="flex gap-2 mb-2">
                  <input value={projectInput} onChange={e => setProjectInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addProject(); }}}
                    placeholder="Nom du projet (Entrée pour ajouter)"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gold/50 outline-none text-sm" />
                  <button type="button" onClick={addProject}
                    className="px-3 py-2 bg-gold text-black rounded-lg hover:bg-gold/90 text-sm font-medium">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {form.contributedProjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.contributedProjects.map(p => (
                      <span key={p} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20 text-xs">
                        {p}
                        <button type="button" onClick={() => removeProject(p)} className="hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Ordre d'affichage</label>
                  <input type="number" min={0} value={form.displayOrder}
                    onChange={e => setForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))}
                    className="w-16 px-2 py-1 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-gold/50" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={form.visible} onChange={e => setForm(f => ({ ...f, visible: e.target.checked }))}
                    className="w-4 h-4 accent-blue-500" />
                  Visible
                </label>
              </div>

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

export default AdminContributors;
