import { Code2, Send, Trophy, UserPlus } from 'lucide-react';

import type { EventSummary } from '@/services/types';

interface HackathonStepsProps {
  event: EventSummary;
}

const dayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

/**
 * What a hackathon asks of a participant, in four steps read before the long description:
 * many visitors did not understand that they had an application to build.
 */
export default function HackathonSteps({ event }: HackathonStepsProps) {
  const closes = event.submissionsCloseAt ? new Date(event.submissionsCloseAt) : null;
  const team = event.maxTeamSize > 1 ? `Seul ou en équipe jusqu’à ${event.maxTeamSize}, ` : 'En solo, ';
  const steps = [
    { icon: UserPlus, title: 'Inscris-toi', text: 'Un clic sur « Je participe », avec ton compte LesCracks.' },
    { icon: Code2, title: 'Développe l’application', text: `${team}avec les outils de ton choix, en suivant le sujet ci-dessous.` },
    { icon: Send, title: 'Soumets ton projet', text: closes && !Number.isNaN(closes.getTime())
      ? `Le lien de ton dépôt Git, sur cette page, avant le ${dayFormat.format(closes)}.`
      : 'Le lien de ton dépôt Git, directement sur cette page.' },
    { icon: Trophy, title: 'Jury et attestations', text: 'Les projets sont évalués et classés. Chaque participant reçoit une attestation, le podium un badge.' },
  ];

  return (
    <section aria-labelledby="hackathon-principle" className="mt-8 rounded-lg border border-gold-400/30 bg-gold-400/5 p-5 sm:p-6">
      <h2 id="hackathon-principle" className="font-display text-xl font-bold text-t1 sm:text-2xl">Le principe : tu développes une application</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-t2 sm:text-base">
        Un hackathon LesCracks est un défi de code : à partir d’un sujet, tu construis une vraie application, tu la rends sur la plateforme, puis un jury l’évalue.
      </p>
      <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <li key={title} className="flex gap-3">
            <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-400 text-sm font-bold text-black">{index + 1}</span>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-t1"><Icon className="h-4 w-4 text-gold-ink" aria-hidden />{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-t3">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
