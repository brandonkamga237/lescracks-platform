import { useState } from 'react';
import { Loader2, Mail } from 'lucide-react';

import { adminApi } from '@/services/adminApi';
import { ApiError } from '@/services/http';

const MAX_LENGTH = 2000;

interface WriteToRegistrantsProps {
  eventId: number;
  /** Registrations not cancelled; suspended accounts are skipped by the server, so it is an upper bound. */
  activeCount: number;
}

export default function WriteToRegistrants({ eventId, activeCount }: WriteToRegistrantsProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  const [failure, setFailure] = useState('');

  const text = message.trim();
  const people = `${activeCount} inscrit${activeCount > 1 ? 's' : ''}`;

  async function send() {
    setSending(true);
    setFailure('');
    try {
      const { sent } = await adminApi.writeToRegistrants(eventId, text);
      setNotice(`Message envoyé à ${sent} inscrit${sent > 1 ? 's' : ''}.`);
      setMessage('');
      setOpen(false);
    } catch (cause) {
      setFailure(cause instanceof ApiError ? cause.message : 'L’envoi a échoué. Réessaie.');
    } finally {
      setSending(false);
      setConfirming(false);
    }
  }

  if (!open) {
    return (
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button type="button" disabled={!activeCount} onClick={() => { setOpen(true); setNotice(''); }}
          className="btn-secondary inline-flex items-center gap-2">
          <Mail className="h-4 w-4" aria-hidden />Écrire aux inscrits
        </button>
        {notice && <p role="status" className="text-sm text-emerald-400">{notice}</p>}
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-lg border border-line-soft bg-card p-5">
      <label htmlFor="registrant-message" className="text-sm font-semibold text-t1">Message aux inscrits</label>
      <p className="mt-1 text-xs leading-relaxed text-t3">
        Chaque inscrit le reçoit par email, avec son prénom, le titre et le lien de l’événement, et la date de clôture.
      </p>
      <textarea id="registrant-message" value={message} maxLength={MAX_LENGTH} rows={7}
        onChange={(event) => { setMessage(event.target.value); setConfirming(false); }}
        placeholder="Une ligne vide sépare deux paragraphes."
        className="mt-3 w-full rounded-lg border border-line bg-noir-900 p-3 text-sm text-t1 focus:border-gold-400 focus:outline-none" />
      <p className="mt-1 text-right text-xs tabular-nums text-t4">{message.length} / {MAX_LENGTH}</p>
      {failure && <p role="alert" className="mt-2 text-sm text-error-ink">{failure}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {confirming ? (
          <>
            <span className="text-sm text-t2">Envoyer ce message à {people} ?</span>
            <button type="button" disabled={sending} onClick={() => void send()} className="btn-primary inline-flex items-center gap-2">
              {sending && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />}Confirmer l’envoi
            </button>
            <button type="button" disabled={sending} onClick={() => setConfirming(false)} className="btn-secondary">Modifier</button>
          </>
        ) : (
          <>
            <button type="button" disabled={!text} onClick={() => setConfirming(true)} className="btn-primary">Envoyer à {people}</button>
            <button type="button" onClick={() => { setOpen(false); setFailure(''); }} className="btn-secondary">Annuler</button>
          </>
        )}
      </div>
    </div>
  );
}
