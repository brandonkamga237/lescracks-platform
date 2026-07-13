import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  PlayCircle,
  Download,
  ExternalLink,
  Eye,
  Crown,
  Lock,
  Tag,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ResourceEngagement from '@/components/resources/ResourceEngagement';
import SEO from '@/components/common/SEO';
import { apiService, Resource } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Link as RouterLink } from 'react-router-dom';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatSize(bytes?: number) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

export default function RessourceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated, isPremium } = useAuth();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    apiService.getResourceBySlug(slug)
      .then(r => {
        setResource(r);
        apiService.trackResourceView(r.id).catch(() => {});
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !resource) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-40 px-4 text-center">
          <p className="text-5xl mb-4">📭</p>
          <h1 className="text-2xl font-bold text-white mb-2">Ressource introuvable</h1>
          <p className="text-t3 mb-8">Cette ressource n'existe pas ou a été retirée.</p>
          <Link to="/ressources" className="flex items-center gap-2 text-gold hover:text-gold/80 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Toutes les ressources
          </Link>
        </div>
      </Layout>
    );
  }

  const isVideo = resource.resourceTypeName === 'VIDEO';

  /**
   * Browsing the catalogue is public. Opening or downloading the CONTENT is not.
   *
   * The server now enforces this (the file endpoint used to be permitAll, so anyone
   * with the URL could pull down any file, premium included). We mirror the rule here
   * so the button says "connecte-toi" instead of firing a request that would 401.
   */
  const canAccess = isAuthenticated && (!resource.premium || isPremium);
  const fileSize = formatSize(resource.metadata?.fileSize);

  const seoDescription = resource.description
    ? resource.description.slice(0, 155)
    : `${isVideo ? 'Vidéo' : 'Document'} LesCracks — ${resource.categoryName}${resource.tags?.length ? ' · ' + resource.tags.slice(0, 3).map(t => t.name).join(', ') : ''}`;

  const handleOpen = async () => {
    await apiService.trackResourceView(resource.id).catch(() => {});
    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = async () => {
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
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Layout>
      <SEO
        title={`${resource.title} — Ressources LesCracks`}
        description={seoDescription}
        url={`/ressources/${resource.slug || resource.id}`}
      />

      {/* Breadcrumb */}
      <div className="pt-20 pb-4 px-4 max-w-4xl mx-auto">
        <nav className="flex items-center gap-2 text-xs text-t4">
          <RouterLink to="/ressources" className="hover:text-t2 transition-colors">Ressources</RouterLink>
          <ChevronRight className="w-3 h-3" />
          {resource.categoryName && (
            <>
              <RouterLink
                to={`/ressources?categoryId=${resource.categoryId}`}
                className="hover:text-t2 transition-colors"
              >
                {resource.categoryName}
              </RouterLink>
              <ChevronRight className="w-3 h-3" />
            </>
          )}
          <span className="text-t3 truncate max-w-[180px]">{resource.title}</span>
        </nav>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8">

          {/* ── Main ─────────────────────────────────────────────── */}
          <div className="md:col-span-2">

            {/* Thumbnail */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative h-52 sm:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-white/5 to-white/2 border border-line-soft mb-6 flex items-center justify-center"
            >
              {resource.previewImageUrl && (
                <img
                  src={resource.previewImageUrl}
                  alt={resource.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-50"
                />
              )}
              {isVideo ? (
                <PlayCircle className="w-16 h-16 text-gold/50 relative z-10" />
              ) : (
                <FileText className="w-16 h-16 text-gold/50 relative z-10" />
              )}
              {resource.premium && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 bg-gold text-black rounded-full text-xs font-bold">
                  <Crown className="w-3 h-3" /> Premium
                </div>
              )}
            </motion.div>

            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="flex items-center gap-2 flex-wrap mb-4"
            >
              <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                isVideo ? 'bg-blue-500/15 text-blue-400' : 'bg-gold/15 text-gold'
              }`}>
                {isVideo ? 'Vidéo' : 'Document'}
              </span>
              {resource.categoryName && (
                <span className="px-2.5 py-1 text-xs rounded-full bg-white/6 text-t3">
                  {resource.categoryName}
                </span>
              )}
              {fileSize && (
                <span className="px-2.5 py-1 text-xs rounded-full bg-white/6 text-t4">
                  {fileSize}
                </span>
              )}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="text-2xl sm:text-3xl font-display font-bold text-white mb-4 leading-tight"
            >
              {resource.title}
            </motion.h1>

            {/* Description */}
            {resource.description && (
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-t2 leading-relaxed mb-6 text-sm"
              >
                {resource.description}
              </motion.p>
            )}

            {/* Tags */}
            {resource.tags && resource.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.12 }}
                className="flex items-center gap-2 flex-wrap mb-6"
              >
                <Tag className="w-3.5 h-3.5 text-t4" />
                {resource.tags.map(tag => (
                  <RouterLink
                    key={tag.id}
                    to={`/ressources?tagIds=${tag.id}`}
                    className="px-2 py-0.5 text-xs rounded bg-white/5 border border-line-soft text-t3 hover:text-t1 hover:border-line-strong transition-colors"
                  >
                    {tag.name}
                  </RouterLink>
                ))}
              </motion.div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-5 text-xs text-t4 mb-6">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                {resource.viewCount ?? 0} vue{(resource.viewCount ?? 0) !== 1 ? 's' : ''}
              </span>
              {resource.downloadable && (
                <span className="flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  {resource.downloadCount ?? 0} téléchargement{(resource.downloadCount ?? 0) !== 1 ? 's' : ''}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(resource.createdAt)}
              </span>
            </div>
          </div>

          {/* ── Sidebar ──────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* CTA card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/4 border border-line-soft rounded-2xl p-5"
            >
              {canAccess ? (
                <div className="space-y-3">
                  <p className="text-xs text-t3 text-center mb-1">Accès libre</p>
                  <button
                    onClick={handleOpen}
                    className="w-full flex items-center justify-center gap-2 bg-gold text-black font-semibold px-4 py-3 rounded-xl hover:bg-gold/80 transition-colors text-sm"
                  >
                    {isVideo ? (
                      <><PlayCircle className="w-4 h-4" /> Regarder la vidéo</>
                    ) : (
                      <><ExternalLink className="w-4 h-4" /> Consulter le document</>
                    )}
                  </button>
                  {resource.downloadable && !isVideo && (
                    <button
                      onClick={handleDownload}
                      className="w-full flex items-center justify-center gap-2 bg-white/6 border border-line text-t1 font-medium px-4 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" /> Télécharger
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto">
                    <Lock className="w-5 h-5 text-gold" />
                  </div>
                  {/* Three different reasons to be blocked — say which one it is, rather
                      than telling a logged-out visitor about Premium when all they need
                      is an account. */}
                  <p className="text-sm text-t2 leading-relaxed">
                    {!isAuthenticated
                      ? (resource.premium
                          ? 'Cette ressource est réservée aux membres Premium. Connecte-toi pour continuer.'
                          : 'Connecte-toi pour ouvrir cette ressource. La consultation du catalogue reste libre.')
                      : 'Cette ressource est réservée aux membres Premium.'}
                  </p>
                  {isAuthenticated ? (
                    <Link
                      to="/premium"
                      className="w-full flex items-center justify-center gap-2 bg-gold text-black font-semibold px-4 py-2.5 rounded-xl hover:bg-gold/80 transition-colors text-sm"
                    >
                      <Crown className="w-4 h-4" /> Passer Premium
                    </Link>
                  ) : (
                    <Link
                      to={`/connexion?redirect=/ressources/${resource.slug || resource.id}`}
                      className="w-full flex items-center justify-center gap-2 bg-gold text-black font-semibold px-4 py-2.5 rounded-xl hover:bg-gold/80 transition-colors text-sm"
                    >
                      Se connecter
                    </Link>
                  )}
                </div>
              )}
            </motion.div>

            {/* Back */}
            <Link
              to="/ressources"
              className="flex items-center gap-2 text-xs text-t4 hover:text-t2 transition-colors px-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Toutes les ressources
            </Link>
          </div>
        </div>

        {/* Likes & comments — readable by anyone, writable only with an account. */}
        <div className="md:max-w-2xl">
          <ResourceEngagement
            resourceId={resource.id}
            returnTo={`/ressources/${resource.slug || resource.id}`}
          />
        </div>
      </div>
    </Layout>
  );
}
