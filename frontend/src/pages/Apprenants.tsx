// src/pages/Apprenants.tsx
import { useState, useEffect } from 'react';
import { Users, Award, BookOpen, Search } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import LearnerCard from '@/components/LearnerCard';
import apiService, { Learner, LearnerStatus } from '@/services/api';

const FILTERS: { label: string; value: LearnerStatus | '' }[] = [
  { label: 'Tous', value: '' },
  { label: 'En cours', value: 'EN_COURS' },
  { label: 'Certifiés', value: 'TERMINE_AVEC_CERTIFICAT' },
  { label: 'Diplômés', value: 'TERMINE_SANS_CERTIFICAT' },
];

export default function Apprenants() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<LearnerStatus | ''>('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiService.getLearners().then(data => {
      setLearners(data);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = learners.filter(l => {
    const matchStatus = !activeFilter || l.status === activeFilter;
    const matchSearch = !search ||
      l.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (l.bio || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.cohort || '').includes(search);
    return matchStatus && matchSearch;
  });

  const stats = {
    total: learners.length,
    certified: learners.filter(l => l.status === 'TERMINE_AVEC_CERTIFICAT').length,
    inProgress: learners.filter(l => l.status === 'EN_COURS').length,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 bg-gradient-to-b from-black to-background">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 text-gold text-xs px-3 py-1.5 rounded-full mb-6">
            <Users className="w-3.5 h-3.5" />
            Notre communauté
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Les Cracks de la tech
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Découvrez les apprenants qui ont rejoint l'aventure LesCracks — en cours de parcours, diplômés ou certifiés.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-10">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-white/40 mt-1">Apprenants</p>
            </div>
            <div className="w-px bg-white/10 hidden sm:block" />
            <div className="text-center">
              <p className="text-3xl font-bold text-gold">{stats.certified}</p>
              <p className="text-sm text-white/40 mt-1 flex items-center gap-1 justify-center">
                <Award className="w-3.5 h-3.5" /> Certifiés
              </p>
            </div>
            <div className="w-px bg-white/10 hidden sm:block" />
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-400">{stats.inProgress}</p>
              <p className="text-sm text-white/40 mt-1 flex items-center gap-1 justify-center">
                <BookOpen className="w-3.5 h-3.5" /> En cours
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters + Search */}
      <section className="max-w-6xl mx-auto px-4 pb-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === f.value
                    ? 'bg-gold text-black'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                {f.label}
                <span className="ml-1.5 text-xs opacity-70">
                  {f.value === '' ? learners.length : learners.filter(l => l.status === f.value).length}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20"
            />
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun apprenant trouvé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(l => (
              <LearnerCard key={l.id} learner={l} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
