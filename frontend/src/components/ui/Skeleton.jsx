const VARIANTS = {
  text: 'h-4 w-full rounded',
  title: 'h-7 w-3/4 rounded-md',
  card: 'h-32 w-full rounded-xl',
  circle: 'h-10 w-10 rounded-full',
};

export default function Skeleton({ variant = 'text', className = '' }) {
  const variantClasses = VARIANTS[variant] || VARIANTS.text;
  return (
    <div className={`bg-gray-200 animate-pulse ${variantClasses} ${className}`} />
  );
}
