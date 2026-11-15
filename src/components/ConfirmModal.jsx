import { useEffect } from 'react';

/**
 * Reusable Confirmation Modal.
 * Used for logout, deletions, or other destructive / confirmation actions.
 *
 * Props:
 *   isOpen        — boolean controlling visibility
 *   title         — heading text
 *   message       — body text
 *   confirmText   — label for the confirm button
 *   cancelText    — label for the cancel button
 *   isDestructive — true  → red confirm button + warning icon
 *                   false → green confirm button + info icon
 *   onConfirm     — callback when user confirms
 *   onCancel      — callback when user cancels or presses ESC
 */
export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Yes, Proceed',
  cancelText = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}) {
  // Dismiss on ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="relative bg-white rounded-xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-naos-gray/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div
          className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
            isDestructive ? 'bg-red-100 text-red-600' : 'bg-naos-green/10 text-naos-green'
          }`}
        >
          {isDestructive ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        <h3 id="confirm-modal-title" className="text-lg font-bold text-naos-dark text-center mb-2">
          {title}
        </h3>

        <p className="text-xs text-naos-text text-center leading-relaxed mb-6">
          {message}
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-md border border-naos-gray px-4 py-2.5 text-xs font-semibold text-naos-dark transition hover:bg-naos-gray/20 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-md px-4 py-2.5 text-xs font-bold text-white transition cursor-pointer shadow-xs ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-naos-green hover:bg-naos-dark'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
