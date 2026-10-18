import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, BookOpen, CalendarDays, KeyRound, Loader2, Lock, LogOut, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import Layout from '@/components/layout/Layout';
import { Section } from '@/components/layout/Page';
import SEO from '@/components/common/SEO';
import NewsletterCard from '@/components/common/NewsletterCard';
import ProfileDetails from '@/components/account/ProfileDetails';
import AvatarPicker from '@/components/account/AvatarPicker';
import { fillClass } from '@/lib/cracklab';
import { FIELD_LABEL } from '@/lib/memberProfile';
import { useSession } from '@/hooks/useSession';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';
import type { AuthProvider, ProfileField } from '@/services/types';

const providerLabels = { LOCAL: 'Email / mot de passe', GOOGLE: 'Google', GITHUB: 'GitHub' };

/** Where each missing field of the completion gauge is filled in. */
const SECTION_OF: Partial<Record<ProfileField, string>> = {
  PHONE: 'contact', SITUATION: 'a-propos', INTERESTS: 'a-propos', GOAL: 'a-propos', CITY: 'a-propos', BIO: 'a-propos',
};

type IdentityProvider = Exclude<AuthProvider, 'LOCAL'>;

const identityProviders: { provider: IdentityProvider; label: string }[] = [
  { provider: 'GOOGLE', label: 'Google' },
  { provider: 'GITHUB', label: 'GitHub' },
];

