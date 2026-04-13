// src/pages/Landing.tsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import apiService, { Event, Learner } from '@/services/api';
import Layout from '@/components/layout/Layout';
import Testimonials from '@/components/landing/Testimonials';
import FAQ from '@/components/landing/FAQ';
import {
  ArrowRight,
  CheckCircle,
  Users,
  Target,
  TrendingUp,
  Compass,
  Calendar,
  MapPin,
  ChevronRight,
  Code2,
  GitBranch,
  Globe,
  Zap,
  Heart,
  Award,
  Linkedin,
} from 'lucide-react';

// ─── data ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '+20', label: 'apprenants formés' },
  { value: '3', label: 'pays couverts' },
  { value: '6-12', label: 'mois de suivi certifiant' },
  { value: '94%', label: 'taux de satisfaction' },
];

const PAIN_POINTS = [
  {
    icon: Target,
    title: 'Pas de cap clair',
    desc: 'Trop d\'options, trop de tutoriels. Difficile de savoir par où commencer et comment progresser efficacement.',
  },
  {
    icon: TrendingUp,
    title: 'Apprentissage sans résultats visibles',
    desc: 'Tu consommes du contenu mais tu n\'arrives pas à construire des choses concrètes ni à te positionner professionnellement.',
  },
  {
    icon: Users,
    title: 'Manque de réseau et d\'accompagnement',
    desc: 'Apprendre seul dans son coin est épuisant. Sans mentor ni communauté, il est difficile de garder la motivation.',
  },
];

const ACC_FEATURES = [
  'Bilan de profil approfondi',
  'Plan de progression personnalisé',
  'Séances de coaching régulières avec un mentor',
  'Accès aux ressources et à la communauté LesCracks',
  'Préparation à l\'emploi, au freelance ou à la création',
  'Attestation de complétion',
];

const PROCESS_STEPS = [
  { num: '01', title: 'Candidature', desc: 'Tu remplis le formulaire. Notre équipe étudie ton profil et te répond sous 48h.' },
  { num: '02', title: 'Bilan initial', desc: 'Un échange de 45 minutes pour comprendre ta situation, tes objectifs et définir ta trajectoire.' },
  { num: '03', title: 'Plan personnalisé', desc: 'On construit ensemble une feuille de route adaptée à ton profil et ton rythme.' },
  { num: '04', title: 'Accompagnement actif', desc: 'Sessions régulières, accès aux ressources, projets pratiques, retours sur ton travail.' },
  { num: '05', title: 'Mise en situation', desc: 'Préparation à la recherche d\'emploi, au freelance ou au lancement d\'un projet.' },
];

const OPEN_SOURCE_ITEMS = [
  { icon: Code2,     title: 'Projets réels',        desc: 'Contribue à des projets open source utilisés par des communautés.' },
  { icon: GitBranch, title: 'Portfolio concret',     desc: 'Chaque contribution visible sur ton GitHub. Rien de théorique.' },
  { icon: Globe,     title: 'Visibilité internationale', desc: 'Tes projets exposés à des recruteurs et des communautés tech internationales.' },
];

const ACTIVITIES = [
  { type: 'BOOTCAMP',  label: 'Bootcamps',   desc: 'Immersion intensive sur des stacks précises en quelques jours.' },
  { type: 'HACKATHON', label: 'Hackathons',  desc: 'Résolution de problèmes réels en équipe sous contrainte de temps.' },
  { type: 'MEETUP',    label: 'Meetups',     desc: 'Rencontres communautaires, talks et échanges entre praticiens.' },
  { type: 'WORKSHOP',  label: 'Workshops',   desc: 'Ateliers pratiques animés par des experts du terrain.' },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

const SL = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] text-gold uppercase tracking-[0.4em] mb-4">{children}</p>
);

// ─── page ─────────────────────────────────────────────────────────────────────

