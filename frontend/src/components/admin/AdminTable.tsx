import { useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EmptyState, ErrorState } from '@/components/common/States';
import { PageHeader } from '@/components/layout/Page';
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
      <PageHeader title={title} description={description} actions={action} />
      {children}
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
  if (loading) return <p role="status" className="rounded-lg border border-line-soft bg-card px-6 py-16 text-center text-t3">Chargement…</p>;

  if (error) {
    return (
      <ErrorState
        title={error.message}
        message={error.reference ? `Référence ${error.reference}` : undefined}
        onRetry={onRetry}
      />
    );
  }

  if (empty) return <EmptyState title={emptyMessage} />;

  return <>{children}</>;
}

/** A row of the flat lists the back office is made of. */
interface AdminRowProps { children: React.ReactNode }

export function AdminRow({ children }: AdminRowProps) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border border-line-soft bg-card p-4 transition-[border-color] duration-200 hover:border-line sm:p-5">
      {children}
    </div>
  );
}

interface AdminActionProps {
  icon: LucideIcon;
  /** Always the accessible name; shown as text from `sm`, as a tooltip on phones. */
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

/** A row action: a 44px icon on phones so a row's actions fit one line, plain text on wider screens. */
export function AdminAction({ icon: Icon, label, onClick, disabled = false, danger = false }: AdminActionProps) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-11 min-w-11 items-center justify-center rounded border border-line px-3 text-xs font-medium transition-colors disabled:opacity-40 sm:h-9 ${danger ? 'text-t3 hover:border-error/40 hover:text-error-ink' : 'text-t2 hover:border-gold-400/40 hover:text-gold-ink'}`}
    >
      <Icon className="h-4 w-4 sm:hidden" aria-hidden />
      <span className="sr-only sm:not-sr-only">{label}</span>
    </button>
  );
}

interface StatusBadgeProps { status: ResourceStatus | EventStatus; resource?: boolean }

export function StatusBadge({ status, resource = false }: StatusBadgeProps) {
  const labels = { DRAFT: 'Brouillon', PUBLISHED: resource ? 'Publiée' : 'Publié', ARCHIVED: 'Archivée', CANCELLED: 'Annulé', COMPLETED: 'Terminé' };
  return <span className={`inline-flex shrink-0 rounded border px-3 py-1 text-xs font-medium ${status === 'PUBLISHED' ? 'border-gold-400/30 bg-gold-400/10 text-gold-ink' : 'border-line-soft bg-noir-800 text-t3'}`}>{labels[status]}</span>;
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
        className={`fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-line-soft bg-card p-6 text-t1 shadow-2xl sm:p-8 ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
      >
        <Dialog.Title className="pr-10 font-display text-2xl font-semibold">{title}</Dialog.Title>
        <Dialog.Description className="mb-6 mt-2 text-sm leading-relaxed text-t3">{description}</Dialog.Description>
        {children}
        <Dialog.Close disabled={busy} aria-label="Fermer" className="absolute right-4 top-4 rounded p-2 text-t3 hover:bg-noir-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400 disabled:opacity-40"><X className="h-5 w-5" aria-hidden /></Dialog.Close>
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
    {error && <p role="alert" className="mb-5 rounded-lg border border-error/30 bg-error/10 p-4 text-sm text-t1">{error}</p>}
    <div className="flex flex-wrap justify-end gap-3">
      <button type="button" disabled={busy} onClick={onCancel} className="btn-secondary">Garder cet élément</button>
      <button type="button" disabled={busy} onClick={onConfirm} className="btn-primary">{busy ? 'En cours…' : label}</button>
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
      <button type="button" disabled={busy || page === 0} onClick={() => onChange(page - 1)} className="flex min-h-11 items-center gap-1 rounded border border-line px-4 text-t2 hover:bg-card disabled:opacity-40"><ChevronLeft className="h-4 w-4" aria-hidden />Précédent</button>
      <button type="button" disabled={busy || page + 1 >= totalPages} onClick={() => onChange(page + 1)} className="flex min-h-11 items-center gap-1 rounded border border-line px-4 text-t2 hover:bg-card disabled:opacity-40">Suivant<ChevronRight className="h-4 w-4" aria-hidden /></button>
    </div>
  </nav>;
}
