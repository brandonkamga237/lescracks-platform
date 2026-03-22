// src/pages/About.tsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import {
  ArrowRight,
  MapPin,
  Calendar,
  Users,
  Heart,
  Target,
  Lightbulb,
  Globe,
  ChevronRight,
} from 'lucide-react';

const VALUES = [
  {
    icon: Target,
    title: 'L\'excellence par la pratique',
    desc: 'On croit que la meilleure façon d\'apprendre la tech, c\'est de construire des choses réelles. Pas de théorie gratuite — tout ce qu\'on enseigne a une application concrète.',
  },
  {
    icon: Heart,
    title: 'L\'humain avant tout',
    desc: 'Derrière chaque apprenant, il y a une histoire, un contexte, des contraintes. On adapte notre approche à chaque personne plutôt que d\'imposer un format unique.',
  },
  {
    icon: Globe,
    title: 'L\'Afrique comme terrain de jeu',
    desc: 'On s\'adresse en priorité à l\'Afrique francophone — un continent avec des talents immenses et un besoin urgent de professionnels de la tech formés localement.',
  },
  {
    icon: Lightbulb,
    title: 'La rigueur sans élitisme',
    desc: 'On ne prétend pas que c\'est facile. Mais on refuse que l\'accès à une formation de qualité reste réservé à ceux qui ont déjà des ressources.',
  },
];

const MILESTONES = [
  { year: '2019', title: 'Naissance de l\'idée', desc: 'Brandon Kamga commence à coacher ses premiers apprenants de manière informelle à Yaoundé.' },
  { year: '2021', title: 'Première structure', desc: 'LesCracks prend forme en tant qu\'agence structurée, avec les premiers programmes d\'accompagnement formalisés.' },
  { year: '2023', title: 'Expansion régionale', desc: 'La communauté s\'étend à d\'autres pays francophones. Les bootcamps et hackathons deviennent récurrents.' },
  { year: '2024', title: 'Plateforme en ligne', desc: 'Lancement de la bibliothèque de ressources et des outils pour accompagner les apprenants à distance.' },
  { year: '2025+', title: 'Prochaine étape', desc: 'Renforcer notre programme d\'accompagnement 360 et ouvrir notre impact open source à des contributeurs internationaux.' },
];

