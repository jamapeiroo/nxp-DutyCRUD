import { MouseEvent, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Confirmation dialog shown on top of the page (rendered in <body>)
export function ConfirmDialog({ title, message, confirmLabel, busy, onConfirm, onCancel }: Props) {
  const titleId = useId();
  const messageId = useId();

  // Escape closes the dialog, unless the action is already running
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) {
        onCancel();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [busy, onCancel]);

  // Clicking the dark background (not the dialog itself) also closes it
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget && !busy) {
      onCancel();
    }
  }

  return createPortal(
    <div className="dialog-backdrop" onClick={handleBackdropClick}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={messageId}>
        <h2 id={titleId} className="dialog-title">
          {title}
        </h2>
        <p id={messageId} className="dialog-message">
          {message}
        </p>

        <div className="dialog-actions">
          <button type="button" className="button" autoFocus disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="button button-danger-solid" disabled={busy} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
