import { Suspense, lazy, useEffect, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, BookOpen, Download, Play } from 'lucide-react';

import ArticleRenderer from '@/components/resources/ArticleRenderer';
import ShareButton from '@/components/common/ShareButton';
import KindCover from '@/components/illustrations/KindCover';
import VideoPlayer from '@/components/media/VideoPlayer';
import SEO from '@/components/common/SEO';
import Layout from '@/components/layout/Layout';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { api } from '@/services/api';
import { resourcePath } from '@/lib/slugs';
import { ENV } from '@/config/env';
import { videoSource } from '@/lib/videoEmbed';

// pdf.js is heavy: it loads only when someone opens an ebook.
const PdfReader = lazy(() => import('@/components/media/PdfReader'));
const readerKey = (id: number) => `lescracks.reader.${id}`;
function savedPage(id: number) { try { return Number(localStorage.getItem(readerKey(id))) || 1; } catch { return 1; } }

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

function megabytes(bytes: number): string {
  const number = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
  return bytes < 1024 * 1024 ? `${number.format(Math.max(1, Math.round(bytes / 1024)))} Ko` : `${number.format(bytes / (1024 * 1024))} Mo`;
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
  const [playing, setPlaying] = useState(false);
  // The reader is part of the URL, so the phone's back button closes it instead of leaving the page.
  const [params, setParams] = useSearchParams();
  const reading = params.get('lecture') === '1';
  const fileUrl = loaded?.downloadUrl ? `${ENV.API_BASE_URL.replace(/\/$/, '')}${loaded.downloadUrl.replace(/^\/api(?=\/)/, '')}` : null;
  const readable = Boolean(fileUrl && loaded?.fileFormat?.toLowerCase().includes('pdf'));
  const embeddable = Boolean(loaded?.kind === 'EXTERNAL_VIDEO' && loaded.videoUrl && videoSource(loaded.videoUrl));
  const resumeAt = loaded && readable ? savedPage(loaded.id) : 1;

  function openReader() {
    const next = new URLSearchParams(params);
    next.set('lecture', '1');
    setParams(next, { state: location.state });
  }

  function closeReader() {
    if (window.history.state?.idx > 0 && reading) window.history.back();
    else { const next = new URLSearchParams(params); next.delete('lecture'); setParams(next, { replace: true, state: location.state }); }
  }

  function watch() {
    setPlaying(true);
    document.getElementById('lecteur')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

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
      <article>
        <div className="mode-raised">
        <div className="mx-auto max-w-7xl px-5 pb-14 pt-8 sm:px-8 sm:pb-20 sm:pt-10">
        <nav aria-label="Fil d’Ariane" className="flex flex-wrap items-center gap-3 text-sm text-t3">
          <Link to={cataloguePath} className="inline-flex min-h-11 items-center gap-2 rounded-lg transition-colors hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"><ArrowLeft className="h-4 w-4" aria-hidden />La bibliothèque</Link>
          {loaded && <><span aria-hidden>/</span><span className="min-w-0 truncate text-t2" aria-current="page">{loaded.title}</span></>}
        </nav>

        {hasParam && resource.loading && <p className="py-24 text-center text-t3" role="status">Chargement de la ressource…</p>}
        {(missing || resource.error) && <div className="my-12 rounded-lg border border-line bg-noir-900 px-6 py-16 text-center" role="alert"><h1 className="font-display text-3xl font-bold text-t1">{missing ? 'Cette ressource est introuvable.' : 'Impossible de charger cette ressource.'}</h1><p className="mx-auto mt-4 max-w-lg text-t3">{missing ? 'Elle n’est peut-être plus publiée. La bibliothèque reste ouverte pour découvrir un autre sujet.' : resource.error?.message}</p>{!missing && <button type="button" onClick={resource.reload} className="btn-primary mt-6">Réessayer</button>}<Link to={cataloguePath} className="mx-auto mt-5 block w-fit py-2 text-sm text-gold-ink underline underline-offset-4">Retour à la bibliothèque</Link></div>}

        {loaded && <>
          <header className="mt-8 max-w-4xl sm:mt-12">
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
              <span className="inline-flex items-center rounded-full bg-gold-400 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-black">{loaded.kind === 'EBOOK' ? 'Ebook' : loaded.kind === 'ARTICLE' ? 'Article' : 'Vidéo'}</span>
              {loaded.categoryName && <span className="label">{loaded.categoryName}</span>}
            </div>
            <h1 className="mt-5 break-words font-display text-5xl font-bold leading-[0.94] tracking-tight text-t1 sm:text-6xl lg:text-7xl lg:leading-[0.9]">{loaded.title}</h1>
            {(loaded.publishedAt ?? loaded.createdAt) && <p className="label mt-6">Publié le <time dateTime={loaded.publishedAt ?? loaded.createdAt}>{dateFormat.format(new Date(loaded.publishedAt ?? loaded.createdAt))}</time></p>}
          </header>
        </>}
        </div>
        </div>

        {loaded && <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-12">
            <div className="min-w-0">
              {loaded.kind === 'EXTERNAL_VIDEO' && loaded.videoUrl ? (
                <VideoPlayer id="lecteur" url={loaded.videoUrl} title={loaded.title} poster={loaded.coverImage} platform={loaded.platform} started={playing} onStart={() => setPlaying(true)} />
              ) : (
                <div className="relative aspect-[16/9] overflow-hidden bg-noir-800">
                  {loaded.coverImage && failedImage !== loaded.coverImage ? <img src={loaded.coverImage} alt={`Couverture de ${loaded.title}`} onError={() => setFailedImage(loaded.coverImage)} className="h-full w-full object-cover" /> : <KindCover kind={loaded.kind} size="spotlight" />}
                  {readable && (
                    <button type="button" onClick={openReader} className="group absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/10 to-transparent p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400 sm:p-7">
                      <span className="inline-flex items-center gap-2 rounded bg-gold-400 px-4 py-2.5 text-sm font-semibold text-black transition-colors duration-150 group-hover:bg-gold-300"><BookOpen className="h-4 w-4" aria-hidden />{resumeAt > 1 ? `Reprendre page ${resumeAt}` : 'Lire en ligne'}</span>
                    </button>
                  )}
                </div>
              )}
              <section className="mt-10" aria-labelledby="resource-description">
                {/* An article opens on its standfirst and reads straight on; other resources get a short « about ». */}
                {loaded.kind === 'ARTICLE' ? <>
                  <h2 id="resource-description" className="sr-only">Article</h2>
                  <p className="max-w-[42rem] whitespace-pre-line break-words text-xl font-medium leading-relaxed text-t1 sm:text-[1.375rem]">{loaded.description}</p>
                  <hr className="my-10 max-w-[42rem] border-line-soft" />
                  <ArticleRenderer resource={loaded} />
                </> : <>
                  <h2 id="resource-description" className="font-display text-3xl font-bold leading-tight text-t1">À propos de cette ressource</h2>
                  <p className="mt-5 whitespace-pre-line break-words text-base leading-relaxed text-t2 sm:text-lg">{loaded.description}</p>
                </>}
                {loaded.tags?.length > 0 && (
                  <div className="mt-7">
                    <h3 className="label">Sujets abordés</h3>
                    <ul aria-label="Sujets abordés" className="mt-3 flex flex-wrap gap-2">
                      {loaded.tags.map((tag) => (
                        <li key={tag} className="rounded-full bg-card px-3 py-1.5 text-sm font-medium text-t2">{tag}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            </div>

            <aside className="rounded-lg bg-card p-6 sm:p-7 lg:sticky lg:top-24" aria-label="Accéder à la ressource">
              <h2 className="font-display text-2xl font-bold leading-tight text-t1">{loaded.kind === 'EBOOK' ? (readable ? 'Lis l’ebook' : 'Télécharge l’ebook') : loaded.kind === 'ARTICLE' ? 'Lire l’article' : 'Regarde la vidéo'}</h2>
              <p className="mt-3 text-sm leading-relaxed text-t3">{loaded.kind === 'EBOOK' ? (readable ? 'Lis-le ici, page après page : la lecture reprend où tu t’es arrêté. Ou télécharge-le pour le garder.' : 'Télécharge le support et avance à ton rythme, où que tu sois.') : loaded.kind === 'ARTICLE' ? `Temps de lecture estimé : ${loaded.readingMinutes ?? 1} min.` : embeddable ? 'La vidéo se lit ici, sans quitter LesCracks.' : 'Retrouve la vidéo sur sa plateforme de diffusion.'}</p>
              <dl className="my-6 space-y-4 border-y border-line py-5 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-t3">Type</dt><dd className="text-right text-t1">{loaded.kind === 'EBOOK' ? 'Ebook' : loaded.kind === 'ARTICLE' ? 'Article' : 'Vidéo'}</dd></div>
                {loaded.fileFormat && <div className="flex justify-between gap-4"><dt className="text-t3">Format du fichier</dt><dd className="break-all text-right text-t1">{loaded.fileFormat}</dd></div>}
                {loaded.fileSize != null && loaded.fileSize >= 0 && <div className="flex justify-between gap-4"><dt className="text-t3">Taille</dt><dd className="text-t1">{megabytes(loaded.fileSize)}</dd></div>}
                {loaded.platform && <div className="flex justify-between gap-4"><dt className="text-t3">Plateforme</dt><dd className="break-words text-right text-t1">{loaded.platform}</dd></div>}
              </dl>


              {embeddable && <button type="button" onClick={watch} className="btn-primary w-full"><Play className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden />{playing ? 'Lecture en cours' : 'Regarder la vidéo'}</button>}
              {readable && <button type="button" onClick={openReader} className="btn-primary w-full"><BookOpen className="h-4 w-4 shrink-0" aria-hidden />{resumeAt > 1 ? `Reprendre page ${resumeAt}` : 'Lire en ligne'}</button>}
              {loaded.kind === 'EBOOK' && fileUrl && <a href={fileUrl} className={`${readable ? 'btn-secondary mt-3' : 'btn-primary'} w-full`}>Télécharger l’ebook<Download className="h-4 w-4 shrink-0" aria-hidden /></a>}
              {loaded.kind !== 'ARTICLE' && !(loaded.kind === 'EBOOK' ? loaded.downloadUrl : loaded.videoUrl) && <p className="text-sm text-t3">Le lien d’accès n’est pas disponible pour le moment.</p>}

              <ShareButton title={loaded.title} path={resourcePath(loaded)} label="Partager la ressource" className="mt-3" />
              <button
                onClick={toggleLike}
                disabled={liking}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded border px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:opacity-50 ${liked ? 'border-gold-400 bg-gold-400/10 text-gold-ink' : 'border-line text-t3 hover:text-gold-ink'}`}
                aria-pressed={liked}
              >
                <Heart filled={liked} />
                {liked ? 'Coup de cœur envoyé' : 'Mettre un coup de cœur'}
                {likeCount > 0 && <span className="rounded-full bg-noir-800 px-2 py-0.5 text-xs text-t2">{likeCount}</span>}
              </button>
            </aside>
          </div>
          <div className="mt-16 border-t border-line pt-8"><Link to={cataloguePath} className="link inline-flex min-h-11 items-center gap-3 text-sm">Continuer à explorer la bibliothèque<ArrowUpRight className="h-4 w-4" aria-hidden /></Link></div>
        </div>}
      </article>
      {reading && loaded && readable && fileUrl && (
        <Suspense fallback={<div role="status" className="fixed inset-0 z-[70] flex items-center justify-center bg-noir-950 text-sm text-t3">Ouverture du lecteur…</div>}>
          <PdfReader url={`${fileUrl}?inline=true`} downloadUrl={fileUrl} title={loaded.title} storageKey={readerKey(loaded.id)} onClose={closeReader} />
        </Suspense>
      )}
    </Layout>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-gold-ink">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}
