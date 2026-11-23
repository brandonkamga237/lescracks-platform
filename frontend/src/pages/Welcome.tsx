import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

import PhoneField from '@/components/account/PhoneField';
import LesCracksLogo from '@/components/common/LesCracksLogo';
import SEO from '@/components/common/SEO';
import { Button } from '@/components/ui/button';
import { Notice, fieldClass } from '@/components/ui/field';
import { useApi } from '@/hooks/useApi';
import { useSession } from '@/hooks/useSession';
import { signupContext } from '@/lib/arrival';
import { GOAL_LABEL, SITUATION_LABEL } from '@/lib/memberProfile';
import { cn } from '@/lib/utils';
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
          className={cn('flex min-h-12 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-colors duration-150',
            value === key ? 'border-gold-400 bg-gold-400/10 text-white' : 'border-white/12 text-white/70 hover:border-white/35 hover:text-white')}>
          {text}
          {value === key && <Check className="h-4 w-4 shrink-0 text-gold-400" aria-hidden />}
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
  const returnTo = safeReturnPath(params.get('retour'), '/');
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
    <div className="relative isolate flex min-h-[100dvh] flex-col overflow-hidden bg-black font-geist text-white antialiased">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh] bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(212,175,55,0.10),transparent_70%)]" />
      <SEO title="Bienvenue" description="Finalise ton compte LesCracks." url="/bienvenue" />
      <header className="mx-auto flex w-full max-w-xl items-center justify-between px-5 pt-6 sm:px-0">
        <LesCracksLogo height={34} className="w-auto" />
        <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => void finish()}>Plus tard</Button>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-10 pt-10 sm:px-0 sm:pt-16">
        <ol aria-label="Étapes" className="grid grid-cols-4 gap-1.5">
          {STEPS.map((label, index) => (
            <li key={label} aria-current={index === step ? 'step' : undefined} className={`h-1 rounded-full ${index <= step ? 'bg-gold-400' : 'bg-white/10'}`}>
              <span className="sr-only">{label}{index < step ? ' : faite' : ''}</span>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm tabular-nums text-gold-400">{step + 1} / {STEPS.length}</p>

        <section className="mt-3 flex-1" aria-live="polite">
          {step === 0 && (
            <>
              <h1 className="text-balance text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.04em]">{firstName ? `Bienvenue ${firstName}.` : 'Bienvenue.'} Ton numéro ?</h1>
              <p className="mt-3 text-white/55">Pour te prévenir des ateliers, des lives et des nouveaux articles. Il n’est jamais affiché publiquement.</p>
              <div className="mt-8 space-y-4">
                <PhoneField value={phone ?? ''} onChange={setPhone} autoFocus hint="Le pays de ton compte est déduit de l’indicatif." />
                <label className="flex items-start gap-3 text-sm text-white/55">
                  <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#d4af37]" />
                  <span>Je veux recevoir les nouveautés par WhatsApp ou SMS. Je peux arrêter à tout moment.</span>
                </label>
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <h1 className="text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.04em]">Où en es-tu ?</h1>
              <p className="mt-3 text-white/55">Pour te proposer des contenus adaptés à ce que tu vis en ce moment.</p>
              <div className="mt-8"><Choice label="Ta situation" options={SITUATION_LABEL} value={situation} onChange={setSituation} /></div>
            </>
          )}
          {step === 2 && (
            <>
              <h1 className="text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.04em]">Qu’est-ce qui t’intéresse ?</h1>
              <p className="mt-3 text-white/55">Choisis les thèmes qui t’intéressent : le blog s’en sert pour te guider.</p>
              <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Centres d’intérêt">
                {categories.loading && <p role="status" className="text-sm text-white/45">Chargement des sujets…</p>}
                {categories.data?.map((category) => {
                  const on = interests.includes(category.id);
                  return (
                    <button key={category.id} type="button" aria-pressed={on} disabled={!on && interests.length >= 10}
                      onClick={() => setInterests((list) => (on ? list.filter((id) => id !== category.id) : [...list, category.id]))}
                      className={cn('min-h-10 rounded-full border px-4 text-sm transition-colors duration-150 disabled:opacity-40', on ? 'border-gold-400 bg-gold-400 font-medium text-black' : 'border-white/12 text-white/70 hover:border-white/35 hover:text-white')}>
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h1 className="text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.04em]">Ton objectif, et ta ville ?</h1>
              <p className="mt-3 text-white/55">Pour savoir quels ateliers organiser, et où.</p>
              <div className="mt-8 space-y-6">
                <Choice label="Ton objectif" options={GOAL_LABEL} value={goal} onChange={setGoal} />
                <div>
                  <label htmlFor="welcome-city" className="text-sm font-medium text-white/80">Ville</label>
                  <input id="welcome-city" value={city} onChange={(event) => setCity(event.target.value)} maxLength={100} autoComplete="address-level2"
                    placeholder="Douala, Abidjan, Dakar…" className={cn(fieldClass, 'text-base')} />
                </div>
              </div>
            </>
          )}
          {failure && <Notice tone="error" className="mt-6">{failure}</Notice>}
        </section>

        <div className="mt-10 flex items-center gap-2">
          {step > 0 && <Button type="button" variant="outline" disabled={busy} onClick={() => setStep(step - 1)} className="w-11 px-0" aria-label="Étape précédente"><ArrowLeft className="h-4 w-4" aria-hidden /></Button>}
          <Button type="button" variant="ghost" disabled={busy} onClick={skip}>Passer</Button>
          <Button type="button" size="lg" disabled={busy} onClick={next} className="ml-auto font-semibold">
            {busy ? 'Enregistrement…' : last ? 'C’est parti' : 'Continuer'}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </Button>
        </div>
      </main>
    </div>
  );
}
