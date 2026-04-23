import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import Card from './ui/Card';

export default function AiInsightCard({
  icon: Icon,
  title,
  description,
  onClick,
  loading,
  alreadyAsked = false,
  onRefresh,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="text-left w-full disabled:opacity-50 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue focus-visible:ring-offset-2 rounded-xl relative"
    >
      {alreadyAsked && onRefresh && (
        <button
          type="button"
          aria-label="Get fresh recommendations"
          title="Get fresh recommendations"
          onClick={(e) => {
            e.stopPropagation();
            onRefresh();
          }}
          className="absolute top-2 right-2 p-1 text-text-tertiary hover:text-apple-blue rounded transition-colors z-10"
        >
          <ArrowPathIcon className="w-4 h-4" />
        </button>
      )}
      <Card padding="md" className="h-full">
        {Icon && <Icon className="w-6 h-6 text-apple-blue mb-2" />}
        <h3 className="type-body-emphasis flex items-center gap-1.5">
          {title}
          {alreadyAsked && <CheckCircleIcon className="w-3.5 h-3.5 text-green-500" />}
        </h3>
        <p className="type-caption text-text-secondary mt-1">
          {loading ? (
            <span className="inline-flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-apple-blue rounded-full" style={{ animation: 'thinking-dot 0.9s infinite', animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-apple-blue rounded-full" style={{ animation: 'thinking-dot 0.9s infinite', animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-apple-blue rounded-full" style={{ animation: 'thinking-dot 0.9s infinite', animationDelay: '300ms' }} />
            </span>
          ) : description}
        </p>
      </Card>
    </button>
  );
}
