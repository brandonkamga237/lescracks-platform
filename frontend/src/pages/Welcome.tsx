import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

import PhoneField from '@/components/account/PhoneField';
import LesCracksLogo from '@/components/common/LesCracksLogo';
import SEO from '@/components/common/SEO';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { signupContext } from '@/lib/arrival';
import { GOAL_LABEL, SITUATION_LABEL } from '@/lib/memberProfile';
import { api } from '@/services/api';
import { safeReturnPath } from '@/services/auth';
import { ApiError } from '@/services/http';
import type { MemberGoal, MemberSituation } from '@/services/types';

const STEPS = ['Téléphone', 'Situation', 'Centres d’intérêt', 'Objectif'] as const;

interface ChoiceProps<T extends string> {
  options: Record<T, string>;
  value?: T;
  onChange: (value: T) => void;
  label: string;
}

function Choice<T extends string>({ options, value, onChange, label }: ChoiceProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2 sm:grid-cols-2">
      {(Object.entries(options) as [T, string][]).map(([key, text]) => (
        <button key={key} type="button" role="radio" aria-checked={value === key} onClick={() => onChange(key)}
          className={`flex min-h-12 items-center justify-between gap-3 rounded border px-4 py-3 text-left text-sm transition-colors duration-150 ${
            value === key ? 'border-gold-400 bg-gold-400/10 text-t1' : 'border-line text-t2 hover:border-line-strong hover:text-t1'}`}>
          {text}
          {value === key && <Check className="h-4 w-4 shrink-0 text-gold-ink" aria-hidden />}
        </button>
      ))}
    </div>
  );
}

/**
 * Shown once after sign-up, whatever the sign-in method (Google and GitHub give no phone).
 * Four short questions, each skippable; « Plus tard » keeps what was filled and goes on.
 */
