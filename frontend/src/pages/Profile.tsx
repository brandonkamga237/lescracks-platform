import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, BookOpen, CalendarDays, KeyRound, Loader2, Lock, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import Layout from '@/components/layout/Layout';
import { Section } from '@/components/layout/Page';
import SEO from '@/components/common/SEO';
import NewsletterCard from '@/components/common/NewsletterCard';
import PhoneField from '@/components/account/PhoneField';
import { useApi } from '@/hooks/useApi';
import { fillClass } from '@/lib/cracklab';
import { FIELD_LABEL, GOAL_LABEL, SITUATION_LABEL } from '@/lib/memberProfile';
import { countryName, displayPhone } from '@/lib/phone';
import { useSession } from '@/hooks/useSession';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';
import type { AuthProvider, MemberGoal, MemberSituation } from '@/services/types';

const providerLabels = { LOCAL: 'Email / mot de passe', GOOGLE: 'Google', GITHUB: 'GitHub' };

type IdentityProvider = Exclude<AuthProvider, 'LOCAL'>;

const identityProviders: { provider: IdentityProvider; label: string }[] = [
  { provider: 'GOOGLE', label: 'Google' },
  { provider: 'GITHUB', label: 'GitHub' },
];

export default function Profile() {
  const { name, email, user, isAdmin, refresh, signOut, socialSignIn } = useSession();
  const navigate = useNavigate();
  const { hash } = useLocation();

  // /profil#securite and #informations come from the account menu: land on that section.
  useEffect(() => {
    if (!hash) return;
    const frame = requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, [hash]);
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    username: user?.username ?? '',
    bio: user?.bio ?? '',
    location: user?.location ?? '',
    socialLinks: user?.socialLinks ?? {},
  });
  // '' when empty, null while what is typed is not a valid number yet.
  const [phone, setPhone] = useState<string | null>(user?.phone ?? '');
  const [details, setDetails] = useState({ situation: user?.situation, goal: user?.goal, interestIds: user?.interestIds ?? [], marketingConsent: user?.marketingConsent ?? false });
  const categories = useApi((signal) => (user ? api.categories(signal) : Promise.resolve([])), [Boolean(user)]);
  const categoryName = (id: number) => categories.data?.find((category) => category.id === id)?.name;
  const [newSocial, setNewSocial] = useState({ platform: '', url: '' });
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
  const [avatarBusy, setAvatarBusy] = useState(false);

  useEffect(() => {
    setForm({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      username: user?.username ?? '',
      bio: user?.bio ?? '',
      location: user?.location ?? '',
      socialLinks: user?.socialLinks ?? {},
    });
    setPhone(user?.phone ?? '');
    setDetails({ situation: user?.situation, goal: user?.goal, interestIds: user?.interestIds ?? [], marketingConsent: user?.marketingConsent ?? false });
  }, [user]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    setFields({});
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Renseigne ton prénom et ton nom pour enregistrer les modifications.');
      return;
    }
    if (phone === null) {
      setFields({ phone: 'Ce numéro ne correspond pas au pays choisi.' });
      setError('Vérifie ton numéro de téléphone, ou vide le champ.');
      return;
    }
    setBusy('save');
    try {
      await api.updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        username: form.username.trim() || undefined,
        // Sent back as is: the API replaces the photo with whatever it receives, nothing included.
        avatarUrl: user?.avatarUrl,
        bio: form.bio.trim() || undefined,
        location: form.location.trim() || undefined,
        socialLinks: Object.keys(form.socialLinks).length ? form.socialLinks : undefined,
        phone,
        situation: details.situation,
        goal: details.goal,
        interestIds: details.interestIds,
        marketingConsent: details.marketingConsent,
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

  async function uploadAvatar(file: File) {
    setAvatarBusy(true);
    setError('');
    try {
      await api.uploadAvatar(file);
      await refresh();
      setNotice('Ton avatar a été mis à jour.');
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'L’upload de l’avatar a échoué.');
    } finally {
      setAvatarBusy(false);
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
    <SEO title="Mon compte" description="Tes informations, ta sécurité et tes connexions LesCracks." url="/profil" />
    <Section spacing="tight">
      <header className="flex flex-col gap-6 border-b border-line-soft pb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5"><div aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gold-400/30 bg-gold-400/10 font-display text-2xl text-gold-ink">{user?.avatarUrl ? <img src={`/api/files/${user.avatarUrl}`} alt="" className="h-full w-full object-cover" /> : name ? name.charAt(0).toUpperCase() : <UserRound className="h-7 w-7" />}</div><div><p className="text-sm font-medium tracking-wide text-gold-ink">Mon compte</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-t1 sm:text-4xl">Bonjour{user?.firstName ? `, ${user.firstName}` : name ? `, ${name}` : ''}.</h1><p className="mt-2 text-sm text-t4">Un point de départ pour ta prochaine découverte.</p></div></div>
        <button type="button" disabled={Boolean(busy)} onClick={() => void logout()} className="btn-secondary hidden self-start lg:inline-flex"><LogOut aria-hidden="true" className="h-4 w-4" />{busy === 'logout' ? 'Déconnexion…' : 'Me déconnecter'}</button>
      </header>
      {user && user.completion < 100 && !editing && (
        <section aria-labelledby="completion-heading" className="mt-8 rounded-lg border border-line bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="completion-heading" className="font-sans text-base font-medium tracking-normal text-t1">Profil complété à <span className="font-mono tabular-nums text-gold-ink">{user.completion} %</span></h2>
            <button type="button" onClick={() => { setEditing(true); setNotice(''); }} className="link text-sm">Compléter mon profil</button>
          </div>
          <div aria-hidden className="mt-3 h-1 rounded-full bg-noir-700"><div className={`h-full rounded-full bg-gold-400 ${fillClass(user.completion / 100)}`} /></div>
          <p className="mt-4 text-sm text-t3">Il manque : {user.missing.map((field) => FIELD_LABEL[field].toLocaleLowerCase('fr')).join(', ')}. Ça nous aide à te proposer les bonnes ressources et les bons ateliers.</p>
        </section>
      )}
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="min-w-0 space-y-6">
        <section id="informations" className="scroll-mt-24 rounded-lg border border-line-soft bg-card p-5 sm:p-8" aria-labelledby="profile-heading">
          <div className="flex items-start justify-between gap-4"><div><h2 id="profile-heading" className="font-display text-xl font-bold text-t1">Mes informations</h2><p className="mt-2 text-sm text-t4">Les informations liées à ton compte.</p></div>{user && !editing && <button type="button" disabled={Boolean(busy)} onClick={() => { setEditing(true); setNotice(''); }} className="min-h-11 px-2 text-sm font-medium text-gold-ink underline-offset-4 hover:underline">Modifier</button>}</div>
          {error && <p role="alert" className="mt-5 rounded border border-error/25 bg-error/5 p-3 text-sm text-error-ink">{error}</p>}
          {notice && <p role="status" className="mt-5 rounded border border-gold-400/25 bg-gold-400/5 p-3 text-sm text-gold-ink">{notice}</p>}
          {editing && user ? <form onSubmit={save} className="mt-7" aria-busy={busy === 'save'}>
            <fieldset disabled={Boolean(busy) || avatarBusy} className="space-y-5"><legend className="sr-only">Modifier tes informations</legend>
              <div>
                <label htmlFor="profile-avatar" className="text-sm font-medium text-t2">Avatar</label>
                <input id="profile-avatar" type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadAvatar(file); event.target.value = ''; }} className="mt-2 text-sm text-t2 file:mr-4 file:rounded file:border-0 file:bg-gold-400 file:px-4 file:py-2 file:font-medium file:text-black" />
                {avatarBusy && <p className="mt-2 text-sm text-gold-ink">Envoi en cours…</p>}
              </div>
              {(['firstName', 'lastName'] as const).map((key) => <div key={key}><label htmlFor={`profile-${key}`} className="text-sm font-medium text-t2">{key === 'firstName' ? 'Prénom' : 'Nom'}</label><input id={`profile-${key}`} name={key} autoComplete={key === 'firstName' ? 'given-name' : 'family-name'} required value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="input mt-2" aria-invalid={Boolean(fields[key])} aria-describedby={fields[key] ? `profile-${key}-error` : undefined} />{fields[key] && <p id={`profile-${key}-error`} className="mt-2 text-sm text-error-ink">{fields[key]}</p>}</div>)}
              <div><label htmlFor="profile-username" className="text-sm font-medium text-t2">Nom d'utilisateur</label><input id="profile-username" name="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} className="input mt-2" /></div>
              <div><label htmlFor="profile-bio" className="text-sm font-medium text-t2">Bio</label><textarea id="profile-bio" name="bio" rows={3} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} className="input mt-2" /></div>
              <div><label htmlFor="profile-location" className="text-sm font-medium text-t2">Ville</label><input id="profile-location" name="location" autoComplete="address-level2" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className="input mt-2" /></div>
              <PhoneField value={phone ?? ''} onChange={setPhone} hint="Jamais affiché publiquement. Le pays de ton compte est déduit de l’indicatif." />
              <label className="flex items-start gap-3 text-sm text-t3">
                <input type="checkbox" checked={details.marketingConsent} onChange={(event) => setDetails({ ...details, marketingConsent: event.target.checked })} className="mt-0.5 h-4 w-4 shrink-0 accent-[#d4af37]" />
                <span>Recevoir les nouveautés par WhatsApp ou SMS.</span>
              </label>
              <div className="grid gap-5 sm:grid-cols-2">
                <div><label htmlFor="profile-situation" className="text-sm font-medium text-t2">Situation</label>
                  <select id="profile-situation" value={details.situation ?? ''} onChange={(event) => setDetails({ ...details, situation: (event.target.value || undefined) as MemberSituation | undefined })} className="input mt-2">
                    <option value="">Choisir</option>{(Object.entries(SITUATION_LABEL) as [MemberSituation, string][]).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select></div>
                <div><label htmlFor="profile-goal" className="text-sm font-medium text-t2">Objectif</label>
                  <select id="profile-goal" value={details.goal ?? ''} onChange={(event) => setDetails({ ...details, goal: (event.target.value || undefined) as MemberGoal | undefined })} className="input mt-2">
                    <option value="">Choisir</option>{(Object.entries(GOAL_LABEL) as [MemberGoal, string][]).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select></div>
              </div>
              <div>
                <span className="text-sm font-medium text-t2">Centres d’intérêt</span>
                <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Centres d’intérêt">
                  {categories.data?.map((category) => {
                    const on = details.interestIds.includes(category.id);
                    return <button key={category.id} type="button" aria-pressed={on} disabled={!on && details.interestIds.length >= 10}
                      onClick={() => setDetails({ ...details, interestIds: on ? details.interestIds.filter((id) => id !== category.id) : [...details.interestIds, category.id] })}
                      className={`min-h-9 rounded border px-3 text-sm transition-colors disabled:opacity-40 ${on ? 'border-gold-400 bg-gold-400/10 text-t1' : 'border-line text-t3 hover:text-t1'}`}>{category.name}</button>;
                  })}
                </div>
              </div>
              <div className="space-y-3">
                <span className="text-sm font-medium text-t2">Liens sociaux</span>
                {Object.entries(form.socialLinks).map(([platform, url]) => (
                  <div key={platform} className="flex items-center gap-2">
                    <span className="w-24 shrink-0 text-sm text-t2 capitalize">{platform}</span>
                    <input type="url" value={url} onChange={(event) => setForm({ ...form, socialLinks: { ...form.socialLinks, [platform]: event.target.value } })} className="input" placeholder="https://..." />
                    <button type="button" onClick={() => { const next = { ...form.socialLinks }; delete next[platform]; setForm({ ...form, socialLinks: next }); }} className="text-sm text-error-ink">Retirer</button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input value={newSocial.platform} onChange={(event) => setNewSocial({ ...newSocial, platform: event.target.value })} className="input" placeholder="Plateforme" />
                  <input type="url" value={newSocial.url} onChange={(event) => setNewSocial({ ...newSocial, url: event.target.value })} className="input" placeholder="https://..." />
                  <button type="button" disabled={!newSocial.platform.trim() || !newSocial.url.trim()} onClick={() => { if (!newSocial.platform.trim() || !newSocial.url.trim()) return; setForm({ ...form, socialLinks: { ...form.socialLinks, [newSocial.platform.trim().toLowerCase()]: newSocial.url.trim() } }); setNewSocial({ platform: '', url: '' }); }} className="text-sm text-gold-ink disabled:opacity-50">Ajouter</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3"><button type="submit" className="btn-primary">{busy === 'save' && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />}{busy === 'save' ? 'Enregistrement…' : 'Enregistrer'}</button><button type="button" onClick={() => { setEditing(false); setForm({ firstName: user.firstName, lastName: user.lastName, username: user.username ?? '', bio: user.bio ?? '', location: user.location ?? '', socialLinks: user.socialLinks ?? {} }); setPhone(user.phone ?? ''); setDetails({ situation: user.situation, goal: user.goal, interestIds: user.interestIds ?? [], marketingConsent: user.marketingConsent }); setNewSocial({ platform: '', url: '' }); setError(''); setFields({}); }} className="btn-secondary">Annuler</button></div>
            </fieldset>
          </form> : <dl className="mt-6 divide-y divide-line-soft border-y border-line-soft text-sm">
            {([
              ['Nom', name || 'Non renseigné'],
              ['Email', email || 'Non disponible'],
              ...(user ? [
                ['Téléphone', user.phone ? displayPhone(user.phone) : null],
                ['Ville', user.location ? `${user.location}${user.country ? `, ${countryName(user.country)}` : ''}` : user.country ? countryName(user.country) : null],
                ['Situation', user.situation ? SITUATION_LABEL[user.situation] : null],
                ['Objectif', user.goal ? GOAL_LABEL[user.goal] : null],
                ['Nom d’utilisateur', user.username || null],
                ['Connexion', providerLabels[user.provider] ?? user.provider],
                ['Membre depuis', joinedLabel],
              ] : []),
            ] as [string, string | null][]).map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-4 py-3">
                <dt className="shrink-0 text-t4">{label}</dt>
                <dd className={`min-w-0 break-words text-right ${value ? 'text-t1' : 'text-t4'}`}>{value ?? 'À compléter'}</dd>
              </div>
            ))}
            {user && user.interestIds.length > 0 && <div className="py-3"><dt className="text-t4">Centres d’intérêt</dt><dd className="mt-2 flex flex-wrap gap-1.5">{user.interestIds.map((id) => categoryName(id) && <span key={id} className="rounded border border-line px-2 py-0.5 text-xs text-t2">{categoryName(id)}</span>)}</dd></div>}
            {user?.bio && <div className="py-3"><dt className="text-t4">Bio</dt><dd className="mt-1 whitespace-pre-line text-t1">{user.bio}</dd></div>}
            {user?.socialLinks && Object.keys(user.socialLinks).length > 0 && <div className="py-3"><dt className="text-t4">Liens</dt><dd className="mt-1 flex flex-wrap gap-x-4 gap-y-1">{Object.entries(user.socialLinks).map(([platform, url]) => <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="capitalize text-gold-ink underline-offset-4 hover:underline">{platform}</a>)}</dd></div>}
          </dl>}
          <div className="mt-7 flex items-start gap-3 border-t border-line-soft pt-5 text-sm leading-relaxed text-t4"><ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-gold-ink" /><p>{user ? 'Tu peux modifier tes informations ici. Ton adresse email reste liée à ton compte et ne peut pas être modifiée depuis cet espace.' : isAdmin ? 'Tu utilises un compte administrateur. La gestion des contenus est accessible depuis ton tableau de bord.' : 'Tu es connecté avec un fournisseur externe. Aucun profil membre modifiable n’est disponible pour cette connexion. Ton identité et ton mot de passe se gèrent auprès de ton fournisseur.'}</p></div>
          {isAdmin && <Link to="/admin" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-gold-ink">Ouvrir l’administration<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>}

        </section>
        <section id="securite" className="scroll-mt-24 rounded-lg border border-line-soft bg-card p-5 sm:p-8" aria-label="Sécurité et connexion">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-gold-400/25 bg-gold-400/10 text-gold-ink">
                  {user?.provider === 'LOCAL' ? <Lock className="h-5 w-5" aria-hidden="true" /> : <KeyRound className="h-5 w-5" aria-hidden="true" />}
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-t1">Sécurité</h3>
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
            <div className="mt-10 border-t border-line-soft pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-gold-400/25 bg-gold-400/10 text-gold-ink"><KeyRound className="h-5 w-5" aria-hidden="true" /></div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-t1">Méthodes de connexion</h3>
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
          <h2 id="quick-links-heading" className="font-display text-xl font-bold text-t1">Et maintenant ?</h2>
          <p className="mt-2 text-sm text-t4">Choisis ce que tu veux explorer aujourd’hui.</p>
          <div className="mt-5 space-y-4">
            <Link to="/ressources" className="group flex gap-4 rounded-lg border border-line-soft bg-card p-6 transition-colors hover:border-line"><BookOpen aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-gold-ink" /><div className="flex-1"><h3 className="font-semibold text-t1">Explorer les ressources</h3><p className="mt-2 text-sm leading-relaxed text-t4">Des ebooks et des vidéos pour approfondir les sujets qui t’intéressent.</p></div><ArrowRight aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-t4 transition group-hover:text-gold-ink" /></Link>
            <Link to="/evenements" className="group flex gap-4 rounded-lg border border-line-soft bg-card p-6 transition-colors hover:border-line"><CalendarDays aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-gold-ink" /><div className="flex-1"><h3 className="font-semibold text-t1">Trouver un événement</h3><p className="mt-2 text-sm leading-relaxed text-t4">Découvre les prochains rendez-vous pour apprendre et échanger.</p></div><ArrowRight aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-t4 transition group-hover:text-gold-ink" /></Link>
          </div>
          <div className="mt-6">
            <NewsletterCard />
          </div>
        </section>
      </div>
    </Section>
  </Layout>;
}
