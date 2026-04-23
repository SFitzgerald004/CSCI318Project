import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getRecommendations, deleteRecommendation } from '../services/recommendationService';
import RecommendationCard from '../components/RecommendationCard';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'hotel', label: 'Hotels' },
  { value: 'restaurant', label: 'Restaurants' },
  { value: 'attraction', label: 'Attractions' },
  { value: 'flight', label: 'Flights' },
  { value: 'car_rental', label: 'Car Rentals' },
];

export default function RecommendationsPage() {
  const { id } = useParams();
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const showSkeleton = useDelayedLoading(loading);

  const loadRecs = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getRecommendations(id);
      setRecs(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadRecs(); }, [loadRecs]);

  async function handleDelete(recId) {
    try {
      await deleteRecommendation(id, recId);
      setRecs((prev) => prev.filter((r) => r.id !== recId));
      toast.success('Removed');
    } catch {
      toast.error('Could not delete');
    }
  }

  const filtered = activeCategory === 'all'
    ? recs
    : recs.filter((r) => r.category === activeCategory);

  if (error) {
    return <ErrorState title="Could not load recommendations" description="Please try again." retry={loadRecs} />;
  }

  return (
    <div>
      <h1 className="type-section-heading">Recommendations</h1>
      <p className="type-caption text-text-secondary mt-1">Items saved for this trip</p>

      <div className="flex flex-wrap gap-2 mt-6">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.value}
            variant={activeCategory === cat.value ? 'pill-filled' : 'pill-outline'}
            size="sm"
            onClick={() => setActiveCategory(cat.value)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {showSkeleton ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} variant="card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BookmarkIcon className="w-12 h-12" />}
          title="No recommendations saved"
          description={activeCategory === 'all'
            ? "Ask the AI advisor for suggestions and save what you like."
            : `No ${activeCategory} recommendations yet.`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {filtered.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} onDelete={() => handleDelete(rec.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
