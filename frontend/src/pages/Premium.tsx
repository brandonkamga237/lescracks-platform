// src/pages/Premium.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Mail,
  Star,
  Zap,
  Shield,
  AlertTriangle,
} from 'lucide-react';

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

const isNoreplyEmail = (email: string) =>
  email.includes('noreply') || email.includes('no-reply') || email.includes('@users.github.com');

const daysUntil = (dateStr: string): number => {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const Premium = () => {
  const { user, isPremium } = useAuth();
  const [existingRequest, setExistingRequest] = useState<PremiumRequestResponse | null | undefined>(undefined);
  const [loadingRequest, setLoadingRequest] = useState(true);

  // Form state
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [country, setCountry] = useState(user?.country || '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill contactEmail with user email if it's not a noreply address
  useEffect(() => {
    if (user?.email && !isNoreplyEmail(user.email)) {
      setContactEmail(user.email);
    }
  }, [user?.email]);

  useEffect(() => {
    authService.getMyPremiumRequest().then((res) => {
      setExistingRequest(res.data ?? null);
      setLoadingRequest(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!whatsappNumber.trim()) {
      setError('Le numéro WhatsApp est requis');
      return;
    }
    if (!contactEmail.trim()) {
      setError("L'email de contact est requis");
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
        contactEmail: contactEmail.trim(),
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

  // Days left for current premium
  const premiumDaysLeft = user?.premiumExpiresAt ? daysUntil(user.premiumExpiresAt) : null;
  const isExpiringSoon = premiumDaysLeft !== null && premiumDaysLeft <= 7;

  const renderExistingRequest = (req: PremiumRequestResponse) => (
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
          <h2 className="text-xl font-display font-semibold">Demande en cours</h2>
          <p className="text-white/40 text-sm">Notre équipe va vous contacter sur WhatsApp</p>
        </div>
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium mb-6 text-yellow-400 bg-yellow-400/10 border-yellow-400/20">
        <Clock className="w-4 h-4" />
        En attente de traitement
      </div>

      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-white/40">WhatsApp</span>
          <p className="text-white mt-1">{req.whatsappNumber}</p>
        </div>
        <div>
          <span className="text-white/40">Email de contact</span>
          <p className="text-white mt-1">{req.contactEmail}</p>
        </div>
        <div>
          <span className="text-white/40">Pays</span>
          <p className="text-white mt-1">{req.country}</p>
        </div>
        <div>
          <span className="text-white/40">Soumise le</span>
          <p className="text-white mt-1">
            {new Date(req.createdAt).toLocaleDateString('fr-FR', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
        {req.message && (
          <div className="md:col-span-2">
            <span className="text-white/40">Message</span>
            <p className="text-white mt-1">{req.message}</p>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm">
        Notre équipe va vous contacter sur WhatsApp au <strong>{req.whatsappNumber}</strong> pour finaliser votre abonnement.
        Un email de confirmation vous sera envoyé à <strong>{req.contactEmail}</strong>.
      </div>
    </motion.div>
  );

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
                ? 'Vous bénéficiez de tous les avantages PREMIUM.'
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
              className="card p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Vous êtes PREMIUM</h2>
                  <p className="text-white/50 text-sm">Profitez de tous les avantages exclusifs</p>
                </div>
              </div>

              {user?.premiumExpiresAt && (
                <div className={`p-4 rounded-lg border mb-6 ${
                  isExpiringSoon
                    ? 'bg-orange-500/10 border-orange-500/20 text-orange-300'
                    : 'bg-gold/10 border-gold/20 text-gold'
                }`}>
                  {isExpiringSoon ? (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">
                        Votre abonnement expire dans <strong>{premiumDaysLeft} jour{premiumDaysLeft! > 1 ? 's' : ''}</strong> — le{' '}
                        {new Date(user.premiumExpiresAt).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'long', year: 'numeric',
                        })}.
                        Contactez-nous sur WhatsApp pour renouveler.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">
                        Accès valable jusqu'au{' '}
                        <strong>
                          {new Date(user.premiumExpiresAt).toLocaleDateString('fr-FR', {
                            day: '2-digit', month: 'long', year: 'numeric',
                          })}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              )}

              <Link to="/ressources" className="btn-primary inline-flex">
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

          {/* Existing pending request */}
          {!isPremium && !loadingRequest && existingRequest && !submitted &&
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
                Notre équipe vous contactera sur WhatsApp pour finaliser votre abonnement.
                Un email de confirmation a été envoyé à <strong className="text-white">{existingRequest?.contactEmail}</strong>.
              </p>
              <Link to="/profil" className="btn-primary mt-8 inline-flex">
                Retour au profil
              </Link>
            </motion.div>
          )}

          {/* Form — shown only when no pending request and not yet submitted */}
          {!isPremium && !loadingRequest && !submitted && !existingRequest && (
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
                    Notre équipe vous contactera sur WhatsApp pour finaliser
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
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email de contact <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold"
                    placeholder="votre@email.com"
                    required
                  />
                  <p className="text-white/30 text-xs mt-1">
                    Email sur lequel recevoir la confirmation d'activation et les rappels d'expiration
                  </p>
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
