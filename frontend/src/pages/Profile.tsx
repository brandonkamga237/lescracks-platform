import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, BookOpen, CalendarDays, KeyRound, Loader2, Lock, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import Layout from '@/components/layout/Layout';
import { Section } from '@/components/layout/Page';
import SEO from '@/components/common/SEO';
import NewsletterCard from '@/components/common/NewsletterCard';
import { useSession } from '@/hooks/useSession';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';
import type { AuthProvider } from '@/services/types';

const statusLabels = { ACTIVE: 'Actif', INACTIVE: 'Inactif', BANNED: 'Suspendu' };
const providerLabels = { LOCAL: 'Email / mot de passe', GOOGLE: 'Google', GITHUB: 'GitHub' };

type IdentityProvider = Exclude<AuthProvider, 'LOCAL'>;

const identityProviders: { provider: IdentityProvider; label: string }[] = [
  { provider: 'GOOGLE', label: 'Google' },
  { provider: 'GITHUB', label: 'GitHub' },
];

export default function Profile() {
  const { name, email, user, isAdmin, refresh, signOut, socialSignIn } = useSession();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', username: user?.username ?? '', bio: user?.bio ?? '', location: user?.location ?? '' });
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<'save' | 'logout' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [editingPassword, setEditingPassword] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordNotice, setPasswordNotice] = useState('');

  const [identityBusy, setIdentityBusy] = useState(false);
  const [unlinkBusy, setUnlinkBusy] = useState<AuthProvider | null>(null);
  const [identityError, setIdentityError] = useState('');
  const [identityNotice, setIdentityNotice] = useState('');

  useEffect(() => {
    setForm({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      username: user?.username ?? '',
      bio: user?.bio ?? '',
      location: user?.location ?? '',
    });
  }, [user?.firstName, user?.lastName, user?.username, user?.bio, user?.location]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    setFields({});
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Renseigne ton prénom et ton nom pour enregistrer les modifications.');
      return;
    }
    setBusy('save');
    try {
      await api.updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        username: form.username.trim() || undefined,
        bio: form.bio.trim() || undefined,
        location: form.location.trim() || undefined,
      });
      await refresh();
      setEditing(false);
      setNotice('Tes informations ont bien été mises à jour.');
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Tes modifications n’ont pas pu être confirmées. Réessaie dans un instant.');
      setFields(cause instanceof ApiError ? cause.fields ?? {} : {});
      if (cause instanceof ApiError && cause.isUnauthenticated) await refresh().catch(() => undefined);
    } finally {
      setBusy(null);
    }
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

  const joined = user?.createdAt ? new Date(user.createdAt) : null;
  const joinedLabel = joined && !Number.isNaN(joined.getTime()) ? joined.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  return <Layout>
    <SEO title="Ton espace" description="Retrouve tes informations et les ressources de la communauté LesCracks." url="/profil" />
    <Section spacing="normal">
      <header className="flex flex-col gap-6 border-b border-line-soft/50 pb-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5"><div aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-gold-400/30 bg-gold-400/10 font-display text-2xl text-gold-400">{name ? name.charAt(0).toUpperCase() : <UserRound className="h-7 w-7" />}</div><div><p className="text-sm font-medium tracking-wide text-gold-400">Ton espace personnel</p><h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-t1 sm:text-4xl">Bonjour{user?.firstName ? `, ${user.firstName}` : name ? `, ${name}` : ''}.</h1><p className="mt-2 text-sm text-t4">Un point de départ pour ta prochaine découverte.</p></div></div>
        <button type="button" disabled={Boolean(busy)} onClick={() => void logout()} className="btn-secondary self-start"><LogOut aria-hidden="true" className="h-4 w-4" />{busy === 'logout' ? 'Déconnexion…' : 'Me déconnecter'}</button>
      </header>
      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-3xl border border-white/[0.06] bg-card p-6 sm:p-8" aria-labelledby="profile-heading">
          <div className="flex items-start justify-between gap-4"><div><h2 id="profile-heading" className="font-display text-xl font-semibold text-t1">Mes informations</h2><p className="mt-2 text-sm text-t4">Les informations liées à ton compte.</p></div>{user && !editing && <button type="button" disabled={Boolean(busy)} onClick={() => { setEditing(true); setNotice(''); }} className="min-h-11 px-2 text-sm font-medium text-gold-400 underline-offset-4 hover:underline">Modifier</button>}</div>
          {error && <p role="alert" className="mt-5 rounded-xl border border-red-400/25 bg-red-400/5 p-3 text-sm text-red-400">{error}</p>}
          {notice && <p role="status" className="mt-5 rounded-xl border border-gold-400/25 bg-gold-400/5 p-3 text-sm text-gold-400">{notice}</p>}
          {editing && user ? <form onSubmit={save} className="mt-7" aria-busy={busy === 'save'}>
            <fieldset disabled={Boolean(busy)} className="space-y-5"><legend className="sr-only">Modifier tes informations</legend>
              {(['firstName', 'lastName'] as const).map((key) => <div key={key}><label htmlFor={`profile-${key}`} className="text-sm font-medium text-t2">{key === 'firstName' ? 'Prénom' : 'Nom'}</label><input id={`profile-${key}`} name={key} autoComplete={key === 'firstName' ? 'given-name' : 'family-name'} required value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="input mt-2" aria-invalid={Boolean(fields[key])} aria-describedby={fields[key] ? `profile-${key}-error` : undefined} />{fields[key] && <p id={`profile-${key}-error`} className="mt-2 text-sm text-red-400">{fields[key]}</p>}</div>)}
              <div><label htmlFor="profile-username" className="text-sm font-medium text-t2">Nom d'utilisateur</label><input id="profile-username" name="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} className="input mt-2" /></div>
              <div><label htmlFor="profile-bio" className="text-sm font-medium text-t2">Bio</label><textarea id="profile-bio" name="bio" rows={3} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} className="input mt-2" /></div>
              <div><label htmlFor="profile-location" className="text-sm font-medium text-t2">Localisation</label><input id="profile-location" name="location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className="input mt-2" /></div>
              <div className="flex flex-wrap gap-3"><button type="submit" className="btn-primary">{busy === 'save' && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />}{busy === 'save' ? 'Enregistrement…' : 'Enregistrer'}</button><button type="button" onClick={() => { setEditing(false); setForm({ firstName: user.firstName, lastName: user.lastName, username: user.username ?? '', bio: user.bio ?? '', location: user.location ?? '' }); setError(''); setFields({}); }} className="btn-secondary">Annuler</button></div>
            </fieldset>
          </form> : <dl className="mt-7 space-y-5">
            <div><dt className="text-xs tracking-wide text-t4">Nom complet</dt><dd className="mt-1 text-t1">{name || 'Non renseigné'}</dd></div>
            <div><dt className="text-xs tracking-wide text-t4">Adresse email</dt><dd className="mt-1 break-all text-t1">{email || 'Non disponible pour ce compte'}</dd></div>
            {user && <div className="flex flex-wrap gap-x-12 gap-y-5"><div><dt className="text-xs tracking-wide text-t4">Nom d'utilisateur</dt><dd className="mt-1 text-t1">{user.username || '—'}</dd></div><div><dt className="text-xs tracking-wide text-t4">Localisation</dt><dd className="mt-1 text-t1">{user.location || '—'}</dd></div><div><dt className="text-xs tracking-wide text-t4">Statut du compte</dt><dd className="mt-1 text-t1">{statusLabels[user.status] ?? user.status}</dd></div><div><dt className="text-xs tracking-wide text-t4">Connexion</dt><dd className="mt-1 text-t1">{providerLabels[user.provider] ?? user.provider}</dd></div>{joinedLabel && <div><dt className="text-xs tracking-wide text-t4">Membre depuis le</dt><dd className="mt-1 text-t1"><time dateTime={user.createdAt}>{joinedLabel}</time></dd></div>}</div>}
            {user?.bio && <div><dt className="text-xs tracking-wide text-t4">Bio</dt><dd className="mt-1 whitespace-pre-line text-t1">{user.bio}</dd></div>}
          </dl>}
          <div className="mt-7 flex items-start gap-3 border-t border-line-soft pt-5 text-sm leading-relaxed text-t4"><ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" /><p>{user ? 'Tu peux modifier tes informations ici. Ton adresse email reste liée à ton compte et ne peut pas être modifiée depuis cet espace.' : isAdmin ? 'Tu utilises un compte administrateur. La gestion des contenus est accessible depuis ton tableau de bord.' : 'Tu es connecté avec un fournisseur externe. Aucun profil membre modifiable n’est disponible pour cette connexion. Ton identité et ton mot de passe se gèrent auprès de ton fournisseur.'}</p></div>
          {isAdmin && <Link to="/admin" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-gold-400">Ouvrir l’administration<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>}

          <div className="mt-10 border-t border-line-soft pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold-400/25 bg-gold-400/10 text-gold-400">
                  {user?.provider === 'LOCAL' ? <Lock className="h-5 w-5" aria-hidden="true" /> : <KeyRound className="h-5 w-5" aria-hidden="true" />}
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-t1">Sécurité</h3>
                  <p className="text-sm text-t4">
                    {user?.provider === 'LOCAL'
                      ? 'Change ton mot de passe quand tu le souhaites.'
                      : 'Ton compte est lié à un fournisseur externe. Le mot de passe se gère chez ce fournisseur.'}
                  </p>
                </div>
              </div>
              {user?.provider === 'LOCAL' && !editingPassword && (
                <button type="button" onClick={() => { setEditingPassword(true); setPasswordNotice(''); setPasswordError(''); }} className="min-h-11 px-2 text-sm font-medium text-gold-400 underline-offset-4 hover:underline">Modifier</button>
              )}
            </div>
            {passwordNotice && <p role="status" className="mt-5 rounded-xl border border-gold-400/25 bg-gold-400/5 p-3 text-sm text-gold-400">{passwordNotice}</p>}
            {passwordError && <p role="alert" className="mt-5 rounded-xl border border-red-400/25 bg-red-400/5 p-3 text-sm text-red-400">{passwordError}</p>}
            {editingPassword && user?.provider === 'LOCAL' && (
              <form onSubmit={savePassword} className="mt-5 space-y-5" aria-busy={passwordBusy}>
                <fieldset disabled={passwordBusy}>
                  <legend className="sr-only">Changer le mot de passe</legend>
                  <div><label htmlFor="current-password" className="text-sm font-medium text-t2">Mot de passe actuel</label><input id="current-password" type="password" autoComplete="current-password" required value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} className="input mt-2" /></div>
                  <div><label htmlFor="new-password" className="text-sm font-medium text-t2">Nouveau mot de passe</label><input id="new-password" type="password" autoComplete="new-password" required minLength={10} value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} className="input mt-2" /><p className="mt-2 text-xs text-t4">Au moins 10 caractères.</p></div>
                  <div><label htmlFor="confirm-password" className="text-sm font-medium text-t2">Confirme le nouveau mot de passe</label><input id="confirm-password" type="password" autoComplete="new-password" required minLength={10} value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} className="input mt-2" /></div>
                  <div className="flex flex-wrap gap-3"><button type="submit" className="btn-primary">{passwordBusy ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : 'Enregistrer'}</button><button type="button" onClick={() => { setEditingPassword(false); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPasswordError(''); setPasswordNotice(''); }} className="btn-secondary">Annuler</button></div>
                </fieldset>
              </form>
            )}
          </div>
          {user && (
            <div className="mt-10 border-t border-line-soft pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold-400/25 bg-gold-400/10 text-gold-400"><KeyRound className="h-5 w-5" aria-hidden="true" /></div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-t1">Méthodes de connexion</h3>
                    <p className="text-sm text-t4">Gère les façons de te connecter à ton compte.</p>
                  </div>
                </div>
              </div>
              {identityError && <p role="alert" className="mt-5 rounded-xl border border-red-400/25 bg-red-400/5 p-3 text-sm text-red-400">{identityError}</p>}
              {identityNotice && <p role="status" className="mt-5 rounded-xl border border-gold-400/25 bg-gold-400/5 p-3 text-sm text-gold-400">{identityNotice}</p>}
              <ul className="mt-5 space-y-3">
                <li className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-[#0b0b0b] px-4 py-3">
                  <span className="text-sm text-t1">{providerLabels.LOCAL}</span>
                  {user.provider === 'LOCAL' ? (
                    <span className="text-xs font-medium text-gold-400">Actif</span>
                  ) : (
                    <span className="text-xs text-t4">—</span>
                  )}
                </li>
                {identityProviders.map(({ provider, label }) => {
                  const linked = user.identities?.some((identity) => identity.provider === provider);
                  const onlyMethod = linked && user.provider !== 'LOCAL' && user.identities?.length === 1 && user.identities[0]?.provider === provider;
                  return (
                    <li key={provider} className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-[#0b0b0b] px-4 py-3">
                      <span className="text-sm text-t1">{label}</span>
                      {linked ? (
                        <button
                          type="button"
                          disabled={Boolean(unlinkBusy) || onlyMethod}
                          onClick={() => void unlinkProvider(provider)}
                          className="text-xs font-medium text-red-400 disabled:opacity-50"
                        >
                          {unlinkBusy === provider ? 'Retrait…' : onlyMethod ? 'Obligatoire' : 'Retirer'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={identityBusy}
                          onClick={() => void linkProvider(provider)}
                          className="text-xs font-medium text-gold-400 disabled:opacity-50"
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
        <section aria-labelledby="quick-links-heading">
          <h2 id="quick-links-heading" className="font-display text-xl font-semibold text-t1">Et maintenant ?</h2>
          <p className="mt-2 text-sm text-t4">Choisis ce que tu veux explorer aujourd’hui.</p>
          <div className="mt-5 space-y-4">
            <Link to="/ressources" className="group flex gap-4 rounded-3xl border border-white/[0.06] bg-card p-6 transition-all hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/20"><BookOpen aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-gold-400" /><div className="flex-1"><h3 className="font-semibold text-t1">Explorer les ressources</h3><p className="mt-2 text-sm leading-relaxed text-t4">Des ebooks et des vidéos pour approfondir les sujets qui t’intéressent.</p></div><ArrowRight aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-t4 transition group-hover:text-gold-400" /></Link>
            <Link to="/evenements" className="group flex gap-4 rounded-3xl border border-white/[0.06] bg-card p-6 transition-all hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/20"><CalendarDays aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-gold-400" /><div className="flex-1"><h3 className="font-semibold text-t1">Trouver un événement</h3><p className="mt-2 text-sm leading-relaxed text-t4">Découvre les prochains rendez-vous pour apprendre et échanger.</p></div><ArrowRight aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-t4 transition group-hover:text-gold-400" /></Link>
          </div>
          <div className="mt-6">
            <NewsletterCard />
          </div>
        </section>
      </div>
    </Section>
  </Layout>;
}
