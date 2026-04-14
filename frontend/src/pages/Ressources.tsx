// src/pages/Ressources.tsx
import { useState, useEffect, useCallback } from 'react';
import SEO from '@/components/common/SEO';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService, Resource, Tag, Category, PaginatedResponse } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import {
  FileText,
  PlayCircle,
  Lock,
  Download,
  Loader2,
  Search,
  Crown,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  ExternalLink,
} from 'lucide-react';

type ResourceType = 'all' | 'VIDEO' | 'DOCUMENT';

const Ressources = () => {
  const { isAuthenticated, isPremium, user } = useAuth();
  const [searchParams] = useSearchParams();

  // Initialise l'onglet actif depuis ?type=VIDEO|DOCUMENT (liens du sous-menu)
  const initialTab = (): ResourceType => {
    const t = searchParams.get('type');
    if (t === 'VIDEO' || t === 'DOCUMENT') return t;
    return 'all';
  };

  // Data state
  const [resources, setResources] = useState<Resource[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);

  // Filter state
  const [activeTab, setActiveTab] = useState<ResourceType>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 12;

  // Synchronise l'onglet si le query param change (navigation depuis le menu)
  useEffect(() => {
    const t = searchParams.get('type');
    if (t === 'VIDEO' || t === 'DOCUMENT') setActiveTab(t);
    else if (!t) setActiveTab('all');
  }, [searchParams]);

  // Load filters (tags and categories)
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [tagsData, categoriesData] = await Promise.all([
          apiService.getTags(),
          apiService.getCategories()
        ]);
        setTags(tagsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to load filters:', error);
      } finally {
        setLoadingFilters(false);
      }
    };
    loadFilters();
  }, []);

  // Load resources with filters and pagination
  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      // Determine resource type filter based on tab
      let typeFilter: 'VIDEO' | 'DOCUMENT' | undefined;
      if (activeTab === 'VIDEO') typeFilter = 'VIDEO';
      else if (activeTab === 'DOCUMENT') typeFilter = 'DOCUMENT';
      
      const response: PaginatedResponse<Resource> = await apiService.getResources({
        type: typeFilter,
        categoryId: selectedCategory || undefined,
        tagIds: selectedTags.length > 0 ? selectedTags : undefined,
        search: searchTerm || undefined,
        page: currentPage,
        size: pageSize,
        sort: 'createdAt,desc'
      });
      
      setResources(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedCategory, selectedTags, searchTerm, currentPage]);

  // Initial load and when filters change
  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab, selectedCategory, selectedTags, searchTerm]);

  // Handle tab change
  const handleTabChange = (tab: ResourceType) => {
    setActiveTab(tab);
  };

  // Handle category filter
  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
  };

  // Handle tag toggle
  const handleTagToggle = (tagId: number) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedTags([]);
    setSearchTerm('');
  };

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is triggered by useEffect on searchTerm change
  };

  // Handle pagination
  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  /** A resource is accessible if it's free, or if the user has premium access. */
  const canAccess = (resource: Resource) => {
    if (!resource.premium) return true;
    return isAuthenticated && isPremium;
  };

  const handleOpen = async (resource: Resource) => {
    await apiService.trackResourceView(resource.id);
    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = async (resource: Resource) => {
    try {
      const url = await apiService.trackResourceDownload(resource.id);
      const a = document.createElement('a');
      a.href = url;
      a.download = resource.metadata?.originalFileName || resource.title;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // Fallback: open directly
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Get display name for resource type
  const getResourceTypeName = (type: string) => {
    return type === 'VIDEO' ? 'Video' : 'Document';
  };

  // Check if any filters are active
  const hasActiveFilters = selectedCategory !== null || selectedTags.length > 0 || searchTerm !== '';

  // Filter tags by selected category (tags belong to a category)
  const filteredTags = selectedCategory 
    ? tags.filter(tag => {
        // Tags in frontend don't have categoryId, so we show all tags when category is selected
        return true;
      })
    : tags;

  return (
    <Layout>
      <SEO
        title="Ressources tech — vidéos et documents"
        description="Accède à la bibliothèque de ressources LesCracks : tutoriels vidéo, guides techniques, articles et formations exclusives pour les apprenants."
        url="/ressources"
      />
      <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Nos <span className="text-gold">Ressources</span>
            </h1>
            <p className="text-white/60 max-w-2xl">
              Accedez a notre bibliotheque de documents et videos pour accelerer votre apprentissage.
            </p>
            {totalElements > 0 && (
              <p className="text-white/40 text-sm mt-2">
                {totalElements} ressource{totalElements !== 1 ? 's' : ''} disponible{totalElements !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Premium Notice */}
          {!isPremium && isAuthenticated && (
            <div className="mb-6 p-4 rounded-lg bg-gold/10 border border-gold/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="w-5 h-5 text-gold" />
                  <span className="text-white/80">
                    Passez premium pour acceder a toutes les ressources
                  </span>
                </div>
                <Link to="/premium" className="btn-primary text-sm py-2">
                  Passer Premium
                </Link>
              </div>
            </div>
          )}

          {/* Tabs — IDs match #bibliotheque / #videotheque hash links from nav/footer */}
          <div className="flex items-center gap-4 mb-6 border-b border-white/10 overflow-x-auto">
            <button
              onClick={() => handleTabChange('all')}
              className={`py-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'all'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              Toutes les ressources
            </button>
            <button
              id="bibliotheque"
              onClick={() => handleTabChange('DOCUMENT')}
              className={`py-3 px-1 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'DOCUMENT'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              Bibliothèque
            </button>
            <button
              id="videotheque"
              onClick={() => handleTabChange('VIDEO')}
              className={`py-3 px-1 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'VIDEO'
                  ? 'border-gold text-gold'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              Vidéothèque
            </button>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
              <input
                type="text"
                placeholder="Rechercher une ressource..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </form>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-gold/20 border-gold text-gold' : ''}`}
            >
              <Filter className="w-4 h-4" />
              Filtres
              {hasActiveFilters && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-gold text-black rounded-full">
                  {(selectedCategory ? 1 : 0) + selectedTags.length + (searchTerm ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filtres</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gold hover:text-gold/80 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Effacer
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="mb-4">
                <label className="block text-sm text-white/60 mb-2">Categorie</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCategoryChange(null)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      selectedCategory === null
                        ? 'bg-gold text-black'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    Toutes
                  </button>
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-gold text-black'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {!loadingFilters && tags.length > 0 && (
                <div>
                  <label className="block text-sm text-white/60 mb-2">
                    Tags (selection multiple - OU logique)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => handleTagToggle(tag.id)}
                        className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                          selectedTags.includes(tag.id)
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-sm text-white/40">Filtres actifs:</span>
              {selectedCategory !== null && (
                <span className="px-2 py-1 text-xs bg-white/10 rounded-full flex items-center gap-1">
                  Categorie: {categories.find(c => c.id === selectedCategory)?.name}
                  <button onClick={() => handleCategoryChange(null)} className="hover:text-gold">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedTags.map(tagId => (
                <span key={tagId} className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full flex items-center gap-1">
                  {tags.find(t => t.id === tagId)?.name}
                  <button onClick={() => handleTagToggle(tagId)} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {searchTerm && (
                <span className="px-2 py-1 text-xs bg-white/10 rounded-full flex items-center gap-1">
                  Recherche: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="hover:text-gold">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Resources Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
          ) : resources.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map((resource, index) => (
                  <motion.div
                    key={resource.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="card card-hover overflow-hidden"
                  >
                    {/* Thumbnail */}
                    <div className="h-36 bg-gradient-to-br from-gold/10 to-white/3 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
                      {resource.previewImageUrl ? (
                        <img src={resource.previewImageUrl} alt={resource.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-60" />
                      ) : null}
                      {resource.resourceTypeName === 'VIDEO' ? (
                        <PlayCircle className="w-12 h-12 text-gold/40 relative z-10" />
                      ) : (
                        <FileText className="w-12 h-12 text-gold/40 relative z-10" />
                      )}
                      {/* Premium badge */}
                      {resource.premium && (
                        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 bg-gold text-black rounded-full text-[10px] font-bold">
                          <Crown className="w-2.5 h-2.5" />
                          Premium
                        </div>
                      )}
                    </div>

                    {/* Type, Category */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        resource.resourceTypeName === 'VIDEO'
                          ? 'bg-blue-500/15 text-blue-400'
                          : 'bg-gold/15 text-gold'
                      }`}>
                        {getResourceTypeName(resource.resourceTypeName)}
                      </span>
                      {resource.categoryName && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-white/5 text-white/35">
                          {resource.categoryName}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {resource.tags && resource.tags.length > 0 && (
                      <div className="flex items-center gap-1 mb-2 flex-wrap">
                        {resource.tags.slice(0, 3).map(tag => (
                          <span key={tag.id} className="px-1.5 py-0.5 text-[10px] rounded bg-white/5 text-white/35">
                            {tag.name}
                          </span>
                        ))}
                        {resource.tags.length > 3 && (
                          <span className="text-[10px] text-white/30">+{resource.tags.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-base font-semibold mb-1.5 leading-snug">{resource.title}</h3>

                    {/* Description */}
                    <p className="text-white/50 text-sm mb-3 line-clamp-2 leading-relaxed flex-1">
                      {resource.description}
                    </p>

                    {/* Indicators */}
                    <div className="flex items-center gap-3 mb-3 text-xs text-white/25">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {resource.viewCount ?? 0}
                      </span>
                      {resource.downloadable && (
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {resource.downloadCount ?? 0}
                        </span>
                      )}
                    </div>

                    {/* CTA */}
                    {canAccess(resource) ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpen(resource)}
                          className="flex-1 btn-secondary text-center flex items-center justify-center gap-2 text-sm py-2"
                        >
                          {resource.resourceTypeName === 'VIDEO' ? (
                            <><PlayCircle className="w-4 h-4" />Regarder</>
                          ) : (
                            <><ExternalLink className="w-4 h-4" />Consulter</>
                          )}
                        </button>
                        {resource.downloadable && resource.resourceTypeName !== 'VIDEO' && (
                          <button
                            onClick={() => handleDownload(resource)}
                            className="px-3 py-2 border border-white/10 rounded-lg text-white/50 hover:text-gold hover:border-gold/30 transition-colors"
                            title="Télécharger"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="w-full flex items-center justify-center gap-2 py-2 border border-white/10 rounded-lg text-white/30 text-sm cursor-not-allowed">
                        <Lock className="w-4 h-4" />
                        {isAuthenticated ? 'Accès Premium requis' : 'Connexion requise'}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i;
                      } else if (currentPage < 3) {
                        pageNum = i;
                      } else if (currentPage > totalPages - 3) {
                        pageNum = totalPages - 5 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`w-10 h-10 rounded-lg transition-colors ${
                            currentPage === pageNum
                              ? 'bg-gold text-black'
                              : 'bg-white/10 hover:bg-white/20'
                          }`}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center py-24"
            >
              <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                <FileText className="w-12 h-12 text-white/20" />
              </div>
              <h3 className="text-lg font-semibold text-white/60 mb-2">Aucune ressource trouvée</h3>
              <p className="text-white/30 text-sm max-w-xs mb-6">
                {hasActiveFilters
                  ? 'Modifiez vos filtres pour voir plus de contenu.'
                  : 'Les ressources arrivent bientôt. Créez un compte pour être notifié.'}
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn-primary">
                  Réinitialiser les filtres
                </button>
              )}
              {!isAuthenticated && !hasActiveFilters && (
                <Link to="/inscription" className="btn-primary">
                  Créer un compte gratuit
                </Link>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Ressources;
