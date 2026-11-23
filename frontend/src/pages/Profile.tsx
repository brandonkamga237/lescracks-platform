import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, KeyRound, Loader2, Lock, LogOut, ShieldCheck } from 'lucide-react';

import AvatarPicker from '@/components/account/AvatarPicker';
import ProfileDetails from '@/components/account/ProfileDetails';
import NewsletterCard from '@/components/common/NewsletterCard';
import SEO from '@/components/common/SEO';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Notice, PasswordField } from '@/components/ui/field';
import { useSession } from '@/hooks/useSession';
import { FIELD_LABEL } from '@/lib/memberProfile';
import { fillClass } from '@/lib/progress';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';
import type { AuthProvider, ProfileField } from '@/services/types';

const PROVIDER_LABEL = { LOCAL: 'Email et mot de passe', GOOGLE: 'Google', GITHUB: 'GitHub' };

/** Where each missing field of the completion gauge is filled in. */
const SECTION_OF: Partial<Record<ProfileField, string>> = {
  PHONE: 'contact', SITUATION: 'a-propos', INTERESTS: 'a-propos', GOAL: 'a-propos', CITY: 'a-propos', BIO: 'a-propos',
};

type IdentityProvider = Exclude<AuthProvider, 'LOCAL'>;
const IDENTITY_PROVIDERS: IdentityProvider[] = ['GOOGLE', 'GITHUB'];

const CARD = 'rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 sm:p-8';
const ROW = 'flex items-center justify-between gap-4 rounded-2xl border border-white/10 px-4 py-3';

function SecurityHeading({ Icon, title, text }: { Icon: typeof Lock; title: string; text: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-400/15 text-gold-400"><Icon className="h-5 w-5" aria-hidden="true" /></span>
      <div>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-0.5 text-sm text-white/55">{text}</p>
      </div>
    </div>
  );
}