const NUMBERS = [
  { value: '200+', label: 'apprenants accompagnés' },
  { value: '3',    label: 'pays couverts' },
  { value: '94%',  label: 'taux de satisfaction' },
  { value: '5+',   label: 'ans d\'expérience terrain' },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const About = () => {
  return (
    <Layout>
      <div className="pb-24">

        {/* ── Breadcrumb ─────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex items-center gap-2 text-sm text-white/30">
            <Link to="/" className="hover:text-gold transition-colors">Accueil</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/60">À propos</span>
          </div>
        </div>

        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <motion.div {...fadeUp} className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-4 h-4 text-gold" />
              <span className="text-sm text-white/40">Yaoundé, Cameroun — Afrique francophone</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight mb-6">
              Rendre la tech accessible{' '}
              <span className="text-gold">à ceux qu'on a longtemps oubliés</span>
            </h1>
            <p className="text-xl text-white/55 leading-relaxed max-w-2xl">
              LesCracks est née d'un constat simple : il y a des talents partout en Afrique
              francophone, mais peu de structures sérieuses pour les accompagner vers un vrai
              métier de la tech. On a décidé d'en être une.
            </p>
          </motion.div>
        </section>

        {/* ── Numbers bar ────────────────────────────────────────── */}
        <section className="border-y border-white/8 bg-white/2">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              {NUMBERS.map((n) => (
                <motion.div key={n.label} {...fadeUp} className="text-center">
                  <p className="text-3xl font-display font-bold text-gold mb-1">{n.value}</p>
                  <p className="text-sm text-white/40">{n.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Story ──────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Text */}
            <motion.div {...fadeUp}>
              <p className="text-xs font-mono text-gold/70 tracking-widest uppercase mb-4">Notre histoire</p>
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6 leading-snug">
                Né de la frustration d'un praticien
              </h2>
              <div className="space-y-4 text-white/55 leading-relaxed">
                <p>
                  Brandon Kamga travaillait dans la tech et voyait autour de lui des jeunes motivés,
                  intelligents, capables — mais perdus. Sans accès à des mentors locaux, sans formation
                  adaptée à leur contexte, sans réseau pour démarrer.
                </p>
                <p>
                  Les ressources en ligne existaient, mais en anglais, pour des contextes occidentaux,
                  sans suivi humain. Ce n'était pas suffisant.
                </p>
                <p>
                  LesCracks a commencé par des sessions informelles, du coaching de pair à pair, des
                  petits groupes qui avançaient ensemble. Avec le temps, une méthode s'est formalisée.
                  Une communauté a grandi. Une agence est née.
                </p>
                <p>
                  Aujourd'hui, on accompagne des apprenants au Cameroun, au Sénégal, en Côte d'Ivoire
                  et au-delà. Mais l'ADN reste le même : du terrain, de l'humain, du concret.
                </p>
              </div>
            </motion.div>

            {/* Image / visual */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                <img
                  src="/images/photo-brandon.jpeg"
                  alt="Brandon Kamga — fondateur de LesCracks"
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    // Fallback graceful if image missing
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              {/* Caption */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/70 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                  <p className="text-sm font-medium text-white">Brandon Kamga</p>
                  <p className="text-xs text-white/50">Fondateur &amp; Lead Coach · LesCracks</p>
                </div>
              </div>
              {/* Decorative ring */}
              <div className="absolute -top-4 -right-4 w-32 h-32 border border-gold/15 rounded-full" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 border border-gold/10 rounded-full" />
            </motion.div>
          </div>
        </section>

        {/* ── Values ─────────────────────────────────────────────── */}
        <section className="bg-white/2 border-y border-white/8 py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp} className="text-center mb-12">
              <p className="text-xs font-mono text-gold/70 tracking-widest uppercase mb-3">Ce en quoi on croit</p>
              <h2 className="text-3xl sm:text-4xl font-display font-bold">Nos principes</h2>
            </motion.div>
            <div className="grid sm:grid-cols-2 gap-6">
              {VALUES.map((v, i) => {
                const Icon = v.icon;
                return (
                  <motion.div
                    key={v.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="card p-6"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-gold" />
                    </div>
                    <h3 className="font-display font-semibold text-lg mb-2">{v.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{v.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Timeline ───────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div {...fadeUp} className="mb-12">
            <p className="text-xs font-mono text-gold/70 tracking-widest uppercase mb-3">Chronologie</p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold">Notre parcours</h2>
          </motion.div>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[22px] top-0 bottom-0 w-px bg-gradient-to-b from-gold/40 via-gold/15 to-transparent" />
            <div className="space-y-8">
              {MILESTONES.map((m, i) => (
                <motion.div
                  key={m.year}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex gap-6 pl-2"
                >
                  {/* Dot */}
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-background border-2 border-gold/40 flex items-center justify-center z-10">
                    <div className="w-2 h-2 rounded-full bg-gold" />
                  </div>
                  {/* Content */}
                  <div className="pb-2">
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="text-xs font-mono text-gold/70 tracking-wider">{m.year}</span>
                      <h3 className="font-display font-semibold">{m.title}</h3>
                    </div>
                    <p className="text-sm text-white/45 leading-relaxed">{m.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Team note ──────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <motion.div
            {...fadeUp}
            className="card p-8 sm:p-10 flex flex-col sm:flex-row gap-8 items-start"
          >
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Users className="w-8 h-8 text-gold" />
              </div>
            </div>
            <div>
              <h3 className="font-display font-semibold text-xl mb-3">Une équipe de praticiens</h3>
              <p className="text-white/50 leading-relaxed mb-4">
                Chez LesCracks, personne n'enseigne ce qu'il ne pratique pas. Chaque formateur et
                coach est un professionnel actif de la tech — développeur, designer, data scientist —
                qui partage son expérience réelle, pas seulement des slides.
              </p>
              <p className="text-white/35 text-sm">
                Tu veux rejoindre l'équipe ou proposer ta contribution ?{' '}
                <a href="mailto:contact@lescracks.com" className="text-gold hover:underline">
                  Écris-nous
                </a>
              </p>
            </div>
          </motion.div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <motion.div
            {...fadeUp}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/20 p-10 sm:p-14 text-center"
          >
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gold/8 rounded-full blur-3xl" />
            </div>
            <h2 className="relative text-3xl sm:text-4xl font-display font-bold mb-4">
              Prêt à rejoindre l'aventure ?
            </h2>
            <p className="relative text-white/50 text-lg mb-8 max-w-xl mx-auto">
              Que tu veuilles apprendre, contribuer ou collaborer — il y a une place pour toi chez LesCracks.
            </p>
            <div className="relative flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/postuler" className="btn-primary inline-flex items-center gap-2">
                Postuler maintenant
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/evenements" className="btn-secondary inline-flex items-center gap-2">
                Voir les événements
                <Calendar className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </section>

      </div>
    </Layout>
  );
};

export default About;
