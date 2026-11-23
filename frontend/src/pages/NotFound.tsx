import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import SEO from '@/components/common/SEO';
import { SplitText } from '@/components/motion/SplitText';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';

export default function NotFound() {
  return (
    <Container className="flex min-h-[70vh] flex-col justify-center py-20">
      <SEO title="Page introuvable" description="Cette page n’existe pas ou a été déplacée." url="/404" />
      <p className="text-sm font-medium text-gold-400">Erreur 404</p>
      <SplitText as="h1" onMount parts={['On a perdu le fil.', { text: 'Cette page n’existe pas.', className: 'text-white/40 sm:block' }]} className="mt-5 max-w-3xl text-display font-semibold" />
      <p className="mt-6 max-w-xl text-base leading-relaxed text-white/55">Elle a peut-être été déplacée ou retirée. Le blog et l’agenda, eux, restent à portée de clic.</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild size="lg" className="font-semibold"><Link to="/blog">Lire le blog<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link></Button>
        <Button asChild size="lg" variant="outline"><Link to="/rendez-vous">Voir l’agenda</Link></Button>
      </div>
    </Container>
  );
}
