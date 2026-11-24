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
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { EmptyPanel, ErrorPanel } from '@/components/ui/panels';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { articlePath } from '@/lib/slugs';
import { cn } from '@/lib/utils';
import { browserVisitorId } from '@/lib/visitor';
import { api } from '@/services/api';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-gold-400" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}

const COUNT = 'rounded-full bg-white/10 px-2 py-0.5 text-xs tabular-nums text-white/70';

/** An article: title and reading time up front, the text in a reading column, reactions beside it. */
export default function BlogPost() {
  const { slug = '' } = useParams();
  const { isSignedIn, signIn } = useSession();
  const hasSlug = slug.trim().length > 0;
  const post = useApi((signal) => (hasSlug ? api.article(slug, signal) : Promise.resolve(null)), [slug, hasSlug], `article:${slug}`);
  const loaded = hasSlug && !post.loading && !post.error && post.data ? post.data : null;
  const likes = useApi((signal) => (loaded ? api.resourceLikes(loaded.id, signal) : Promise.resolve(null)), [loaded?.id, isSignedIn]);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);
  const [mine, setMine] = useState<{ liked: boolean; count: number } | null>(null);
  const [views, setViews] = useState<{ id: number; count: number } | null>(null);
  const [commentCount, setCommentCount] = useState(0);
  // Once per article and page: the development double effect would otherwise post twice.
  const counted = useRef<number | null>(null);
  const actions = useRef<HTMLElement>(null);
  const missing = !hasSlug || post.error?.status === 404;
  const published = loaded ? loaded.publishedAt ?? loaded.createdAt : undefined;
  const liked = mine?.liked ?? likes.data?.liked ?? false;
  const likeCount = mine?.count ?? likes.data?.count ?? 0;

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
      setMine({ liked: status.liked, count: status.count });
    } finally { setLiking(false); }
  }

  return (
    <article>
      <SEO title={loaded?.title ?? (missing ? 'Article introuvable' : 'Article')} description={loaded?.description ?? 'Les articles du blog LesCracks.'} image={loaded?.coverImage || undefined} url={loaded ? articlePath(loaded) : '/blog'} />
      <Container className="pt-6 sm:pt-8">
        <Link to="/blog" className="group inline-flex min-h-10 items-center gap-2 text-sm text-white/55 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />Tous les articles
        </Link>

        {hasSlug && post.loading && <p role="status" className="py-32 text-center text-white/50">Chargement de l’article…</p>}
        {missing && <div className="py-16"><EmptyPanel title="Cet article est introuvable." description="Il a peut-être été retiré, ou le lien est incomplet." action={<Button asChild variant="outline"><Link to="/blog">Retour au blog</Link></Button>} /></div>}
        {!missing && post.error && <div className="py-16"><ErrorPanel title="Impossible de charger l’article." message={post.error.message} onRetry={post.reload} /></div>}

        {loaded && (
          <header className="max-w-3xl pb-8 pt-4">
            {loaded.categoryName && <p className="text-sm font-medium text-gold-400">{loaded.categoryName}</p>}
            <h1 className="mt-2 break-words text-2xl font-semibold leading-tight tracking-tight sm:text-4xl">{loaded.title}</h1>
            <p className="mt-3 text-sm text-white/50">
              {published && <>Publié le <time dateTime={published}>{dateFormat.format(new Date(published))}</time> · </>}
              {loaded.readingMinutes ?? 1} min de lecture
              {viewCount > 0 && <> · {viewCount.toLocaleString('fr-FR')} {viewCount > 1 ? 'lectures' : 'lecture'}</>}
            </p>
          </header>
        )}
      </Container>

      {loaded && (
        <Container className="pb-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-14">
            <div className="min-w-0">
              <div className="relative aspect-[16/9] max-w-[42rem] overflow-hidden rounded-3xl bg-white/[0.03]">
                {loaded.coverImage && failedImage !== loaded.coverImage
                  ? <img src={loaded.coverImage} alt={`Illustration de ${loaded.title}`} onError={() => setFailedImage(loaded.coverImage)} className="h-full w-full object-cover" />
                  : <ArticleCover size="spotlight" />}
              </div>
              <p className="mt-8 max-w-[42rem] whitespace-pre-line break-words text-lg font-medium leading-relaxed text-white">{loaded.description}</p>
              <hr className="my-8 max-w-[42rem] border-white/10" />
              <ArticleRenderer article={loaded} />
              <ReadMarker event="Article lu en entier" data={{ article: loaded.slug ?? String(loaded.id) }} />
              {loaded.tags.length > 0 && (
                <ul aria-label="Sujets abordés" className="mt-12 flex max-w-[42rem] flex-wrap gap-2">
                  {loaded.tags.map((tag) => <li key={tag} className="rounded-full border border-white/12 px-3 py-1.5 text-sm text-white/65">{tag}</li>)}
                </ul>
              )}
            </div>

            <aside ref={actions} aria-label="Réagir à l’article" className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 lg:sticky lg:top-6">
              <p className="text-sm leading-relaxed text-white/55">Cet article t’a aidé ? Fais-le savoir, ou envoie-le à quelqu’un qui en a besoin.</p>
              <Button type="button" variant="outline" onClick={() => void toggleLike()} disabled={liking} aria-pressed={liked} className={cn('mt-5 w-full', liked && 'border-gold-400/50 bg-gold-400/10 text-white')}>
                <Heart filled={liked} />{liked ? 'Coup de cœur envoyé' : 'Coup de cœur'}{likeCount > 0 && <span className={COUNT}>{likeCount}</span>}
              </Button>
              <Button type="button" variant="outline" onClick={goToDiscussion} className="mt-3 w-full">
                <MessageCircle className="h-5 w-5 text-gold-400" aria-hidden="true" />Commenter{commentCount > 0 && <span className={COUNT}>{commentCount}</span>}
              </Button>
              <ShareButton title={loaded.title} path={articlePath(loaded)} label="Partager l’article" className="mt-3" />
            </aside>
          </div>

          <ArticleComments resourceId={loaded.id} returnPath={articlePath(loaded)} articleSlug={loaded.slug ?? String(loaded.id)} onCountChange={setCommentCount} />

          <div className="mt-16 border-t border-white/10 pt-8">
            <Link to="/blog" className="group inline-flex min-h-11 items-center gap-2 text-sm text-white/60 transition-colors hover:text-white">
              Lire d’autres articles<ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>

          {/* On a phone the reactions sit after the article: the bar keeps them in reach while reading. */}
          <StickyActionBar anchor={actions} label="Réagir à l’article" className="lg:hidden">
            <div className="grid flex-1 grid-cols-3 gap-2">
              <button type="button" onClick={() => void toggleLike()} disabled={liking} aria-pressed={liked}
                className={cn('flex min-h-11 items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-50', liked ? 'bg-gold-400/15 text-white' : 'text-white/70 hover:text-white')}>
                <Heart filled={liked} />{likeCount > 0 ? likeCount : <span className="sr-only sm:not-sr-only">J’aime</span>}<span className="sr-only"> coup de cœur</span>
              </button>
              <button type="button" onClick={goToDiscussion} className="flex min-h-11 items-center justify-center gap-1.5 rounded-full text-sm font-medium text-white/70 transition-colors hover:text-white">
                <MessageCircle className="h-5 w-5 text-gold-400" aria-hidden="true" />{commentCount > 0 ? commentCount : 'Commenter'}<span className="sr-only">{commentCount > 0 ? ' commentaires' : ''}</span>
              </button>
              <ShareButton title={loaded.title} path={articlePath(loaded)} label="Partager" variant="primary" className="[&>button]:min-h-11 [&>button]:px-3" />
            </div>
          </StickyActionBar>
        </Container>
      )}
    </article>
  );
}
