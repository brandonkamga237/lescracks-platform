// src/pages/Evenements.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService, Event } from '@/services/api';
import Layout from '@/components/layout/Layout';
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  Loader2,
  Search,
  Flame,
  Clock,
} from 'lucide-react';

const getCapacityInfo = (current: number, max: number) => {
  const pct = current / max;
  if (pct >= 0.9) return { label: 'Presque complet', color: 'text-red-400 bg-red-400/10', urgent: true };
  if (pct >= 0.7) return { label: `${max - current} places restantes`, color: 'text-orange-400 bg-orange-400/10', urgent: true };
  return { label: `${current}/${max} places`, color: 'text-white/40 bg-white/5', urgent: false };
};

const getDaysUntil = (dateStr: string) => {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff <= 0) return null;
  if (diff === 1) return 'Demain';
  if (diff <= 7) return `Dans ${diff} jours`;
  return null;
};

const Evenements = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const data = await apiService.getEvents();
        setEvents(data);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || event.type === selectedType;
    return matchesSearch && matchesType;
  });

  const eventTypes = ['BOOTCAMP', 'HACKATHON', 'MEETUP', 'WORKSHOP', 'FORMATION'];

  return (
    <Layout>
      <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Nos <span className="text-gold">Evenements</span>
            </h1>
            <p className="text-white/60 max-w-2xl">
              Rejoignez nos bootcamps, hackathons et meetups pour accelerer votre transformation professionnelle.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
              <input
                type="text"
                placeholder="Rechercher un evenement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
              <button
                onClick={() => setSelectedType('')}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  !selectedType 
                    ? 'bg-gold text-black' 
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                Tous
              </button>
              {eventTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    selectedType === type 
                      ? 'bg-gold text-black' 
                      : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card card-hover overflow-hidden"
                >
                  {/* Image */}
                  <div className="h-48 bg-gradient-to-br from-gold/20 to-transparent rounded-lg mb-4 flex items-center justify-center">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Trophy className="w-16 h-16 text-gold/30" />
                    )}
                  </div>

                  {/* Type & Status */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-gold/20 text-gold">
                      {event.type}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      event.status === 'OUVERT'
                        ? 'bg-green-500/20 text-green-400'
                        : event.status === 'EN_COURS'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {event.status === 'OUVERT' ? 'Ouvert' :
                       event.status === 'EN_COURS' ? 'En cours' : 'Fermé'}
                    </span>
                    {/* Countdown badge */}
                    {event.status === 'OUVERT' && getDaysUntil(event.startDate) && (
                      <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gold/10 text-gold">
                        <Clock className="w-3 h-3" />
                        {getDaysUntil(event.startDate)}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold mb-2">{event.title}</h3>

                  {/* Description */}
                  <p className="text-white/60 text-sm mb-4 line-clamp-2">
                    {event.description}
                  </p>

                  {/* Meta */}
                  <div className="space-y-2 text-white/40 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.startDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                    )}
                    {event.maxParticipants && (() => {
                      const current = event.currentParticipants || 0;
                      const cap = getCapacityInfo(current, event.maxParticipants);
                      return (
                        <div className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-medium w-fit ${cap.color}`}>
                          {cap.urgent ? <Flame className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                          {cap.label}
                        </div>
                      );
                    })()}
                  </div>

                  {/* CTA */}
                  <Link
                    to={`/evenements/${event.id}`}
                    className="block w-full btn-secondary text-center"
                  >
                    Voir les details
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center py-24"
            >
              <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                <Trophy className="w-12 h-12 text-white/20" />
              </div>
              <h3 className="text-lg font-semibold text-white/60 mb-2">Aucun evenement trouve</h3>
              <p className="text-white/30 text-sm max-w-xs mb-6">
                Essayez un autre filtre ou revenez bientôt — de nouveaux événements sont ajoutés régulièrement.
              </p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedType(''); }}
                className="px-5 py-2.5 rounded-lg bg-gold/10 text-gold text-sm font-medium hover:bg-gold/20 transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Evenements;
