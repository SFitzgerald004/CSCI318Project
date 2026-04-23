import Card from './ui/Card';

export default function AiInsightCard({ icon: Icon, title, description, onClick, loading }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="text-left w-full disabled:opacity-50 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue focus-visible:ring-offset-2 rounded-xl"
    >
      <Card padding="md" className="h-full">
        {Icon && <Icon className="w-6 h-6 text-apple-blue mb-2" />}
        <h3 className="type-body-emphasis">{title}</h3>
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
