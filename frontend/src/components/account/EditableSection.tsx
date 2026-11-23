import { useState, type FormEvent, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/field';

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
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="text-xl font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-1 text-sm text-white/45">{description}</p>}
        </div>
        {!editing && (
          <Button type="button" size="sm" variant="outline" onClick={() => { setEditing(true); setSaved(false); }} className="shrink-0">Modifier</Button>
        )}
      </div>
      {saved && !editing && <p role="status" className="mt-4 text-sm text-gold-400">Enregistré.</p>}
      {editing ? (
        <form onSubmit={submit} className="mt-5" aria-busy={busy}>
          <fieldset disabled={busy} className="space-y-5">
            <legend className="sr-only">{title}</legend>
            {children}
            {error && <Notice tone="error">{error}</Notice>}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" className="font-semibold">
                {busy && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />}
                {busy ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
              <Button type="button" variant="outline" onClick={cancel}>Annuler</Button>
            </div>
          </fieldset>
        </form>
      ) : <div className="mt-4">{view}</div>}
    </section>
  );
}
