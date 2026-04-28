const VARIANTS = {
  white: 'bg-white',
  light: 'bg-surface-light',
  'dark-1': 'bg-surface-dark-1 text-white',
  'dark-2': 'bg-surface-dark-2 text-white',
};

const PADDINGS = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export default function Card({
  variant = 'white',
  padding = 'md',
  hover = false,
  elevated = false,
  className = '',
  children,
  ...rest
}) {
  const base = 'rounded-xl transition-all duration-200';
  const variantClasses = VARIANTS[variant] || VARIANTS.white;
  const paddingClasses = PADDINGS[padding] || PADDINGS.md;
  const hoverClasses = hover ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-card' : '';
  const elevatedClasses = elevated ? 'shadow-card' : '';
  return (
    <div className={`${base} ${variantClasses} ${paddingClasses} ${hoverClasses} ${elevatedClasses} ${className}`} {...rest}>
      {children}
    </div>
  );
}
