// src/pages/Premium.tsx
import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { authService, PremiumRequestResponse } from '@/services/auth';
import Layout from '@/components/layout/Layout';
import {
  Crown,
  MessageCircle,
  MapPin,
  MessageSquare,
  Loader2,
  CheckCircle,
  Clock,
  Phone,
  Star,
  Zap,
  Shield,
} from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; color: string; icon: JSX.Element }> = {
  PENDING: {
    label: 'En attente',
    color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    icon: <Clock className="w-4 h-4" />,
  },
  CONTACTED: {
    label: 'Contacté',
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    icon: <Phone className="w-4 h-4" />,
  },
  PAID: {
    label: 'Activé',
    color: 'text-green-400 bg-green-400/10 border-green-400/20',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  REJECTED: {
    label: 'Refusé',
    color: 'text-red-400 bg-red-400/10 border-red-400/20',
    icon: <span className="w-4 h-4 inline-block">✕</span>,
  },
};

const PREMIUM_BENEFITS = [
  { icon: <Zap className="w-5 h-5" />, text: 'Accès à toutes les ressources exclusives' },
  { icon: <Shield className="w-5 h-5" />, text: 'Téléchargements illimités' },
  { icon: <Star className="w-5 h-5" />, text: 'Accès prioritaire aux événements' },
  { icon: <Crown className="w-5 h-5" />, text: 'Badge PREMIUM sur votre profil' },
];

const SOCIAL_PROOF_STATS = [
  { value: '200+', label: 'membres actifs' },
  { value: '50+', label: 'ressources exclusives' },
  { value: '12', label: 'événements par an' },
  { value: '94%', label: 'taux de satisfaction' },
];

const Premium = () => {
  const { user, isAuthenticated, isPremium } = useAuth();
  const [existingRequest, setExistingRequest] = useState<PremiumRequestResponse | null | undefined>(undefined);
  const [loadingRequest, setLoadingRequest] = useState(true);

  // Form state
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [country, setCountry] = useState(user?.country || '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    authService.getMyPremiumRequest().then((res) => {
      setExistingRequest(res.data ?? null);
      setLoadingRequest(false);
    });
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!whatsappNumber.trim()) {
      setError('Le numéro WhatsApp est requis');
      return;
    }
    if (!country.trim()) {
      setError('Le pays est requis');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.submitPremiumRequest({
        whatsappNumber: whatsappNumber.trim(),
        country: country.trim(),
        message: message.trim() || undefined,
      });

      if (res.success) {
        setSubmitted(true);
        if (res.data) setExistingRequest(res.data);
      } else {
        setError(res.message || 'Une erreur est survenue');
      }
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderExistingRequest = (req: PremiumRequestResponse) => {
    const statusInfo = STATUS_LABELS[req.status];
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h2 className="text-xl font-display font-semibold">Votre demande</h2>
            <p className="text-white/40 text-sm">Statut actuel de votre demande PREMIUM</p>
          </div>
        </div>

        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium mb-6 ${statusInfo.color}`}>
          {statusInfo.icon}
          {statusInfo.label}
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-white/40">WhatsApp</span>
            <p className="text-white mt-1">{req.whatsappNumber}</p>
          </div>
          <div>
            <span className="text-white/40">Pays</span>
            <p className="text-white mt-1">{req.country}</p>
          </div>
          {req.message && (
            <div className="md:col-span-2">
              <span className="text-white/40">Message</span>
              <p className="text-white mt-1">{req.message}</p>
            </div>
          )}
          <div>
            <span className="text-white/40">Soumise le</span>
            <p className="text-white mt-1">
              {new Date(req.createdAt).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'long', year: 'numeric'
              })}
            </p>
          </div>
        </div>

        {req.status === 'PENDING' && (
          <div className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm">
            Notre service client va vous contacter sur WhatsApp <strong>{req.whatsappNumber}</strong> pour finaliser votre abonnement.
          </div>
        )}

        {req.status === 'CONTACTED' && (
          <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm">
            Notre équipe vous a contacté. Suivez les instructions reçues sur WhatsApp pour procéder au paiement.
          </div>
        )}

        {req.status === 'PAID' && (
          <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-sm flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Votre compte est maintenant PREMIUM. Profitez de tous les avantages !
          </div>
        )}

        {req.status === 'REJECTED' && (
          <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            Votre demande a été refusée. Contactez-nous directement si vous pensez qu'il s'agit d'une erreur.
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <Layout>
      <div className="pt-8 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold/20 mb-4">
              <Crown className="w-8 h-8 text-gold" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-3">
              {isPremium ? 'Compte PREMIUM actif' : 'Passer au compte PREMIUM'}
            </h1>
            <p className="text-white/60 text-lg max-w-xl mx-auto">
              {isPremium
                ? 'Vous bénéficiez déjà de tous les avantages PREMIUM.'
                : 'Accédez à tous les contenus exclusifs et boostez votre apprentissage.'}
            </p>
          </motion.div>

          {/* Social proof stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 p-6 rounded-2xl bg-white/5 border border-white/10"
          >
            {SOCIAL_PROOF_STATS.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl font-display font-bold text-gold">{stat.value}</p>
                <p className="text-xs text-white/50 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Testimonial quote */}
          <motion.blockquote
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mb-10 px-6 py-4 border-l-2 border-gold/60 bg-gold/5 rounded-r-xl"
          >
            <p className="text-white/70 text-sm italic leading-relaxed">
              "LesCracks Premium m'a donné accès à des ressources que je n'aurais jamais trouvées seul. En 3 mois j'ai décroché mon premier job tech."
            </p>
            <footer className="mt-2 text-xs text-gold font-medium">— Joël K., Développeur Full-Stack · Yaoundé</footer>
          </motion.blockquote>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid sm:grid-cols-2 gap-4 mb-10"
          >
            {PREMIUM_BENEFITS.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-9 h-9 rounded-lg bg-gold/20 flex items-center justify-center text-gold flex-shrink-0">
                  {benefit.icon}
                </div>
                <span className="text-white/80 text-sm">{benefit.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Already premium */}
          {isPremium && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-8 text-center"
            >
              <CheckCircle className="w-12 h-12 text-gold mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Vous êtes PREMIUM</h2>
              <p className="text-white/60">Profitez de tous les avantages exclusifs disponibles sur la plateforme.</p>
              <Link to="/ressources" className="btn-primary mt-6 inline-flex">
                Accéder aux ressources
              </Link>
            </motion.div>
          )}

          {/* Loading state */}
          {!isPremium && loadingRequest && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
            </div>
          )}

          {/* Existing request */}
          {!isPremium && !loadingRequest && existingRequest && !submitted &&
            (existingRequest.status === 'PENDING' || existingRequest.status === 'CONTACTED' || existingRequest.status === 'PAID') &&
            renderExistingRequest(existingRequest)
          }

          {/* Success state after submission */}
          {submitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card p-10 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-display font-bold mb-3">Demande envoyée !</h2>
              <p className="text-white/70 text-lg leading-relaxed max-w-md mx-auto">
                Votre demande a été enregistrée.<br />
                Notre service client vous contactera sur WhatsApp pour finaliser votre abonnement.
              </p>
              <Link to="/profil" className="btn-primary mt-8 inline-flex">
                Retour au profil
              </Link>
            </motion.div>
          )}

          {/* Form */}
          {!isPremium && !loadingRequest && !submitted &&
            (!existingRequest || existingRequest.status === 'REJECTED') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-semibold">Faire une demande</h2>
                  <p className="text-white/40 text-sm">
                    Remplissez le formulaire — notre équipe vous contactera sur WhatsApp
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm text-white/60 mb-2">
                    <MessageCircle className="w-4 h-4 inline mr-1" />
                    Numéro WhatsApp <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold"
                    placeholder="+237 600 000 000"
                    required
                  />
                  <p className="text-white/30 text-xs mt-1">Incluez l'indicatif pays (ex: +237 pour le Cameroun)</p>
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Pays <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold"
                    placeholder="Cameroun"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    Message (optionnel)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold resize-none"
                    placeholder="Partagez vos motivations ou posez vos questions..."
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      <>
                        <Crown className="w-4 h-4 inline mr-2" />
                        Envoyer ma demande
                      </>
                    )}
                  </button>
                  <p className="text-white/30 text-xs text-center mt-3">
                    Aucun paiement immédiat. Notre équipe vous contactera pour finaliser.
                  </p>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Premium;
