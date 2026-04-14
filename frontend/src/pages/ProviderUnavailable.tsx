import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, WifiOff } from 'lucide-react';

const ProviderUnavailable = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const provider = searchParams.get('provider') || 'ce fournisseur';
  const returnTo = searchParams.get('from') || '/connexion';

  const providerLabel = provider === 'google' ? 'Google' : provider === 'github' ? 'GitHub' : provider;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-7 h-7 text-white/30" />
        </div>

        <h1 className="text-2xl font-display font-bold text-white mb-3">
          Connexion {providerLabel} indisponible
        </h1>
        <p className="text-white/45 text-sm leading-relaxed mb-8">
          La connexion via <span className="text-white/70 font-medium">{providerLabel}</span> est
          temporairement indisponible. Utilise ton adresse email et un mot de passe
          pour te connecter ou créer ton compte.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => navigate(returnTo)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gold text-black font-semibold hover:bg-gold/90 transition-colors rounded-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Choisir une autre méthode
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderUnavailable;
