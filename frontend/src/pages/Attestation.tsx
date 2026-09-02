import { useParams } from 'react-router-dom';
import { BadgeCheck, ShieldAlert } from 'lucide-react';

import Layout from '@/components/layout/Layout';
import { useApi } from '@/hooks/useApi';
import { api } from '@/services/api';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

/**
 * Verifying a code.
 *
 * Read by a recruiter who has no account, wants none, and needs one thing: whether this is
 * real. So the answer comes first and large, and there is nothing on the page that asks
 * them to do anything else.
 */
export default function Attestation() {
  const { code = '' } = useParams();
  const check = useApi((signal) => api.attestation(code, signal), [code]);

  return (
    <Layout>
      <div className="mx-auto max-w-xl px-6 py-20 sm:py-28">
        {check.loading && <p className="text-center text-t4">Vérification…</p>}

        {check.error && (
          <div className="text-center">
            <ShieldAlert className="mx-auto h-10 w-10 text-t4" aria-hidden />
            <h1 className="mt-6 font-display text-2xl font-semibold text-t1">
              Aucune attestation ne porte ce code
            </h1>
            <p className="mt-3 text-t3">
              Vérifiez la saisie. Un code ressemble à <span className="font-mono">LC-2026-AB12CD</span>.
            </p>
            <p className="mt-8 font-mono text-sm text-t4">{code}</p>
          </div>
        )}

        {check.data && (
          <article className="text-center">
            <BadgeCheck className="mx-auto h-10 w-10 text-gold-400" aria-hidden />
            <p className="mt-6 text-sm uppercase tracking-widest text-t4">Attestation vérifiée</p>

            <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-t1 sm:text-4xl">
              {check.data.holderName}
            </h1>
            <p className="mt-4 text-lg text-t2">a suivi {check.data.programme}</p>

            <dl className="mx-auto mt-12 grid max-w-sm grid-cols-2 gap-x-8 gap-y-6 border-t border-line-soft pt-8 text-left">
              <div>
                <dt className="text-xs uppercase tracking-wider text-t4">Terminé le</dt>
                <dd className="mt-1 text-t2">
                  {dateFormat.format(new Date(check.data.completedAt))}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-t4">Délivrée le</dt>
                <dd className="mt-1 text-t2">
                  {dateFormat.format(new Date(check.data.issuedAt))}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs uppercase tracking-wider text-t4">Code</dt>
                <dd className="mt-1 font-mono text-t2">{check.data.code}</dd>
              </div>
            </dl>

            <p className="mt-12 text-sm leading-relaxed text-t4">
              Cette page est la vérification officielle. Elle ne présente que ce qui est
              nécessaire pour attester du parcours&nbsp;: aucune donnée de contact n’y figure.
            </p>
          </article>
        )}
      </div>
    </Layout>
  );
}
