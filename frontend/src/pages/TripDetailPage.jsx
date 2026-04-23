import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTrip } from '../services/tripService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { CalculatorIcon, SparklesIcon, BookmarkIcon } from '@heroicons/react/24/outline';

const PURPOSE_EMOJI = {
  vacation: '🌴',
  business: '💼',
  family: '👨‍👩‍👧‍👦',
  adventure: '🏔️',
};

export default function TripDetailPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const showSkeleton = useDelayedLoading(loading);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const t = await getTrip(id);
      setTrip(t);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  if (error) return <ErrorState title="Could not load trip" retry={load} />;
  if (showSkeleton) return <div><Skeleton variant="title" className="w-48 mb-6" /><Skeleton variant="card" /></div>;
  if (!trip) return null;

  const departure = new Date(trip.departure_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const returnDate = new Date(trip.return_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div>
      <h1 className="type-section-heading">{trip.destination}</h1>
      <p className="type-caption text-text-secondary mt-1 capitalize">
        {trip.trip_purpose} · {trip.num_travelers} traveler{trip.num_travelers > 1 ? 's' : ''}
      </p>

      <Card elevated className="mt-6 relative">
        <div className="absolute top-5 right-5 text-4xl">{PURPOSE_EMOJI[trip.trip_purpose] || '✈️'}</div>
        <h2 className="type-card-title">Overview</h2>
        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="type-caption text-text-tertiary">Departure</dt>
            <dd className="type-body mt-0.5">{departure}</dd>
          </div>
          <div>
            <dt className="type-caption text-text-tertiary">Return</dt>
            <dd className="type-body mt-0.5">{returnDate}</dd>
          </div>
          <div>
            <dt className="type-caption text-text-tertiary">Total Budget</dt>
            <dd className="type-body-emphasis mt-0.5">${trip.total_budget.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="type-caption text-text-tertiary">Hotel Style</dt>
            <dd className="type-body mt-0.5 capitalize">{(trip.hotel_prefs || 'mid_range').replace('_', ' ')}</dd>
          </div>
        </dl>
      </Card>

      <h2 className="type-card-title mt-8 mb-3">Quick Actions</h2>
      <div className="flex flex-wrap gap-3">
        <Link to={`/trips/${id}/budget`}>
          <Button variant="pill-outline" icon={CalculatorIcon}>Budget</Button>
        </Link>
        <Link to={`/trips/${id}/ai`}>
          <Button variant="pill-outline" icon={SparklesIcon}>AI Advisor</Button>
        </Link>
        <Link to={`/trips/${id}/recommendations`}>
          <Button variant="pill-outline" icon={BookmarkIcon}>Recommendations</Button>
        </Link>
      </div>
    </div>
  );
}
