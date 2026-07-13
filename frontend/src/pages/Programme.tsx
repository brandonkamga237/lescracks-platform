// src/pages/Programme.tsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '@/components/common/SEO';
import Layout from '@/components/layout/Layout';
import {
  ArrowRight, CheckCircle, ChevronRight, Compass, Users,
  Clock, Award, Briefcase, Code, MessageCircle, Target,
  Star, Zap, Heart,
} from 'lucide-react';

const WHATSAPP_URL = 'https://wa.me/237691788026';

const SL = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] text-gold uppercase tracking-[0.4em] mb-4">{children}</p>
);

const FOR_WHO = [
  {
    icon: Target,
    title: 'Étudiants en informatique',
    desc: 'Tu suis des cours théoriques mais tu ne sais pas encore travailler sur de vrais projets. Tu veux dépasser le cadre académique.',
  },
  {
    icon: Code,
    title: 'Autodidactes',
    desc: 'Tu apprends seul depuis des mois mais tu tourne en rond. Tu cherches une direction claire et un cadre structuré.',
  },
  {
    icon: Briefcase,
    title: 'Personnes en reconversion',
    desc: 'Tu veux changer de carrière pour la tech. Tu as besoin d\'un guide pour partir du bon pied sans perdre de temps.',
  },
  {
    icon: Zap,
    title: 'Développeurs bloqués',
    desc: 'Tu codes déjà mais tu stagnes. Tu veux monter en niveau, te spécialiser et te rendre enfin visible sur le marché.',
  },
];

const WHAT_YOU_GET = [
  { title: 'Bilan de profil approfondi', desc: 'On analyse ta situation actuelle, tes forces, tes lacunes et tes objectifs pour construire le bon plan.' },
  { title: 'Plan de progression personnalisé', desc: 'Une feuille de route claire, adaptée à ton profil et ton rythme — pas un programme générique.' },
  { title: 'Mentor dédié', desc: 'Un professionnel en activité qui te suit tout au long du parcours — sessions régulières, feedback direct.' },
  { title: 'Projets réels', desc: 'Tu travailles sur des projets concrets que tu pourras montrer à des recruteurs. Rien de théorique.' },
  { title: 'Accès aux ressources', desc: 'Accès complet à la bibliothèque de ressources et à la communauté LesCracks.' },
  { title: 'Préparation à l\'insertion', desc: 'CV, portfolio, entretiens, stratégie de recherche d\'emploi ou de freelance — on t\'accompagne jusqu\'au bout.' },
  { title: 'Attestation de complétion', desc: 'Un certificat reconnu par la communauté tech locale et les partenaires LesCracks.' },
  { title: 'Réseau LesCracks', desc: 'Tu rejoins une communauté d\'anciens et d\'actuels membres — entraide, opportunités, projets communs.' },
];

const STEPS = [
  {
    num: '01',
    title: 'Candidature',
    desc: 'Tu remplis le formulaire de candidature. Notre équipe étudie ton profil et te répond sous 48h.',
    duration: '48h',
  },
  {
    num: '02',
    title: 'Bilan initial',
    desc: 'Un échange de 45 minutes avec un de nos coachs pour comprendre ta situation, tes objectifs et définir ta trajectoire.',
    duration: '45 min',
  },
  {
    num: '03',
    title: 'Plan personnalisé',
    desc: 'On construit ensemble une feuille de route adaptée à ton profil, ton niveau et ton rythme de travail.',
    duration: '1 semaine',
  },
  {
    num: '04',
    title: 'Accompagnement actif',
    desc: 'Sessions régulières avec ton mentor, accès aux ressources, projets pratiques, retours détaillés sur ton travail.',
    duration: '6 à 12 mois',
  },
  {
    num: '05',
    title: 'Mise en situation',
    desc: 'Préparation à la recherche d\'emploi, au freelance ou au lancement d\'un projet. On ne s\'arrête pas avant que tu sois lancé.',
    duration: 'Jusqu\'au résultat',
  },
];

