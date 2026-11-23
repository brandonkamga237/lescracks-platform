import { Link, useSearchParams } from 'react-router-dom';

import SEO from '@/components/common/SEO';
import { YouTubeIcon } from '@/components/icons/BrandIcons';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import EpisodeRow from '@/components/talks/EpisodeRow';
import TalkSpotlight from '@/components/talks/TalkSpotlight';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { PageHero } from '@/components/ui/page-hero';
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
      <PageHero
        id="talk-title"
        eyebrow={!talks.loading && !talks.error ? `Le Talk · ${total} épisode${total > 1 ? 's' : ''}` : 'Le Talk'}
        title={['Des parcours réels.', { text: 'Pas des légendes.', className: 'text-white/40' }]}
        lead="Des conversations vidéo avec celles et ceux qui construisent la tech africaine : leurs produits, leurs choix, leurs erreurs."
      >
        {FOLLOW}
      </PageHero>

      <Container className="pb-20">
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
                <Stagger className={cn('border-t border-white/10', latest && 'mt-14')}>
                  {episodes.map((video) => <StaggerItem key={video.id}><EpisodeRow video={video} /></StaggerItem>)}
                </Stagger>
              )}
              <Pager page={page} totalPages={talks.data?.totalPages ?? 0} onPageChange={goToPage} />
            </div>
          )}
        </div>
      </Container>

      <section aria-labelledby="talk-guest-title" className="border-t border-white/10">
        <Container className="flex flex-col items-start gap-8 py-16 sm:py-20 lg:flex-row lg:items-end lg:justify-between">
          <h2 id="talk-guest-title" className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Tu construis quelque chose ? <span className="text-white/40">Viens en parler.</span></h2>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="font-semibold"><a href={`mailto:${CONTACT_EMAIL}`}>Écris-nous</a></Button>
            <Button asChild size="lg" variant="outline"><Link to="/blog">Lire le blog</Link></Button>
          </div>
        </Container>
      </section>
    </>
  );
}
