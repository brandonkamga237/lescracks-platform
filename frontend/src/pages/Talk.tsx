import { useSearchParams } from 'react-router-dom';

import SEO from '@/components/common/SEO';
import { YouTubeIcon } from '@/components/icons/BrandIcons';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import EpisodeRow from '@/components/talks/EpisodeRow';
import TalkSpotlight from '@/components/talks/TalkSpotlight';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { SpaceHeader } from '@/components/ui/space-header';
import { Pager } from '@/components/ui/pager';
import { EmptyPanel, ErrorPanel, RowsLoading } from '@/components/ui/panels';
import { CONTACT_EMAIL } from '@/config/site';
import { useApi } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';

const CHANNEL_URL = 'https://youtube.com/@lescracks';

function positiveInteger(value: string | null): number {
  if (!value || !/^[1-9]\d*$/.test(value)) return 1;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed <= 2147483647 ? parsed : 1;
}

const FOLLOW = <Button asChild variant="outline"><a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer"><YouTubeIcon className="h-4 w-4" />Suivre la chaîne</a></Button>;

/** The Talk: the latest episode up front, the others as lines that play here. */
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
    <>
      <SEO title="LesCracks Talk" description="LesCracks Talk, le rendez-vous vidéo qui met en lumière la tech africaine : des conversations avec celles et ceux qui construisent, des produits et des parcours réels." url="/talk" />
      <SpaceHeader title="Le Talk" meta={!talks.loading && !talks.error ? `${total} épisode${total > 1 ? 's' : ''}` : undefined} lead="Des conversations avec celles et ceux qui construisent la tech africaine." action={FOLLOW} />

      <Container className="pb-10">
        <div role="region" aria-label="Épisodes" aria-live="polite" aria-busy={talks.loading}>
          {talks.loading && list.length === 0 && <RowsLoading label="Chargement des épisodes…" />}
          {talks.error && <ErrorPanel title="Les épisodes sont momentanément indisponibles." message={talks.error.message} onRetry={talks.reload} />}
          {!talks.loading && !talks.error && list.length === 0 && (
            <EmptyPanel
              title={page > 1 ? 'Cette page est vide.' : 'Le premier épisode se prépare.'}
              description={page > 1 ? 'Reviens à la première page pour retrouver les épisodes.' : 'Les conversations seront publiées sur YouTube et référencées ici.'}
              action={FOLLOW}
            />
          )}
          {!talks.error && list.length > 0 && (
            <div className={cn('transition-opacity', talks.loading && 'opacity-60')}>
              {latest && <TalkSpotlight video={latest} />}
              {episodes.length > 0 && (
                <Stagger className={cn('border-t border-white/10', latest && 'mt-8')}>
                  {episodes.map((video) => <StaggerItem key={video.id}><EpisodeRow video={video} /></StaggerItem>)}
                </Stagger>
              )}
              <Pager page={page} totalPages={talks.data?.totalPages ?? 0} onPageChange={goToPage} />
            </div>
          )}
        </div>
      </Container>

      <Container className="pb-20">
        <p className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/60">
          Tu construis quelque chose et tu veux en parler dans le Talk ?
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-gold-400 underline-offset-4 hover:underline">Écris-nous</a>
        </p>
      </Container>
    </>
  );
}
