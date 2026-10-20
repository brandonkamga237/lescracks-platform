import { AdminState } from '@/components/admin/AdminTable';
import { BarList, Panel } from '@/components/admin/viz';
import { useApi } from '@/hooks/useApi';
import { GOAL_LABEL, PROVIDER_LABEL, SITUATION_LABEL } from '@/lib/memberProfile';
import { countryName } from '@/lib/phone';
import { adminApi } from '@/services/adminApi';
import type { MemberPortrait as Portrait } from '@/services/types';

const label = (labels: Record<string, string>) => (name: string) => labels[name] ?? name;

const DIMENSIONS: { key: keyof Omit<Portrait, 'members'>; title: string; format?: (name: string) => string }[] = [
  { key: 'situations', title: 'Situation', format: label(SITUATION_LABEL) },
  { key: 'goals', title: 'Objectif', format: label(GOAL_LABEL) },
  { key: 'interests', title: 'Centres d’intérêt' },
  { key: 'countries', title: 'Pays', format: countryName },
  { key: 'providers', title: 'Connexion', format: label(PROVIDER_LABEL) },
];

/** Who the members are, from the welcome questions and their profile: what to write and which workshops to run. */
export default function MemberPortrait() {
  const portrait = useApi((signal) => adminApi.memberPortrait(signal), []);
  const data = portrait.data;
  const answered = data ? DIMENSIONS.some(({ key }) => data[key].length > 0) : false;

  return (
    <Panel title="Qui sont tes membres" subtitle="D’après leurs réponses aux questions de bienvenue et leur profil.">
      <AdminState loading={portrait.loading} error={portrait.error} empty={!answered}
        emptyMessage="Les membres n’ont pas encore répondu aux questions de bienvenue." onRetry={portrait.reload}>
        {data && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {DIMENSIONS.filter(({ key }) => data[key].length > 0).map(({ key, title, format }) => {
              const told = data[key].reduce((sum, item) => sum + item.count, 0);
              return (
                <section key={key} aria-label={title}>
                  <div className="mb-3 flex items-baseline justify-between gap-3">
                    <h3 className="font-sans text-sm font-semibold tracking-normal text-t1">{title}</h3>
                    {/* Interests add up past the member count: one member picks several. */}
                    {key !== 'interests' && <span className="shrink-0 text-xs tabular-nums text-t4">{told.toLocaleString('fr-FR')} / {data.members.toLocaleString('fr-FR')}</span>}
                  </div>
                  <BarList items={data[key].slice(0, 6)} format={format} />
                </section>
              );
            })}
          </div>
        )}
      </AdminState>
    </Panel>
  );
}
