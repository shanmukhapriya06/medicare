import './LoadingSpinner.css';

/**
 * Reusable Loading Spinner & Skeleton placeholders for MediCare
 */
export function LoadingSpinner({
  message = 'Loading MediCare data...',
  fullPage = false,
  size = 'md',
  className = '',
}) {
  return (
    <div
      className={`medicare-spinner-container ${fullPage ? 'medicare-spinner-container--full' : ''} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className={`medicare-spinner medicare-spinner--${size}`} />
      {message && <p className="medicare-spinner__message">{message}</p>}
    </div>
  );
}

export function SkeletonCard({ count = 1 }) {
  return (
    <div className="medicare-skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="medicare-skeleton-card">
          <div className="medicare-skeleton medicare-skeleton--title" />
          <div className="medicare-skeleton medicare-skeleton--text" />
          <div className="medicare-skeleton medicare-skeleton--text medicare-skeleton--short" />
        </div>
      ))}
    </div>
  );
}

export default LoadingSpinner;
