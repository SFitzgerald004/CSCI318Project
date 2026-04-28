import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from './Button';

export default function ErrorState({ title, description, retry }) {
  return (
    <div className="text-center py-16">
      <ExclamationTriangleIcon className="w-12 h-12 text-red-500/60 mx-auto mb-3" />
      <h2 className="type-card-title">{title}</h2>
      {description && <p className="type-caption text-text-secondary mt-1">{description}</p>}
      {retry && (
        <div className="mt-5">
          <Button variant="primary" onClick={retry}>Try again</Button>
        </div>
      )}
    </div>
  );
}
