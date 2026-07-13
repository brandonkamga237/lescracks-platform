// src/pages/Landing.tsx
import { useState, useEffect, useRef } from 'react';
import SEO from '@/components/common/SEO';
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

const WHATSAPP_URL = 'https://chat.whatsapp.com/BQvJNnAxAWw3NWCkqCfhQK';

const STATS = [
  { value: '94%', label: 'trouvent un poste ou lancent un projet' },
  { value: '6-12', label: 'mois de suivi certifiant' },
  { value: '3', label: 'pays · Afrique francophone' },
  { value: '1-1', label: 'mentorat dédié à chaque apprenant' },
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
      <SEO
        title="LesCracks – Accélérateur de carrière tech · Afrique francophone"
        description="Un accompagnement structuré de 6 à 12 mois pour passer de débutant à profil employable — mentor dédié, projets réels, attestation. Accélérateur de carrière tech en Afrique francophone."
        url="/"
      />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative flex flex-col justify-center min-h-screen overflow-hidden"
        style={{ backgroundImage: 'url(/images/hero.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/*
          One directional mask instead of three stacked black scrims. The copy sits in
          the left column, so we darken the left and let the photograph actually exist
          on the right — rather than paying to download an image we then erase.
        */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/30" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent" />
        <motion.div
          className="absolute left-8 top-1/4 w-px h-[35vh] bg-gradient-to-b from-gold/50 via-gold/20 to-transparent hidden lg:block"
          style={{ scaleY: scrollYProgress, transformOrigin: 'top' }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-28">
          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-2xl">

            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="text-[11px] text-gold uppercase tracking-[0.45em] mb-7">
              Accélérateur de carrière tech · Afrique francophone
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
              className="text-lg text-t2 max-w-lg mb-10">
              Un accompagnement structuré pour passer de débutant à profil employable — avec un mentor, des projets réels et une communauté.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              className="flex flex-col sm:flex-row gap-4">
              {/*
                The primary action belongs to the product. It used to be the WhatsApp
                button — an off-palette green that sent the most qualified traffic to a
                channel we neither control nor measure. WhatsApp is now the secondary,
                on-brand action, offered after the product path.
              */}
              <Link
                to={postulerHref}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gold text-black font-bold text-base hover:bg-gold-light transition-colors"
              >
                Postuler — réponse sous 48h
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>

              <Link
                to="/programme"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-line-strong text-t2 hover:text-t1 hover:border-gold/50 transition-colors text-base"
              >
                Découvrir le programme
              </Link>
            </motion.div>

            {/* WhatsApp — a community link, not the headline conversion. */}
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="mt-6 text-sm text-t3">
              Ou{' '}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-gold hover:text-gold-light underline underline-offset-4 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                rejoindre la communauté WhatsApp
              </a>
            </motion.p>

          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
          <span className="text-[11px] tracking-widest text-t4">SCROLL</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-px h-5 bg-gradient-to-b from-gold to-transparent" />
        </motion.div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────────── */}
      <div className="border-y border-line-soft">
        <div className="max-w-7xl mx-auto px-4 py-7 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-display font-bold text-gold">{s.value}</p>
              <p className="text-xs text-t4 mt-1">{s.label}</p>
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
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}
                  className="p-6 rounded-2xl border border-line-soft hover:border-line transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-gold/70" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{p.title}</h3>
                  <p className="text-sm text-t3 leading-relaxed">{p.desc}</p>
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
              <p className="text-t2 text-sm leading-relaxed mb-8">
                Un suivi humain et structuré de <strong className="text-white">6 à 12 mois</strong> qui t'emmène de "je ne sais pas par où commencer" jusqu'à ton premier poste, ta première mission freelance ou le lancement de ton projet. Avec un mentor dédié, des projets concrets et une attestation de complétion.
              </p>

              {/* For who */}
              <div className="p-4 rounded-xl bg-white/4 border border-line-soft mb-8">
                <p className="text-[11px] text-gold/60 uppercase tracking-widest mb-2">Pour qui</p>
                <p className="text-sm text-t2 leading-relaxed">
                  Débutants, personnes en reconversion, profils qui tournent en rond depuis des mois sans résultats concrets.
                </p>
              </div>

              <Link to={postulerHref}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gold text-black font-bold hover:bg-gold-light transition-colors">
                Postuler maintenant
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-t4 text-xs mt-3">Réponse sous 48h · Sans engagement immédiat</p>
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
                  <p className="text-xs text-t4">Accompagnement 360 · Suivi personnalisé</p>
                </div>
              </div>
              <ul className="space-y-3.5">
                {ACC_FEATURES.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-t1">
                    <CheckCircle className="w-4 h-4 text-gold/70 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-6 border-t border-line-soft">
                <p className="text-xs text-t4 mb-1">Résultat attendu</p>
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
                  initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}
                  className="flex gap-6">
                  <div className="hidden md:flex w-11 h-11 rounded-full bg-background border border-line items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-gold text-xs font-bold">{step.num}</span>
                  </div>
                  <div className="flex-1 p-5 rounded-xl border border-line-soft hover:border-gold/15 transition-colors">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-gold md:hidden">{step.num}</span>
                      <h3 className="font-semibold text-white">{step.title}</h3>
                    </div>
                    <p className="text-sm text-t3 leading-relaxed">{step.desc}</p>
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
            <p className="text-t4 text-xs mt-3">Réponse sous 48h · Sans engagement immédiat</p>
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
              <p className="text-t3 leading-relaxed mb-8 text-sm">
                Chez LesCracks, l'open source n'est pas un exercice. C'est une façon de construire un portfolio solide, de collaborer en équipe et de se rendre visible sur la scène tech internationale.
              </p>
              <div className="space-y-5">
                {OPEN_SOURCE_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-lg bg-white/5 border border-line-soft flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-gold/70" />
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm mb-0.5">{item.title}</p>
                        <p className="text-xs text-t3 leading-relaxed">{item.desc}</p>
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
              className="rounded-2xl overflow-hidden border border-line-soft">
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
            <p className="text-t3 mt-3 max-w-xl text-sm leading-relaxed">
              En plus des parcours principaux, LesCracks organise régulièrement des événements communautaires pour renforcer vos compétences et élargir votre réseau.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {ACTIVITIES.map((a, i) => (
              <motion.div key={a.type}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}
                className="p-5 rounded-2xl border border-line-soft hover:border-gold/20 transition-colors">
                <span className="text-[11px] font-bold text-gold/60 uppercase tracking-widest">{a.type}</span>
                <h3 className="font-semibold text-white mt-2 mb-2">{a.label}</h3>
                <p className="text-xs text-t3 leading-relaxed">{a.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Events preview */}
          {events.length > 0 && (
            <>
              <p className="text-xs text-t4 uppercase tracking-widest mb-5">Prochains événements</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {events.map((event, i) => (
                  <motion.div key={event.id}
                    initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}
                    className="p-4 border border-line-soft rounded-xl hover:border-line transition-colors">
                    <span className="text-[11px] text-gold/70 uppercase tracking-wider">{event.type}</span>
                    <h4 className="font-medium text-sm mt-1.5 mb-2 text-t1">{event.title}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-t4">
                      <Calendar className="w-3 h-3" />
                      {new Date(event.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      {event.location && <><span>·</span><MapPin className="w-3 h-3" />{event.location}</>}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-7 text-center">
                <Link to="/evenements" className="inline-flex items-center gap-2 text-t3 hover:text-gold transition-colors text-sm">
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
                <p className="text-t3 mt-3 max-w-xl text-sm leading-relaxed">
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
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}
                >
                  <Link
                    to={`/apprenants/${l.slug}`}
                    className="group block bg-white/3 border border-line-soft rounded-2xl p-5 hover:border-gold/25 hover:bg-white/6 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {l.photoUrl ? (
                        <img src={l.photoUrl} alt={l.fullName} className="w-11 h-11 rounded-full object-cover border border-line group-hover:border-gold/30 transition-colors flex-shrink-0" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gold/10 border border-gold/15 flex items-center justify-center text-gold font-bold text-sm flex-shrink-0">
                          {l.firstName[0]}{l.lastName[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{l.fullName}</p>
                        {l.cohort && <p className="text-xs text-t4">Cohorte {l.cohort}</p>}
                      </div>
                    </div>
                    {l.bio && <p className="text-xs text-t3 line-clamp-2 mb-3">{l.bio}</p>}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        l.status === 'TERMINE_AVEC_CERTIFICAT'
                          ? 'bg-gold/10 text-gold border border-gold/20'
                          : l.status === 'EN_COURS'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-white/5 text-t3 border border-line'
                      }`}>
                        {l.status === 'TERMINE_AVEC_CERTIFICAT' && <Award className="w-3 h-3 inline mr-1 -mt-0.5" />}
                        {l.status === 'TERMINE_AVEC_CERTIFICAT' ? 'Certifié' : l.status === 'EN_COURS' ? 'En cours' : 'Diplômé'}
                      </span>
                      {l.linkedinUrl && (
                        <a href={l.linkedinUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-t4 hover:text-blue-400 transition-colors">
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
                className="inline-flex items-center gap-2 border border-line text-t2 hover:border-gold/30 hover:text-gold transition-colors px-6 py-3 rounded-xl text-sm"
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
              className="relative rounded-2xl overflow-hidden border border-line-soft order-2 md:order-1">
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
              <p className="text-t2 text-sm leading-relaxed mb-4">
                LesCracks est un accélérateur de carrière tech né au Cameroun, convaincu que le talent ne manque pas en Afrique — c'est l'accès à la bonne structure et au bon accompagnement qui fait la différence.
              </p>
              <p className="text-t3 text-sm leading-relaxed mb-8">
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
                    <div key={v.label} className="text-center p-3 rounded-xl border border-line-soft">
                      <Icon className="w-5 h-5 text-gold/60 mx-auto mb-2" />
                      <p className="text-[11px] text-t3 leading-tight">{v.label}</p>
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
            <p className="text-t3 mb-10 max-w-lg mx-auto text-sm leading-relaxed">
              Rejoins une communauté qui avance vraiment. Ton parcours commence par une candidature.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={postulerHref}
                className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-gold text-black font-bold text-lg hover:bg-gold-light transition-colors">
                Postuler maintenant
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-10 py-5 border border-[#25D366]/40 text-[#25D366]/80 hover:border-[#25D366] hover:text-[#25D366] transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Canal WhatsApp
              </a>
            </div>
            <p className="text-t4 text-xs mt-6">Réponse sous 48h · Sans engagement · Entretien gratuit</p>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Landing;
