// src/components/common/PasswordInput.tsx
import { useId, useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  /** Rendered under the field — e.g. the complexity rules. */
  hint?: string;
  /** Optional element on the right of the label, e.g. a "forgot password?" link. */
  labelAction?: React.ReactNode;
}

/**
 * Password field with a show/hide toggle.
 *
 * Typing a password blind is the single easiest way to fail a login you would
 * otherwise pass — especially on mobile keyboards, and especially with the
 * complexity rules this app enforces (upper, lower, digit, symbol).
 *
 * The toggle is a real <button type="button"> so it is reachable by keyboard and
 * cannot accidentally submit the surrounding form.
 */
const PasswordInput = ({
  value,
  onChange,
  name = 'password',
  label = 'Mot de passe',
  placeholder = '••••••••',
  required,
  minLength,
  autoComplete = 'current-password',
  hint,
  labelAction,
}: PasswordInputProps) => {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={id} className="block text-sm text-t2">
          {label}
        </label>
        {labelAction}
      </div>

      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-t4" aria-hidden="true" />

        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className="input pl-10 pr-11"
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
        />

        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          // The label must describe the ACTION, not the state, or screen-reader
          // users are told what they already have rather than what they'd get.
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-t4 hover:text-t1 hover:bg-white/5 transition-colors"
        >
          {visible ? <EyeOff className="w-4.5 h-4.5 w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
        </button>
      </div>

      {hint && <p className="text-t4 text-xs mt-1.5">{hint}</p>}
    </div>
  );
};

export default PasswordInput;
