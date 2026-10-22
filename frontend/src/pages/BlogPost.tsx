import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, MessageCircle } from 'lucide-react';

import ArticleCover from '@/components/blog/ArticleCover';
import ArticleRenderer from '@/components/blog/ArticleRenderer';
import ArticleComments from '@/components/community/ArticleComments';
import ReadMarker from '@/components/common/ReadMarker';
import SEO from '@/components/common/SEO';
import ShareButton from '@/components/common/ShareButton';
import StickyActionBar from '@/components/common/StickyActionBar';
import Layout from '@/components/layout/Layout';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { articlePath } from '@/lib/slugs';
import { api } from '@/services/api';
import { browserVisitorId } from '@/lib/visitor';

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
  const [views, setViews] = useState<{ id: number; count: number } | null>(null);
  const [commentCount, setCommentCount] = useState(0);
  // Once per article and page: the development double effect would otherwise post twice.
  const counted = useRef<number | null>(null);
  const actions = useRef<HTMLElement>(null);
  const missing = !hasSlug || post.error?.status === 404;
  const published = loaded ? loaded.publishedAt ?? loaded.createdAt : undefined;

  useEffect(() => {
    if (likes.data) {
      setLiked(likes.data.liked);
      setLikeCount(likes.data.count);
    }
  }, [likes.data]);

  useEffect(() => {
    if (!loaded || counted.current === loaded.id) return;
    counted.current = loaded.id;
    api.recordArticleView(loaded.id, browserVisitorId())
      .then(({ viewCount }) => setViews({ id: loaded.id, count: viewCount }))
      .catch(() => undefined);
  }, [loaded]);
  const viewCount = loaded ? (views?.id === loaded.id ? views.count : loaded.viewCount ?? 0) : 0;

  function goToDiscussion() {
    document.getElementById('discussion')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

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
              <header className="mt-5 max-w-4xl sm:mt-8">
                {loaded.categoryName && <p className="label">{loaded.categoryName}</p>}
                <h1 className="mt-3 break-words font-display text-3xl font-bold leading-tight tracking-tight text-t1 sm:text-4xl lg:text-5xl">{loaded.title}</h1>
                <p className="label mt-4">
                  {published && <>Publié le <time dateTime={published}>{dateFormat.format(new Date(published))}</time>  ·  </>}
                  {loaded.readingMinutes ?? 1} min de lecture
                  {viewCount > 0 && <>  ·  {viewCount.toLocaleString('fr-FR')} {viewCount > 1 ? 'lectures' : 'lecture'}</>}
                </p>
              </header>
            )}
          </div>
        </div>

        {loaded && (
          <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-14">
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
                <ReadMarker event="Article lu en entier" data={{ article: loaded.slug ?? String(loaded.id) }} />
                {loaded.tags.length > 0 && (
                  <ul aria-label="Sujets abordés" className="mt-12 flex max-w-[42rem] flex-wrap gap-2">
                    {loaded.tags.map((tag) => <li key={tag} className="rounded-full bg-card px-3 py-1.5 text-sm font-medium text-t2">{tag}</li>)}
                  </ul>
                )}
              </div>

              <aside ref={actions} className="rounded-lg bg-card p-6 lg:sticky lg:top-24" aria-label="Réagir à l’article">
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
                <button type="button" onClick={goToDiscussion}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded border border-line px-4 py-3 text-sm font-medium text-t2 transition-colors hover:border-line-strong hover:text-t1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400">
                  <MessageCircle className="h-5 w-5 text-gold-ink" aria-hidden />
                  Commenter
                  {commentCount > 0 && <span className="rounded-full bg-noir-800 px-2 py-0.5 text-xs text-t2">{commentCount}</span>}
                </button>
                <ShareButton title={loaded.title} path={articlePath(loaded)} label="Partager l’article" className="mt-3" />
              </aside>
            </div>
            <ArticleComments resourceId={loaded.id} returnPath={articlePath(loaded)} articleSlug={loaded.slug ?? String(loaded.id)} onCountChange={setCommentCount} />
            <div className="mt-16 border-t border-line pt-8">
              <Link to="/blog" className="link inline-flex min-h-11 items-center gap-3 text-sm">Lire d’autres articles<ArrowUpRight className="h-4 w-4" aria-hidden /></Link>
            </div>
            {/* On a phone the reactions sit after the article: the bar keeps them in reach while reading. */}
            <StickyActionBar anchor={actions} label="Réagir à l’article" className="lg:hidden">
              <div className="grid flex-1 grid-cols-3 gap-2">
                <button type="button" onClick={() => void toggleLike()} disabled={liking} aria-pressed={liked}
                  className={`flex min-h-11 items-center justify-center gap-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 ${liked ? 'bg-gold-400/15 text-t1' : 'text-t2 hover:text-t1'}`}>
                  <Heart filled={liked} />{likeCount > 0 ? likeCount : <span className="sr-only sm:not-sr-only">J’aime</span>}<span className="sr-only"> coup de cœur</span>
                </button>
                <button type="button" onClick={goToDiscussion} className="flex min-h-11 items-center justify-center gap-1.5 rounded text-sm font-medium text-t2 transition-colors hover:text-t1">
                  <MessageCircle className="h-5 w-5 text-gold-ink" aria-hidden />{commentCount > 0 ? commentCount : 'Commenter'}<span className="sr-only">{commentCount > 0 ? ' commentaires' : ''}</span>
                </button>
                <ShareButton title={loaded.title} path={articlePath(loaded)} label="Partager" variant="primary" className="[&>button]:min-h-11 [&>button]:px-3" />
              </div>
            </StickyActionBar>
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
