import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import SEO from '@/components/common/SEO';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';

export default function NotFound() {
  return (
    <Container className="flex min-h-[50vh] flex-col justify-center py-16">
      <SEO title="Page introuvable" description="Cette page n’existe pas ou a été déplacée." url="/404" />
      <p className="text-sm font-medium text-gold-400">Erreur 404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Cette page n’existe pas.</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55">Elle a peut-être été déplacée ou retirée. Le blog et l’agenda, eux, restent à portée de clic.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild className="font-semibold"><Link to="/blog">Lire le blog<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link></Button>
        <Button asChild variant="outline"><Link to="/rendez-vous">Voir l’agenda</Link></Button>
      </div>
    </Container>
  );
}
