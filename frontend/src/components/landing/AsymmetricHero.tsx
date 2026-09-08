import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function AsymmetricHero() {
  const { isDark } = useTheme();

  return (
    <section
      className="relative flex min-h-[92vh] items-center justify-center overflow-hidden"
      style={{
        backgroundImage: 'url(/images/hero.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className={`absolute inset-0 ${isDark ? 'bg-black/70' : 'bg-black/50'}`} />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 max-w-4xl px-5 text-center sm:px-8"
      >
        <p className="mb-4 text-sm font-medium tracking-wide text-gold">
          Excellence en formation tech
        </p>

        <h1 className="font-display text-5xl font-semibold leading-[1.1] tracking-tight text-t1 sm:text-6xl md:text-7xl">
          Devenez un <span className="text-gold">crack</span> de la Tech
        </h1>

        <p className={`mx-auto mt-6 max-w-xl text-lg leading-relaxed ${isDark ? 'text-t3' : 'text-t1'}`}>
          Deviens aussi un crack de la tech. Des ressources et rencontres pensées pour faire décoller ton parcours.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/inscription" className="btn-primary text-base">
            Rejoindre LesCracks
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link to="/ressources" className="btn-secondary text-base">
            Explorer le catalogue
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
