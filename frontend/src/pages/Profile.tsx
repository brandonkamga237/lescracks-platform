import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Award, CalendarCheck, CalendarPlus, Lock, Medal, ShieldCheck, type LucideIcon } from 'lucide-react';

import AvatarPicker from '@/components/account/AvatarPicker';
import ProfileDetails from '@/components/account/ProfileDetails';
import NewsletterCard from '@/components/common/NewsletterCard';
import InstallAppCard from '@/components/install/InstallAppCard';
import SEO from '@/components/common/SEO';
import BadgeList from '@/components/recognition/BadgeList';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { FIELD_LABEL } from '@/lib/memberProfile';
import { fillClass } from '@/lib/progress';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import type { ProfileField } from '@/services/types';

/** Where each missing field of the completion gauge is filled in. */
const SECTION_OF: Partial<Record<ProfileField, string>> = {
  PHONE: 'contact', SITUATION: 'a-propos', INTERESTS: 'a-propos', GOAL: 'a-propos', CITY: 'a-propos', BIO: 'a-propos',
};

const CARD = 'rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6';
const sinceFormat = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

function Stat({ value, label, Icon }: { value: number | undefined; label: string; Icon: LucideIcon }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-400/10 text-gold-400"><Icon className="h-5 w-5" aria-hidden="true" /></span>
      <span className="min-w-0">
        <span className="block text-xl font-semibold leading-tight tabular-nums">{value ?? '–'}</span>
        <span className="block truncate text-xs text-white/50">{label}</span>
      </span>
    </li>
  );
}

/** The member's profile: who they are, what they have done and earned, and what they tell us. */
export default function Profile() {
  const { name, user, isAdmin, refresh } = useSession();
  const { hash } = useLocation();

  // A link from elsewhere (/profil#a-propos) lands on that section once the page has drawn it.
  useEffect(() => {
    if (!hash || !user) return;
    const frame = requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
    return () => cancelAnimationFrame(frame);
  }, [hash, user]);
  const mine = useApi((signal) => (user ? api.myEvents(signal) : Promise.resolve([])), [user?.id], `my-events:${user?.id}`);
  const certificates = useApi((signal) => (user ? api.myCertificates(signal) : Promise.resolve([])), [user?.id], `my-certificates:${user?.id}`);
  const badges = useApi((signal) => (user ? api.myBadges(signal) : Promise.resolve([])), [user?.id], `my-badges:${user?.id}`);

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : name || 'Ton compte';
  const issued = certificates.data?.filter((certificate) => !certificate.revoked);
  const attended = mine.data?.filter((event) => event.status === 'ATTENDED').length;

  return (
    <>
      <SEO title="Mon profil" description="Ton profil LesCracks : tes informations, tes attestations et tes badges." url="/profil" />
      <Container className="flex flex-col gap-5 pb-6 pt-8 sm:flex-row sm:items-center sm:justify-between sm:pt-10">
        <div className="flex min-w-0 items-center gap-5">
          <AvatarPicker name={name} avatarUrl={user?.avatarUrl} onChanged={refresh} />
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">{fullName}</h1>
            {user && <p className="mt-1 text-sm text-white/50">Membre depuis {sinceFormat.format(new Date(user.createdAt))}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {user && <Button asChild size="sm" variant="outline"><Link to={`/membres/${user.id}`}>Mon profil public<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link></Button>}
          <Button asChild size="sm" variant="outline"><Link to="/profil/securite"><Lock className="h-4 w-4" aria-hidden="true" />Sécurité</Link></Button>
        </div>
      </Container>

      <Container className="space-y-10 pb-20">
        {user && (
          <section aria-labelledby="stats-title">
            <h2 id="stats-title" className="sr-only">Mes chiffres</h2>
            <ul className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Stat value={mine.data?.length} label="Inscriptions" Icon={CalendarPlus} />
              <Stat value={attended} label="Participations" Icon={CalendarCheck} />
              <Stat value={issued?.length} label="Attestations" Icon={Award} />
              <Stat value={badges.data?.length} label="Badges" Icon={Medal} />
              <li className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 lg:col-span-1">
                <span className="block text-2xl font-semibold tabular-nums">{user.completion} %</span>
                <span className="mt-0.5 block text-sm text-white/50">Profil complété</span>
                <span aria-hidden="true" className="mt-2 block h-1 rounded-full bg-white/10"><span className={cn('block h-full rounded-full bg-gold-400', fillClass(user.completion / 100))} /></span>
              </li>
            </ul>
            {user.completion < 100 && user.missing.length > 0 && (
              <p className="mt-3 text-sm text-white/55">
                Il manque : {user.missing.map((field) => FIELD_LABEL[field].toLocaleLowerCase('fr')).join(', ')}.{' '}
                <a href={`#${SECTION_OF[user.missing[0]] ?? 'informations'}`} className="inline-flex items-center gap-1 text-gold-400 underline-offset-4 hover:underline">Compléter<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></a>
              </p>
            )}
          </section>
        )}

        {user && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section aria-labelledby="badges-title" className={CARD}>
              <h2 id="badges-title" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight"><Medal className="h-5 w-5 text-gold-400" aria-hidden="true" />Mes badges</h2>
              {badges.data?.length
                ? <div className="mt-4"><BadgeList badges={badges.data} /></div>
                : <p className="mt-2 text-sm text-white/55">Les badges récompensent ta participation à la communauté. Le premier arrive vite.</p>}
            </section>
            <section aria-labelledby="certificates-title" className={CARD}>
              <h2 id="certificates-title" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight"><Award className="h-5 w-5 text-gold-400" aria-hidden="true" />Mes attestations</h2>
              {issued?.length ? (
                <ul className="mt-4 space-y-2">
                  {issued.map((certificate) => (
                    <li key={certificate.code}>
                      <Link to={`/attestations/${certificate.code}`} className="group flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 transition-colors hover:border-gold-400/40">
                        <Award className="h-5 w-5 shrink-0 text-gold-400" aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium first-letter:uppercase group-hover:text-gold-400">{certificate.title}</span>
                          {certificate.issuedAt && <span className="block text-xs text-white/45">Délivrée le {dateFormat.format(new Date(certificate.issuedAt))}</span>}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-sm text-white/55">Chaque rendez-vous suivi te vaut une attestation vérifiable, à partager avec un recruteur.</p>}
            </section>
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="min-w-0 space-y-6">
            {user ? <ProfileDetails user={user} onSaved={refresh} /> : (
              <section className={CARD}>
                <div className="flex items-start gap-3 text-sm leading-relaxed text-white/55">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" aria-hidden="true" />
                  <p>{isAdmin ? 'Tu utilises un compte administrateur. La gestion des contenus se fait dans l’administration.' : 'Tu es connecté avec un fournisseur externe. Ton identité se gère chez lui.'}</p>
                </div>
                {isAdmin && <Link to="/admin" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-gold-400">Ouvrir l’administration<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
              </section>
            )}
          </div>
          <div className="min-w-0 space-y-6"><InstallAppCard /><NewsletterCard /></div>
        </div>
      </Container>
    </>
  );
}
