import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import Layout from '@/components/layout/Layout';
import SEO from '@/components/common/SEO';
import { safeReturnPath } from '@/services/auth';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';
import { useSession } from '@/hooks/useSession';

interface AuthPageProps {
  mode: 'login' | 'register';
}

const inputClass = 'mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 disabled:opacity-60';

export function ResetPasswordPage() {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
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

  return <Layout>
    <SEO title="Nouveau mot de passe" description="Choisis un nouveau mot de passe pour ton compte LesCracks." url="/reset-password" />
    <div className="mx-auto max-w-lg px-5 py-16 sm:py-24">
      <section className="rounded-3xl border border-white/10 bg-[#171717] p-6 text-white shadow-2xl sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d4af37]">LesCracks / Sécurité</p>
        <h1 className="mt-4 font-display text-3xl font-semibold">Un nouveau départ.</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">Choisis un nouveau mot de passe pour retrouver ton compte.</p>
        {done ? <div role="status" className="mt-6 rounded-xl border border-[#d4af37]/25 p-4 text-sm text-[#d4af37]">Ton mot de passe a été mis à jour. Tu peux maintenant te connecter.</div> : !token ? <p role="alert" className="mt-6 text-sm text-red-300">Ce lien est incomplet. Retourne à la connexion pour demander un nouveau lien.</p> : <form onSubmit={submit} className="mt-7" aria-busy={busy}>
          <fieldset disabled={busy} className="space-y-5"><legend className="sr-only">Nouveau mot de passe</legend>
            <div><label htmlFor="reset-password" className="text-sm font-medium text-zinc-200">Nouveau mot de passe</label><div className="relative"><input id="reset-password" name="password" type={visible ? 'text' : 'password'} autoComplete="new-password" required minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} className={`${inputClass} pr-14`} aria-describedby="reset-help" /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Masquer les mots de passe' : 'Afficher les mots de passe'} aria-pressed={visible} className="absolute right-1 top-3 flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 hover:text-white">{visible ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}</button></div><p id="reset-help" className="mt-2 text-xs text-zinc-400">Au moins 10 caractères.</p></div>
            <div><label htmlFor="reset-confirmation" className="text-sm font-medium text-zinc-200">Confirme ton mot de passe</label><input id="reset-confirmation" name="confirmation" type={visible ? 'text' : 'password'} autoComplete="new-password" required minLength={10} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={inputClass} /></div>
            {error && <p role="alert" className="rounded-xl border border-red-400/20 p-3 text-sm text-red-300">{error}</p>}
            <button type="submit" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-5 py-3 font-semibold text-black disabled:opacity-60">{busy && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />}{busy ? 'Enregistrement…' : 'Enregistrer mon mot de passe'}</button>
          </fieldset>
        </form>}
        <Link to="/connexion" replace className="mt-7 block text-center text-sm font-medium text-[#d4af37] underline-offset-4 hover:underline">Revenir à la connexion</Link>
      </section>
    </div>
  </Layout>;
}

