import { Panel } from '@/components/admin/viz';
import type { StatsOverview } from '@/services/adminApi';

interface SignupFunnelProps {
  funnel: StatsOverview['signupFunnel'];
  /** Umami visitors over the same 30 days: the first step once the audience is connected. */
  visitors?: number | null;
  className?: string;
}

interface Step {
  label: string;
  count: number;
}

/**
 * From a visit to a member who comes back, over the last 30 days. Each step shows how many of the
 * previous one made it; the weakest step is named, since that is where the next effort pays most.
 */
export default function SignupFunnel({ funnel, visitors, className = '' }: SignupFunnelProps) {
  const steps: Step[] = [
    ...(visitors ? [{ label: 'Visiteurs', count: visitors }] : []),
    { label: 'Inscrits', count: funnel.signedUp },
    { label: 'Email confirmé', count: funnel.verified },
    { label: 'Bienvenue faite', count: funnel.onboarded },
    { label: 'Revenus après J+1', count: funnel.returned },
  ];
  const top = Math.max(steps[0].count, 1);
  const rate = (index: number) => (steps[index - 1].count ? Math.round((steps[index].count / steps[index - 1].count) * 100) : null);
  const weakest = steps.slice(1).reduce<number | null>((worst, _, i) => {
    const current = rate(i + 1);
    if (current == null) return worst;
    return worst == null || current < (rate(worst) ?? 101) ? i + 1 : worst;
  }, null);

  return (
    <Panel className={className} title="Entonnoir des 30 derniers jours" subtitle="Là où le chiffre chute, c’est là qu’on perd les gens.">
      <ol className="space-y-3.5">
        {steps.map((step, i) => (
          <li key={step.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-t2">{step.label}</span>
              <span className="shrink-0 font-display font-semibold tabular-nums text-t1">{step.count.toLocaleString('fr-FR')}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-noir-800">
              {/* Measured width: the share of the first step this one keeps. */}
              <div className={`h-full rounded-full ${i === weakest ? 'bg-error' : 'bg-gold-400'}`}
                style={{ width: `${Math.max((step.count / top) * 100, step.count ? 2 : 0)}%` }} />
            </div>
            {i > 0 && rate(i) != null && (
              <p className={`mt-1 text-xs tabular-nums ${i === weakest ? 'text-error-ink' : 'text-t4'}`}>
                {rate(i)} % de l’étape précédente{i === weakest && ' · plus forte perte'}
              </p>
            )}
          </li>
        ))}
      </ol>
    </Panel>
  );
}
