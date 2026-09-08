import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import SEO from '@/components/common/SEO';
import { safeReturnPath } from '@/services/auth';
import { useSession } from '@/hooks/useSession';
import { ApiError } from '@/services/http';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAdmin, isAdmin, isLoading, error: sessionError } = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const candidate = safeReturnPath(new URLSearchParams(location.search).get('retour'), '/admin');
  const returnTo = /^\/admin(?:\/|\?|#|$)/.test(candidate) ? candidate : '/admin';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await loginAdmin(username.trim(), password);
      navigate(returnTo, { replace: true });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Impossible de te connecter. Vérifie ta connexion et réessaie.');
    } finally {
      setBusy(false);
    }
  }

  if (!isLoading && isAdmin && !sessionError && !busy) return <Navigate to={returnTo} replace />;

  return <main className="flex min-h-screen flex-col items-center justify-center bg-[#0b0b0b] px-5 py-12 text-white">
    <SEO title="Connexion administration" description="Accès à l’administration LesCracks." url="/admin/connexion" />
    <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-gold-400"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Retour au site</Link>
    <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#171717] p-6 shadow-2xl sm:p-9">
      <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl border border-gold-400/25 bg-gold-400/5 text-gold-400"><ShieldCheck aria-hidden="true" className="h-6 w-6" /></div>
      <p className="text-xs font-semibold tracking-wide text-gold-400">LesCracks / Administration</p>
      <h1 className="mt-4 font-display text-3xl font-semibold">Ton espace de pilotage.</h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">Connecte-toi avec ton compte administrateur pour gérer le contenu de la plateforme.</p>
      {sessionError && <p role="alert" className="mt-5 text-sm text-amber-200">{sessionError.message}</p>}
      <form onSubmit={submit} className="mt-8" aria-busy={busy}>
        <fieldset disabled={busy} className="space-y-5">
          <legend className="sr-only">Connexion administrateur</legend>
          <div><label htmlFor="admin-username" className="text-sm font-medium text-zinc-200">Nom d’utilisateur</label><input id="admin-username" name="username" autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} className="input mt-2" /></div>
          <div><label htmlFor="admin-password" className="text-sm font-medium text-zinc-200">Mot de passe</label><div className="relative"><input id="admin-password" name="password" autoComplete="current-password" required type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className="input mt-2 pr-14" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={showPassword} className="absolute right-2 top-2.5 flex h-9 w-9 items-center justify-center rounded-full text-t4 transition hover:text-t1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400">{showPassword ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}</button></div></div>
          {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? <><Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />Connexion en cours…</> : <>Accéder à l’administration<ArrowRight aria-hidden="true" className="h-4 w-4" /></>}</button>
        </fieldset>
      </form>
      <p className="mt-7 border-t border-white/10 pt-5 text-center text-sm text-zinc-400">Tu cherches ton espace membre ? <Link to="/connexion" className="text-gold-400 underline-offset-4 hover:underline">C’est ici</Link></p>
    </section>
    <p className="mt-6 text-xs text-zinc-500">Accès réservé aux administrateurs autorisés.</p>
  </main>;
}