export default function Profile() {
  const { name, user, isAdmin, refresh, signOut, socialSignIn } = useSession();
  const navigate = useNavigate();
  const { hash } = useLocation();

  // /profil#securite and #informations come from the account menu: land on that section.
  useEffect(() => {
    if (!hash) return;
    const frame = requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, [hash]);
  const [busy, setBusy] = useState<'logout' | null>(null);
  const [error, setError] = useState('');

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [editingPassword, setEditingPassword] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordNotice, setPasswordNotice] = useState('');

  const [identityBusy, setIdentityBusy] = useState(false);
  const [unlinkBusy, setUnlinkBusy] = useState<AuthProvider | null>(null);
  const [identityError, setIdentityError] = useState('');
  const [identityNotice, setIdentityNotice] = useState('');

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
      await api.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setEditingPassword(false);
      setPasswordNotice('Ton mot de passe a été mis à jour.');
    } catch (cause) {
      setPasswordError(cause instanceof ApiError ? cause.message : 'La mise à jour a échoué. Réessaie.');
      if (cause instanceof ApiError && cause.isUnauthenticated) await refresh().catch(() => undefined);
    } finally {
      setPasswordBusy(false);
    }
  }

  async function logout() {
    setBusy('logout');
    setError('');
    try {
      await signOut();
      navigate('/connexion', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La déconnexion a échoué. Réessaie.');
    } finally {
      setBusy(null);
    }
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


  return <Layout>
    <SEO title="Mon compte" description="Tes informations, ta sécurité et tes connexions LesCracks." url="/profil" />
    <Section spacing="tight">
      <header className="flex items-center justify-between gap-6 border-b border-line-soft pb-6 sm:pb-8">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <AvatarPicker name={name} avatarUrl={user?.avatarUrl} onChanged={refresh} />
          <div className="min-w-0">
            <p className="kicker">Mon compte</p>
            <h1 className="mt-1 break-words text-xl sm:text-3xl">{user ? `${user.firstName} ${user.lastName}`.trim() : name || 'Ton compte'}</h1>
            {user?.email && <p className="mt-1 truncate text-sm text-t4">{user.email}</p>}
          </div>
        </div>
        <button type="button" disabled={Boolean(busy)} onClick={() => void logout()} className="btn-secondary hidden self-start lg:inline-flex"><LogOut aria-hidden="true" className="h-4 w-4" />{busy === 'logout' ? 'Déconnexion…' : 'Me déconnecter'}</button>
      </header>
      {error && <p role="alert" className="mt-5 rounded border border-error/25 bg-error/5 p-3 text-sm text-error-ink">{error}</p>}
      {user && user.completion < 100 && user.missing.length > 0 && (
        <section aria-labelledby="completion-heading" className="mt-6 rounded-lg border border-line bg-card p-4 sm:mt-8 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="completion-heading" className="font-sans text-base font-medium tracking-normal text-t1">Profil complété à <span className="font-mono tabular-nums text-gold-ink">{user.completion} %</span></h2>
            <a href={`#${SECTION_OF[user.missing[0]] ?? 'informations'}`} className="link text-sm">Compléter mon profil</a>
          </div>
          <div aria-hidden className="mt-3 h-1 rounded-full bg-noir-700"><div className={`h-full rounded-full bg-gold-400 ${fillClass(user.completion / 100)}`} /></div>
          <p className="mt-3 text-sm text-t3">Il manque : {user.missing.map((field) => FIELD_LABEL[field].toLocaleLowerCase('fr')).join(', ')}. Ça nous aide à te proposer les bons articles et les bons ateliers.</p>
        </section>
      )}
      <div className="mt-6 grid items-start gap-6 sm:mt-8 lg:grid-cols-[1.2fr_1fr] lg:gap-8">
        <div className="min-w-0 space-y-6">
        {user ? <ProfileDetails user={user} onSaved={refresh} /> : (
          <section className="rounded-lg border border-line-soft bg-card p-4 sm:p-7">
            <div className="flex items-start gap-3 text-sm leading-relaxed text-t4"><ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-gold-ink" /><p>{isAdmin ? 'Tu utilises un compte administrateur. La gestion des contenus est accessible depuis ton tableau de bord.' : 'Tu es connecté avec un fournisseur externe. Aucun profil membre modifiable n’est disponible pour cette connexion. Ton identité et ton mot de passe se gèrent auprès de ton fournisseur.'}</p></div>
            {isAdmin && <Link to="/admin" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-gold-ink">Ouvrir l’administration<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>}
          </section>
        )}
        <section id="securite" className="scroll-mt-24 rounded-lg border border-line-soft bg-card p-4 sm:p-7" aria-label="Sécurité et connexion">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-gold-400/25 bg-gold-400/10 text-gold-ink">
                  {user?.provider === 'LOCAL' ? <Lock className="h-5 w-5" aria-hidden="true" /> : <KeyRound className="h-5 w-5" aria-hidden="true" />}
                </div>
                <div>
                  <h3 className="text-lg text-t1">Sécurité</h3>
                  <p className="text-sm text-t4">
                    {user?.provider === 'LOCAL'
                      ? 'Change ton mot de passe quand tu le souhaites.'
                      : 'Ton compte est lié à un fournisseur externe. Le mot de passe se gère chez ce fournisseur.'}
                  </p>
                </div>
              </div>
              {user?.provider === 'LOCAL' && !editingPassword && (
                <button type="button" onClick={() => { setEditingPassword(true); setPasswordNotice(''); setPasswordError(''); }} className="min-h-11 px-2 text-sm font-medium text-gold-ink underline-offset-4 hover:underline">Modifier</button>
              )}
            </div>
            {passwordNotice && <p role="status" className="mt-5 rounded border border-gold-400/25 bg-gold-400/5 p-3 text-sm text-gold-ink">{passwordNotice}</p>}
            {passwordError && <p role="alert" className="mt-5 rounded border border-error/25 bg-error/5 p-3 text-sm text-error-ink">{passwordError}</p>}
            {editingPassword && user?.provider === 'LOCAL' && (
              <form onSubmit={savePassword} className="mt-5 space-y-5" aria-busy={passwordBusy}>
                <fieldset disabled={passwordBusy}>
                  <legend className="sr-only">Changer le mot de passe</legend>
                  <div><label htmlFor="current-password" className="text-sm font-medium text-t2">Mot de passe actuel</label><input id="current-password" type="password" autoComplete="current-password" required value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} className="input mt-2" /></div>
                  <div><label htmlFor="new-password" className="text-sm font-medium text-t2">Nouveau mot de passe</label><input id="new-password" type="password" autoComplete="new-password" required minLength={10} value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} className="input mt-2" /><p className="mt-2 text-xs text-t4">Au moins 10 caractères.</p></div>
                  <div><label htmlFor="confirm-password" className="text-sm font-medium text-t2">Confirme le nouveau mot de passe</label><input id="confirm-password" type="password" autoComplete="new-password" required minLength={10} value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} className="input mt-2" /></div>
                  <div className="flex flex-wrap gap-3"><button type="submit" className="btn-primary">{passwordBusy ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : 'Enregistrer'}</button><button type="button" onClick={() => { setEditingPassword(false); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPasswordError(''); setPasswordNotice(''); }} className="btn-secondary">Annuler</button></div>
                </fieldset>
              </form>
            )}
          </div>
          {user && (
            <div className="mt-8 border-t border-line-soft pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-gold-400/25 bg-gold-400/10 text-gold-ink"><KeyRound className="h-5 w-5" aria-hidden="true" /></div>
                  <div>
                    <h3 className="text-lg text-t1">Méthodes de connexion</h3>
                    <p className="text-sm text-t4">Gère les façons de te connecter à ton compte.</p>
                  </div>
                </div>
              </div>
              {identityError && <p role="alert" className="mt-5 rounded border border-error/25 bg-error/5 p-3 text-sm text-error-ink">{identityError}</p>}
              {identityNotice && <p role="status" className="mt-5 rounded border border-gold-400/25 bg-gold-400/5 p-3 text-sm text-gold-ink">{identityNotice}</p>}
              <ul className="mt-5 space-y-3">
                <li className="flex items-center justify-between gap-4 rounded-lg border border-line-soft bg-noir-900 px-4 py-3">
                  <span className="text-sm text-t1">{providerLabels.LOCAL}</span>
                  {user.provider === 'LOCAL' ? (
                    <span className="text-xs font-medium text-gold-ink">Actif</span>
                  ) : (
                    <span className="text-xs text-t4">Inactif</span>
                  )}
                </li>
                {identityProviders.map(({ provider, label }) => {
                  const linked = user.identities?.some((identity) => identity.provider === provider);
                  const onlyMethod = linked && user.provider !== 'LOCAL' && user.identities?.length === 1 && user.identities[0]?.provider === provider;
                  return (
                    <li key={provider} className="flex items-center justify-between gap-4 rounded-lg border border-line-soft bg-noir-900 px-4 py-3">
                      <span className="text-sm text-t1">{label}</span>
                      {linked ? (
                        <button
                          type="button"
                          disabled={Boolean(unlinkBusy) || onlyMethod}
                          onClick={() => void unlinkProvider(provider)}
                          className="text-xs font-medium text-error-ink disabled:opacity-50"
                        >
                          {unlinkBusy === provider ? 'Retrait…' : onlyMethod ? 'Obligatoire' : 'Retirer'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={identityBusy}
                          onClick={() => void linkProvider(provider)}
                          className="text-xs font-medium text-gold-ink disabled:opacity-50"
                        >
                          {identityBusy ? 'Redirection…' : 'Lier'}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
        </div>
        <section aria-labelledby="quick-links-heading">
          <h2 id="quick-links-heading" className="text-lg text-t1 sm:text-xl">Et maintenant ?</h2>
          <div className="mt-4 space-y-3">
            <Link to="/blog" className="group flex gap-4 rounded-lg border border-line-soft bg-card p-4 transition-colors hover:border-line sm:p-5"><BookOpen aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-gold-ink" /><div className="flex-1"><h3 className="font-sans text-base font-semibold tracking-normal text-t1">Lire le blog</h3><p className="mt-1 text-sm leading-relaxed text-t4">Des articles pour approfondir les sujets qui t’intéressent.</p></div><ArrowRight aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-t4 transition group-hover:text-gold-ink" /></Link>
            <Link to="/evenements" className="group flex gap-4 rounded-lg border border-line-soft bg-card p-4 transition-colors hover:border-line sm:p-5"><CalendarDays aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-gold-ink" /><div className="flex-1"><h3 className="font-sans text-base font-semibold tracking-normal text-t1">Trouver un événement</h3><p className="mt-1 text-sm leading-relaxed text-t4">Découvre les prochains rendez-vous pour apprendre et échanger.</p></div><ArrowRight aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-t4 transition group-hover:text-gold-ink" /></Link>
          </div>
          <div className="mt-6">
            <NewsletterCard />
          </div>
        </section>
      </div>
    </Section>
  </Layout>;
}
