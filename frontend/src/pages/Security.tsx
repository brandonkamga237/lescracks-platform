import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Loader2, Lock, LogOut } from 'lucide-react';

import SEO from '@/components/common/SEO';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Notice, PasswordField } from '@/components/ui/field';
import { SpaceHeader } from '@/components/ui/space-header';
import { useSession } from '@/hooks/useSession';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';
import type { AuthProvider } from '@/services/types';

const PROVIDER_LABEL = { LOCAL: 'Email et mot de passe', GOOGLE: 'Google', GITHUB: 'GitHub' };

type IdentityProvider = Exclude<AuthProvider, 'LOCAL'>;
const IDENTITY_PROVIDERS: IdentityProvider[] = ['GOOGLE', 'GITHUB'];

const CARD = 'rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6';
const ROW = 'flex items-center justify-between gap-4 rounded-2xl border border-white/10 px-4 py-3';
const EMPTY_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' };

function CardHeading({ id, Icon, title, text }: { id: string; Icon: typeof Lock; title: string; text: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-400/15 text-gold-400"><Icon className="h-5 w-5" aria-hidden="true" /></span>
      <div>
        <h2 id={id} className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-0.5 text-sm text-white/55">{text}</p>
      </div>
    </div>
  );
}

/** How the member signs in: their password, the accounts linked to theirs, and the way out. */
export default function Security() {
  const { user, refresh, signOut, socialSignIn } = useSession();
  const navigate = useNavigate();
  const [passwordForm, setPasswordForm] = useState(EMPTY_FORM);
  const [editingPassword, setEditingPassword] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordNotice, setPasswordNotice] = useState('');
  const [identityBusy, setIdentityBusy] = useState(false);
  const [unlinkBusy, setUnlinkBusy] = useState<AuthProvider | null>(null);
  const [identityError, setIdentityError] = useState('');
  const [identityNotice, setIdentityNotice] = useState('');
  const [leaving, setLeaving] = useState(false);
  const local = user?.provider === 'LOCAL';

  function closePasswordForm() {
    setEditingPassword(false);
    setPasswordForm(EMPTY_FORM);
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

  async function linkProvider(provider: IdentityProvider) {
    setIdentityError('');
    setIdentityNotice('');
    setIdentityBusy(true);
    try {
      await socialSignIn(provider.toLowerCase() as 'google' | 'github', '/profil/securite');
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

  // Leave this members-only page first: signed out on it, its guard would send the reader to sign in again.
  async function leave() {
    setLeaving(true);
    navigate('/', { replace: true });
    await signOut().catch(() => undefined);
  }

  return (
    <>
      <SEO title="Sécurité" description="Ton mot de passe et tes méthodes de connexion LesCracks." url="/profil/securite" />
      <SpaceHeader title="Sécurité" lead="Ton mot de passe et les comptes qui te permettent de te connecter." />

      <Container className="pb-20">
        <div className="grid max-w-3xl gap-6">
        <section aria-labelledby="password-title" className={CARD}>
          <div className="flex items-start justify-between gap-4">
            <CardHeading id="password-title" Icon={local ? Lock : KeyRound} title="Mot de passe" text={local ? 'Change-le quand tu le souhaites.' : 'Ton compte est lié à un fournisseur externe : le mot de passe se gère chez lui.'} />
            {local && !editingPassword && <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => { setEditingPassword(true); setPasswordNotice(''); setPasswordError(''); }}>Modifier</Button>}
          </div>
          {passwordNotice && <Notice tone="info" className="mt-5">{passwordNotice}</Notice>}
          {editingPassword && local && (
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
        </section>

        {user && (
          <section aria-labelledby="identities-title" className={CARD}>
            <CardHeading id="identities-title" Icon={KeyRound} title="Méthodes de connexion" text="Les façons de te connecter à ton compte." />
            {identityError && <Notice tone="error" className="mt-5">{identityError}</Notice>}
            {identityNotice && <Notice tone="info" className="mt-5">{identityNotice}</Notice>}
            <ul className="mt-5 space-y-2">
              <li className={ROW}>
                <span className="text-sm">{PROVIDER_LABEL.LOCAL}</span>
                <span className={cn('text-xs font-medium', local ? 'text-gold-400' : 'text-white/45')}>{local ? 'Actif' : 'Inactif'}</span>
              </li>
              {IDENTITY_PROVIDERS.map((provider) => {
                const linked = user.identities?.some((identity) => identity.provider === provider);
                const onlyMethod = linked && !local && user.identities?.length === 1 && user.identities[0]?.provider === provider;
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
          </section>
        )}

        <section aria-labelledby="session-title" className={cn(CARD, 'flex flex-wrap items-center justify-between gap-4')}>
          <div>
            <h2 id="session-title" className="text-lg font-semibold tracking-tight">Session</h2>
            <p className="mt-0.5 text-sm text-white/55">Déconnecte-toi de LesCracks sur cet appareil.</p>
          </div>
          <Button type="button" variant="outline" disabled={leaving} onClick={() => void leave()}><LogOut className="h-4 w-4" aria-hidden="true" />{leaving ? 'Déconnexion…' : 'Me déconnecter'}</Button>
        </section>
        </div>
      </Container>
    </>
  );
}
