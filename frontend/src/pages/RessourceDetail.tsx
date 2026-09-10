import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Download, ExternalLink } from 'lucide-react';

import ArticleRenderer from '@/components/resources/ArticleRenderer';
import ResourceShare from '@/components/resources/ResourceShare';
import SEO from '@/components/common/SEO';
import Layout from '@/components/layout/Layout';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { api } from '@/services/api';
import { resourcePath } from '@/lib/slugs';
import { ENV } from '@/config/env';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

function megabytes(bytes: number): string {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} Mo`;
}

export default function RessourceDetail() {
  const { id = '' } = useParams();
  const location = useLocation();
  const { isSignedIn, signIn } = useSession();
  const hasParam = id.trim().length > 0;
  const resource = useApi((signal) => hasParam ? api.resource(id, signal) : Promise.resolve(null), [id, hasParam]);
  const likes = useApi((signal) => hasParam && resource.data?.id ? api.resourceLikes(resource.data.id, signal) : Promise.resolve(null), [resource.data?.id, hasParam, isSignedIn]);
  const loaded = hasParam && !resource.loading && !resource.error && resource.data ? resource.data : null;
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(loaded?.likeCount ?? 0);

  useEffect(() => {
    if (likes.data) {
      setLiked(likes.data.liked);
      setLikeCount(likes.data.count);
    }
  }, [likes.data]);
  const previousPath: unknown = location.state?.cataloguePath;
  const cataloguePath = typeof previousPath === 'string' && /^\/ressources(?:\/(?:ebooks|videos|articles))?(?:\?.*)?$/.test(previousPath) ? previousPath : '/ressources';
  const missing = !hasParam || resource.error?.status === 404;

  async function toggleLike() {
    if (!loaded) return;
    if (!isSignedIn) { signIn(resourcePath(loaded)); return; }
    if (liking) return;
    setLiking(true);
    try {
      const status = liked ? await api.unlikeResource(loaded.id) : await api.likeResource(loaded.id);
      setLiked(status.liked);
      setLikeCount(status.count);
    } finally { setLiking(false); }
  }

  return (
    <Layout>
      <SEO title={loaded?.title ?? (missing ? 'Ressource introuvable' : 'Ressource')} description={loaded?.description ?? 'Découvre les ebooks et vidéos de la bibliothèque LesCracks.'} image={loaded?.coverImage || undefined} url={loaded ? resourcePath(loaded) : '/ressources'} />
      <article className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-16">
        <nav aria-label="Fil d’Ariane" className="flex flex-wrap items-center gap-3 text-sm text-t3">
          <Link to={cataloguePath} className="inline-flex min-h-11 items-center gap-2 rounded-lg transition-colors hover:text-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"><ArrowLeft className="h-4 w-4" aria-hidden />La bibliothèque</Link>
          {loaded && <><span aria-hidden>/</span><span className="min-w-0 truncate text-t2" aria-current="page">{loaded.title}</span></>}
        </nav>

        {hasParam && resource.loading && <p className="py-24 text-center text-t3" role="status">Chargement de la ressource…</p>}
        {(missing || resource.error) && <div className="my-12 rounded-2xl border border-line bg-noir-900 px-6 py-16 text-center" role="alert"><h1 className="font-display text-3xl text-t1">{missing ? 'Cette ressource est introuvable.' : 'Impossible de charger cette ressource.'}</h1><p className="mx-auto mt-4 max-w-lg text-t3">{missing ? 'Elle n’est peut-être plus publiée. La bibliothèque reste ouverte pour découvrir un autre sujet.' : resource.error?.message}</p>{!missing && <button type="button" onClick={resource.reload} className="mt-6 min-h-11 rounded-xl bg-gold-400 px-5 font-medium text-noir-950">Réessayer</button>}<Link to={cataloguePath} className="mx-auto mt-5 block w-fit py-2 text-sm text-gold-400 underline underline-offset-4">Retour à la bibliothèque</Link></div>}

        {loaded && <>
          <header className="mt-8 max-w-4xl sm:mt-12">
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1.5 text-gold-400">{loaded.kind === 'EBOOK' ? 'Ebook' : loaded.kind === 'ARTICLE' ? 'Article' : 'Vidéo'}</span>
              {loaded.categoryName && <span className="tracking-wide text-t3">{loaded.categoryName}</span>}
            </div>
            <h1 className="mt-5 break-words font-display text-4xl font-semibold leading-[1.1] tracking-tight text-t1 sm:text-5xl lg:text-6xl">{loaded.title}</h1>
            {loaded.createdAt && <p className="mt-5 text-sm text-t3">Publié le <time dateTime={loaded.createdAt}>{dateFormat.format(new Date(loaded.createdAt))}</time></p>}
          </header>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-12">
            <div className="min-w-0">
              <div className="aspect-[16/9] overflow-hidden rounded-2xl border border-line bg-noir-800">
                {loaded.coverImage && failedImage !== loaded.coverImage ? <img src={loaded.coverImage} alt={`Couverture de ${loaded.title}`} onError={() => setFailedImage(loaded.coverImage)} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-gold-400/10 via-noir-800 to-noir-950" aria-hidden><span className="font-display text-3xl text-white/10">{loaded.kind === 'EBOOK' ? 'Ebook' : loaded.kind === 'ARTICLE' ? 'Article' : 'Vidéo'}</span></div>}
              </div>
              <section className="mt-10" aria-labelledby="resource-description">
                <h2 id="resource-description" className="font-display text-2xl font-semibold text-t1">{loaded.kind === 'ARTICLE' ? 'Contenu de l’article' : 'À propos de cette ressource'}</h2>
                <p className="mt-5 whitespace-pre-line break-words text-base leading-loose text-t2 sm:text-lg">{loaded.description}</p>
                {loaded.kind === 'ARTICLE' && <div className="mt-8"><ArticleRenderer resource={loaded} /></div>}
                {loaded.tags?.length > 0 && (
                  <div className="mt-7">
                    <h3 className="text-xs font-semibold tracking-wide text-t4">Sujets abordés</h3>
                    <ul aria-label="Sujets abordés" className="mt-3 flex flex-wrap gap-2">
                      {loaded.tags.map((tag) => (
                        <li key={tag} className="rounded-md border border-line-soft bg-noir-950 px-3 py-1.5 text-sm font-medium text-t3">{tag}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            </div>

            <aside className="rounded-2xl border border-line bg-noir-900 p-6 sm:p-7 lg:sticky lg:top-28" aria-label="Accéder à la ressource">
              <h2 className="font-display text-2xl font-semibold text-t1">{loaded.kind === 'EBOOK' ? 'Télécharge l’ebook' : loaded.kind === 'ARTICLE' ? 'Lire l’article' : 'Regarde la vidéo'}</h2>
              <p className="mt-3 text-sm leading-relaxed text-t3">{loaded.kind === 'EBOOK' ? 'Télécharge le support et avance à ton rythme, où que tu sois.' : loaded.kind === 'ARTICLE' ? `Temps de lecture estimé : ${loaded.readingMinutes ?? 1} min.` : 'Retrouve la vidéo directement sur sa plateforme de diffusion.'}</p>
              <dl className="my-6 space-y-4 border-y border-line-soft py-5 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-t3">Type</dt><dd className="text-right text-t1">{loaded.kind === 'EBOOK' ? 'Ebook' : loaded.kind === 'ARTICLE' ? 'Article' : 'Vidéo externe'}</dd></div>
                {loaded.fileFormat && <div className="flex justify-between gap-4"><dt className="text-t3">Format du fichier</dt><dd className="break-all text-right text-t1">{loaded.fileFormat}</dd></div>}
                {loaded.fileSize != null && loaded.fileSize >= 0 && <div className="flex justify-between gap-4"><dt className="text-t3">Taille</dt><dd className="text-t1">{megabytes(loaded.fileSize)}</dd></div>}
                {loaded.platform && <div className="flex justify-between gap-4"><dt className="text-t3">Plateforme</dt><dd className="break-words text-right text-t1">{loaded.platform}</dd></div>}
              </dl>

              {loaded && (
                <div className="mb-4 flex items-center justify-between rounded-xl border border-line-soft bg-noir-950 px-4 py-3">
                  <span className="text-sm text-t3">Partager</span>
                  <ResourceShare resource={loaded} />
                </div>
              )}

              {loaded.kind === 'EXTERNAL_VIDEO' && loaded.videoUrl && <a href={loaded.videoUrl} target="_blank" rel="noreferrer noopener" className="flex min-h-12 items-center justify-center gap-3 rounded-xl bg-gold-400 px-4 py-3 text-center text-sm font-semibold text-noir-950 transition-colors hover:bg-gold-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-noir-900">Regarder la vidéo<ExternalLink className="h-4 w-4 shrink-0" aria-hidden /><span className="sr-only"> (nouvel onglet)</span></a>}
              {loaded.kind === 'EBOOK' && loaded.downloadUrl && <a href={`${ENV.API_BASE_URL.replace(/\/$/, '')}${loaded.downloadUrl.replace(/^\/api(?=\/)/, '')}`} className="flex min-h-12 items-center justify-center gap-3 rounded-xl bg-gold-400 px-4 py-3 text-center text-sm font-semibold text-noir-950 transition-colors hover:bg-gold-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-noir-900">Télécharger l’ebook<Download className="h-4 w-4 shrink-0" aria-hidden /></a>}
              {loaded.kind !== 'ARTICLE' && !(loaded.kind === 'EBOOK' ? loaded.downloadUrl : loaded.videoUrl) && <p className="text-sm text-t3">Le lien d’accès n’est pas disponible pour le moment.</p>}

              <button
                onClick={toggleLike}
                disabled={liking}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:opacity-50 ${liked ? 'border-gold-400 bg-gold-400/10 text-gold-300' : 'border-line text-t3 hover:text-gold-300'}`}
                aria-pressed={liked}
              >
                <Heart filled={liked} />
                {liked ? 'Coup de cœur envoyé' : 'Mettre un coup de cœur'}
                {likeCount > 0 && <span className="rounded-full bg-noir-800 px-2 py-0.5 text-xs text-t2">{likeCount}</span>}
              </button>
            </aside>
          </div>
          <div className="mt-14 border-t border-line-soft pt-7"><Link to={cataloguePath} className="inline-flex min-h-11 items-center gap-3 text-sm font-medium text-gold-400 hover:text-gold-300">Continuer à explorer la bibliothèque<ArrowUpRight className="h-4 w-4" aria-hidden /></Link></div>
        </>}
      </article>
    </Layout>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-gold-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}
