import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import SEO from '@/components/common/SEO';
import Layout from '@/components/layout/Layout';
import { PageHeader, Section } from '@/components/layout/Page';

const PILLARS = [
  { title: 'Des ressources concrètes', body: 'Pas de théorie creuse. Des vidéos et des ebooks directement utilisables sur un vrai projet.' },
  { title: 'Des ateliers et des bootcamps', body: 'Des rendez-vous pour poser ses questions, pratiquer en groupe et avancer plus vite.' },
  { title: 'Une communauté francophone', body: 'Apprendre seul, c’est difficile. Avancer avec des personnes qui partagent le même objectif, c’est plus simple.' },
  { title: 'Accessible dès le début', body: 'La bibliothèque est ouverte sans compte. Tu crées un compte quand tu veux aller plus loin.' },
] as const;

/**
 * The story behind the platform: why it exists, how it works, who it is for.
 */
export default function About() {
  return (
    <Layout>
      <SEO title="À propos" description="LesCracks, c’est une école en ligne tech pensée pour celles et ceux qui apprennent mieux en construisant, avec une communauté francophone." url="/a-propos" />

      <Section spacing="loose" className="border-b border-line-soft/50">
        <PageHeader
          eyebrow="Notre histoire"
          title="Une école en ligne qui récompense ceux qui font."
          description="LesCracks naît d’un constat : trop de plateformes vendent des cours sans jamais faire passer à la pratique. Nous rassemblons des ressources concrètes — vidéos, ebooks, ateliers — autour d’une communauté qui apprend en public et construit en commun."
        />
      </Section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="aspect-[4/5] overflow-hidden rounded-3xl border border-white/[0.06]">
              <img src="/images/photo-brandon.jpeg" alt="Brandon, fondateur de LesCracks" className="h-full w-full object-cover" loading="lazy" />
            </div>
            <div className="aspect-[3/4] overflow-hidden rounded-3xl border border-white/[0.06] sm:mt-12">
              <img src="/images/about.jpg" alt="Des apprenants LesCracks en session de travail" className="h-full w-full object-cover" loading="lazy" />
            </div>
          </div>

          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-t1 sm:text-4xl">
              Apprendre, puis passer à l’action.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-t3">
              Le métier de la tech ne s’apprend pas dans une bibliothèque. Il s’apprend en réalisant des projets, en demandant de l’aide, en montrant son travail. Sur LesCracks, chaque ressource est pensée comme un tremplin vers un exercice, un rendez-vous ou une discussion avec la communauté.
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {PILLARS.map(({ title, body }, index) => (
                <div key={title} className="border-l-2 border-gold-400 pl-5">
                  <p className="text-sm font-medium text-gold-400">{String(index + 1).padStart(2, '0')}</p>
                  <h3 className="mt-2 font-display text-lg font-semibold text-t1">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-t3">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section muted bordered>
        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-t1 sm:text-4xl">
            Prêt à monter en compétence ?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-t3">
            Parcours les ressources publiques, inscris-toi à un prochain événement et rejoins la communauté pour ne plus apprendre seul.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/ressources" className="btn-primary">Explorer la bibliothèque<ArrowRight className="h-4 w-4" aria-hidden /></Link>
            <Link to="/evenements" className="btn-secondary">Voir les événements</Link>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
