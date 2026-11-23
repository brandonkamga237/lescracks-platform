import { Link, useParams } from 'react-router-dom';
import { Award, ExternalLink, MapPin } from 'lucide-react';

import SEO from '@/components/common/SEO';
import MemberAvatar from '@/components/community/MemberAvatar';
import BadgeList from '@/components/recognition/BadgeList';
import { ArrowCircle } from '@/components/ui/arrow-circle';
import { Container } from '@/components/ui/container';
import { EmptyPanel, ErrorPanel } from '@/components/ui/panels';
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
    <Container className="py-12 sm:py-20">
      <SEO title={data?.name ?? 'Membre'} url={`/membres/${id}`} noindex description="Un membre de la communauté LesCracks." />
      <div className="mx-auto max-w-3xl">
        {profile.loading && <div aria-hidden="true" className="h-48 animate-pulse rounded-3xl bg-white/[0.03] motion-reduce:animate-none" />}
        {profile.error?.status === 404 && <EmptyPanel title="Ce profil n’existe pas." description="Le membre a peut-être quitté LesCracks." />}
        {profile.error && profile.error.status !== 404 && <ErrorPanel title="Le profil est momentanément indisponible." message={profile.error.message} onRetry={profile.reload} />}
        {data && (
          <>
            <header className="flex items-center gap-5">
              <MemberAvatar name={data.name} avatarUrl={data.avatarUrl} size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gold-400">Membre depuis {sinceFormat.format(new Date(data.memberSince))}</p>
                <h1 className="mt-2 break-words text-[clamp(1.75rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.04em]">{data.name}</h1>
                {data.location && <p className="mt-2 flex items-center gap-1.5 text-sm text-white/55"><MapPin className="h-4 w-4" aria-hidden="true" />{data.location}</p>}
              </div>
            </header>
            {data.bio && <p className="mt-8 whitespace-pre-line text-lg leading-relaxed text-white/70">{data.bio}</p>}
            {data.links && (
              <ul className="mt-6 flex flex-wrap gap-2">
                {Object.entries(data.links).map(([platform, url]) => (
                  <li key={platform}><a href={url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/12 px-4 text-sm capitalize text-white/70 transition-colors hover:border-white/35 hover:text-white">{platform}<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a></li>
                ))}
              </ul>
            )}

            <section aria-labelledby="badges-title" className="mt-14">
              <h2 id="badges-title" className="text-2xl font-semibold tracking-tight">Badges</h2>
              {data.badges.length ? <div className="mt-5"><BadgeList badges={data.badges} /></div> : <p className="mt-3 text-sm text-white/45">Pas encore de badge.</p>}
            </section>

            {data.certificates.length > 0 && (
              <section aria-labelledby="certificates-title" className="mt-14">
                <h2 id="certificates-title" className="text-2xl font-semibold tracking-tight">Attestations</h2>
                <ul className="mt-5 grid gap-3">
                  {data.certificates.map((certificate) => (
                    <li key={certificate.code}>
                      <Link to={`/attestations/${certificate.code}`} className="group flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-gold-400/40">
                        <Award className="h-6 w-6 shrink-0 text-gold-400" aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium first-letter:uppercase">{certificate.title}</span>
                          <span className="mt-1 block text-sm text-white/50">Délivrée le {dateFormat.format(new Date(certificate.issuedAt))}</span>
                        </span>
                        <ArrowCircle />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </Container>
  );
}
