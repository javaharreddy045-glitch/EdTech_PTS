import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export function Modal({ isOpen, onClose, title, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    dialogRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-charcoal/40 animate-fade-up"
        style={{ animationDuration: '150ms' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="animate-fade-up relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-cream p-6 shadow-xl focus:outline-none"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-charcoal">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full p-1.5 text-charcoal-soft transition-colors hover:bg-cream-dim hover:text-charcoal"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
