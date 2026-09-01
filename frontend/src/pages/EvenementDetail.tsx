// src/pages/EvenementDetail.tsx
//
// This page did not exist. The route /evenements/:id was wired to the LIST component,
// so "Voir les détails" on a card simply re-rendered the list: nothing to read, and no
// way to sign up. Every event the admin created was a dead end.

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/common/SEO';
import { Skeleton } from '@/components/common/Skeleton';
import apiService, { Event } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft, Calendar, MapPin, Users, CheckCircle, Loader2, AlertCircle, Tag as TagIcon, LogIn,
} from 'lucide-react';

import { errorMessage } from '@/lib/utils';
const STATUS_LABEL: Record<string, { label: string; chip: string }> = {
  open:     { label: 'Inscriptions ouvertes', chip: 'bg-success-subtle text-success border-success/30' },
  upcoming: { label: 'À venir',               chip: 'bg-info-subtle text-info border-info/30' },
  closed:   { label: 'Terminé',               chip: 'bg-white/5 text-t4 border-line' },
};

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : null;

const EvenementDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // registration
  const [form, setForm] = useState({ fullName: '', emailAddress: '', whatsappNumber: '', motivationText: '' });
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      // Old links used the numeric id (/evenements/3). Resolve by id, then redirect
      // (replace) to the canonical slug URL so shared/indexed links keep working.
      if (/^\d+$/.test(slug)) {
        const ev = await apiService.getEvent(slug);
        if (ev.slug) {
          navigate(`/evenements/${ev.slug}`, { replace: true });
          return;
        }
        setEvent(ev);
      } else {
        setEvent(await apiService.getEventBySlug(slug));
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [slug, navigate]);

  useEffect(() => { load(); }, [load]);

  // Prefill from the account when we have one — no reason to make a logged-in user retype.
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        fullName: f.fullName || user.name || user.username || '',
        emailAddress: f.emailAddress || user.email || '',
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setError('');
    setSubmitting(true);
    try {
      // Registration keys on the internal numeric id, never the public slug.
      await apiService.registerToEvent(String(event.id), form);
      setRegistered(true);
    } catch (err) {
      setError(errorMessage(err, "L'inscription a échoué. Merci de réessayer."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </Layout>
    );
  }

  if (notFound || !event) {
    return (
      <Layout>
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <AlertCircle className="w-12 h-12 text-t4 mx-auto mb-4" />
          <h1 className="text-title font-display font-bold text-white mb-3">Événement introuvable</h1>
          <p className="text-t3 mb-8">Cet événement n'existe pas ou a été retiré.</p>
          <Link to="/evenements" className="btn-primary py-2.5 px-6 inline-block">
            Voir tous les événements
          </Link>
        </div>
      </Layout>
    );
  }

  const status = STATUS_LABEL[event.status] ?? STATUS_LABEL.upcoming;
  const isClosed = event.status === 'closed';
  const full =
    event.maxParticipants != null &&
    (event.currentParticipants ?? 0) >= event.maxParticipants;
  const canRegister = !isClosed && !full;

  // schema.org Event — helps Google (JS-rendered) and generative engines cite the event.
  const eventJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    ...(event.description ? { description: event.description.slice(0, 500) } : {}),
    ...(event.startDate ? { startDate: event.startDate } : {}),
    ...(event.endDate ? { endDate: event.endDate } : {}),
    ...(event.coverImageUrl ? { image: event.coverImageUrl } : {}),
    url: `https://lescracks.com/evenements/${event.slug ?? event.id}`,
    eventStatus: isClosed ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
    ...(event.location
      ? { location: { '@type': 'Place', name: event.location } }
      : {
          eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
          location: { '@type': 'VirtualLocation', url: 'https://lescracks.com/evenements' },
        }),
    organizer: { '@type': 'Organization', name: 'LesCracks', url: 'https://lescracks.com' },
  };

  return (
    <Layout>
      <SEO title={event.title} description={event.description?.slice(0, 155)} url={`/evenements/${event.slug ?? event.id}`} jsonLd={eventJsonLd} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <Link to="/evenements" className="inline-flex items-center gap-2 text-t3 hover:text-gold transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Tous les événements
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {event.coverImageUrl && (
            <img
              src={event.coverImageUrl}
              alt=""
              className="w-full h-64 object-cover rounded-xl border border-line mb-8"
            />
          )}

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`px-2.5 py-1 rounded-full border text-label ${status.chip}`}>
              {status.label}
            </span>
            {event.type && (
              <span className="px-2.5 py-1 rounded-full border border-line text-label text-t3">
                {event.type}
              </span>
            )}
          </div>

          <h1 className="text-section font-display font-bold text-white mb-4">{event.title}</h1>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-body text-t3 mb-8">
            {event.startDate && (
              <span className="inline-flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold" aria-hidden="true" />
                {fmtDate(event.startDate)}
                {event.endDate && <> → {fmtDate(event.endDate)}</>}
              </span>
            )}
            {event.location && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" aria-hidden="true" />
                {event.location}
              </span>
            )}
            {event.maxParticipants != null && (
              <span className="inline-flex items-center gap-2">
                <Users className="w-4 h-4 text-gold" aria-hidden="true" />
                {event.currentParticipants ?? 0}/{event.maxParticipants} participants
              </span>
            )}
          </div>

          <div className="prose prose-invert max-w-none text-t2 leading-relaxed whitespace-pre-line mb-8">
            {event.description}
          </div>

          {/* ── Registration ─────────────────────────────────────────────── */}
          <div className="card p-6 md:p-8">
            {registered ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-gold" />
                </div>
                <h2 className="text-title font-display font-bold text-white mb-2">Inscription enregistrée</h2>
                <p className="text-t3 text-body">
                  On revient vers toi sur WhatsApp avec les détails. Vérifie aussi tes emails.
                </p>
              </div>
            ) : !canRegister ? (
              <div className="text-center py-4">
                <h2 className="text-heading font-display font-bold text-white mb-2">
                  {isClosed ? 'Les inscriptions sont closes' : 'Complet'}
                </h2>
                <p className="text-t3 text-body">
                  {isClosed
                    ? 'Cet événement est terminé.'
                    : 'Toutes les places ont été prises. Suis-nous pour le prochain.'}
                </p>
              </div>
            ) : !isAuthenticated ? (
              /* An event seat is nominative: we need to know who is coming, be able to
                 reach them, and stop one person taking three of the twenty places.
                 Show this instead of a form that the server would reject anyway. */
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
                  <LogIn className="w-6 h-6 text-gold" aria-hidden="true" />
                </div>
                <h2 className="text-title font-display font-bold text-white mb-2">
                  Connecte-toi pour t'inscrire
                </h2>
                <p className="text-t3 text-body mb-6 max-w-sm mx-auto">
                  Les places sont nominatives. Crée ton compte en une minute — on te ramène
                  directement ici après.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to={`/connexion?redirect=${encodeURIComponent(`/evenements/${event.slug ?? slug}`)}`}
                    className="btn-primary py-3 px-6"
                  >
                    Se connecter
                  </Link>
                  <Link
                    to={`/inscription?redirect=${encodeURIComponent(`/evenements/${event.slug ?? slug}`)}`}
                    className="btn-secondary py-3 px-6"
                  >
                    Créer un compte
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-title font-display font-bold text-white mb-1">
                  {event.applicationRequired ? 'Postuler à cet événement' : 'S\'inscrire'}
                </h2>
                <p className="text-t3 text-body mb-6">
                  {event.applicationRequired
                    ? 'Les places sont limitées : parle-nous de toi, on étudie chaque candidature.'
                    : 'Laisse-nous tes coordonnées, on te recontacte avec les détails.'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-error-subtle border border-error/30 text-error text-body">
                      {error}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="ev-name" className="block text-body text-t2 mb-2">Nom complet</label>
                      <input
                        id="ev-name"
                        className="input"
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        placeholder="Jean Dupont"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="ev-email" className="block text-body text-t2 mb-2">Email</label>
                      <input
                        id="ev-email"
                        type="email"
                        className="input"
                        value={form.emailAddress}
                        onChange={(e) => setForm({ ...form, emailAddress: e.target.value })}
                        placeholder="vous@exemple.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="ev-wa" className="block text-body text-t2 mb-2">WhatsApp</label>
                    <input
                      id="ev-wa"
                      className="input"
                      value={form.whatsappNumber}
                      onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                      placeholder="+237 6 00 00 00 00"
                      required
                    />
                    <p className="text-t4 text-label mt-1.5">C'est par là qu'on te transmettra les détails pratiques.</p>
                  </div>

                  {event.applicationRequired && (
                    <div>
                      <label htmlFor="ev-motiv" className="block text-body text-t2 mb-2">
                        Pourquoi veux-tu participer ?
                      </label>
                      <textarea
                        id="ev-motiv"
                        className="input min-h-[110px] resize-y"
                        value={form.motivationText}
                        onChange={(e) => setForm({ ...form, motivationText: e.target.value })}
                        placeholder="Quelques lignes suffisent."
                      />
                    </div>
                  )}

                  <button type="submit" disabled={submitting} className="w-full btn-primary py-3">
                    {submitting
                      ? <Loader2 className="w-5 h-5 animate-spin" />
                      : event.applicationRequired ? 'Envoyer ma candidature' : 'Confirmer mon inscription'}
                  </button>
                </form>
              </>
            )}
          </div>

          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-8">
              <TagIcon className="w-4 h-4 text-t4" aria-hidden="true" />
              {event.tags.map((t) => (
                <span key={t.id} className="px-2.5 py-1 rounded-full bg-white/5 border border-line text-label text-t3">
                  {t.name}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default EvenementDetail;
