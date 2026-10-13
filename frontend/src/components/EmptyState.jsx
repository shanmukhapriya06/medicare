import './EmptyState.css';

/**
 * Reusable EmptyState component for zero appointments, empty lists, etc.
 */
export function EmptyState({
  icon = '📋',
  title = 'No records found',
  description = 'There are currently no items to display in this section.',
  action = null,
  className = '',
}) {
  return (
    <div className={`medicare-empty-state ${className}`}>
      <div className="medicare-empty-state__icon-wrap">
        <span className="medicare-empty-state__icon" role="img" aria-hidden="true">
          {icon}
        </span>
      </div>
      <h4 className="medicare-empty-state__title">{title}</h4>
      <p className="medicare-empty-state__description">{description}</p>
      {action && <div className="medicare-empty-state__action">{action}</div>}
    </div>
  );
}

export default EmptyState;
