import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Actions row, right-aligned under the body. */
  footer?: React.ReactNode;
}

/**
 * Escape closes it, the backdrop closes it, and focus moves inside on open — none of which
 * the six hand-rolled modals did, so a keyboard user could not dismiss any of them.
 */
const Modal = ({ open, onClose, title, children, footer }: ModalProps) => {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    panel.current?.focus();
    // Stop the page behind from scrolling under the overlay.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-surface-1 border border-line rounded-xl focus:outline-none"
      >
        <div className="flex items-center justify-between gap-4 px-gutter py-4 border-b border-line-soft">
          <h2 className="text-data-lg font-medium text-t1">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="text-t4 hover:text-t1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-gutter py-gutter">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 px-gutter py-4 border-t border-line-soft">{footer}</div>
        )}
      </div>
    </div>
  );
};

export default Modal;
