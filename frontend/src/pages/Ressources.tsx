import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import Layout from '@/components/layout/Layout';
import ResourceCard from '@/components/resources/ResourceCard';
import { useApi } from '@/hooks/useApi';
import { EFFORT_BANDS, KIND_LABEL, type EffortBand } from '@/lib/effort';
import { api } from '@/services/api';
import type { ResourceKind } from '@/services/types';

const KINDS: ResourceKind[] = ['VIDEO', 'ARTICLE', 'EBOOK'];

/**
 * The catalogue.
 *
 * Organised by what a resource costs before what it is about: a beginner knows how much of
 * their evening they have long before they know whether they want DevOps. Subject filters
 * are still here — second, where they belong.
 *
 * The time band is applied in the browser rather than in the query: the API has no notion
 * of it, and pushing one there would freeze a product decision into the schema before we
 * know whether people use it.
 */
export default function Ressources() {
  const [params, setParams] = useSearchParams();
  const [band, setBand] = useState<EffortBand | null>(null);

  const kind = (params.get('kind') as ResourceKind | null) ?? undefined;
  const search = params.get('q') ?? '';

  const catalogue = useApi(
    (signal) => api.resources({ kind, search: search || undefined, size: 60 }, signal),
    [kind, search],
  );

  const visible = useMemo(() => {
    const all = catalogue.data?.content ?? [];
    if (!band) return all;
    const definition = EFFORT_BANDS.find((b) => b.id === band);
    return definition ? all.filter(definition.matches) : all;
  }, [catalogue.data, band]);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
        <header className="max-w-2xl">
          <h1 className="font-display text-4xl font-semibold leading-tight text-t1 sm:text-5xl">
            Vous avez combien de temps&nbsp;?
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-t3">
            Tout ce qu’on publie est rangé par ce que ça vous demande, pas par sujet.
            Choisissez le temps que vous avez devant vous.
          </p>
        </header>

        {/* The primary filter, first and largest, because it is the real question. */}
        <div className="mt-10 flex flex-wrap gap-3">
          {EFFORT_BANDS.map((definition) => {
            const active = band === definition.id;
            return (
              <button
                key={definition.id}
                type="button"
                onClick={() => setBand(active ? null : definition.id)}
                aria-pressed={active}
                className={`rounded-full border px-5 py-2.5 text-left transition-colors ${
                  active
                    ? 'border-gold-400 bg-gold-400/10 text-t1'
                    : 'border-line text-t2 hover:border-line-strong hover:text-t1'
                }`}
              >
                <span className="block text-sm font-medium">{definition.label}</span>
                <span className="block text-xs text-t4">{definition.hint}</span>
              </button>
            );
          })}
        </div>

        {/* Subject filters, deliberately quieter. */}
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line-soft pt-6 text-sm">
          <button
            type="button"
            onClick={() => setParam('kind', null)}
            className={!kind ? 'text-t1' : 'text-t4 hover:text-t2'}
          >
            Tous les formats
          </button>
          {KINDS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setParam('kind', kind === option ? null : option)}
              className={kind === option ? 'text-t1' : 'text-t4 hover:text-t2'}
            >
              {KIND_LABEL[option]}
            </button>
          ))}

          <label className="ml-auto flex items-center gap-2">
            <span className="sr-only">Rechercher une ressource</span>
            <input
              type="search"
              defaultValue={search}
              placeholder="Rechercher…"
              onChange={(event) => setParam('q', event.target.value || null)}
              className="w-44 border-b border-line bg-transparent py-1 text-t1 placeholder:text-t4 focus:border-gold-400 focus:outline-none"
            />
          </label>
        </div>

        <section className="mt-4" aria-live="polite">
          {catalogue.loading && <p className="py-16 text-center text-t4">Chargement…</p>}

          {catalogue.error && (
            <div className="py-16 text-center">
              <p className="text-t2">{catalogue.error.message}</p>
              <button
                type="button"
                onClick={catalogue.reload}
                className="mt-4 text-sm text-gold-400 underline underline-offset-4"
              >
                Réessayer
              </button>
            </div>
          )}

          {!catalogue.loading && !catalogue.error && visible.length === 0 && (
            <p className="py-16 text-center text-t3">
              {band
                ? 'Rien dans cette durée pour l’instant. Essayez une autre.'
                : 'Le catalogue est encore vide.'}
            </p>
          )}

          {visible.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </section>
      </div>
    </Layout>
  );
}
