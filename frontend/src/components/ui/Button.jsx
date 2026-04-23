const VARIANTS = {
  primary: 'bg-apple-blue text-white hover:bg-apple-blue-hover disabled:opacity-50',
  secondary: 'bg-white text-text-primary border border-gray-200 hover:bg-surface-light disabled:opacity-50',
  'pill-outline': 'bg-transparent text-link-light border border-link-light rounded-full hover:bg-link-light/5 disabled:opacity-50',
  'pill-filled': 'bg-apple-blue text-white rounded-full hover:bg-apple-blue-hover disabled:opacity-50',
  ghost: 'bg-transparent text-text-secondary hover:bg-surface-light disabled:opacity-50',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  children,
  className = '',
  ...rest
}) {
  const isDisabled = disabled || loading;
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed';
  const variantClasses = VARIANTS[variant] || VARIANTS.primary;
  const sizeClasses = SIZES[size] || SIZES.md;
  return (
    <button
      type={type}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      className={`${base} ${variantClasses} ${sizeClasses} ${className}`}
      {...rest}
    >
      {loading ? (
        <span data-testid="button-spinner" className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        Icon && <Icon className="w-4 h-4" />
      )}
      <span>{children}</span>
    </button>
  );
}
