import { Link } from 'react-router-dom';

import CrackLabLayout from '@/components/cracklab/CrackLabLayout';
import ProfileView from '@/components/cracklab/ProfileView';
import SEO from '@/components/common/SEO';
import { Skeleton } from '@/components/common/Skeleton';
import { useCrackLabProgress } from '@/hooks/useCrackLabProgress';

export default function MyProfile() {
  const { progress, playing } = useCrackLabProgress();
  return (
    <CrackLabLayout>
      <SEO title="Mon profil · CrackLab" description="Ton niveau, ton rang, tes badges et tes challenges CrackLab." url="/cracklab/moi" />
      {!playing ? (
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
          <p className="rounded-lg border border-line bg-noir-900 p-6 text-sm text-t3">Les challenges se jouent avec un compte membre. Ton compte administrateur sert à les écrire et à noter les réponses.</p>
          <Link to="/admin/cracklab/challenges" className="btn-primary mt-6">Administration CrackLab</Link>
        </div>
      ) : progress ? <ProfileView progress={progress} /> : (
        <div role="status" className="mx-auto max-w-5xl space-y-6 px-5 py-14 sm:px-8"><Skeleton className="h-40" /><Skeleton className="h-24" /><span className="sr-only">Chargement de ton profil…</span></div>
      )}
    </CrackLabLayout>
  );
}
