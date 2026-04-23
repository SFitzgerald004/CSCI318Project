const VARIANTS = {
  text: 'h-4 w-full rounded',
  title: 'h-7 w-3/4 rounded-md',
  card: 'h-32 w-full rounded-xl',
  circle: 'h-10 w-10 rounded-full',
};

export default function Skeleton({ variant = 'text', className = '' }) {
  const variantClasses = VARIANTS[variant] || VARIANTS.text;
  return (
    <div
      className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-pulse ${variantClasses} ${className}`}
      style={{ animation: 'shimmer 1.5s infinite linear, pulse 2s infinite' }}
    />
  );
}
