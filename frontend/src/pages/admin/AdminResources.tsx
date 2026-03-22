// src/pages/admin/AdminResources.tsx
import { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Loader2, Trash2, Eye, Video, File, ChevronLeft, ChevronRight, Search, Filter, X, Save, Youtube, Upload, Crown, Download, Lock } from 'lucide-react';
import adminApi, { AdminResource, AdminCategory, PaginatedResponse } from '@/services/adminApi';
import apiService from '@/services/api';

const AdminResources = () => {
  const [resources, setResources] = useState<AdminResource[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  // Create/Edit modal states
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState<AdminResource | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    previewImageUrl: '',
    categoryId: '',
    resourceTypeId: '',
    sourceType: 'EXTERNAL' as 'EXTERNAL' | 'UPLOADED',
    isPremium: false,
    isDownloadable: true,
  });

  // File upload state
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resource types
  const resourceTypes = [
    { id: 1, name: 'VIDEO', label: 'Vidéo (YouTube)' },
    { id: 2, name: 'DOCUMENT', label: 'Document (PDF)' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const cats = await adminApi.getCategories();
        setCategories(cats);
        
        const data: PaginatedResponse<AdminResource> = await adminApi.getResources(page, 100);
        
        let filtered = data.content;
        if (searchQuery) {
          filtered = filtered.filter(r => 
            r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.description?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        if (selectedCategory) {
          filtered = filtered.filter(r => r.categoryId.toString() === selectedCategory);
        }
        if (selectedType) {
          filtered = filtered.filter(r => r.resourceTypeName?.toLowerCase() === selectedType.toLowerCase());
        }
        
        setResources(filtered);
        setTotalPages(Math.ceil(filtered.length / 20) || 1);
        setTotalElements(filtered.length);
      } catch (err) {
        console.error('Error loading resources:', err);
        setResources([]);
        setCategories([]);
        setTotalPages(0);
        setTotalElements(0);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, selectedCategory, selectedType, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette ressource?')) return;
    try {
      await adminApi.deleteResource(id);
      setResources(resources.filter(r => r.id !== id));
    } catch (err) {
      setResources(resources.filter(r => r.id !== id));
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedType('');
    setPage(0);
  };

  const openCreateModal = () => {
    setEditingResource(null);
    setUploadedFileName('');
    setFormData({
      title: '',
      description: '',
      url: '',
      previewImageUrl: '',
      categoryId: categories[0]?.id?.toString() || '',
      resourceTypeId: '1',
      sourceType: 'EXTERNAL',
      isPremium: false,
      isDownloadable: true,
    });
    setShowModal(true);
  };

  // Real multipart upload — sends file to backend, stores URL from response
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'video/mp4', 'video/webm'];
    if (!allowed.includes(file.type)) {
      alert('Format non supporté. Formats acceptés : PDF, images (PNG, JPEG, GIF), vidéos (MP4, WebM).');
      return;
    }

    setUploading(true);
    try {
      const url = await apiService.uploadResourceFile(file);
      setFormData(prev => ({ ...prev, url, sourceType: 'UPLOADED' }));
      setUploadedFileName(file.name);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'upload du fichier');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url || !formData.categoryId || !formData.resourceTypeId) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSaving(true);
    try {
      const data = {
        title: formData.title,
        description: formData.description,
        url: formData.url,
        previewImageUrl: formData.previewImageUrl || undefined,
        categoryId: parseInt(formData.categoryId),
        resourceTypeId: parseInt(formData.resourceTypeId),
        sourceType: formData.sourceType,
        premium: formData.isPremium,
        downloadable: formData.isDownloadable,
      };

      if (editingResource) {
        // Update existing
        await adminApi.updateResource(editingResource.id, data);
        setResources(resources.map(r => r.id === editingResource.id ? { ...r, ...data, categoryName: categories.find(c => c.id.toString() === formData.categoryId)?.name || '' } : r));
      } else {
        // Create new
        const created = await adminApi.createResource(data);
        setResources([created, ...resources]);
      }
      setShowModal(false);
    } catch (err) {
      console.error('Error saving resource:', err);
      alert('Erreur lors de la sauvegarde de la ressource');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ressources</h2>
          <p className="text-gray-500 text-sm">{totalElements} ressource{totalElements !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle Ressource
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Rechercher</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Titre ou description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
              />
            </div>
          </div>
          <div className="w-48">
            <label className="block text-xs text-gray-500 mb-1">Categorie</label>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(0); }}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
            >
              <option value="">Toutes les categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select
              value={selectedType}
              onChange={(e) => { setSelectedType(e.target.value); setPage(0); }}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
            >
              <option value="">Tous les types</option>
              <option value="VIDEO">Video</option>
              <option value="DOCUMENT">Document</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold/90"
            >
              <Filter className="w-4 h-4" />
            </button>
            {(searchQuery || selectedCategory || selectedType) && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
              >
                Effacer
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vues</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">DL</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accès</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {resources.map((resource) => (
                  <tr key={resource.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{resource.title}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">{resource.description}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 w-fit ${
                        resource.resourceTypeName?.toLowerCase() === 'video'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gold/20 text-gold'
                      }`}>
                        {resource.resourceTypeName?.toLowerCase() === 'video' ? <Video className="w-3 h-3" /> : <File className="w-3 h-3" />}
                        {resource.resourceTypeName?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{resource.categoryName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{(resource as any).viewCount ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{(resource as any).downloadCount ?? 0}</td>
                    <td className="px-4 py-3">
                      {(resource as any).premium ? (
                        <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                          <Crown className="w-3 h-3" />Premium
                        </span>
                      ) : (
                        <span className="text-xs text-green-600">Gratuit</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <a href={resource.url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Voir">
                          <Eye className="w-4 h-4" />
                        </a>
                        <button onClick={() => handleDelete(resource.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600">Page {page + 1} sur {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {!loading && resources.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucune ressource trouvee</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingResource ? 'Modifier la ressource' : 'Nouvelle ressource'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Titre de la ressource"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de la ressource"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type *</label>
                <select
                  value={formData.resourceTypeId}
                  onChange={(e) => setFormData({ ...formData, resourceTypeId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
                  required
                >
                  {resourceTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
                {formData.resourceTypeId === '1' && (
                  <p className="text-xs text-blue-600 mt-1">
                    <Youtube className="w-3 h-3 inline mr-1" />
                    Pour les vidéos:collez l'URL YouTube (ex: https://youtube.com/watch?v=xxx)
                  </p>
                )}
              </div>

              {/* Source type — visible only for videos */}
              {formData.resourceTypeId === '1' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Source de la vidéo *</label>
                  <div className="flex gap-3">
                    {(['EXTERNAL', 'UPLOADED'] as const).map((s) => (
                      <label key={s} className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-colors text-sm ${
                        formData.sourceType === s ? 'border-gold bg-gold/5 text-gray-900' : 'border-gray-200 text-gray-600'
                      }`}>
                        <input type="radio" name="sourceType" value={s} checked={formData.sourceType === s}
                          onChange={() => setFormData(prev => ({ ...prev, sourceType: s, url: '' }))}
                          className="accent-yellow-500" />
                        {s === 'EXTERNAL' ? <><Youtube className="w-4 h-4 text-red-500" />YouTube / Externe</> : <><Upload className="w-4 h-4" />Uploader</>}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  {formData.sourceType === 'UPLOADED' ? 'Fichier *' : 'URL *'}
                </label>
                {/* VIDEO — EXTERNAL */}
                {formData.resourceTypeId === '1' && formData.sourceType === 'EXTERNAL' && (
                  <input type="url" value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
                    required />
                )}

                {/* VIDEO — UPLOADED or DOCUMENT — always upload */}
                {(formData.resourceTypeId !== '1' || formData.sourceType === 'UPLOADED') && (
                  <div className="space-y-2">
                    <label
                      className="flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gold transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Cliquez pour choisir un fichier</span>
                      <p className="text-xs text-gray-400 mt-1">PDF · Images · Vidéos (MP4, WebM)</p>
                      <input ref={fileInputRef} type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.gif,.mp4,.webm"
                        onChange={handleFileChange} className="hidden" />
                    </label>
                    {uploading && (
                      <p className="text-sm text-blue-600 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />Upload en cours...
                      </p>
                    )}
                    {uploadedFileName && !uploading && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <File className="w-4 h-4" />{uploadedFileName}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Image de prévisualisation</label>
                <input
                  type="url"
                  value={formData.previewImageUrl}
                  onChange={(e) => setFormData({ ...formData, previewImageUrl: e.target.value })}
                  placeholder="https://exemple.com/image-preview.jpg"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
                <p className="text-xs text-gray-500 mt-1">URL de l'image qui s'affichera comme aperçu</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Categorie *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
                  required
                >
                  <option value="">Selectionner une categorie</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Access & download toggles */}
              <div className="flex flex-col gap-3 pt-1">
                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">Accès Premium uniquement</p>
                      <p className="text-xs text-gray-400">Les utilisateurs gratuits verront un cadenas</p>
                    </div>
                  </div>
                  <input type="checkbox" checked={formData.isPremium}
                    onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                    className="w-4 h-4 accent-yellow-500" />
                </label>
                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Téléchargement autorisé</p>
                      <p className="text-xs text-gray-400">Les utilisateurs pourront télécharger ce fichier</p>
                    </div>
                  </div>
                  <input type="checkbox" checked={formData.isDownloadable}
                    onChange={(e) => setFormData({ ...formData, isDownloadable: e.target.checked })}
                    className="w-4 h-4 accent-blue-500" />
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold/90 flex items-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingResource ? 'Mettre a jour' : 'Creer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminResources;
