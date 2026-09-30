import { Link, useSearchParams } from 'react-router-dom';
import { Podcast, Youtube } from 'lucide-react';

import EpisodeRow from '@/components/talks/EpisodeRow';
import TalkSpotlight from '@/components/talks/TalkSpotlight';
import Pagination from '@/components/common/Pagination';
import SEO from '@/components/common/SEO';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import Layout from '@/components/layout/Layout';
import { PageHeader, Section } from '@/components/layout/Page';
import { useApi } from '@/hooks/useApi';
import { api } from '@/services/api';

const CHANNEL_URL = 'https://youtube.com/@lescracks';

function positiveInteger(value: string | null): number {
  if (!value || !/^[1-9]\d*$/.test(value)) return 1;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed <= 2147483647 ? parsed : 1;
}

/**
 * LesCracks Talk: the episode catalogue.
 * Conversations about African tech, hosted on YouTube and referenced here.
 */
export default function Talk() {
  const [params, setParams] = useSearchParams();
  const page = positiveInteger(params.get('page'));
  const talks = useApi((signal) => api.talks(page - 1, 12, signal), [page]);
  const list = talks.data?.content ?? [];
  const total = talks.data?.totalElements ?? 0;
  const latest = page === 1 ? list[0] : undefined;
  const episodes = latest ? list.slice(1) : list;

  function goToPage(value: number) {
    const next = new URLSearchParams(params);
    if (value === 1) next.delete('page');
    else next.set('page', String(value));
    setParams(next);
  }

  return (
    <Layout>
      <SEO
        title="LesCracks Talk"
        description="LesCracks Talk, le rendez-vous vidéo qui met en lumière la tech africaine : des conversations avec celles et ceux qui construisent, des produits et des parcours réels."
        url="/talk"
      />

      <Section tone="raised" spacing="tight">
        <PageHeader
          eyebrow="Sur YouTube"
          title="Le Talk"
          description="Des conversations avec celles et ceux qui construisent la tech africaine."
          meta={!talks.loading && !talks.error ? `${total} épisode${total > 1 ? 's' : ''}` : undefined}
          actions={
            <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
              <Youtube className="h-4 w-4" aria-hidden />
              Suivre la chaîne
            </a>
          }
        />
      </Section>

      <Section>
        <div aria-label="Épisodes" aria-live="polite" aria-busy={talks.loading} role="region">
          {talks.loading && list.length === 0 && (
            <div role="status" className="space-y-5">
              <Skeleton className="aspect-[16/10] sm:aspect-[21/9]" />
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
              <span className="sr-only">Chargement des épisodes…</span>
            </div>
          )}
          {talks.error && <ErrorState title="Les épisodes sont momentanément indisponibles." message={talks.error.message} onRetry={talks.reload} />}
          {!talks.loading && !talks.error && list.length === 0 && (
            <EmptyState
              icon={<Podcast className="h-8 w-8" aria-hidden />}
              title={page > 1 ? 'Cette page est vide.' : 'Le premier épisode se prépare.'}
              description={page > 1 ? 'Reviens à la première page pour retrouver les épisodes.' : 'Les conversations seront publiées sur YouTube et référencées ici.'}
              action={
                <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                  <Youtube className="h-4 w-4" aria-hidden />
                  Suivre la chaîne
                </a>
              }
            />
          )}
          {!talks.error && list.length > 0 && (
            <div className={`transition-opacity ${talks.loading ? 'opacity-60' : ''}`}>
              {latest && <TalkSpotlight video={latest} />}
              {episodes.length > 0 && (
                <ul className={latest ? 'mt-12' : ''}>
                  {episodes.map((video) => (
                    <EpisodeRow key={video.id} video={video} />
                  ))}
                </ul>
              )}
              <Pagination page={page} totalPages={talks.data?.totalPages ?? 0} onPageChange={goToPage} />
            </div>
          )}
        </div>

      </Section>

      <Section tone="raised">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="max-w-2xl font-display text-4xl font-bold leading-[0.94] tracking-tight text-t1 sm:text-5xl lg:text-6xl lg:leading-[0.9]">
            Tu construis quelque chose ? Viens en parler.
          </h2>
          <div className="flex flex-wrap gap-3">
            <a href="mailto:contact@lescracks.com" className="btn-primary">Écris-nous</a>
            <Link to="/ressources" className="btn-secondary">Explorer la bibliothèque</Link>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
