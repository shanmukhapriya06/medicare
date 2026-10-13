import React from 'react';
import './ConfirmationModal.css';

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary', // 'primary' | 'danger'
  isLoading = false,
  onConfirm,
  onCancel,
  details = [],
}) {
  if (!isOpen) return null;

  return (
    <div className="mc-modal-overlay" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="mc-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className={`mc-modal-icon-badge mc-modal-icon-badge--${confirmVariant}`}>
          {confirmVariant === 'danger' ? '⚠️' : '📅'}
        </div>

        <h3 className="mc-modal-title">{title}</h3>
        <p className="mc-modal-message">{message}</p>

        {details && details.length > 0 && (
          <div className="mc-modal-details-box">
            {details.map((item, idx) => (
              <div key={idx} className="mc-modal-detail-row">
                <span className="mc-modal-detail-label">{item.label}</span>
                <span className="mc-modal-detail-val">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mc-modal-actions">
          <button
            type="button"
            className="mc-modal-btn mc-modal-btn--secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`mc-modal-btn mc-modal-btn--${confirmVariant}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
