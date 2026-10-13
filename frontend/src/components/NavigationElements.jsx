import './NavigationElements.css';

/**
 * Reusable Tab switcher for dashboard views and filter bars
 */
export function Tabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={`medicare-tabs ${className}`} role="tablist">
      {tabs.map((tab) => {
        const id = typeof tab === 'object' ? tab.id : tab;
        const label = typeof tab === 'object' ? tab.label : tab;
        const count = typeof tab === 'object' ? tab.count : undefined;
        const isActive = activeTab === id;

        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`medicare-tab ${isActive ? 'medicare-tab--active' : ''}`}
            onClick={() => onChange(id)}
          >
            <span>{label}</span>
            {count !== undefined && (
              <span className="medicare-tab__badge">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Quick action card for prominent shortcuts
 */
export function QuickActionCard({
  icon,
  title,
  description,
  buttonText,
  onClick,
  className = '',
}) {
  return (
    <div className={`medicare-quick-action ${className}`}>
      <div className="medicare-quick-action__icon">{icon}</div>
      <div className="medicare-quick-action__content">
        <h4 className="medicare-quick-action__title">{title}</h4>
        <p className="medicare-quick-action__desc">{description}</p>
      </div>
      <button
        type="button"
        className="medicare-quick-action__btn"
        onClick={onClick}
      >
        {buttonText} →
      </button>
    </div>
  );
}
