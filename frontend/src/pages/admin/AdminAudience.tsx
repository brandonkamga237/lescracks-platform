import { useState } from 'react';
import { Globe2 } from 'lucide-react';

import { AdminSection, AdminState } from '@/components/admin/AdminTable';
import ConversionsPanel from '@/components/admin/ConversionsPanel';
import { BarList, Kpi, Panel, PeriodSelect, SERIES_MUTED, TrendChart, fmt, fmtDuration } from '@/components/admin/viz';
import { compareWith } from '@/lib/comparison';
import { useApi } from '@/hooks/useApi';
import { countryName } from '@/lib/phone';
import { adminApi } from '@/services/adminApi';

const formatSource = (name: string) =>
  name === '(direct)' ? 'Accès direct' : name.replace(/^https?:\/\//, '').replace(/^www\./, '');

export default function AdminAudience() {
  const [days, setDays] = useState(30);
  const audience = useApi((signal) => adminApi.audience(days, signal), [days]);
  const data = audience.data;
  const before = `les ${days} jours d’avant`;

  return (
    <AdminSection
      title="Audience"
      description="Qui visite LesCracks, d’où viennent-ils, ce qu’ils regardent, et ce qui les fait s’inscrire."
      action={<PeriodSelect value={days} onChange={setDays} />}
    >
      <AdminState loading={audience.loading} error={audience.error}
        empty={!data} emptyMessage="Les statistiques d’audience ne sont pas disponibles.">
        {data && !data.available && (
          <div className="rounded-lg border border-line-soft bg-card px-6 py-16 text-center">
            <Globe2 className="mx-auto h-8 w-8 text-t4" aria-hidden />
            <h2 className="mt-4 font-display text-lg font-semibold text-t1">L’audience n’est pas encore mesurée</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-t3">
              La mesure de fréquentation vient d’être activée — les chiffres remonteront au fil des prochaines visites.
            </p>
          </div>
        )}

        {data?.available && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <Kpi label="Visiteurs" value={fmt(data.visitors)}
                comparison={compareWith(data.visitors, data.previousVisitors, before)}
                hint="personnes distinctes" />
              <Kpi label="Visites" value={fmt(data.visits)}
                comparison={compareWith(data.visits, data.previousVisits, before)}
                hint="sessions sur la période" />
              <Kpi label="Pages vues" value={fmt(data.pageviews)}
                comparison={compareWith(data.pageviews, data.previousPageviews, before)}
                hint="pages consultées au total" />
              <Kpi label="Durée d’une visite" value={fmtDuration(data.avgVisitSeconds)}
                hint={data.bounceRate != null ? `${data.bounceRate.toLocaleString('fr-FR')} % repartent après une page` : undefined} />
            </div>

            <Panel className="mt-6" title="Fréquentation" subtitle="Visites et pages vues, jour par jour.">
              <TrendChart
                className="h-44 sm:h-72"
                data={data.series.map((p) => ({ date: p.date, visits: p.visits, pageviews: p.pageviews }))}
                series={[
                  { key: 'pageviews', name: 'Pages vues', color: SERIES_MUTED, dashed: true },
                  { key: 'visits', name: 'Visites' },
                ]}
              />
            </Panel>

            <Panel className="mt-6" title="Ce qu’ils font" subtitle="Les actions comptées sur le site pendant la période.">
              {data.events?.length ? (
                <BarList items={data.events} />
              ) : (
                <p className="py-8 text-center text-sm text-t3">Les actions (inscription, newsletter, WhatsApp, articles lus jusqu’au bout) apparaîtront ici dès les premiers clics.</p>
              )}
            </Panel>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <Panel title="D’où viennent-ils" subtitle="Sites qui envoient des visiteurs">
                {data.sources.length ? (
                  <BarList items={data.sources} format={formatSource} />
                ) : (
                  <p className="py-8 text-center text-sm text-t3">Presque tout le trafic arrive en direct pour l’instant.</p>
                )}
              </Panel>
              <Panel title="Ce qu’ils regardent" subtitle="Pages les plus consultées">
                <BarList items={data.topPages} format={(p) => p === '/' ? 'Accueil' : p} />
              </Panel>
              <Panel title="D’où ils sont" subtitle="Pays des visiteurs">
                {data.countries.length ? (
                  <BarList items={data.countries} format={countryName} />
                ) : (
                  <p className="py-8 text-center text-sm text-t3">Pas encore de répartition par pays.</p>
                )}
              </Panel>
            </div>
          </>
        )}
      </AdminState>
      <ConversionsPanel days={days} />
    </AdminSection>
  );
}
