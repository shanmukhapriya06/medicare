import './Button.css';

/**
 * Reusable Button component for MediCare
 * @param {'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost'} [variant='primary']
 * @param {'sm' | 'md' | 'lg'} [size='md']
 * @param {boolean} [isLoading=false]
 * @param {React.ReactNode} [icon]
 * @param {React.ReactNode} children
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon = null,
  disabled = false,
  type = 'button',
  className = '',
  onClick,
  ...props
}) {
  return (
    <button
      type={type}
      className={`medicare-btn medicare-btn--${variant} medicare-btn--${size} ${className}`}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <span className="medicare-btn__spinner" aria-hidden="true" />
      ) : icon ? (
        <span className="medicare-btn__icon">{icon}</span>
      ) : null}
      <span className="medicare-btn__text">{children}</span>
    </button>
  );
}

export default Button;