const RESULTS = [
  { icon: Briefcase, label: 'Premier poste tech décroché' },
  { icon: Star,      label: 'Première mission freelance' },
  { icon: Code,      label: 'Projet personnel lancé' },
  { icon: Award,     label: 'Portfolio solide et visible' },
];

const FAQ_ITEMS = [
  {
    q: 'Faut-il déjà savoir coder pour postuler ?',
    a: 'Non. L\'Accompagnement 360 s\'adresse aussi aux débutants complets. Le bilan initial nous permet de te placer au bon niveau et de construire un plan adapté à ta situation réelle.',
  },
  {
    q: 'Combien de temps faut-il y consacrer par semaine ?',
    a: 'En moyenne 10 à 15 heures par semaine selon ton rythme et tes objectifs. Le programme est flexible — il s\'adapte à toi, pas l\'inverse.',
  },
  {
    q: 'Quel est le coût du programme ?',
    a: 'Le tarif est défini lors de la prise de contact, en fonction de ton profil et de la durée du programme. Contacte-nous sur WhatsApp pour un devis personnalisé.',
  },
  {
    q: 'Le programme est-il en présentiel ou en ligne ?',
    a: 'Entièrement en ligne, ce qui le rend accessible depuis n\'importe quel pays. Les sessions se font par visioconférence.',
  },
  {
    q: 'Quelle est la différence entre le programme et un simple cours en ligne ?',
    a: 'Un cours en ligne te donne du contenu. LesCracks te donne un mentor, un plan, des projets réels, un suivi continu et un réseau. La différence, c\'est l\'accompagnement humain.',
  },
];

