// src/pages/Landing.tsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { apiService, Event } from '@/services/api';
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
  GraduationCap,
  Calendar,
  MapPin,
  ChevronRight,
  Code2,
  GitBranch,
  Globe,
  Zap,
  Heart,
} from 'lucide-react';

// ─── data ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '200+', label: 'apprenants formés' },
  { value: '3', label: 'pays couverts' },
  { value: '94%', label: 'taux de satisfaction' },
  { value: '2019', label: 'année de création' },
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

const COMPARISON = [
  { label: 'Objectif',       acc: 'Évolution professionnelle',        form: 'Acquisition de compétences' },
  { label: 'Suivi',          acc: 'Coaching personnalisé régulier',    form: 'Auto-apprentissage guidé' },
  { label: 'Plan',           acc: 'Feuille de route sur-mesure',      form: 'Programme standardisé' },
  { label: 'Réseau',         acc: 'Accès réseau LesCracks',           form: 'Communauté d\'apprenants' },
  { label: 'Rythme',         acc: 'Encadré et structuré',             form: 'Flexible, à votre rythme' },
  { label: 'Profil cible',   acc: 'Reconversion, débutants, bloqués', form: 'Autodidactes motivés' },
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
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const heroRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  useEffect(() => {
    apiService.getEvents({ status: 'OUVERT' }).then((d) => setEvents(d.slice(0, 4))).catch(() => {});
  }, []);

  const postulerHref = isAuthenticated ? '/postuler' : '/inscription';

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
              Devenez un professionnel{' '}
              <span className="relative inline-block text-gold">
                de la tech
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 260 10" preserveAspectRatio="none">
                  <path d="M0 7 Q130 12 260 7" stroke="#D4AF37" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="text-lg text-white/55 max-w-lg mb-10">
              Deux parcours complémentaires pour acquérir des compétences réelles et évoluer dans le secteur tech, depuis l'Afrique.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              className="flex flex-col sm:flex-row gap-4">
              <Link to={postulerHref}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gold text-black font-bold text-base hover:bg-gold-light transition-colors">
                Postuler
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="#offres"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors text-base">
                Découvrir nos offres
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

      {/* ── DEUX OFFRES ─────────────────────────────────────────────── */}
      <section id="offres" className="py-24 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14">
            <SL>Nos parcours</SL>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
              Deux chemins selon <span className="text-gold">votre situation</span>
            </h2>
            <p className="text-white/40 mt-3 max-w-xl text-sm leading-relaxed">
              Les deux offres sont complémentaires. Choisissez celle qui correspond à là où vous en êtes.
            </p>
          </motion.div>

          {/* Cards — equal visual weight */}
          <div className="grid md:grid-cols-2 gap-6 mb-14">

            {/* Accompagnement 360 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="rounded-2xl border border-gold/30 bg-gold/4 p-8 flex flex-col">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-gold/15 flex items-center justify-center">
                  <Compass className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-white">Accompagnement 360</h3>
                  <p className="text-xs text-white/40">Suivi personnalisé · Orienté résultat</p>
                </div>
              </div>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                Un suivi structuré qui va de la compréhension de votre profil à la mise en situation professionnelle. Idéal si vous avez besoin d'un cadre, d'un mentor et d'une communauté.
              </p>
              <ul className="space-y-2.5 mb-7 flex-1">
                {['Bilan de situation initial', 'Plan de progression sur-mesure', 'Sessions de coaching régulières', 'Accès aux ressources LesCracks', 'Préparation à l\'emploi ou au freelance'].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-white/65">
                    <CheckCircle className="w-4 h-4 text-gold/70 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="p-3.5 rounded-xl bg-white/4 border border-white/8 mb-6 text-sm text-white/45">
                <span className="text-white/25 text-xs">Pour qui : </span>
                Débutants, personnes en reconversion, profils qui stagnent depuis plusieurs mois.
              </div>
              <Link to={postulerHref}
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-gold text-black font-bold hover:bg-gold-light transition-colors text-sm">
                Postuler à l'Accompagnement 360
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Formation pratique */}
            <motion.div
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
              className="rounded-2xl border border-white/12 p-8 flex flex-col">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-white/7 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white/60" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-white">Formation pratique</h3>
                  <p className="text-xs text-white/40">Compétences ciblées · Flexible</p>
                </div>
              </div>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                Des cours structurés, des projets concrets et des exercices pratiques pour monter en compétence sur une technologie précise. Accessible à votre propre rythme.
              </p>
              <ul className="space-y-2.5 mb-7 flex-1">
                {['Cours vidéo et articles structurés', 'Exercices et projets pratiques', 'Accès à la bibliothèque de ressources', 'Communauté d\'apprenants active', 'Certifications de complétion'].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-white/55">
                    <CheckCircle className="w-4 h-4 text-white/25 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="p-3.5 rounded-xl bg-white/4 border border-white/8 mb-6 text-sm text-white/45">
                <span className="text-white/25 text-xs">Pour qui : </span>
                Autodidactes motivés qui savent ce qu'ils veulent apprendre et avancent à leur propre rythme.
              </div>
              <Link to="/postuler?service=formation"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-colors text-sm font-semibold">
                Commencer la Formation
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>

          {/* Comparison table */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-xs text-white/30 uppercase tracking-widest text-center mb-6">Comparaison rapide</p>
            <div className="rounded-2xl overflow-hidden border border-white/8">
              <div className="grid grid-cols-3 bg-white/4 border-b border-white/8">
                <div className="p-4" />
                <div className="p-4 text-center border-l border-white/8">
                  <span className="text-xs font-semibold text-gold/80 uppercase tracking-wider">Accompagnement 360</span>
                </div>
                <div className="p-4 text-center border-l border-white/8">
                  <span className="text-xs font-semibold text-white/30 uppercase tracking-wider">Formation pratique</span>
                </div>
              </div>
              {COMPARISON.map((row, i) => (
                <div key={row.label} className={`grid grid-cols-3 ${i < COMPARISON.length - 1 ? 'border-b border-white/5' : ''}`}>
                  <div className="p-4 text-xs text-white/35 font-medium">{row.label}</div>
                  <div className="p-4 text-xs text-white/70 border-l border-white/8 bg-gold/3">{row.acc}</div>
                  <div className="p-4 text-xs text-white/35 border-l border-white/8">{row.form}</div>
                </div>
              ))}
            </div>
          </motion.div>
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
                src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=700&h=500&fit=crop"
                alt="Open Source"
                className="w-full h-72 object-cover opacity-70"
              />
              <div className="p-6 bg-white/3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-white/40">Projets actifs en ce moment</span>
                </div>
                <div className="space-y-2">
                  {['LesCracks Platform', 'Afrika Dev Tools', 'OpenMentor API'].map((proj) => (
                    <div key={proj} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/4 border border-white/6">
                      <Code2 className="w-3.5 h-3.5 text-gold/60" />
                      <span className="text-xs text-white/60">{proj}</span>
                    </div>
                  ))}
                </div>
              </div>
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

      {/* ── À PROPOS ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-secondary" id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="relative rounded-2xl overflow-hidden border border-white/8 order-2 md:order-1">
              <img
                src="https://images.unsplash.com/photo-1573164574572-cb89e39749b4?w=700&h=500&fit=crop"
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
          <img src="https://images.unsplash.com/photo-1573164574572-cb89e39749b4?w=1920&h=800&fit=crop" alt="" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-black/65" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <SL>Passez à l'action</SL>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-5 text-white">
              Prêt à changer<br />de <span className="text-gold">trajectoire</span> ?
            </h2>
            <p className="text-white/45 mb-10 max-w-lg mx-auto text-sm leading-relaxed">
              Des centaines d'apprenants nous ont fait confiance. Rejoignez une communauté qui avance vraiment.
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
