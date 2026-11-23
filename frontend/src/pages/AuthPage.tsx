import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';

import SEO from '@/components/common/SEO';
import { GitHubIcon } from '@/components/icons/BrandIcons';
import { SplitText } from '@/components/motion/SplitText';
import AuthShell from '@/components/site/AuthShell';
import { Button } from '@/components/ui/button';
import { Notice, PasswordField, TextField } from '@/components/ui/field';
import { useSession } from '@/hooks/useSession';
import { signupContext } from '@/lib/arrival';
import { EASE } from '@/lib/motion';
import { api } from '@/services/api';
import { safeReturnPath } from '@/services/auth';
import { ApiError } from '@/services/http';

const ARRIVE = { initial: { opacity: 0, y: 16, filter: 'blur(6px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)' } };
const arrive = (delay: number) => ({ ...ARRIVE, transition: { duration: 0.8, delay, ease: EASE } });

const CARD = 'w-full rounded-[2rem] border border-white/10 bg-black/60 p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-10';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 5.04c1.62 0 3.06.56 4.2 1.64l3.12-3.12C17.46 1.8 14.96.72 12 .72 7.44.72 3.58 3.34 1.76 7.28l3.64 2.82C6.24 7.22 8.86 5.04 12 5.04Z" />
      <path fill="#4285F4" d="M23.28 12.26c0-.8-.07-1.55-.2-2.26H12v4.5h6.34c-.29 1.48-1.14 2.73-2.4 3.58l3.62 2.8c2.1-1.94 3.72-4.8 3.72-8.62Z" />
      <path fill="#FBBC05" d="M5.42 14.36A7.2 7.2 0 0 1 5.04 12c0-.82.14-1.62.38-2.36L1.78 6.82A11.28 11.28 0 0 0 .72 12c0 1.82.44 3.54 1.06 5.18l3.64-2.82Z" />
      <path fill="#34A853" d="M12 23.28c2.96 0 5.46-.98 7.28-2.66l-3.62-2.8c-1 .68-2.28 1.08-3.66 1.08-3.14 0-5.76-2.18-6.6-5.06l-3.64 2.82c1.82 3.94 5.68 6.62 10.24 6.62Z" />
    </svg>
  );
}

interface AuthCardProps {
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
}

/** The heading every sign-in screen opens with, above its form. */
function AuthCard({ eyebrow, title, lead, children }: AuthCardProps) {
  return (
    <motion.section {...arrive(0.1)} aria-labelledby="auth-title" className={CARD}>
      <p className="text-sm font-medium text-gold-400">{eyebrow}</p>
      <SplitText as="h1" id="auth-title" onMount delay={0.15} parts={[title]} className="mt-4 text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.04em]" />
      <p className="mt-3 text-[15px] leading-relaxed text-white/55">{lead}</p>
      {children}
    </motion.section>
  );
}

export function ResetPasswordPage() {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!token) return;
    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setBusy(true);
    try {
      await api.resetPassword(token, password);
      setPassword('');
      setConfirmation('');
      setDone(true);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Impossible de joindre le serveur. Réessaie dans un instant.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <SEO title="Nouveau mot de passe" description="Choisis un nouveau mot de passe pour ton compte LesCracks." url="/reinitialiser" />
      <div className="w-full max-w-md">
        <AuthCard eyebrow="Sécurité" title="Un nouveau départ." lead="Choisis un nouveau mot de passe pour retrouver ton compte.">
          {done && <Notice tone="info" className="mt-7">Ton mot de passe a été mis à jour. Tu peux maintenant te connecter.</Notice>}
          {!done && !token && <Notice tone="error" className="mt-7">Ce lien est incomplet. Retourne à la connexion pour demander un nouveau lien.</Notice>}
          {!done && token && (
            <form onSubmit={submit} className="mt-8" aria-busy={busy}>
              <fieldset disabled={busy} className="space-y-5">
                <legend className="sr-only">Nouveau mot de passe</legend>
                <PasswordField id="reset-password" label="Nouveau mot de passe" help="Au moins 10 caractères." autoComplete="new-password" required minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} />
                <PasswordField id="reset-confirmation" label="Confirme ton mot de passe" autoComplete="new-password" required minLength={10} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
                {error && <Notice tone="error">{error}</Notice>}
                <Button type="submit" size="lg" className="w-full font-semibold">{busy ? <><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />Enregistrement…</> : 'Enregistrer mon mot de passe'}</Button>
              </fieldset>
            </form>
          )}
          <p className="mt-8 border-t border-white/10 pt-6 text-center text-sm"><Link to="/connexion" replace className="font-medium text-gold-400 underline-offset-4 hover:underline">Revenir à la connexion</Link></p>
        </AuthCard>
      </div>
    </AuthShell>
  );
}

