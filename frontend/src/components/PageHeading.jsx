import './PageHeading.css';

/**
 * Reusable Page Heading component for MediCare
 */
export function PageHeading({
  title,
  subtitle = null,
  badge = null,
  actions = null,
  onBack = null,
  className = '',
}) {
  return (
    <div className={`medicare-page-header ${className}`}>
      <div className="medicare-page-header__main">
        {onBack && (
          <button
            type="button"
            className="medicare-page-header__back"
            onClick={onBack}
            aria-label="Go back"
            title="Go back"
          >
            ←
          </button>
        )}
        <div className="medicare-page-header__text">
          <div className="medicare-page-header__title-row">
            <h1 className="medicare-page-header__title">{title}</h1>
            {badge && <span className="medicare-page-header__badge">{badge}</span>}
          </div>
          {subtitle && (
            <p className="medicare-page-header__subtitle">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="medicare-page-header__actions">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeading;
