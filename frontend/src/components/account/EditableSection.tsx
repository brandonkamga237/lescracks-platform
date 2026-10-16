import { useState, type FormEvent, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';


interface EditableSectionProps {
  id: string;
  title: string;
  description?: string;
  /** What the section shows when it is not being edited. */
  view: ReactNode;
  /** The fields, shown in place of the view while editing. */
  children: ReactNode;
  /** Saves the section; the message of an error it throws is shown to the member. */
  onSave: () => Promise<void>;
  /** Puts the fields back to the saved values. */
  onCancel: () => void;
}

/**
 * One part of the profile, edited on its own: change a city without scrolling through twelve
 * fields, and see right there that it was saved.
 */
export default function EditableSection({ id, title, description, view, children, onSave, onCancel }: EditableSectionProps) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave();
      setEditing(false);
      setSaved(true);
    } catch (cause) {
      // A TypeError is fetch failing to reach the server; any other error carries a message for the member.
      setError(cause instanceof Error && !(cause instanceof TypeError) ? cause.message : 'L’enregistrement a échoué. Réessaie dans un instant.');
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    onCancel();
    setError('');
    setEditing(false);
  }

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 rounded-lg border border-line-soft bg-card p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id={`${id}-title`} className="font-display text-lg font-bold text-t1">{title}</h2>
          {description && <p className="mt-1 text-sm text-t4">{description}</p>}
        </div>
        {!editing && (
          <button type="button" onClick={() => { setEditing(true); setSaved(false); }}
            className="min-h-10 shrink-0 px-2 text-sm font-medium text-gold-ink underline-offset-4 hover:underline">
            Modifier
          </button>
        )}
      </div>
      {saved && !editing && <p role="status" className="mt-4 text-sm text-gold-ink">Enregistré.</p>}
      {editing ? (
        <form onSubmit={submit} className="mt-5" aria-busy={busy}>
          <fieldset disabled={busy} className="space-y-5">
            <legend className="sr-only">{title}</legend>
            {children}
            {error && <p role="alert" className="rounded border border-error/25 bg-error/5 p-3 text-sm text-error-ink">{error}</p>}
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="btn-primary">
                {busy && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />}
                {busy ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button type="button" onClick={cancel} className="btn-secondary">Annuler</button>
            </div>
          </fieldset>
        </form>
      ) : <div className="mt-4">{view}</div>}
    </section>
  );
}
