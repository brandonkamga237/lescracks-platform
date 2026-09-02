import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';

import Layout from '@/components/layout/Layout';
import ArticleBody from '@/components/resources/ArticleBody';
import { useApi } from '@/hooks/useApi';
import { KIND_LABEL, effortLabel } from '@/lib/effort';
import { api } from '@/services/api';
import { ENV } from '@/config/env';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

function megabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function RessourceDetail() {
  const { slug = '' } = useParams();
  const resource = useApi((signal) => api.resource(slug, signal), [slug]);
  const loaded = resource.data;

  // Counted once the resource is actually on screen, not on every render.
  useEffect(() => {
    if (loaded?.id) api.countView(loaded.id);
  }, [loaded?.id]);

  return (
    <Layout>
      <article className="mx-auto max-w-2xl px-6 py-12 sm:py-20">
        <Link
          to="/ressources"
          className="inline-flex items-center gap-2 text-sm text-t4 transition-colors hover:text-t2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Le catalogue
        </Link>

        {resource.loading && <p className="py-20 text-center text-t4">Chargement…</p>}

        {resource.error && (
          <div className="py-20 text-center">
            <p className="text-t2">{resource.error.message}</p>
          </div>
        )}

        {loaded && (
          <>
            <header className="mt-10">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-t4">
                <span className="text-gold-400">{KIND_LABEL[loaded.kind]}</span>
                <span aria-hidden>·</span>
                <span>{loaded.categoryName}</span>
                {effortLabel(loaded) && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="font-mono tabular-nums">{effortLabel(loaded)}</span>
                  </>
                )}
              </div>

              <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-t1 sm:text-4xl">
                {loaded.title}
              </h1>

              {loaded.summary && (
                <p className="mt-4 text-lg leading-relaxed text-t2">{loaded.summary}</p>
              )}

              <p className="mt-6 text-sm text-t4">
                Publié le {dateFormat.format(new Date(loaded.createdAt))}
                {loaded.viewCount > 0 && ` · consulté ${loaded.viewCount} fois`}
                {loaded.article?.authorName && ` · par ${loaded.article.authorName}`}
              </p>
            </header>

            {/* A video is watched where it lives: we point at it rather than wrap it. */}
            {loaded.video && (
              <a
                href={loaded.video.externalUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-10 flex items-center justify-between gap-4 rounded border border-line px-5 py-4 transition-colors hover:border-gold-400"
              >
                <span className="text-t1">Regarder la vidéo</span>
                <ExternalLink className="h-4 w-4 shrink-0 text-gold-400" aria-hidden />
              </a>
            )}

            {loaded.ebook && (
              <a
                href={`${ENV.API_BASE_URL}${loaded.ebook.downloadUrl.replace(/^\/api/, '')}`}
                className="mt-10 flex items-center justify-between gap-4 rounded border border-line px-5 py-4 transition-colors hover:border-gold-400"
              >
                <span className="min-w-0">
                  <span className="block truncate text-t1">{loaded.ebook.originalName}</span>
                  <span className="mt-0.5 block text-sm text-t4">
                    {megabytes(loaded.ebook.sizeBytes)}
                    {loaded.ebook.pageCount ? ` · ${loaded.ebook.pageCount} pages` : ''}
                  </span>
                </span>
                <Download className="h-4 w-4 shrink-0 text-gold-400" aria-hidden />
              </a>
            )}

            {loaded.article && <ArticleBody body={loaded.article.body} />}

            {loaded.tags.length > 0 && (
              <footer className="mt-16 flex flex-wrap gap-2 border-t border-line-soft pt-6">
                {loaded.tags.map((tag) => (
                  <span key={tag.id} className="rounded-full border border-line-soft px-3 py-1 text-xs text-t3">
                    {tag.name}
                  </span>
                ))}
              </footer>
            )}
          </>
        )}
      </article>
    </Layout>
  );
}
