import './StatCard.css';

/**
 * Reusable StatCard component for KPI cards across Patient, Doctor, and Admin dashboards
 */
export function StatCard({
  label,
  value,
  icon,
  subtext = null,
  color = 'blue', // 'blue' | 'green' | 'amber' | 'purple' | 'teal'
  onClick = null,
  className = '',
}) {
  const isClickable = Boolean(onClick);

  return (
    <div
      className={`medicare-stat-card medicare-stat-card--${color} ${isClickable ? 'medicare-stat-card--clickable' : ''} ${className}`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      <div className="medicare-stat-card__header">
        <span className="medicare-stat-card__label">{label}</span>
        {icon && <div className="medicare-stat-card__icon">{icon}</div>}
      </div>
      <div className="medicare-stat-card__body">
        <span className="medicare-stat-card__value">{value}</span>
        {subtext && <span className="medicare-stat-card__subtext">{subtext}</span>}
      </div>
    </div>
  );
}

export default StatCard;
