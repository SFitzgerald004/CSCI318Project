import { CheckCircleIcon } from '@heroicons/react/24/outline';

const VARIANTS = {
  neutral: 'bg-gray-100 text-gray-700',
  hotel: 'bg-blue-100 text-blue-700',
  restaurant: 'bg-orange-100 text-orange-700',
  attraction: 'bg-purple-100 text-purple-700',
  flight: 'bg-green-100 text-green-700',
  'car-rental': 'bg-gray-100 text-gray-700',
  'ai-pick': 'bg-yellow-100 text-yellow-700 font-semibold',
  'tool-called': 'bg-apple-blue/10 text-apple-blue font-medium',
};

export default function Badge({ variant = 'neutral', children, className = '' }) {
  const variantClasses = VARIANTS[variant] || VARIANTS.neutral;
  const showIcon = variant === 'tool-called';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs capitalize ${variantClasses} ${className}`}>
      {showIcon && <CheckCircleIcon className="w-3 h-3" />}
      {children}
    </span>
  );
}