const Landing = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [showcasedLearners, setShowcasedLearners] = useState<Learner[]>([]);
  const heroRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  useEffect(() => {
    apiService.getEvents({ status: 'OUVERT' }).then((d) => setEvents(d.slice(0, 4))).catch(() => {});
    apiService.getShowcasedLearners().then(setShowcasedLearners).catch(() => {});
  }, []);

  const postulerHref = '/postuler';

  return (
    <Layout>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative flex flex-col justify-center min-h-screen overflow-hidden"
        style={{ backgroundImage: 'url(/images/hero.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/* Dark overlay — multi-layer for reliable text legibility on any image */}
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black to-transparent" />
        <motion.div
          className="absolute left-8 top-1/4 w-px h-[35vh] bg-gradient-to-b from-gold/50 via-gold/20 to-transparent hidden lg:block"
          style={{ scaleY: scrollYProgress, transformOrigin: 'top' }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-28">
          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-2xl">

            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="text-[11px] text-gold uppercase tracking-[0.45em] mb-7">
              Agence Edtech · Afrique francophone
            </motion.p>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.7 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6">
              Devenez aussi{' '}
              <span className="relative inline-block text-gold">
                un crack de la tech
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 420 10" preserveAspectRatio="none">
                  <path d="M0 7 Q210 12 420 7" stroke="#D4AF37" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="text-lg text-white/55 max-w-lg mb-10">
              Un accompagnement structuré pour passer de débutant à profil employable — avec un mentor, des projets réels et une communauté.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              className="flex flex-col sm:flex-row gap-4">
              <Link to={postulerHref}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gold text-black font-bold text-base hover:bg-gold-light transition-colors">
                Postuler à l'accompagnement
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="#parcours"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors text-base">
                Découvrir le parcours
              </Link>
            </motion.div>

          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
          <span className="text-[9px] tracking-widest text-white/20">SCROLL</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-px h-5 bg-gradient-to-b from-gold to-transparent" />
        </motion.div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────────── */}
      <div className="border-y border-white/6">
        <div className="max-w-7xl mx-auto px-4 py-7 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-display font-bold text-gold">{s.value}</p>
              <p className="text-xs text-white/35 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── PROBLÈME ────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14">
            <SL>Le défi</SL>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
              Apprendre la tech, c'est difficile<br />sans <span className="text-gold">la bonne structure</span>.
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {PAIN_POINTS.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div key={p.title}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="p-6 rounded-2xl border border-white/7 hover:border-white/15 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-gold/70" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{p.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{p.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ACCOMPAGNEMENT 360 ──────────────────────────────────────── */}
      <section id="parcours" className="py-24 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Left — pitch */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <SL>Notre offre</SL>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-5">
                L'<span className="text-gold">Accompagnement 360</span>
              </h2>
              <p className="text-white/55 text-sm leading-relaxed mb-8">
                Un suivi humain et structuré de <strong className="text-white">6 à 12 mois</strong> qui t'emmène de "je ne sais pas par où commencer" jusqu'à ton premier poste, ta première mission freelance ou le lancement de ton projet. Avec un mentor dédié, des projets concrets et une attestation de complétion.
              </p>

              {/* For who */}
              <div className="p-4 rounded-xl bg-white/4 border border-white/8 mb-8">
                <p className="text-[11px] text-gold/60 uppercase tracking-widest mb-2">Pour qui</p>
                <p className="text-sm text-white/55 leading-relaxed">
                  Débutants, personnes en reconversion, profils qui tournent en rond depuis des mois sans résultats concrets.
                </p>
              </div>

              <Link to={postulerHref}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-black font-bold hover:bg-gold-light transition-colors">
                Postuler maintenant
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-white/20 text-xs mt-3">Réponse sous 48h · Sans engagement immédiat</p>
            </motion.div>

            {/* Right — feature list */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="rounded-2xl border border-gold/20 bg-gold/3 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-gold/15 flex items-center justify-center">
                  <Compass className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="font-display font-bold text-white">Ce que tu obtiens</p>
                  <p className="text-xs text-white/35">Accompagnement 360 · Suivi personnalisé</p>
                </div>
              </div>
              <ul className="space-y-3.5">
                {ACC_FEATURES.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/70">
                    <CheckCircle className="w-4 h-4 text-gold/70 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-6 border-t border-white/8">
                <p className="text-xs text-white/25 mb-1">Résultat attendu</p>
                <p className="text-sm font-medium text-gold">Emploi · Freelance · Projet personnel lancé</p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── PROCESSUS ACCOMPAGNEMENT 360 ────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14">
            <SL>Comment ça fonctionne</SL>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
              Le processus <span className="text-gold">Accompagnement 360</span>
            </h2>
          </motion.div>

          <div className="relative">
            <div className="absolute left-[22px] top-8 bottom-8 w-px bg-gradient-to-b from-gold/40 via-gold/15 to-transparent hidden md:block" />
            <div className="space-y-5">
              {PROCESS_STEPS.map((step, i) => (
                <motion.div key={step.num}
                  initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.09 }}
                  className="flex gap-6">
                  <div className="hidden md:flex w-11 h-11 rounded-full bg-background border border-white/15 items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-gold text-xs font-bold">{step.num}</span>
                  </div>
                  <div className="flex-1 p-5 rounded-xl border border-white/7 hover:border-gold/15 transition-colors">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-gold md:hidden">{step.num}</span>
                      <h3 className="font-semibold text-white">{step.title}</h3>
                    </div>
                    <p className="text-sm text-white/45 leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-12 text-center">
            <Link to={postulerHref}
              className="inline-flex items-center gap-2 px-9 py-4 bg-gold text-black font-bold hover:bg-gold-light transition-colors">
              Postuler maintenant
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-white/25 text-xs mt-3">Réponse sous 48h · Sans engagement immédiat</p>
          </motion.div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ─────────────────────────────────────────────── */}
      <Testimonials />

      {/* ── OPEN SOURCE ─────────────────────────────────────────────── */}
      <section className="py-24 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <SL>Open Source</SL>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-5">
                Contribue à des projets <span className="text-gold">qui existent vraiment</span>
              </h2>
              <p className="text-white/50 leading-relaxed mb-8 text-sm">
                Chez LesCracks, l'open source n'est pas un exercice. C'est une façon de construire un portfolio solide, de collaborer en équipe et de se rendre visible sur la scène tech internationale.
              </p>
              <div className="space-y-5">
                {OPEN_SOURCE_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-gold/70" />
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm mb-0.5">{item.title}</p>
                        <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link to="/open-source" className="inline-flex items-center gap-2 mt-8 text-gold hover:text-gold-light transition-colors text-sm font-medium">
                Voir nos projets open source <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Visual illustration */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="rounded-2xl overflow-hidden border border-white/8">
              <img
                src="/images/community-2.jpg"
                alt="Communauté LesCracks"
                className="w-full h-72 object-cover opacity-80"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── NOS ACTIVITÉS ────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14">
            <SL>Communauté</SL>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
              Nos <span className="text-gold">activités</span> complémentaires
            </h2>
            <p className="text-white/40 mt-3 max-w-xl text-sm leading-relaxed">
              En plus des parcours principaux, LesCracks organise régulièrement des événements communautaires pour renforcer vos compétences et élargir votre réseau.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {ACTIVITIES.map((a, i) => (
              <motion.div key={a.type}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="p-5 rounded-2xl border border-white/7 hover:border-gold/20 transition-colors">
                <span className="text-[10px] font-bold text-gold/60 uppercase tracking-widest">{a.type}</span>
                <h3 className="font-semibold text-white mt-2 mb-2">{a.label}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{a.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Events preview */}
          {events.length > 0 && (
            <>
              <p className="text-xs text-white/25 uppercase tracking-widest mb-5">Prochains événements</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {events.map((event, i) => (
                  <motion.div key={event.id}
                    initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                    className="p-4 border border-white/7 rounded-xl hover:border-white/15 transition-colors">
                    <span className="text-[10px] text-gold/70 uppercase tracking-wider">{event.type}</span>
                    <h4 className="font-medium text-sm mt-1.5 mb-2 text-white/80">{event.title}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-white/30">
                      <Calendar className="w-3 h-3" />
                      {new Date(event.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      {event.location && <><span>·</span><MapPin className="w-3 h-3" />{event.location}</>}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-7 text-center">
                <Link to="/evenements" className="inline-flex items-center gap-2 text-white/40 hover:text-gold transition-colors text-sm">
                  Voir tous les événements <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── NOS APPRENANTS ───────────────────────────────────────────── */}
      {showcasedLearners.length > 0 && (
        <section className="py-24 bg-secondary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <SL>Communauté</SL>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
                  Ils sont <span className="text-gold">devenus des cracks</span>
                </h2>
                <p className="text-white/40 mt-3 max-w-xl text-sm leading-relaxed">
                  Rencontrez quelques-uns des apprenants qui ont suivi notre accompagnement et qui construisent aujourd'hui leur carrière tech.
                </p>
              </div>
              <Link to="/apprenants" className="flex-shrink-0 flex items-center gap-1.5 text-sm text-gold hover:text-gold/70 transition-colors">
                Voir tous les apprenants <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {showcasedLearners.slice(0, 8).map((l, i) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                >
                  <Link
                    to={`/apprenants/${l.slug}`}
                    className="group block bg-white/3 border border-white/8 rounded-2xl p-5 hover:border-gold/25 hover:bg-white/6 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {l.photoUrl ? (
                        <img src={l.photoUrl} alt={l.fullName} className="w-11 h-11 rounded-full object-cover border border-white/10 group-hover:border-gold/30 transition-colors flex-shrink-0" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gold/10 border border-gold/15 flex items-center justify-center text-gold font-bold text-sm flex-shrink-0">
                          {l.firstName[0]}{l.lastName[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{l.fullName}</p>
                        {l.cohort && <p className="text-xs text-white/35">Cohorte {l.cohort}</p>}
                      </div>
                    </div>
                    {l.bio && <p className="text-xs text-white/45 line-clamp-2 mb-3">{l.bio}</p>}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        l.status === 'TERMINE_AVEC_CERTIFICAT'
                          ? 'bg-gold/10 text-gold border border-gold/20'
                          : l.status === 'EN_COURS'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-white/5 text-white/40 border border-white/10'
                      }`}>
                        {l.status === 'TERMINE_AVEC_CERTIFICAT' && <Award className="w-3 h-3 inline mr-1 -mt-0.5" />}
                        {l.status === 'TERMINE_AVEC_CERTIFICAT' ? 'Certifié' : l.status === 'EN_COURS' ? 'En cours' : 'Diplômé'}
                      </span>
                      {l.linkedinUrl && (
                        <a href={l.linkedinUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-white/25 hover:text-blue-400 transition-colors">
                          <Linkedin className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                to="/apprenants"
                className="inline-flex items-center gap-2 border border-white/10 text-white/60 hover:border-gold/30 hover:text-gold transition-colors px-6 py-3 rounded-xl text-sm"
              >
                <Users className="w-4 h-4" />
                Découvrir toute la communauté
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── À PROPOS ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-secondary" id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="relative rounded-2xl overflow-hidden border border-white/8 order-2 md:order-1">
              <img
                src="/images/about.jpg"
                alt="Apprenants LesCracks — Afrique francophone"
                className="w-full h-80 object-cover"
              />
              {/* Overlay to ensure image blends with dark theme */}
              <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/30 to-black/10" />
            </motion.div>

            {/* Text */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="order-1 md:order-2">
              <SL>Notre histoire</SL>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-5">
                Qui sommes-<span className="text-gold">nous</span> ?
              </h2>
              <p className="text-white/55 text-sm leading-relaxed mb-4">
                LesCracks est une agence edtech née au Cameroun, convaincue que le talent tech ne manque pas en Afrique — c'est l'accès à la bonne structure et au bon accompagnement qui fait la différence.
              </p>
              <p className="text-white/40 text-sm leading-relaxed mb-8">
                Fondée par des praticiens du terrain, notre mission est simple : rendre l'excellence tech accessible à tous ceux qui sont prêts à travailler, quelle que soit leur situation de départ.
              </p>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { icon: Globe, label: 'Afrique francophone' },
                  { icon: Heart, label: 'Fait par des praticiens' },
                  { icon: Zap, label: 'Axé sur la pratique' },
                ].map((v) => {
                  const Icon = v.icon;
                  return (
                    <div key={v.label} className="text-center p-3 rounded-xl border border-white/7">
                      <Icon className="w-5 h-5 text-gold/60 mx-auto mb-2" />
                      <p className="text-[11px] text-white/40 leading-tight">{v.label}</p>
                    </div>
                  );
                })}
              </div>

              <Link to="/about" className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors text-sm font-medium">
                En savoir plus sur nous <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <FAQ />

      {/* ── CTA FINAL ────────────────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/community-1.jpg" alt="" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-black/65" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <SL>Passez à l'action</SL>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-5 text-white">
              Prêt à changer<br />de <span className="text-gold">trajectoire</span> ?
            </h2>
            <p className="text-white/45 mb-10 max-w-lg mx-auto text-sm leading-relaxed">
              Rejoins une communauté qui avance vraiment. Ton parcours commence par une candidature.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={postulerHref}
                className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-gold text-black font-bold text-lg hover:bg-gold-light transition-colors">
                Postuler
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/ressources"
                className="inline-flex items-center justify-center gap-2 px-10 py-5 border border-white/15 text-white/50 hover:text-white hover:border-white/35 transition-colors">
                Explorer les ressources
              </Link>
            </div>
            <p className="text-white/20 text-xs mt-6">Réponse sous 48h · Sans engagement · Entretien gratuit</p>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Landing;