interface AuthPageProps {
  mode: 'login' | 'register';
}

export default function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, createAccount, socialSignIn, isSignedIn, isLoading, isAdmin, error: sessionError } = useSession();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [busy, setBusy] = useState<'submit' | 'forgot' | 'google' | 'github' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [newsletter, setNewsletter] = useState(false);
  const state = location.state as { from?: string; expired?: boolean } | null;
  const returnTo = safeReturnPath(new URLSearchParams(location.search).get('retour') ?? state?.from, isAdmin ? '/admin' : '/');
  const registering = mode === 'register';

  function report(cause: unknown) {
    setError(cause instanceof Error && !(cause instanceof TypeError) ? cause.message : 'Impossible de joindre le serveur. Réessaie dans un instant.');
    setFields(cause instanceof ApiError ? cause.fields ?? {} : {});
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy('submit');
    setError('');
    setNotice('');
    setFields({});
    try {
      if (registering) {
        // Signed in straight away: the welcome questions come next, and confirming the
        // address is asked by a banner instead of blocking the way in.
        await createAccount({ ...form, email: form.email.trim(), firstName: form.firstName.trim(), lastName: form.lastName.trim(), newsletter, context: signupContext() });
      } else {
        await login(form.email.trim(), form.password);
      }
      navigate(returnTo, { replace: true });
    } catch (cause) {
      report(cause);
    } finally {
      setBusy(null);
    }
  }

  async function forgot() {
    const emailInput = document.getElementById('auth-email') as HTMLInputElement | null;
    if (!emailInput?.reportValidity()) return;
    setBusy('forgot');
    setError('');
    setNotice('');
    try {
      await api.forgotPassword(form.email.trim());
      setNotice('Si un compte correspond à cette adresse, tu recevras un lien de réinitialisation. Pense à vérifier tes indésirables.');
    } catch (cause) {
      report(cause);
    } finally {
      setBusy(null);
    }
  }

  async function social(provider: 'google' | 'github') {
    setBusy(provider);
    setError('');
    try {
      await socialSignIn(provider, returnTo);
    } catch (cause) {
      report(cause);
      setBusy(null);
    }
  }

  if (!isLoading && isSignedIn && !sessionError && !busy) return <Navigate to={returnTo} replace />;

  const other = `${registering ? '/connexion' : '/inscription'}?retour=${encodeURIComponent(returnTo)}`;

  return (
    <AuthShell>
      <SEO title={registering ? 'Créer ton compte' : 'Connexion'} description="Retrouve ton espace LesCracks et continue à apprendre la tech." url={registering ? '/inscription' : '/connexion'} />
      <div className="w-full max-w-md">
        <AuthCard
          eyebrow={registering ? 'Rejoindre LesCracks' : 'Heureux de te revoir'}
          title={registering ? 'Crée ton compte.' : 'Connecte-toi.'}
          lead={registering ? 'Inscris-toi aux rendez-vous, garde tes attestations et suis les nouveaux articles.' : 'Ton dashboard, tes rendez-vous et tes attestations t’attendent.'}
        >
          {state?.expired && <Notice tone="info" className="mt-6">Connecte-toi pour accéder à cette page. Si ta session a expiré, tu reprendras là où tu en étais.</Notice>}
          {sessionError && <Notice tone="error" className="mt-6">{sessionError.message}</Notice>}

          <div className="mt-8 grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" disabled={Boolean(busy) || isLoading} onClick={() => void social('google')}><GoogleIcon />{busy === 'google' ? 'Redirection…' : 'Google'}</Button>
            <Button type="button" variant="outline" disabled={Boolean(busy) || isLoading} onClick={() => void social('github')}><GitHubIcon className="h-4 w-4" />{busy === 'github' ? 'Redirection…' : 'GitHub'}</Button>
          </div>
          <div className="my-7 flex items-center gap-3 text-xs text-white/35"><span className="h-px flex-1 bg-white/10" />ou avec ton email<span className="h-px flex-1 bg-white/10" /></div>

          <form onSubmit={submit} aria-busy={Boolean(busy)}>
            <fieldset disabled={Boolean(busy)} className="space-y-5">
              <legend className="sr-only">Tes identifiants</legend>
              {registering && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField id="auth-firstName" label="Prénom" autoComplete="given-name" required value={form.firstName} error={fields.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
                  <TextField id="auth-lastName" label="Nom" autoComplete="family-name" required value={form.lastName} error={fields.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
                </div>
              )}
              <TextField id="auth-email" label="Adresse email" type="email" autoComplete="email" required value={form.email} error={fields.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              <div>
                <PasswordField id="auth-password" label="Mot de passe" autoComplete={registering ? 'new-password' : 'current-password'} required minLength={registering ? 10 : undefined} value={form.password} error={fields.password} help={registering ? 'Au moins 10 caractères.' : undefined} onChange={(event) => setForm({ ...form, password: event.target.value })} />
                {!registering && <button type="button" onClick={() => void forgot()} className="mt-2 min-h-10 text-sm text-white/55 underline-offset-4 transition-colors hover:text-gold-400 hover:underline">{busy === 'forgot' ? 'Envoi du lien…' : 'Mot de passe oublié ?'}</button>}
              </div>
              {registering && (
                <label className="flex items-start gap-3 text-sm leading-relaxed text-white/55">
                  <input type="checkbox" checked={newsletter} onChange={(event) => setNewsletter(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#d4af37]" />
                  <span>Recevoir la newsletter : les nouveaux articles et les prochains ateliers, par email. Tu peux te désabonner à tout moment.</span>
                </label>
              )}
              {error && <Notice tone="error">{error}</Notice>}
              {notice && <Notice tone="info">{notice}</Notice>}
              <Button type="submit" size="lg" className="w-full font-semibold">
                {busy === 'submit'
                  ? <><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />{registering ? 'Création de ton compte…' : 'Connexion en cours…'}</>
                  : <>{registering ? 'Créer mon compte' : 'Me connecter'}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></>}
              </Button>
            </fieldset>
          </form>

          <p className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-white/55">
            {registering ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}
            <Link to={other} className="font-medium text-gold-400 underline-offset-4 hover:underline">{registering ? 'Connecte-toi' : 'Crée-le en une minute'}</Link>
          </p>
        </AuthCard>
        <motion.p {...arrive(0.3)} className="mt-6 text-center text-sm text-white/40">
          Tu veux juste lire ? <Link to="/blog" className="text-white/70 underline-offset-4 hover:text-white hover:underline">Le blog est ouvert à tous</Link>
        </motion.p>
      </div>

      {(busy === 'google' || busy === 'github') && (
        <div role="status" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-black/95">
          <Loader2 className="h-10 w-10 animate-spin text-gold-400 motion-reduce:animate-none" aria-hidden="true" />
          <div className="text-center">
            <p className="text-2xl font-semibold tracking-tight">On prépare ton espace.</p>
            <p className="mt-2 text-sm text-white/55">Connexion {busy === 'google' ? 'Google' : 'GitHub'} en cours…</p>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