export default function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, createAccount, socialSignIn, isSignedIn, isLoading, isAdmin, error: sessionError } = useSession();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [busy, setBusy] = useState<'submit' | 'forgot' | 'resend' | 'google' | 'github' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [needsVerification, setNeedsVerification] = useState(false);
  const state = location.state as { from?: string; expired?: boolean } | null;
  const returnTo = safeReturnPath(new URLSearchParams(location.search).get('retour') ?? state?.from, isAdmin ? '/admin' : '/profil');
  const registering = mode === 'register';

  useEffect(() => {
    setError('');
    setNotice('');
    setFields({});
    setForm((value) => ({ ...value, password: '' }));
    setShowPassword(false);
  }, [mode]);

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
    setNeedsVerification(false);
    try {
      if (registering) {
        await createAccount({ ...form, email: form.email.trim(), firstName: form.firstName.trim(), lastName: form.lastName.trim() });
        setNotice('Ton compte a été créé. Vérifie ta boîte de réception pour confirmer ton adresse email.');
        setForm({ email: '', password: '', firstName: '', lastName: '' });
      } else {
        await login(form.email.trim(), form.password);
        navigate(returnTo, { replace: true });
      }
    } catch (cause) {
      if (cause instanceof ApiError && cause.message.toLowerCase().includes('vérifiée')) {
        setNeedsVerification(true);
      }
      report(cause);
    } finally {
      setBusy(null);
    }
  }

  async function resend() {
    if (!form.email.trim()) return;
    setBusy('resend');
    setError('');
    setNotice('');
    try {
      await api.resendVerification(form.email.trim());
      setNotice('Un nouveau lien de vérification a été envoyé.');
    } catch (cause) {
      report(cause);
    } finally { setBusy(null); }
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

  return <Layout>
    <SEO title={registering ? 'Créer ton compte' : 'Connexion'} description="Retrouve ton espace LesCracks et continue à apprendre la tech." url={registering ? '/inscription' : '/connexion'} />
    <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-10 px-5 py-12 sm:px-8 sm:py-20 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-20">
      <section>
        <Link to="/" className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d4af37]">LesCracks / Ton espace</Link>
        <h1 className="mt-6 max-w-lg font-display text-4xl font-semibold leading-tight tracking-tight text-t1 sm:text-6xl">{registering ? <>Ta prochaine étape<br /><span className="text-[#d4af37]">commence ici.</span></> : <>Le bon endroit<br />pour <span className="text-[#d4af37]">aller plus loin.</span></>}</h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-t3">{registering ? 'Crée ton compte, explore les ressources et trouve ton prochain rendez-vous tech.' : 'Retrouve ton espace personnel. Les ressources et les événements t’attendent, à ton rythme.'}</p>
        <div className="mt-10 flex items-start gap-3 border-t border-line-soft pt-6 text-sm leading-relaxed text-t4"><ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#d4af37]" /><p>Tu peux aussi découvrir le catalogue sans compte.<br /><Link to="/ressources" className="mt-2 inline-flex items-center gap-2 text-t2 underline underline-offset-4">Explorer les ressources <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></p></div>
      </section>
      <section className="rounded-3xl border border-white/10 bg-[#171717] p-6 text-white shadow-2xl sm:p-9" aria-labelledby="auth-heading">
        <p className="text-xs uppercase tracking-[0.2em] text-[#d4af37]">{registering ? 'Bienvenue dans la communauté' : 'Heureux de te retrouver'}</p>
        <h2 id="auth-heading" className="mt-3 font-display text-3xl font-semibold">{registering ? 'Créer ton compte' : 'Te connecter'}</h2>
        <p className="mt-2 text-sm text-zinc-400">{registering ? 'Quelques informations, et c’est parti.' : 'Entre tes identifiants pour continuer.'}</p>
        {state?.expired && <p role="status" className="mt-5 rounded-xl border border-[#d4af37]/25 bg-[#d4af37]/5 p-3 text-sm text-[#d4af37]">Connecte-toi pour accéder à cette page. Si ta session a expiré, tu reprendras là où tu en étais.</p>}
        {sessionError && <p role="alert" className="mt-5 text-sm text-amber-200">{sessionError.message}</p>}
        <form onSubmit={submit} className="mt-7" aria-busy={Boolean(busy)}>
          <fieldset disabled={Boolean(busy)} className="space-y-5">
            <legend className="sr-only">Tes identifiants</legend>
            {registering && <div className="grid gap-5 sm:grid-cols-2">
              <div><label htmlFor="auth-firstName" className="text-sm font-medium text-zinc-200">Prénom</label><input id="auth-firstName" name="firstName" autoComplete="given-name" required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} className={inputClass} aria-invalid={Boolean(fields.firstName)} aria-describedby={fields.firstName ? 'firstName-error' : undefined} />{fields.firstName && <p id="firstName-error" className="mt-2 text-sm text-red-300">{fields.firstName}</p>}</div>
              <div><label htmlFor="auth-lastName" className="text-sm font-medium text-zinc-200">Nom</label><input id="auth-lastName" name="lastName" autoComplete="family-name" required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} className={inputClass} aria-invalid={Boolean(fields.lastName)} aria-describedby={fields.lastName ? 'lastName-error' : undefined} />{fields.lastName && <p id="lastName-error" className="mt-2 text-sm text-red-300">{fields.lastName}</p>}</div>
            </div>}
            <div><label htmlFor="auth-email" className="text-sm font-medium text-zinc-200">Adresse email</label><input id="auth-email" name="email" autoComplete="email" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={inputClass} aria-invalid={Boolean(fields.email)} aria-describedby={fields.email ? 'email-error' : undefined} />{fields.email && <p id="email-error" className="mt-2 text-sm text-red-300">{fields.email}</p>}</div>
            <div><label htmlFor="auth-password" className="text-sm font-medium text-zinc-200">Mot de passe</label><div className="relative"><input id="auth-password" name="password" autoComplete={registering ? 'new-password' : 'current-password'} required minLength={registering ? 10 : undefined} type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className={`${inputClass} pr-14`} aria-invalid={Boolean(fields.password)} aria-describedby="password-help" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={showPassword} className="absolute right-1 top-3 flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d4af37]">{showPassword ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}</button></div><p id="password-help" className={`mt-2 text-xs ${fields.password ? 'text-red-300' : 'text-zinc-400'}`}>{fields.password ?? (registering ? 'Au moins 10 caractères.' : 'Le mot de passe de ton compte LesCracks.')}</p></div>
            {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300">{error}</p>}
            {notice && <p role="status" className="rounded-xl border border-[#d4af37]/20 p-3 text-sm text-[#d4af37]">{notice}</p>}
            {needsVerification && <button type="button" disabled={Boolean(busy)} onClick={() => void resend()} className="-mt-3 text-left text-sm text-[#d4af37] underline underline-offset-4 hover:text-white disabled:opacity-60">{busy === 'resend' ? 'Envoi…' : 'Renvoyer le lien de vérification'}</button>}
            <button type="submit" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-5 py-3 font-semibold text-black transition hover:bg-[#e4c45d] disabled:cursor-wait disabled:opacity-60">{busy === 'submit' ? <><Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />Connexion en cours…</> : <>{registering ? 'Créer mon compte' : 'Me connecter'}<ArrowRight aria-hidden="true" className="h-4 w-4" /></>}</button>
            {!registering && <button type="button" onClick={() => void forgot()} className="min-h-10 w-full text-sm text-zinc-300 underline-offset-4 hover:text-[#d4af37] hover:underline">{busy === 'forgot' ? 'Envoi du lien…' : 'Mot de passe oublié ?'}</button>}
          </fieldset>
        </form>
        <div className="my-6 flex items-center gap-3 text-xs text-zinc-500"><span className="h-px flex-1 bg-white/10" />ou<span className="h-px flex-1 bg-white/10" /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" disabled={Boolean(busy) || isLoading} onClick={() => void social('google')} className="flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-white/20 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:border-white/40 disabled:opacity-60">
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path fill="#EA4335" d="M12 5.04c1.62 0 3.06.56 4.2 1.64l3.12-3.12C17.46 1.8 14.96.72 12 .72 7.44.72 3.58 3.34 1.76 7.28l3.64 2.82C6.24 7.22 8.86 5.04 12 5.04Z"/><path fill="#4285F4" d="M23.28 12.26c0-.8-.07-1.55-.2-2.26H12v4.5h6.34c-.29 1.48-1.14 2.73-2.4 3.58l3.62 2.8c2.1-1.94 3.72-4.8 3.72-8.62Z"/><path fill="#FBBC05" d="M5.42 14.36A7.2 7.2 0 0 1 5.04 12c0-.82.14-1.62.38-2.36L1.78 6.82A11.28 11.28 0 0 0 .72 12c0 1.82.44 3.54 1.06 5.18l3.64-2.82Z"/><path fill="#34A853" d="M12 23.28c2.96 0 5.46-.98 7.28-2.66l-3.62-2.8c-1 .68-2.28 1.08-3.66 1.08-3.14 0-5.76-2.18-6.6-5.06l-3.64 2.82c1.82 3.94 5.68 6.62 10.24 6.62Z"/></svg>
            {busy === 'google' ? 'Redirection…' : 'Google'}
          </button>
          <button type="button" disabled={Boolean(busy) || isLoading} onClick={() => void social('github')} className="flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-white/20 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:border-white/40 disabled:opacity-60">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.17c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.04-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.75 2.69 1.25 3.35.95.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11.1 11.1 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12v3.14c0 .31.21.67.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>
            {busy === 'github' ? 'Redirection…' : 'GitHub'}
          </button>
        </div>
        <p className="mt-7 border-t border-white/10 pt-6 text-center text-sm text-zinc-400">{registering ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}<Link className="font-medium text-[#d4af37] underline-offset-4 hover:underline" to={`${registering ? '/connexion' : '/inscription'}?retour=${encodeURIComponent(returnTo)}`}>{registering ? 'Connecte-toi' : 'Rejoins-nous'}</Link></p>
      </section>
    </div>
  </Layout>;
}
