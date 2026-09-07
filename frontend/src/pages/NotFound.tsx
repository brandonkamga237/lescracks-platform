// src/pages/NotFound.tsx
import { Link } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';
import SEO from '@/components/common/SEO';
import Layout from '@/components/layout/Layout';

const NotFound = () => {
  return (
    <Layout showFooter={false} showScrollTop={false}>
      <SEO title="Page introuvable" description="Cette page n’existe pas ou a été déplacée." url="/404" />
      <div className="flex min-h-[calc(100dvh_-_5rem)] items-center justify-center px-5 py-16">
        <div className="w-full max-w-lg rounded-3xl border border-line bg-card p-8 text-center sm:p-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10 text-gold"><Compass className="h-7 w-7" aria-hidden /></div>
          <p className="mb-4 font-mono text-sm text-gold">ERREUR 404</p>
          <h1 className="font-display text-3xl font-medium text-t1">On a perdu le fil.</h1>
          <p className="mt-4 text-sm leading-relaxed text-t3">Cette page n’existe pas ou n’est plus disponible. La bibliothèque, elle, reste à portée de clic.</p>
          <div className="mt-8 flex flex-col gap-3"><Link to="/ressources" className="btn-primary gap-2">Explorer la bibliothèque<ArrowRight className="h-4 w-4" aria-hidden /></Link><Link to="/" className="btn-secondary">Revenir à l’accueil</Link></div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
