import { useId } from 'react';
import { cn } from '@/lib/utils';

interface FieldProps {
  label: string;
  /** Marks the control required and appends the marker to the label. */
  required?: boolean;
  /** Shown under the control until an error replaces it. */
  hint?: string;
  error?: string;
  className?: string;
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => React.ReactNode;
}

/**
 * Wraps a control with its label, hint and error, and wires the aria plumbing between them.
 * Sixty-three inputs were doing this by hand, none of them the same way and most of them
 * without the aria at all.
 */
const Field = ({ label, required, hint, error, className, children }: FieldProps) => {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-data font-medium text-t2">
        {label}
        {required && <span className="text-gold ml-0.5" aria-hidden="true">*</span>}
      </label>
      {children({
        id,
        'aria-describedby': message ? messageId : undefined,
        'aria-invalid': error ? true : undefined,
      })}
      {message && (
        <p id={messageId} className={cn('text-label normal-case tracking-normal', error ? 'text-error' : 'text-t4')}>
          {message}
        </p>
      )}
    </div>
  );
};

/** The control styles, shared by input, select and textarea so all three match. */
export const controlClass =
  'w-full bg-surface-1 text-t1 border border-line rounded-lg px-3 py-cell-y text-data ' +
  'placeholder:text-t4 transition-colors duration-150 ' +
  'focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent ' +
  'disabled:opacity-50 disabled:cursor-not-allowed ' +
  'aria-[invalid=true]:border-error aria-[invalid=true]:focus:ring-error';

export default Field;
