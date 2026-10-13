import './StatusBadge.css';

/**
 * Reusable StatusBadge component for appointments, roles, and status tags
 */
export function StatusBadge({ status, label = null, size = 'md', className = '' }) {
  const normalized = (status || '').toUpperCase().trim();

  // Map status key to display text and color theme class
  let theme = 'neutral';
  let defaultLabel = status;

  switch (normalized) {
    case 'CONFIRMED':
    case 'APPROVED':
    case 'ACTIVE':
    case 'VERIFIED':
      theme = 'success';
      defaultLabel = 'Confirmed';
      break;

    case 'PENDING':
    case 'REQUESTED':
    case 'PENDING_VERIFICATION':
      theme = 'warning';
      defaultLabel = 'Pending';
      break;

    case 'CANCELLED':
    case 'REJECTED':
    case 'INACTIVE':
      theme = 'danger';
      defaultLabel = 'Cancelled';
      break;

    case 'COMPLETED':
    case 'FINISHED':
      theme = 'info';
      defaultLabel = 'Completed';
      break;

    case 'AVAILABLE':
      theme = 'emerald';
      defaultLabel = 'Available';
      break;

    case 'PATIENT':
      theme = 'primary';
      defaultLabel = 'Patient';
      break;

    case 'DOCTOR':
      theme = 'teal';
      defaultLabel = 'Doctor';
      break;

    case 'ADMIN':
      theme = 'purple';
      defaultLabel = 'Administrator';
      break;

    default:
      theme = 'neutral';
      defaultLabel = status || 'Unknown';
      break;
  }

  const displayText = label || defaultLabel;

  return (
    <span className={`medicare-badge medicare-badge--${theme} medicare-badge--${size} ${className}`}>
      <span className="medicare-badge__dot" aria-hidden="true" />
      <span className="medicare-badge__text">{displayText}</span>
    </span>
  );
}

export default StatusBadge;
