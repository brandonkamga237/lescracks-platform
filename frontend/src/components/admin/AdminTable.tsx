import { useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { ApiError } from '@/services/http';
import type { EventStatus, ResourceStatus } from '@/services/types';

interface AdminSectionProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

/** One heading, one optional action, so every back-office screen opens the same way. */
export function AdminSection({ title, description, action, children }: AdminSectionProps) {
  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-t1 sm:text-4xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-t4">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

interface AdminStateProps {
  loading: boolean;
  error: ApiError | null;
  empty: boolean;
  emptyMessage: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

/**
 * The three states every list has, rendered once.
 *
 * An error shows the sentence the backend wrote rather than a generic one: it already knows
 * what it refused, and rewording it here is how the two drift apart.
 */
export function AdminState({
  loading,
  error,
  empty,
  emptyMessage,
  onRetry,
  children,
}: AdminStateProps) {
  if (loading) return <p role="status" className="rounded-2xl border border-line-soft bg-card px-6 py-16 text-center text-t3">Chargement…</p>;

  if (error) {
    return (
      <div role="alert" className="rounded-2xl border border-line-soft bg-card px-6 py-12 text-center">
        <p className="text-t2">{error.message}</p>
        {error.reference && (
          <p className="mt-2 font-mono text-xs text-t4">Référence {error.reference}</p>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 text-sm text-gold-400 underline underline-offset-4"
          >
            Réessayer
          </button>
        )}
      </div>
    );
  }

  if (empty) return <p role="status" className="rounded-2xl border border-dashed border-line bg-card px-6 py-16 text-center text-t3">{emptyMessage}</p>;

  return <>{children}</>;
}

/** A row of the flat lists the back office is made of. */
interface AdminRowProps { children: React.ReactNode }

export function AdminRow({ children }: AdminRowProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-4 rounded-2xl border border-line-soft bg-card p-5 transition-colors hover:border-line">
      {children}
    </div>
  );
}

interface StatusBadgeProps { status: ResourceStatus | EventStatus; resource?: boolean }

export function StatusBadge({ status, resource = false }: StatusBadgeProps) {
  const labels = { DRAFT: 'Brouillon', PUBLISHED: resource ? 'Publiée' : 'Publié', ARCHIVED: 'Archivée', CANCELLED: 'Annulé', COMPLETED: 'Terminé' };
  return <span className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${status === 'PUBLISHED' ? 'border-gold-400/30 bg-gold-400/10 text-gold-400' : 'border-line-soft bg-noir-800 text-t3'}`}>{labels[status]}</span>;
}

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  busy?: boolean;
  wide?: boolean;
  children: React.ReactNode;
}

export function AdminModal({ open, onClose, title, description, busy = false, wide = false, children }: AdminModalProps) {
  const previousFocus = useRef<HTMLElement | null>(null);
  return <Dialog.Root open={open} onOpenChange={(next) => { if (!next && !busy) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
      <Dialog.Content
        onOpenAutoFocus={() => { previousFocus.current = document.activeElement as HTMLElement; }}
        onCloseAutoFocus={(event) => { event.preventDefault(); if (previousFocus.current?.isConnected) previousFocus.current.focus(); else document.getElementById('admin-content')?.focus(); }}
        onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }}
        onPointerDownOutside={(event) => event.preventDefault()}
        className={`fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-line bg-card p-6 text-t1 shadow-2xl sm:p-8 ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
      >
        <Dialog.Title className="pr-10 font-display text-2xl font-semibold">{title}</Dialog.Title>
        <Dialog.Description className="mb-6 mt-2 text-sm leading-relaxed text-t3">{description}</Dialog.Description>
        {children}
        <Dialog.Close disabled={busy} aria-label="Fermer" className="absolute right-4 top-4 rounded-full p-2 text-t3 hover:bg-noir-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400 disabled:opacity-40"><X className="h-5 w-5" aria-hidden /></Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

interface AdminConfirmProps {
  open: boolean;
  title: string;
  description: string;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  label?: string;
}

export function AdminConfirm({ open, title, description, busy, error, onCancel, onConfirm, label = 'Supprimer définitivement' }: AdminConfirmProps) {
  return <AdminModal open={open} onClose={onCancel} title={title} description={description} busy={busy}>
    {error && <p role="alert" className="mb-5 rounded-2xl border border-gold-400/40 bg-gold-400/10 p-4 text-sm text-t1">{error}</p>}
    <div className="flex flex-wrap justify-end gap-3">
      <button type="button" disabled={busy} onClick={onCancel} className="rounded-full border border-line px-5 py-3 text-sm text-t2 disabled:opacity-50">Garder cet élément</button>
      <button type="button" disabled={busy} onClick={onConfirm} className="rounded-full bg-gold-400 px-5 py-3 text-sm font-semibold text-black disabled:opacity-50">{busy ? 'En cours…' : label}</button>
    </div>
  </AdminModal>;
}

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  busy: boolean;
  onChange: (page: number) => void;
}

export function AdminPagination({ page, totalPages, totalElements, busy, onChange }: AdminPaginationProps) {
  return <nav aria-label="Pagination" className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line-soft pt-5 text-sm text-t3">
    <p aria-live="polite">{totalElements.toLocaleString('fr-FR')} résultat{totalElements !== 1 ? 's' : ''} · Page {totalPages ? page + 1 : 0} sur {totalPages}</p>
    <div className="flex gap-2">
      <button type="button" disabled={busy || page === 0} onClick={() => onChange(page - 1)} className="flex items-center gap-1 rounded-full border border-line px-4 py-2 text-t2 hover:bg-card disabled:opacity-40"><ChevronLeft className="h-4 w-4" aria-hidden />Précédent</button>
      <button type="button" disabled={busy || page + 1 >= totalPages} onClick={() => onChange(page + 1)} className="flex items-center gap-1 rounded-full border border-line px-4 py-2 text-t2 hover:bg-card disabled:opacity-40">Suivant<ChevronRight className="h-4 w-4" aria-hidden /></button>
    </div>
  </nav>;
}
