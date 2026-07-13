// src/pages/NotFound.tsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Compass } from 'lucide-react';
import SEO from '@/components/common/SEO';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <SEO title="Page introuvable" description="Cette page n'existe pas ou a été déplacée." url="/404" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.1)_0%,_transparent_50%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-line flex items-center justify-center mx-auto mb-6">
          <Compass className="w-7 h-7 text-gold" />
        </div>

        <p className="text-gold font-display text-5xl font-bold mb-3">404</p>
        <h1 className="text-2xl font-display font-bold text-white mb-3">Page introuvable</h1>
        <p className="text-t3 text-sm leading-relaxed mb-8">
          La page que tu cherches n'existe pas ou a été déplacée.
          Vérifie l'adresse ou reviens à l'accueil.
        </p>

        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gold text-black font-semibold hover:bg-gold/90 transition-colors rounded-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
