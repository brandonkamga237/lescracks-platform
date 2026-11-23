import { useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '@/lib/utils';

export const fieldClass = 'mt-2 block h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-[15px] text-white placeholder:text-white/30 transition-colors focus:border-gold-400/60 focus:outline-none focus:ring-2 focus:ring-gold-400/20 disabled:opacity-60 aria-[invalid=true]:border-error/60';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  /** The backend's sentence for this field; it replaces the help while it stands. */
  error?: string;
  help?: string;
  /** Inside the field, at the right: a toggle, a unit. */
  trailing?: ReactNode;
}

/** A labelled input with its help or error under it, wired for screen readers. */
export function TextField({ id, label, error, help, trailing, className, ...input }: TextFieldProps) {
  const note = error ?? help;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-white/80">{label}</label>
      <div className="relative">
        <input id={id} aria-invalid={Boolean(error)} aria-describedby={note ? `${id}-note` : undefined} className={cn(fieldClass, trailing ? 'pr-14' : undefined, className)} {...input} />
        {trailing && <div className="absolute inset-y-0 right-2 flex items-center">{trailing}</div>}
      </div>
      {note && <p id={`${id}-note`} className={cn('mt-2 text-xs', error ? 'text-error-ink' : 'text-white/45')}>{note}</p>}
    </div>
  );
}

/** A password field whose characters the member can reveal. */
export function PasswordField(props: Omit<TextFieldProps, 'type' | 'trailing'>) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={(
        <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={visible} className="flex h-9 w-9 items-center justify-center rounded-full text-white/40 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400">
          {visible ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
        </button>
      )}
    />
  );
}

interface NoticeProps {
  tone: 'error' | 'info';
  children: ReactNode;
  className?: string;
}

/** A sentence that answers what the member just did: a refusal, or what happens next. */
export function Notice({ tone, children, className }: NoticeProps) {
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={cn('rounded-2xl border px-4 py-3 text-sm leading-relaxed', tone === 'error' ? 'border-error/25 bg-error/5 text-error-ink' : 'border-gold-400/25 bg-gold-400/5 text-gold-400', className)}>
      {children}
    </p>
  );
}
