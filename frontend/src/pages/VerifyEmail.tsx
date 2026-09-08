import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/common/SEO';
import { api } from '@/services/api';
import { ApiError } from '@/services/http';

export default function VerifyEmail() {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');
  const [busy, setBusy] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setBusy(false);
      setError('Ce lien est incomplet.');
      return;
    }
    api.verifyEmail(token)
      .then(() => { setVerified(true); setBusy(false); })
      .catch((cause) => { setError(cause instanceof ApiError ? cause.message : 'Impossible de vérifier l’adresse.'); setBusy(false); });
  }, [token]);

  return <Layout>
    <SEO title="Vérification d’email" description="Confirme ton adresse email pour activer ton compte LesCracks." url="/verifier-email" />
    <div className="mx-auto max-w-lg px-5 py-16 sm:py-24">
      <section className="rounded-3xl border border-white/10 bg-[#171717] p-6 text-white shadow-2xl sm:p-9">
        <p className="text-xs font-semibold tracking-wide text-gold-400">LesCracks / Sécurité</p>
        <h1 className="mt-4 font-display text-3xl font-semibold">Confirmation de ton email</h1>
        {busy ? <p className="mt-6 flex items-center gap-3 text-sm text-zinc-400"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Vérification en cours…</p> : verified ? (
          <div className="mt-6 rounded-xl border border-gold-400/25 p-4 text-sm text-gold-400">
            Ton adresse email est confirmée. Tu peux maintenant te connecter.
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-red-400/20 p-4 text-sm text-red-300">{error || 'Ce lien est invalide ou a expiré.'}</div>
        )}
        <Link to="/connexion" replace className="mt-7 block text-center text-sm font-medium text-gold-400 underline-offset-4 hover:underline">Revenir à la connexion</Link>
      </section>
    </div>
  </Layout>;
}
