import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Award, TrendingUp, Search, ArrowRight, MessageCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import LearnerCard from '@/components/LearnerCard';
import SEO from '@/components/common/SEO';
import apiService, { Learner, LearnerStatus } from '@/services/api';

const WHATSAPP_URL = 'https://wa.me/237691788026';

const FILTERS: { label: string; value: LearnerStatus | '' }[] = [
  { label: 'Tous', value: '' },
  { label: 'En parcours', value: 'EN_COURS' },
  { label: 'Certifiés', value: 'TERMINE_AVEC_CERTIFICAT' },
  { label: 'Diplômés', value: 'TERMINE_SANS_CERTIFICAT' },
];

export default function Apprenants() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<LearnerStatus | ''>('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiService.getLearners().then(setLearners).finally(() => setLoading(false));
  }, []);

  const showcased = learners.filter(l => l.showcased && l.visible);

  const filtered = learners.filter(l => {
    if (!l.visible) return false;
    const matchStatus = !activeFilter || l.status === activeFilter;
    const matchSearch = !search ||
      l.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (l.bio || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.cohort || '').includes(search);
    return matchStatus && matchSearch;
  });

  const certifiedCount = learners.filter(l => l.status === 'TERMINE_AVEC_CERTIFICAT').length;
  const inProgressCount = learners.filter(l => l.status === 'EN_COURS').length;

  return (
    <Layout>
      <SEO
        title="Success Stories — Alumni LesCracks · Accélérateur tech Afrique"
        description="Ils ont transformé leur carrière grâce à l'Accompagnement 360 LesCracks. Découvrez les témoignages des alumni — certifiés, en poste, entrepreneurs tech en Afrique francophone."
        url="/apprenants"
      />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="pt-28 pb-16 px-4 bg-gradient-to-b from-black to-background">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 text-gold text-xs px-3 py-1.5 rounded-full mb-6"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Success Stories
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl md:text-5xl font-display font-bold text-white mb-4 leading-tight"
          >
            Ils ont transformé{' '}
            <span className="text-gold">leur carrière</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-t2 max-w-2xl mx-auto leading-relaxed"
          >
            Ces passionnés ont choisi l'Accompagnement 360 LesCracks pour changer de trajectoire.
            Leurs parcours prouvent que la tech est accessible depuis l'Afrique francophone.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap justify-center gap-10 mt-12"
          >
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{learners.length}</p>
              <p className="text-sm text-t3 mt-1 flex items-center gap-1 justify-center">
                <Users className="w-3.5 h-3.5" /> Apprenants
              </p>
            </div>
            <div className="w-px bg-white/10 hidden sm:block self-stretch" />
            <div className="text-center">
              <p className="text-3xl font-bold text-gold">{certifiedCount}</p>
              <p className="text-sm text-t3 mt-1 flex items-center gap-1 justify-center">
                <Award className="w-3.5 h-3.5" /> Certifiés
              </p>
            </div>
            <div className="w-px bg-white/10 hidden sm:block self-stretch" />
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{inProgressCount}</p>
              <p className="text-sm text-t3 mt-1">En parcours</p>
            </div>
            <div className="w-px bg-white/10 hidden sm:block self-stretch" />
            <div className="text-center">
              <p className="text-3xl font-bold text-white">3</p>
              <p className="text-sm text-t3 mt-1">Pays · Afrique</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Spotlight (showcased learners) ───────────────────────── */}
      {!loading && showcased.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-white/6" />
            <p className="text-xs font-semibold text-t4 uppercase tracking-widest">
              Témoignages à la une
            </p>
            <div className="h-px flex-1 bg-white/6" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {showcased.map((l, i) => (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
              >
                <LearnerCard learner={l} featured />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── Filters + Search ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-4">
        {showcased.length > 0 && (
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-white/6" />
            <p className="text-xs font-semibold text-t4 uppercase tracking-widest">
              Toute la communauté
            </p>
            <div className="h-px flex-1 bg-white/6" />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === f.value
                    ? 'bg-gold text-black'
                    : 'bg-white/5 text-t2 hover:bg-white/10 border border-line'
                }`}
              >
                {f.label}
                <span className="ml-1.5 text-xs opacity-60">
                  {f.value === ''
                    ? learners.filter(l => l.visible).length
                    : learners.filter(l => l.status === f.value && l.visible).length}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-t4" />
            <input
              type="text"
              placeholder="Nom, bio, cohorte…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-line rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder:text-t4 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20"
            />
          </div>
        </div>
      </section>

      {/* ── Grid ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-44 bg-white/4 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-t4">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun apprenant trouvé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((l, i) => (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
              >
                <LearnerCard learner={l} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── CTA final ────────────────────────────────────────────── */}
      {!loading && learners.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="bg-white/4 border border-line rounded-3xl p-10">
            <p className="text-xs font-semibold text-gold/70 uppercase tracking-widest mb-4">
              Ta prochaine étape
            </p>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">
              Prêt à écrire ta propre story ?
            </h2>
            <p className="text-t3 text-sm leading-relaxed mb-8 max-w-md mx-auto">
              Rejoins les prochains cracks. Commence par une conversation sur WhatsApp — sans engagement, sans formulaire.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#1ebe5c] transition-colors text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Discuter sur WhatsApp
              </a>
              <a
                href="/postuler"
                className="inline-flex items-center justify-center gap-2 bg-gold text-black font-semibold px-6 py-3 rounded-xl hover:bg-gold/80 transition-colors text-sm"
              >
                Postuler maintenant
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}
