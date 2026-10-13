import './Card.css';

export function Card({
  children,
  variant = 'default',
  className = '',
  onClick,
  ...props
}) {
  const isClickable = Boolean(onClick);
  return (
    <div
      className={`medicare-card medicare-card--${variant} ${isClickable ? 'medicare-card--interactive' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`medicare-card__header ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', as = 'h3', ...props }) {
  const Component = as;
  return (
    <Component className={`medicare-card__title ${className}`} {...props}>
      {children}
    </Component>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`medicare-card__desc ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`medicare-card__content ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`medicare-card__footer ${className}`} {...props}>
      {children}
    </div>
  );
}

export default Card;
