import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';

import ArticleCover from '@/components/blog/ArticleCover';
import ArticleRenderer from '@/components/blog/ArticleRenderer';
import SEO from '@/components/common/SEO';
import ShareButton from '@/components/common/ShareButton';
import Layout from '@/components/layout/Layout';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { articlePath } from '@/lib/slugs';
import { api } from '@/services/api';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

export default function BlogPost() {
  const { slug = '' } = useParams();
  const { isSignedIn, signIn } = useSession();
  const hasSlug = slug.trim().length > 0;
  const post = useApi((signal) => hasSlug ? api.article(slug, signal) : Promise.resolve(null), [slug, hasSlug]);
  const loaded = hasSlug && !post.loading && !post.error && post.data ? post.data : null;
  const likes = useApi((signal) => loaded ? api.resourceLikes(loaded.id, signal) : Promise.resolve(null), [loaded?.id, isSignedIn]);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const missing = !hasSlug || post.error?.status === 404;
  const published = loaded ? loaded.publishedAt ?? loaded.createdAt : undefined;

  useEffect(() => {
    if (likes.data) {
      setLiked(likes.data.liked);
      setLikeCount(likes.data.count);
    }
  }, [likes.data]);

  async function toggleLike() {
    if (!loaded) return;
    if (!isSignedIn) { signIn(articlePath(loaded)); return; }
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
      <SEO title={loaded?.title ?? (missing ? 'Article introuvable' : 'Article')} description={loaded?.description ?? 'Les articles du blog LesCracks.'} image={loaded?.coverImage || undefined} url={loaded ? articlePath(loaded) : '/blog'} />
      <article>
        <div className="mode-raised">
          <div className="mx-auto max-w-7xl px-5 pb-14 pt-8 sm:px-8 sm:pb-20 sm:pt-10">
            <nav aria-label="Fil d’Ariane" className="flex flex-wrap items-center gap-3 text-sm text-t3">
              <Link to="/blog" className="inline-flex min-h-11 items-center gap-2 rounded-lg transition-colors hover:text-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"><ArrowLeft className="h-4 w-4" aria-hidden />Blog</Link>
              {loaded && <><span aria-hidden>/</span><span className="min-w-0 truncate text-t2" aria-current="page">{loaded.title}</span></>}
            </nav>

            {hasSlug && post.loading && <p className="py-24 text-center text-t3" role="status">Chargement de l’article…</p>}
            {(missing || post.error) && (
              <div className="my-12 rounded-lg border border-line bg-noir-900 px-6 py-16 text-center" role="alert">
                <h1 className="font-display text-3xl font-bold text-t1">{missing ? 'Cet article est introuvable.' : 'Impossible de charger l’article.'}</h1>
                <Link to="/blog" className="btn-secondary mt-6">Retour au blog</Link>
              </div>
            )}

            {loaded && (
              <header className="mt-8 max-w-4xl sm:mt-12">
                {loaded.categoryName && <p className="label">{loaded.categoryName}</p>}
                <h1 className="mt-5 break-words font-display text-5xl font-bold leading-[0.94] tracking-tight text-t1 sm:text-6xl lg:text-7xl lg:leading-[0.9]">{loaded.title}</h1>
                <p className="label mt-6">
                  {published && <>Publié le <time dateTime={published}>{dateFormat.format(new Date(published))}</time>  ·  </>}
                  {loaded.readingMinutes ?? 1} min de lecture
                </p>
              </header>
            )}
          </div>
        </div>

        {loaded && (
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-12">
              <div className="min-w-0">
                <div className="relative aspect-[16/9] overflow-hidden bg-noir-800">
                  {loaded.coverImage && failedImage !== loaded.coverImage
                    ? <img src={loaded.coverImage} alt={`Illustration de ${loaded.title}`} onError={() => setFailedImage(loaded.coverImage)} className="h-full w-full object-cover" />
                    : <ArticleCover size="spotlight" />}
                </div>
                <p className="mt-10 max-w-[42rem] whitespace-pre-line break-words text-xl font-medium leading-relaxed text-t1 sm:text-[1.375rem]">{loaded.description}</p>
                <hr className="my-10 max-w-[42rem] border-line-soft" />
                <ArticleRenderer article={loaded} />
                {loaded.tags.length > 0 && (
                  <ul aria-label="Sujets abordés" className="mt-12 flex max-w-[42rem] flex-wrap gap-2">
                    {loaded.tags.map((tag) => <li key={tag} className="rounded-full bg-card px-3 py-1.5 text-sm font-medium text-t2">{tag}</li>)}
                  </ul>
                )}
              </div>

              <aside className="rounded-lg bg-card p-6 lg:sticky lg:top-24" aria-label="Partager l’article">
                <p className="text-sm leading-relaxed text-t3">Cet article t’a aidé ? Fais-le savoir, ou envoie-le à quelqu’un qui en a besoin.</p>
                <button
                  type="button"
                  onClick={() => void toggleLike()}
                  disabled={liking}
                  aria-pressed={liked}
                  className={`mt-5 flex w-full items-center justify-center gap-2 rounded border px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:opacity-50 ${liked ? 'border-gold-400/40 bg-gold-400/10 text-t1' : 'border-line text-t2 hover:border-line-strong hover:text-t1'}`}
                >
                  <Heart filled={liked} />
                  {liked ? 'Coup de cœur envoyé' : 'Mettre un coup de cœur'}
                  {likeCount > 0 && <span className="rounded-full bg-noir-800 px-2 py-0.5 text-xs text-t2">{likeCount}</span>}
                </button>
                <ShareButton title={loaded.title} path={articlePath(loaded)} label="Partager l’article" className="mt-3" />
              </aside>
            </div>
            <div className="mt-16 border-t border-line pt-8">
              <Link to="/blog" className="link inline-flex min-h-11 items-center gap-3 text-sm">Lire d’autres articles<ArrowUpRight className="h-4 w-4" aria-hidden /></Link>
            </div>
          </div>
        )}
      </article>
    </Layout>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-gold-ink" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}
