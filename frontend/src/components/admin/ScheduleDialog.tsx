import { useEffect, useState } from 'react';

import ScheduleField from '@/components/admin/ScheduleField';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { scheduleIsValid } from '@/lib/schedule';

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The date already set, if the content is scheduled. */
  current?: string | null;
  busy: boolean;
  /** What is being scheduled, for the sentence: "cet article", "ce challenge". */
  subject: string;
  onConfirm: (scheduledAt: string) => void;
  onUnschedule: () => void;
}

export default function ScheduleDialog({ open, onOpenChange, current, busy, subject, onConfirm, onUnschedule }: ScheduleDialogProps) {
  const [value, setValue] = useState<string | null>(current ?? null);

  useEffect(() => {
    if (open) setValue(current ?? null);
  }, [open, current]);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
      <DialogContent className="mode-raised border-line bg-card sm:max-w-xl">
        <DialogTitle className="font-display text-2xl font-bold text-t1">Programmer la publication</DialogTitle>
        <DialogDescription className="text-sm leading-relaxed text-t3">
          Le contenu est enregistré maintenant et mis en ligne automatiquement à la date choisie, avec la même annonce qu’une publication manuelle. Tu peux changer la date ou annuler jusque-là pour {subject}.
        </DialogDescription>
        <ScheduleField value={value} onChange={setValue} />
        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {current && <button type="button" disabled={busy} onClick={onUnschedule} className="btn-secondary whitespace-nowrap sm:mr-auto">Annuler la programmation</button>}
          <button type="button" disabled={busy} onClick={() => onOpenChange(false)} className="btn-secondary">Fermer</button>
          <button type="button" disabled={busy || !scheduleIsValid(value)} onClick={() => value && onConfirm(value)} className="btn-primary">
            {busy ? 'Enregistrement…' : current ? 'Changer la date' : 'Programmer'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
