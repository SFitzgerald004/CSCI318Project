export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="text-center py-16">
      {icon && <div className="text-text-tertiary mx-auto w-12 h-12 mb-3">{icon}</div>}
      <h2 className="type-card-title">{title}</h2>
      {description && <p className="type-caption text-text-secondary mt-1">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
