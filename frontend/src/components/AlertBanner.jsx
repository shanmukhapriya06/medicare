import './AlertBanner.css';

/**
 * Reusable AlertBanner component for errors, success feedback, and system warnings
 */
export function AlertBanner({
  type = 'info', // 'info' | 'success' | 'warning' | 'error'
  title = null,
  message = null,
  children = null,
  onClose = null,
  className = '',
}) {
  const icons = {
    info: 'ℹ️',
    success: '✓',
    warning: '⚠️',
    error: '✕',
  };

  return (
    <div
      className={`medicare-alert medicare-alert--${type} ${className}`}
      role="alert"
    >
      <div className="medicare-alert__icon" aria-hidden="true">
        {icons[type] || 'ℹ️'}
      </div>
      <div className="medicare-alert__content">
        {title && <h5 className="medicare-alert__title">{title}</h5>}
        {message && <div className="medicare-alert__message">{message}</div>}
        {children}
      </div>
      {onClose && (
        <button
          type="button"
          className="medicare-alert__close"
          onClick={onClose}
          aria-label="Dismiss alert"
          title="Dismiss"
        >
          &times;
        </button>
      )}
    </div>
  );
}

export default AlertBanner;
