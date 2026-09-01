// src/pages/admin/AdminResources.tsx
import { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Loader2, Trash2, Eye, Video, File, Search, Filter, X, Save, Youtube, Upload, Download, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/admin/viz';
import AsyncState from '@/components/ui/AsyncState';
import Pagination from '@/components/ui/Pagination';
import adminApi, { AdminResource, AdminCategory, AdminResourcePayload, PaginatedResponse } from '@/services/adminApi';
import apiService from '@/services/api';

import { errorMessage } from '@/lib/utils';
const AdminResources = () => {
  const [resources, setResources] = useState<AdminResource[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  /** Settled search term: firing a request per keystroke hammers the API. */
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  useEffect(() => {
    setPage(0);
  }, [selectedCategory, selectedType, debouncedSearch]);

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
    isDownloadable: true,
    content: '',
    author: '',
    readingTimeMinutes: '',
  });

  // File upload state
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPreview, setUploadingPreview] = useState(false);

  // Resource type ids are database rows: reading them avoids the drift a hardcoded
  // list suffers the moment a type is added.
  const [resourceTypes, setResourceTypes] = useState<{ id: number; name: string }[]>([]);

  const TYPE_LABELS: Record<string, string> = {
    VIDEO: 'Vidéo (YouTube ou fichier)',
    DOCUMENT: 'Document (PDF, Word, …)',
    ARTICLE: 'Article rédigé ici',
  };

  const selectedTypeName = resourceTypes
    .find(t => t.id.toString() === formData.resourceTypeId)?.name?.toUpperCase() ?? '';
  const isArticle = selectedTypeName === 'ARTICLE';
  const isVideo = selectedTypeName === 'VIDEO';

  useEffect(() => {
    adminApi.getResourceTypes()
      .then(setResourceTypes)
      .catch(err => console.error('Error loading resource types:', err));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const cats = await adminApi.getCategories();
        setCategories(cats);
        
        // Filtering happens in the query, not in the browser: the previous version pulled
        // one page and filtered that, so a search never reached rows on other pages.
        const data: PaginatedResponse<AdminResource> = await adminApi.getResources(page, PAGE_SIZE, {
          type: selectedType || undefined,
          categoryId: selectedCategory ? parseInt(selectedCategory) : undefined,
          search: debouncedSearch || undefined,
        });

        setResources(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
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
  }, [page, selectedCategory, selectedType, debouncedSearch]);

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
      // Dropping the row on failure too made a refused delete look like it worked.
      alert(errorMessage(err, 'La suppression a échoué.'));
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedType('');
    setPage(0);
  };

  const openEditModal = (resource: AdminResource) => {
    setEditingResource(resource);
    setUploadedFileName(resource.sourceType === 'UPLOADED' ? resource.url?.split('/').pop() || '' : '');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (previewInputRef.current) previewInputRef.current.value = '';
    setFormData({
      title: resource.title,
      description: resource.description || '',
      url: resource.url || '',
      previewImageUrl: resource.previewImageUrl || '',
      categoryId: resource.categoryId.toString(),
      resourceTypeId: resource.resourceTypeId.toString(),
      sourceType: (resource.sourceType === 'UPLOADED' ? 'UPLOADED' : 'EXTERNAL') as 'EXTERNAL' | 'UPLOADED',
      isDownloadable: resource.downloadable !== false,
      content: resource.content || '',
      author: '',
      readingTimeMinutes: '',
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingResource(null);
    setUploadedFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (previewInputRef.current) previewInputRef.current.value = '';
    setFormData({
      title: '',
      description: '',
      url: '',
      previewImageUrl: '',
      categoryId: categories[0]?.id?.toString() || '',
      resourceTypeId: resourceTypes[0]?.id?.toString() || '',
      sourceType: 'EXTERNAL',
        isDownloadable: true,
      content: '',
      author: '',
      readingTimeMinutes: '',
    });
    setShowModal(true);
  };

  const handlePreviewImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      alert('Format non supporté. Formats acceptés : PNG, JPEG, GIF, WebP.');
      return;
    }
    setUploadingPreview(true);
    try {
      const url = await apiService.uploadImage(file);
      setFormData(prev => ({ ...prev, previewImageUrl: url }));
    } catch (err) {
      alert(errorMessage(err, 'Erreur lors de l\'upload de l\'image'));
    } finally {
      setUploadingPreview(false);
    }
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
    } catch (err) {
      alert(errorMessage(err, 'Erreur lors de l\'upload du fichier'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.categoryId || !formData.resourceTypeId) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (isArticle && !formData.content.trim()) {
      alert("Le contenu de l'article est obligatoire");
      return;
    }
    if (!isArticle && !formData.url) {
      alert('Veuillez fournir une URL ou un fichier');
      return;
    }

    setSaving(true);
    try {
      const data: AdminResourcePayload = {
        title: formData.title,
        description: formData.description,
        url: isArticle ? undefined : formData.url,
        content: isArticle ? formData.content : undefined,
        author: isArticle ? formData.author || undefined : undefined,
        readingTimeMinutes: isArticle && formData.readingTimeMinutes
          ? parseInt(formData.readingTimeMinutes)
          : undefined,
        previewImageUrl: formData.previewImageUrl || undefined,
        categoryId: parseInt(formData.categoryId),
        resourceTypeId: parseInt(formData.resourceTypeId),
        sourceType: isArticle ? 'INLINE' : formData.sourceType,
        downloadable: isArticle ? false : formData.isDownloadable,
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
      <PageHeader icon={FileText} title="Ressources"
        subtitle={`${totalElements} ressource${totalElements !== 1 ? 's' : ''}`}
        actions={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold/90 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouvelle ressource</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
        } />

      {/* Search and Filters */}
      <div className="mb-6 p-4 bg-surface-1 rounded-2xl border border-line ">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-t3 mb-1">Rechercher</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-t4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Titre ou description..."
                className="w-full pl-10 pr-4 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
              />
            </div>
          </div>
          <div className="w-48">
            <label className="block text-xs text-t3 mb-1">Categorie</label>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(0); }}
              className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
            >
              <option value="">Toutes les categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs text-t3 mb-1">Type</label>
            <select
              value={selectedType}
              onChange={(e) => { setSelectedType(e.target.value); setPage(0); }}
              className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
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
                className="px-4 py-2 border border-line rounded-lg hover:bg-surface-2 text-sm"
              >
                Effacer
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-surface-1 rounded-2xl border border-line overflow-hidden">
        <AsyncState
          loading={loading}
          empty={resources.length === 0}
          emptyLabel="Aucune ressource ne correspond à ces filtres."
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-2 border-b border-line">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-t3 uppercase w-12">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-t3 uppercase">Titre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-t3 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-t3 uppercase">Catégorie</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-t3 uppercase">Vues</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-t3 uppercase">DL</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-t3 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {resources.map((resource, index) => (
                  <tr key={resource.id} className="hover:bg-surface-2">
                    {/* Position in the list, not the database id: a row number must not leak
                        how many records exist or let anyone walk the table by guessing. */}
                    <td className="px-4 py-3 text-sm text-t4 tabular-nums">
                      {page * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-t1 truncate max-w-[200px]">{resource.title}</p>
                        <p className="text-xs text-t4 truncate max-w-[200px]">{resource.description}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 w-fit ${
                        resource.resourceTypeName?.toLowerCase() === 'video'
                          ? 'bg-info-subtle text-info'
                          : 'bg-gold/20 text-gold'
                      }`}>
                        {resource.resourceTypeName?.toLowerCase() === 'video' ? <Video className="w-3 h-3" /> : <File className="w-3 h-3" />}
                        {resource.resourceTypeName?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-t3">{resource.categoryName}</td>
                    <td className="px-4 py-3 text-sm text-t3">{resource.viewCount ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-t3">{resource.downloadCount ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <a href={resource.url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 text-info hover:bg-info-subtle rounded-lg" title="Voir">
                          <Eye className="w-4 h-4" />
                        </a>
                        <button onClick={() => openEditModal(resource)}
                          className="p-1.5 text-gold hover:bg-gold/10 rounded-lg" title="Modifier">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(resource.id)}
                          className="p-1.5 text-error hover:bg-error-subtle rounded-lg" title="Supprimer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </div>

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-1 rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingResource ? 'Modifier la ressource' : 'Nouvelle ressource'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-surface-2 rounded"
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
                  className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
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
                  className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type *</label>
                <select
                  value={formData.resourceTypeId}
                  onChange={(e) => setFormData({ ...formData, resourceTypeId: e.target.value })}
                  className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
                  required
                >
                  {resourceTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {TYPE_LABELS[type.name.toUpperCase()] ?? type.name}
                    </option>
                  ))}
                </select>
                {isVideo && (
                  <p className="text-xs text-info mt-1">
                    <Youtube className="w-3 h-3 inline mr-1" />
                    Pour les vidéos:collez l'URL YouTube (ex: https://youtube.com/watch?v=xxx)
                  </p>
                )}
              </div>

              {/* Source type — visible only for videos */}
              {isVideo && (
                <div>
                  <label className="block text-sm font-medium mb-2">Source de la vidéo *</label>
                  <div className="flex gap-3">
                    {(['EXTERNAL', 'UPLOADED'] as const).map((s) => (
                      <label key={s} className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-colors text-sm ${
                        formData.sourceType === s ? 'border-gold bg-gold/5 text-t1' : 'border-line text-t3'
                      }`}>
                        <input type="radio" name="sourceType" value={s} checked={formData.sourceType === s}
                          onChange={() => setFormData(prev => ({ ...prev, sourceType: s, url: '' }))}
                          className="accent-yellow-500" />
                        {s === 'EXTERNAL' ? <><Youtube className="w-4 h-4 text-error" />YouTube / Externe</> : <><Upload className="w-4 h-4" />Uploader</>}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {isArticle && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Contenu de l'article *</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder={"# Titre\n\nÉcris ton article en Markdown."}
                      rows={14}
                      className="w-full px-4 py-2 border border-line rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                      required
                    />
                    <p className="text-xs text-t4 mt-1">Markdown supporté. Aucune URL n'est nécessaire.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Auteur</label>
                      <input
                        type="text"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        placeholder="Brandon Kamga"
                        className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Temps de lecture (min)</label>
                      <input
                        type="number"
                        min={1}
                        value={formData.readingTimeMinutes}
                        onChange={(e) => setFormData({ ...formData, readingTimeMinutes: e.target.value })}
                        placeholder="8"
                        className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className={isArticle ? 'hidden' : undefined}>
                <label className="block text-sm font-medium mb-1">
                  {formData.sourceType === 'UPLOADED' ? 'Fichier *' : 'URL *'}
                </label>
                {/* VIDEO — EXTERNAL */}
                {isVideo && formData.sourceType === 'EXTERNAL' && (
                  <input type="url" value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
                    required />
                )}

                {/* VIDEO — UPLOADED or DOCUMENT — always upload */}
                {!isArticle && (!isVideo || formData.sourceType === 'UPLOADED') && (
                  <div className="space-y-2">
                    <label
                      className="flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-dashed border-line rounded-lg cursor-pointer hover:border-gold transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-8 h-8 text-t4 mb-2" />
                      <span className="text-sm text-t3">Cliquez pour choisir un fichier</span>
                      <p className="text-xs text-t4 mt-1">PDF · Images · Vidéos (MP4, WebM)</p>
                      <input ref={fileInputRef} type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.gif,.mp4,.webm"
                        onChange={handleFileChange} className="hidden" />
                    </label>
                    {uploading && (
                      <p className="text-sm text-info flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />Upload en cours...
                      </p>
                    )}
                    {uploadedFileName && !uploading && (
                      <p className="text-sm text-success flex items-center gap-1">
                        <File className="w-4 h-4" />{uploadedFileName}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Image de prévisualisation *</label>
                <div className="space-y-2">
                  {formData.previewImageUrl ? (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-line group">
                      <img src={formData.previewImageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setFormData(prev => ({ ...prev, previewImageUrl: '' })); if (previewInputRef.current) previewInputRef.current.value = ''; }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label
                      className="flex flex-col items-center justify-center w-full px-4 py-5 border-2 border-dashed border-line rounded-lg cursor-pointer hover:border-gold transition-colors"
                      onClick={() => previewInputRef.current?.click()}
                    >
                      {uploadingPreview ? (
                        <Loader2 className="w-6 h-6 animate-spin text-gold mb-1" />
                      ) : (
                        <Upload className="w-6 h-6 text-t4 mb-1" />
                      )}
                      <span className="text-sm text-t3">
                        {uploadingPreview ? 'Upload en cours...' : 'Uploader une image d\'aperçu'}
                      </span>
                      <p className="text-xs text-t4 mt-1">PNG · JPEG · GIF · WebP</p>
                      <input ref={previewInputRef} type="file" accept=".png,.jpg,.jpeg,.gif,.webp"
                        onChange={handlePreviewImageChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Categorie *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
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
                {/* Downloading only makes sense for a document. A video is watched and an
                    article is read in place — the backend forces both non-downloadable
                    regardless, so we hide the toggle rather than offer a dead switch. */}
                {!isVideo && !isArticle && (
                  <label className="flex items-center justify-between p-3 border border-line rounded-lg cursor-pointer hover:bg-surface-2">
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">Téléchargement autorisé</p>
                        <p className="text-xs text-t4">Les utilisateurs pourront télécharger ce fichier</p>
                      </div>
                    </div>
                    <input type="checkbox" checked={formData.isDownloadable}
                      onChange={(e) => setFormData({ ...formData, isDownloadable: e.target.checked })}
                      className="w-4 h-4 accent-blue-500" />
                  </label>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-line rounded-lg hover:bg-surface-2"
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