export default function Welcome() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, reload } = useSession();
  const categories = useApi((signal) => api.categories(signal), []);
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState<string | null>(user?.phone ?? '');
  const [consent, setConsent] = useState(user?.marketingConsent ?? false);
  const [situation, setSituation] = useState<MemberSituation | undefined>(user?.situation);
  const [interests, setInterests] = useState<number[]>(user?.interestIds ?? []);
  const [goal, setGoal] = useState<MemberGoal | undefined>(user?.goal);
  const [city, setCity] = useState(user?.location ?? '');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const returnTo = safeReturnPath(params.get('retour'), '/ressources');
  const last = step === STEPS.length - 1;

  async function finish() {
    setBusy(true);
    setFailure('');
    try {
      await api.onboard({
        phone: phone || undefined,
        marketingConsent: consent,
        situation,
        goal,
        interestIds: interests.length ? interests : undefined,
        location: city.trim() || undefined,
        context: signupContext(),
      });
      await reload();
      navigate(returnTo, { replace: true });
    } catch (error) {
      setFailure(error instanceof ApiError ? error.message : 'L’enregistrement a échoué. Réessaie.');
      if (error instanceof ApiError && error.message.toLowerCase().includes('téléphone')) setStep(0);
    } finally {
      setBusy(false);
    }
  }

  function next() {
    if (step === 0 && phone === null) {
      setFailure('Ce numéro ne correspond pas au pays choisi. Corrige-le ou passe cette étape.');
      return;
    }
    setFailure('');
    if (last) void finish();
    else setStep(step + 1);
  }

  function skip() {
    if (step === 0) setPhone('');
    setFailure('');
    if (last) void finish();
    else setStep(step + 1);
  }

  const firstName = user?.firstName?.trim();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-black text-t1">
      <SEO title="Bienvenue" description="Finalise ton compte LesCracks." url="/bienvenue" />
      <header className="mx-auto flex w-full max-w-xl items-center justify-between px-5 pt-6 sm:px-0">
        <LesCracksLogo height={28} className="w-auto" />
        <button type="button" disabled={busy} onClick={() => void finish()} className="min-h-11 px-2 text-sm text-t3 underline-offset-4 hover:text-t1 hover:underline">Plus tard</button>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-10 pt-10 sm:px-0 sm:pt-16">
        <ol aria-label="Étapes" className="grid grid-cols-4 gap-1.5">
          {STEPS.map((label, index) => (
            <li key={label} aria-current={index === step ? 'step' : undefined} className={`h-1 rounded-full ${index <= step ? 'bg-gold-400' : 'bg-noir-700'}`}>
              <span className="sr-only">{label}{index < step ? ' : faite' : ''}</span>
            </li>
          ))}
        </ol>
        <p className="mt-6 font-mono text-xs text-t4">{step + 1} / {STEPS.length}</p>

        <section className="mt-3 flex-1" aria-live="polite">
          {step === 0 && (
            <>
              <h1 className="text-balance font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{firstName ? `Bienvenue ${firstName}.` : 'Bienvenue.'} Ton numéro ?</h1>
              <p className="mt-3 text-t3">Pour te prévenir des ateliers, des lives et des nouveaux challenges. Il n’est jamais affiché publiquement.</p>
              <div className="mt-8 space-y-4">
                <PhoneField value={phone ?? ''} onChange={setPhone} autoFocus hint="Le pays de ton compte est déduit de l’indicatif." />
                <label className="flex items-start gap-3 text-sm text-t3">
                  <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#d4af37]" />
                  <span>Je veux recevoir les nouveautés par WhatsApp ou SMS. Je peux arrêter à tout moment.</span>
                </label>
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Où en es-tu ?</h1>
              <p className="mt-3 text-t3">Pour te proposer des ressources adaptées à ce que tu vis en ce moment.</p>
              <div className="mt-8"><Choice label="Ta situation" options={SITUATION_LABEL} value={situation} onChange={setSituation} /></div>
            </>
          )}
          {step === 2 && (
            <>
              <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Qu’est-ce qui t’intéresse ?</h1>
              <p className="mt-3 text-t3">Choisis autant de sujets que tu veux : la bibliothèque et les challenges s’en servent pour te guider.</p>
              <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Centres d’intérêt">
                {categories.loading && <p role="status" className="text-sm text-t4">Chargement des sujets…</p>}
                {categories.data?.map((category) => {
                  const on = interests.includes(category.id);
                  return (
                    <button key={category.id} type="button" aria-pressed={on} disabled={!on && interests.length >= 10}
                      onClick={() => setInterests((list) => (on ? list.filter((id) => id !== category.id) : [...list, category.id]))}
                      className={`min-h-10 rounded border px-3.5 text-sm transition-colors duration-150 disabled:opacity-40 ${on ? 'border-gold-400 bg-gold-400/10 text-t1' : 'border-line text-t2 hover:border-line-strong hover:text-t1'}`}>
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Ton objectif, et ta ville ?</h1>
              <p className="mt-3 text-t3">Pour savoir quels ateliers organiser, et où.</p>
              <div className="mt-8 space-y-6">
                <Choice label="Ton objectif" options={GOAL_LABEL} value={goal} onChange={setGoal} />
                <div>
                  <label htmlFor="welcome-city" className="text-sm font-medium text-t1">Ville</label>
                  <input id="welcome-city" value={city} onChange={(event) => setCity(event.target.value)} maxLength={100} autoComplete="address-level2"
                    placeholder="Douala, Abidjan, Dakar…" className="input mt-2 text-base" />
                </div>
              </div>
            </>
          )}
          {failure && <p role="alert" className="mt-6 rounded border border-error/30 bg-error/10 p-3 text-sm text-t1">{failure}</p>}
        </section>

        <div className="mt-10 flex items-center gap-2">
          {step > 0 && <button type="button" disabled={busy} onClick={() => setStep(step - 1)} className="btn-secondary px-3" aria-label="Étape précédente"><ArrowLeft className="h-4 w-4" aria-hidden /></button>}
          <button type="button" disabled={busy} onClick={skip} className="min-h-11 px-3 text-sm text-t3 hover:text-t1">Passer</button>
          <button type="button" disabled={busy} onClick={next} className="btn-primary ml-auto">
            {busy ? 'Enregistrement…' : last ? 'C’est parti' : 'Continuer'}<ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </main>
    </div>
  );
}
