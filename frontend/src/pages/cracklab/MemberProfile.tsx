import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import CrackLabLayout from '@/components/cracklab/CrackLabLayout';
import ProfileView from '@/components/cracklab/ProfileView';
import SEO from '@/components/common/SEO';
import { Skeleton } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/States';
import { useApi } from '@/hooks/useApi';
import { memberPath } from '@/lib/cracklab';
import { api } from '@/services/api';

export default function MemberProfile() {
  const { id = '' } = useParams();
  const memberId = Number(id);
  const member = useApi((signal) => api.cracklab.member(memberId, signal), [memberId]);
  const progress = member.data;

  return (
    <CrackLabLayout>
      {progress && <SEO title={`${progress.member.displayName} · CrackLab`} description={`Niveau ${progress.level.name}, ${progress.xp} XP sur CrackLab.`} url={memberPath(progress.member.id)} />}
      {member.error ? (
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
          <ErrorState title={member.error.status === 404 ? 'Ce profil est introuvable.' : 'Impossible de charger ce profil.'}
            message={member.error.status === 404 ? 'Ce membre n’a pas encore relevé de challenge.' : member.error.message} onRetry={member.error.status === 404 ? undefined : member.reload} />
          <Link to="/cracklab/classement" className="link mt-6 inline-flex items-center gap-1.5"><ArrowLeft className="h-4 w-4" aria-hidden />Voir le classement</Link>
        </div>
      ) : progress ? <ProfileView progress={progress} /> : (
        <div role="status" className="mx-auto max-w-5xl space-y-6 px-5 py-14 sm:px-8"><Skeleton className="h-40" /><Skeleton className="h-24" /><span className="sr-only">Chargement du profil…</span></div>
      )}
    </CrackLabLayout>
  );
}
