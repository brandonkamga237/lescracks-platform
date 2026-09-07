import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import SEO from '@/components/common/SEO';
import Layout from '@/components/layout/Layout';

/**
 * The story behind the platform: why it exists, how it works, who it is for.
 */
export default function About() {
  return (
    <Layout>
      <SEO title="À propos" description="LesCracks, c’est une école en ligne tech pensée pour celles et ceux qui apprennent mieux en construisant, avec une communauté francophone." url="/a-propos" />

      <section className="border-b border-line-soft">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-gold-400">Notre histoire</p>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-t1 sm:text-5xl lg:text-6xl">
              Une école en ligne qui récompense ceux qui font.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-t3 sm:text-xl">
              LesCracks naît d’un constat : trop de plateformes vendent des cours sans jamais faire passer à la pratique. Nous rassemblons des ressources concrètes — vidéos, ebooks, ateliers — autour d’une communauté qui apprend en public et construit en commun.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:py-24">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-line">
            <img src="/images/photo-brandon.jpeg" alt="Brandon, fondateur de LesCracks" className="h-full w-full object-cover" loading="lazy" />
          </div>
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-line sm:mt-12">
            <img src="/images/about.jpg" alt="Des apprenants LesCracks en session de travail" className="h-full w-full object-cover" loading="lazy" />
          </div>
        </div>

        <div className="lg:pl-10">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-t1 sm:text-4xl">
            Apprendre, puis passer à l’action.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-t3">
            Le métier de la tech ne s’apprend pas dans une bibliothèque. Il s’apprend en réalisant des projets, en demandant de l’aide, en montrant son travail. Sur LesCracks, chaque ressource est pensée comme un tremplin vers un exercice, un rendez-vous ou une discussion avec la communauté.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="border-l-2 border-gold-400 pl-5">
              <p className="text-sm font-medium text-gold-400">01</p>
              <h3 className="mt-2 font-display text-lg font-semibold text-t1">Des ressources concrètes</h3>
              <p className="mt-2 text-sm leading-relaxed text-t3">Pas de théorie creuse. Des vidéos et des ebooks directement utilisables sur un vrai projet.</p>
            </div>
            <div className="border-l-2 border-gold-400 pl-5">
              <p className="text-sm font-medium text-gold-400">02</p>
              <h3 className="mt-2 font-display text-lg font-semibold text-t1">Des ateliers et des bootcamps</h3>
              <p className="mt-2 text-sm leading-relaxed text-t3">Des rendez-vous pour poser ses questions, pratiquer en groupe et avancer plus vite.</p>
            </div>
            <div className="border-l-2 border-gold-400 pl-5">
              <p className="text-sm font-medium text-gold-400">03</p>
              <h3 className="mt-2 font-display text-lg font-semibold text-t1">Une communauté francophone</h3>
              <p className="mt-2 text-sm leading-relaxed text-t3">Apprendre seul, c’est difficile. Avancer avec des personnes qui partagent le même objectif, c’est plus simple.</p>
            </div>
            <div className="border-l-2 border-gold-400 pl-5">
              <p className="text-sm font-medium text-gold-400">04</p>
              <h3 className="mt-2 font-display text-lg font-semibold text-t1">Accessible dès le début</h3>
              <p className="mt-2 text-sm leading-relaxed text-t3">La bibliothèque est ouverte sans compte. Tu crées un compte quand tu veux aller plus loin.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line-soft bg-noir-900/40">
        <div className="mx-auto max-w-7xl px-5 py-14 text-center sm:px-8 sm:py-20">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-t1 sm:text-4xl">
            Prêt à monter en compétence ?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-t3">
            Parcours les ressources publiques, inscris-toi à un prochain événement et rejoins la communauté pour ne plus apprendre seul.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/ressources" className="btn-primary gap-2">Explorer la bibliothèque<ArrowRight className="h-4 w-4" aria-hidden /></Link>
            <Link to="/evenements" className="text-sm font-medium text-t2 underline-offset-4 hover:text-gold-300 hover:underline">Voir les événements</Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
