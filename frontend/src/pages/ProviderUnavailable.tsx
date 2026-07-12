import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Mail, Github, Wrench } from 'lucide-react';

const ProviderUnavailable = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const provider = searchParams.get('provider') || 'ce fournisseur';
  const returnTo = searchParams.get('from') || '/connexion';

  const providerLabel = provider === 'google' ? 'Google' : provider === 'github' ? 'GitHub' : provider;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.1)_0%,_transparent_50%)]" />

      <div className="relative max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-6">
          <Wrench className="w-7 h-7 text-gold" />
        </div>

        <h1 className="text-2xl font-display font-bold text-white mb-3">
          Connexion {providerLabel} en maintenance
        </h1>
        <p className="text-white/45 text-sm leading-relaxed mb-8">
          La connexion via <span className="text-white/70 font-medium">{providerLabel}</span> est
          momentanément indisponible, le temps d'une maintenance. En attendant, tu peux te connecter
          avec ton adresse email ou avec GitHub — c'est tout aussi rapide.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => navigate(returnTo)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gold text-black font-semibold hover:bg-gold/90 transition-colors rounded-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Choisir une autre méthode
          </button>

          <div className="flex items-center justify-center gap-6 pt-2 text-white/35 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email &amp; mot de passe
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Github className="w-3.5 h-3.5" /> GitHub
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderUnavailable;