/** The member's account: who they are, how complete it is, how they sign in. */
export default function Profile() {
  const { name, user, isAdmin, refresh, signOut, socialSignIn } = useSession();
  const navigate = useNavigate();
  const { hash } = useLocation();

  // /profil#securite and #informations come from the menu: land on that section.
  useEffect(() => {
    if (!hash) return;
    const frame = requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
    return () => cancelAnimationFrame(frame);
  }, [hash]);

  const [leaving, setLeaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [editingPassword, setEditingPassword] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordNotice, setPasswordNotice] = useState('');
  const [identityBusy, setIdentityBusy] = useState(false);
  const [unlinkBusy, setUnlinkBusy] = useState<AuthProvider | null>(null);
  const [identityError, setIdentityError] = useState('');
  const [identityNotice, setIdentityNotice] = useState('');

  function closePasswordForm() {
    setEditingPassword(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError('');
    setPasswordNotice('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Le nouveau mot de passe et sa confirmation ne correspondent pas.');
      return;
    }
    if (passwordForm.newPassword.length < 10) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 10 caractères.');
      return;
    }
    setPasswordBusy(true);
    try {
      await api.changePassword(passwordForm);
      closePasswordForm();
      setPasswordNotice('Ton mot de passe a été mis à jour.');
    } catch (cause) {
      setPasswordError(cause instanceof ApiError ? cause.message : 'La mise à jour a échoué. Réessaie.');
      if (cause instanceof ApiError && cause.isUnauthenticated) await refresh().catch(() => undefined);
    } finally {
      setPasswordBusy(false);
    }
  }

  // Leave this members-only page first: signed out on it, its guard would send the reader to sign in again.
  async function leave() {
    setLeaving(true);
    navigate('/', { replace: true });
    await signOut().catch(() => undefined);
  }

  async function linkProvider(provider: IdentityProvider) {
    setIdentityError('');
    setIdentityNotice('');
    setIdentityBusy(true);
    try {
      await socialSignIn(provider.toLowerCase() as 'google' | 'github', '/profil');
    } catch (cause) {
      setIdentityBusy(false);
      setIdentityError(cause instanceof Error ? cause.message : 'Impossible d’ouvrir la fenêtre de connexion.');
    }
  }

  async function unlinkProvider(provider: IdentityProvider) {
    setIdentityError('');
    setIdentityNotice('');
    setUnlinkBusy(provider);
    try {
      await api.unlinkIdentity(provider);
      setIdentityNotice('La méthode de connexion a été retirée.');
      await refresh();
    } catch (cause) {
      setIdentityError(cause instanceof ApiError ? cause.message : 'Le retrait a échoué. Réessaie dans un instant.');
    } finally {
      setUnlinkBusy(null);
    }
  }

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : name || 'Ton compte';

  return (
    <>
      <SEO title="Mon compte" description="Tes informations, ta sécurité et tes connexions LesCracks." url="/profil" />
      <section aria-labelledby="account-title" className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(ellipse_55%_70%_at_20%_0%,rgba(212,175,55,0.09),transparent_70%)]" />
        <Container className="flex flex-col gap-6 pb-10 pt-12 sm:flex-row sm:items-end sm:justify-between sm:pb-14 sm:pt-20">
          <div className="flex min-w-0 items-center gap-5">
            <AvatarPicker name={name} avatarUrl={user?.avatarUrl} onChanged={refresh} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gold-400">Mon compte</p>
              <h1 id="account-title" className="mt-2 break-words text-[clamp(1.75rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.04em]">{fullName}</h1>
              {user?.email && <p className="mt-1 truncate text-sm text-white/50">{user.email}</p>}
            </div>
          </div>
          <Button type="button" variant="outline" disabled={leaving} onClick={() => void leave()} className="self-start sm:self-end">
            <LogOut className="h-4 w-4" aria-hidden="true" />{leaving ? 'Déconnexion…' : 'Me déconnecter'}
          </Button>
        </Container>
      </section>

      <Container className="pb-24">

        {user && user.completion < 100 && user.missing.length > 0 && (
          <section aria-labelledby="completion-title" className={cn(CARD, 'mb-6')}>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="completion-title" className="text-lg font-semibold tracking-tight">Profil complété à <span className="tabular-nums text-gold-400">{user.completion} %</span></h2>
              <a href={`#${SECTION_OF[user.missing[0]] ?? 'informations'}`} className="group inline-flex items-center gap-1.5 text-sm text-gold-400">Compléter mon profil<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></a>
            </div>
            <div aria-hidden="true" className="mt-4 h-1 rounded-full bg-white/10"><div className={cn('h-full rounded-full bg-gold-400', fillClass(user.completion / 100))} /></div>
            <p className="mt-4 text-sm text-white/55">Il manque : {user.missing.map((field) => FIELD_LABEL[field].toLocaleLowerCase('fr')).join(', ')}. Ça nous aide à te proposer les bons articles et les bons ateliers.</p>
          </section>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="min-w-0 space-y-6">
            {user ? <ProfileDetails user={user} onSaved={refresh} /> : (
              <section className={CARD}>
                <div className="flex items-start gap-3 text-sm leading-relaxed text-white/55">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" aria-hidden="true" />
                  <p>{isAdmin ? 'Tu utilises un compte administrateur. La gestion des contenus se fait dans l’administration.' : 'Tu es connecté avec un fournisseur externe. Ton identité et ton mot de passe se gèrent chez lui.'}</p>
                </div>
                {isAdmin && <Link to="/admin" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-gold-400">Ouvrir l’administration<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
              </section>
            )}
          </div>

          <div className="min-w-0 space-y-6">
            <section id="securite" aria-label="Sécurité et connexion" className={cn(CARD, 'scroll-mt-8')}>
              <div className="flex items-start justify-between gap-4">
                <SecurityHeading Icon={user?.provider === 'LOCAL' ? Lock : KeyRound} title="Mot de passe" text={user?.provider === 'LOCAL' ? 'Change-le quand tu le souhaites.' : 'Ton compte est lié à un fournisseur externe : le mot de passe se gère chez lui.'} />
                {user?.provider === 'LOCAL' && !editingPassword && <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => { setEditingPassword(true); setPasswordNotice(''); setPasswordError(''); }}>Modifier</Button>}
              </div>
              {passwordNotice && <Notice tone="info" className="mt-5">{passwordNotice}</Notice>}
              {editingPassword && user?.provider === 'LOCAL' && (
                <form onSubmit={savePassword} className="mt-6" aria-busy={passwordBusy}>
                  <fieldset disabled={passwordBusy} className="space-y-5">
                    <legend className="sr-only">Changer le mot de passe</legend>
                    <PasswordField id="current-password" label="Mot de passe actuel" autoComplete="current-password" required value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} />
                    <PasswordField id="new-password" label="Nouveau mot de passe" help="Au moins 10 caractères." autoComplete="new-password" required minLength={10} value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} />
                    <PasswordField id="confirm-password" label="Confirme le nouveau mot de passe" autoComplete="new-password" required minLength={10} value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} />
                    {passwordError && <Notice tone="error">{passwordError}</Notice>}
                    <div className="flex flex-wrap gap-3">
                      <Button type="submit" className="font-semibold">{passwordBusy && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}Enregistrer</Button>
                      <Button type="button" variant="outline" onClick={closePasswordForm}>Annuler</Button>
                    </div>
                  </fieldset>
                </form>
              )}

              {user && (
                <div className="mt-8 border-t border-white/10 pt-8">
                  <SecurityHeading Icon={KeyRound} title="Méthodes de connexion" text="Les façons de te connecter à ton compte." />
                  {identityError && <Notice tone="error" className="mt-5">{identityError}</Notice>}
                  {identityNotice && <Notice tone="info" className="mt-5">{identityNotice}</Notice>}
                  <ul className="mt-5 space-y-2">
                    <li className={ROW}>
                      <span className="text-sm">{PROVIDER_LABEL.LOCAL}</span>
                      <span className={cn('text-xs font-medium', user.provider === 'LOCAL' ? 'text-gold-400' : 'text-white/45')}>{user.provider === 'LOCAL' ? 'Actif' : 'Inactif'}</span>
                    </li>
                    {IDENTITY_PROVIDERS.map((provider) => {
                      const linked = user.identities?.some((identity) => identity.provider === provider);
                      const onlyMethod = linked && user.provider !== 'LOCAL' && user.identities?.length === 1 && user.identities[0]?.provider === provider;
                      return (
                        <li key={provider} className={ROW}>
                          <span className="text-sm">{PROVIDER_LABEL[provider]}</span>
                          {linked
                            ? <button type="button" disabled={Boolean(unlinkBusy) || onlyMethod} onClick={() => void unlinkProvider(provider)} className="min-h-9 text-xs font-medium text-error-ink disabled:opacity-50">{unlinkBusy === provider ? 'Retrait…' : onlyMethod ? 'Obligatoire' : 'Retirer'}</button>
                            : <button type="button" disabled={identityBusy} onClick={() => void linkProvider(provider)} className="min-h-9 text-xs font-medium text-gold-400 disabled:opacity-50">{identityBusy ? 'Redirection…' : 'Lier'}</button>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </section>

            <NewsletterCard />
          </div>
        </div>
      </Container>
    </>
  );
}