const Programme = () => {
  return (
    <Layout>
      <SEO
        title="Le programme Accompagnement 360 — LesCracks"
        description="Tout savoir sur l'Accompagnement 360 de LesCracks : pour qui, comment ça marche, ce que tu obtiens, durée, processus. L'accélérateur de carrière tech en Afrique francophone."
        url="/programme"
      />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/4 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">

          {/* Breadcrumb */}
          <div className="flex items-center justify-center gap-2 text-sm text-t4 mb-10">
            <Link to="/" className="hover:text-gold transition-colors">Accueil</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-t2">Le programme</span>
          </div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <SL>Accompagnement 360</SL>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
              De débutant à{' '}
              <span className="relative inline-block text-gold">
                profil employable
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 480 10" preserveAspectRatio="none">
                  <path d="M0 7 Q240 12 480 7" stroke="#D4AF37" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="text-lg text-t3 max-w-2xl mx-auto mb-10 leading-relaxed">
              Un suivi humain et structuré de <strong className="text-white">6 à 12 mois</strong> avec un mentor dédié,
              des projets concrets et un réseau. Pas une formation — un accompagnement qui va jusqu'au résultat.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/postuler"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gold text-black font-bold text-base hover:bg-gold-light transition-colors"
              >
                Postuler maintenant
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-line-strong text-t2 hover:text-white hover:border-line-strong transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Poser une question sur WhatsApp
              </a>
            </div>
            <p className="text-t4 text-xs mt-4">Réponse sous 48h · Sans engagement · Entretien gratuit</p>
          </motion.div>
        </div>
      </section>

      {/* ── POUR QUI ──────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12 text-center">
            <SL>Public cible</SL>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
              Ce programme est fait <span className="text-gold">pour toi si...</span>
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FOR_WHO.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}
                  className="p-6 rounded-2xl border border-line-soft hover:border-gold/20 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-gold" />
                  </div>
                  <h3 className="font-semibold text-white mb-2 text-sm">{item.title}</h3>
                  <p className="text-xs text-t3 leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CE QUE TU OBTIENS ─────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
            <SL>Le programme</SL>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
              Ce que tu <span className="text-gold">obtiens</span>
            </h2>
            <p className="text-t3 mt-3 max-w-xl text-sm leading-relaxed">
              L'Accompagnement 360 n'est pas un cours. C'est un pack complet qui combine cinq leviers indissociables.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-4">
            {WHAT_YOU_GET.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}
                className="flex gap-4 p-5 rounded-xl border border-line-soft hover:border-gold/15 transition-colors"
              >
                <CheckCircle className="w-5 h-5 text-gold/70 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white text-sm mb-1">{item.title}</p>
                  <p className="text-xs text-t3 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RÉSULTATS ATTENDUS ────────────────────────────────────── */}
      <section className="py-12 px-4 border-y border-line-soft">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {RESULTS.map((r, i) => {
              const Icon = r.icon;
              return (
                <motion.div
                  key={r.label}
                  initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}
                  className="flex flex-col items-center text-center gap-3"
                >
                  <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gold" />
                  </div>
                  <p className="text-sm text-t2 leading-tight">{r.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PROCESSUS ────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
            <SL>Comment ça fonctionne</SL>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
              Les <span className="text-gold">5 étapes</span> du programme
            </h2>
          </motion.div>
          <div className="relative">
            <div className="absolute left-[22px] top-8 bottom-8 w-px bg-gradient-to-b from-gold/40 via-gold/15 to-transparent hidden md:block" />
            <div className="space-y-4">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}
                  className="flex gap-6"
                >
                  <div className="hidden md:flex w-11 h-11 rounded-full bg-background border border-line items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-gold text-xs font-bold">{step.num}</span>
                  </div>
                  <div className="flex-1 p-5 rounded-xl border border-line-soft hover:border-gold/15 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gold md:hidden">{step.num}</span>
                        <h3 className="font-semibold text-white">{step.title}</h3>
                      </div>
                      <span className="text-[11px] text-gold/50 bg-gold/8 border border-gold/15 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                        {step.duration}
                      </span>
                    </div>
                    <p className="text-sm text-t3 leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DURÉE ET MODALITÉS ───────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12 text-center">
            <SL>Modalités</SL>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
              Comment <span className="text-gold">ça se passe</span>
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: Clock,   title: '6 à 12 mois',     desc: 'Durée selon ton niveau de départ et tes objectifs. Le programme s\'adapte à toi.' },
              { icon: Users,   title: '100% en ligne',   desc: 'Sessions par visioconférence. Accessible depuis n\'importe quel pays d\'Afrique francophone.' },
              { icon: Heart,   title: 'Tarif personnalisé', desc: 'Le coût est défini avec toi selon ta situation. Contacte-nous sur WhatsApp pour en discuter.' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}
                  className="p-6 rounded-2xl border border-line-soft text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-5 h-5 text-gold" />
                  </div>
                  <h3 className="font-display font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-t3 leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
            <SL>Questions fréquentes</SL>
            <h2 className="text-3xl font-display font-bold text-white">
              Tu as des <span className="text-gold">questions ?</span>
            </h2>
          </motion.div>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}
                className="p-5 rounded-xl border border-line-soft"
              >
                <p className="font-semibold text-white text-sm mb-2">{item.q}</p>
                <p className="text-sm text-t3 leading-relaxed">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────── */}
      <section className="py-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-6">
            <Compass className="w-7 h-7 text-gold" />
          </div>
          <SL>Passer à l'action</SL>
          <h2 className="text-4xl font-display font-bold text-white mb-4">
            Prêt à changer de <span className="text-gold">trajectoire</span> ?
          </h2>
          <p className="text-t3 mb-8 text-sm leading-relaxed">
            Postule maintenant. Notre équipe étudie ton profil et te répond sous 48h. Sans engagement immédiat.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/postuler"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-gold text-black font-bold text-base hover:bg-gold-light transition-colors"
            >
              Postuler maintenant
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 border border-line text-t3 hover:text-white hover:border-line-strong transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Contacter sur WhatsApp
            </a>
          </div>
        </motion.div>
      </section>
    </Layout>
  );
};

export default Programme;
