import { Link, useParams } from 'react-router-dom';
import { Award, ExternalLink, MapPin } from 'lucide-react';

import SEO from '@/components/common/SEO';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState, ErrorState } from '@/components/common/States';
import MemberAvatar from '@/components/community/MemberAvatar';
import Layout from '@/components/layout/Layout';
import { Section } from '@/components/layout/Page';
import BadgeList from '@/components/recognition/BadgeList';
import { useApi } from '@/hooks/useApi';
import { api } from '@/services/api';

const sinceFormat = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

/** A member's public page: what they chose to show, their badges and their attestations. */
export default function MemberProfile() {
  const { id = '' } = useParams();
  const memberId = Number(id);
  const profile = useApi((signal) => api.publicProfile(memberId, signal), [memberId]);
  const data = profile.data;

  return (
    <Layout>
      <SEO title={data?.name ?? 'Membre'} url={`/membres/${id}`} noindex description="Un membre de la communauté LesCracks." />
      <Section spacing="tight">
        <div className="mx-auto max-w-3xl">
          {profile.loading ? (
            <Skeleton className="h-48 rounded-lg" />
          ) : profile.error?.status === 404 ? (
            <EmptyState title="Ce profil n’existe pas." description="Le membre a peut-être quitté LesCracks." />
          ) : profile.error ? (
            <ErrorState title="Le profil est momentanément indisponible." message={profile.error.message} onRetry={profile.reload} />
          ) : data && (
            <>
              <header className="flex items-center gap-5">
                <MemberAvatar name={data.name} avatarUrl={data.avatarUrl} size="lg" />
                <div className="min-w-0">
                  <h1 className="break-words text-2xl sm:text-4xl">{data.name}</h1>
                  <p className="mt-1 text-sm text-t3">Membre depuis {sinceFormat.format(new Date(data.memberSince))}</p>
                  {data.location && <p className="mt-1 flex items-center gap-1.5 text-sm text-t2"><MapPin className="h-4 w-4 text-t4" aria-hidden />{data.location}</p>}
                </div>
              </header>
              {data.bio && <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-t2">{data.bio}</p>}
              {data.links && (
                <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  {Object.entries(data.links).map(([platform, url]) => (
                    <li key={platform}><a href={url} target="_blank" rel="noopener noreferrer nofollow" className="link inline-flex items-center gap-1.5 capitalize">{platform}<ExternalLink className="h-3.5 w-3.5" aria-hidden /></a></li>
                  ))}
                </ul>
              )}

              <section aria-labelledby="badges-heading" className="mt-10">
                <h2 id="badges-heading" className="text-lg sm:text-xl">Badges</h2>
                {data.badges.length ? <div className="mt-4"><BadgeList badges={data.badges} /></div> : <p className="mt-3 text-sm text-t4">Pas encore de badge.</p>}
              </section>

              {data.certificates.length > 0 && (
                <section aria-labelledby="certificates-heading" className="mt-10">
                  <h2 id="certificates-heading" className="text-lg sm:text-xl">Attestations</h2>
                  <ul className="mt-4 space-y-2">
                    {data.certificates.map((certificate) => (
                      <li key={certificate.code}>
                        <Link to={`/attestations/${certificate.code}`} className="flex items-start gap-3 rounded-lg border border-line-soft bg-card p-4 transition-colors hover:border-line">
                          <Award className="mt-0.5 h-5 w-5 shrink-0 text-gold-ink" aria-hidden />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-t1 first-letter:uppercase">{certificate.title}</span>
                            <span className="block text-xs text-t4">Délivrée le {dateFormat.format(new Date(certificate.issuedAt))}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      </Section>
    </Layout>
  );
}
