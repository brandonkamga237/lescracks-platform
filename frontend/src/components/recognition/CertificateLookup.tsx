import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/** A field that opens the public page of a certificate from its code. */
export default function CertificateLookup({ id = 'certificate-code' }: { id?: string }) {
  const navigate = useNavigate();
  const [code, setCode] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = code.trim().toUpperCase();
    if (value) navigate(`/attestations/${encodeURIComponent(value)}`);
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.03] p-1.5 transition-colors focus-within:border-gold-400/60">
      <label htmlFor={id} className="sr-only">Code de l’attestation</label>
      {/* 16px text: anything smaller makes iOS zoom the page on focus. */}
      <input
        id={id}
        type="text"
        required
        spellCheck={false}
        autoComplete="off"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        placeholder="LC-2026-4F7Q"
        className="min-w-0 flex-1 bg-transparent px-3 font-mono text-base uppercase tracking-[0.12em] text-white placeholder:text-white/30 focus:outline-none sm:text-sm"
      />
      <button type="submit" aria-label="Vérifier l’attestation" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.08] text-white transition-colors hover:bg-gold-400 hover:text-black">
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}
