import { useState, useEffect } from 'react';
import { PlusIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { getTrips, createTrip } from '../services/tripService';
import TripCard from '../components/TripCard';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import toast from 'react-hot-toast';

const TRIP_PURPOSES = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'business', label: 'Business' },
  { value: 'family', label: 'Family' },
  { value: 'adventure', label: 'Adventure' },
];
const HOTEL_OPTIONS = [
  { value: 'budget', label: 'Budget' },
  { value: 'mid_range', label: 'Mid range' },
  { value: 'luxury', label: 'Luxury' },
];
const FOOD_OPTIONS = ['fine_dining', 'street_food', 'budget_eats', 'local_cuisine'];
const ACTIVITY_OPTIONS = ['museums', 'nightlife', 'beaches', 'hiking', 'attractions', 'shopping'];

const INITIAL_FORM = {
  destination: '', destination_country: '', total_budget: '',
  departure_date: '', return_date: '', trip_purpose: 'vacation',
  num_travelers: 1, food_prefs: [], activity_prefs: [], hotel_prefs: 'mid_range',
};

export default function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const showSkeleton = useDelayedLoading(loading);

  async function loadTrips() {
    setLoading(true);
    setError(false);
    try {
      const data = await getTrips();
      setTrips(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTrips(); }, []);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleArrayItem(field, item) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i) => i !== item)
        : [...prev[field], item],
    }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newTrip = await createTrip({
        ...form,
        total_budget: Number(form.total_budget),
        num_travelers: Number(form.num_travelers),
      });
      setTrips((prev) => [...prev, newTrip]);
      setShowModal(false);
      setForm(INITIAL_FORM);
      toast.success('Trip created');
    } catch {
      toast.error('Could not create trip');
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <ErrorState title="Could not load trips" retry={loadTrips} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="type-section-heading">My Trips</h1>
          <p className="type-caption text-text-secondary mt-1">Plan and manage your travel budgets</p>
        </div>
        <Button onClick={() => setShowModal(true)} icon={PlusIcon}>New Trip</Button>
      </div>

      {showSkeleton ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} variant="card" />)}
        </div>
      ) : trips.length === 0 ? (
        <EmptyState
          icon={<PaperAirplaneIcon className="w-12 h-12" />}
          title="No trips yet"
          description="Plan your first trip to get started."
          action={<Button onClick={() => setShowModal(true)}>Plan a Trip</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Plan a New Trip">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Destination" value={form.destination}
            onChange={(v) => updateForm('destination', v)} placeholder="Tokyo" required />

          <Input label="Country" value={form.destination_country}
            onChange={(v) => updateForm('destination_country', v)} placeholder="Japan" />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Total Budget ($)" type="number" value={form.total_budget}
              onChange={(v) => updateForm('total_budget', v)} placeholder="3500" required />
            <Input label="Travelers" type="number" value={form.num_travelers}
              onChange={(v) => updateForm('num_travelers', v)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Departure" type="date" value={form.departure_date}
              onChange={(v) => updateForm('departure_date', v)} required />
            <Input label="Return" type="date" value={form.return_date}
              onChange={(v) => updateForm('return_date', v)} required />
          </div>

          <Select label="Trip Purpose" options={TRIP_PURPOSES}
            value={form.trip_purpose} onChange={(v) => updateForm('trip_purpose', v)} />

          <Select label="Hotel Preference" options={HOTEL_OPTIONS}
            value={form.hotel_prefs} onChange={(v) => updateForm('hotel_prefs', v)} />

          <fieldset>
            <legend className="text-xs text-text-secondary mb-2">Food Preferences</legend>
            <div className="flex flex-wrap gap-2">
              {FOOD_OPTIONS.map((f) => (
                <button key={f} type="button" onClick={() => toggleArrayItem('food_prefs', f)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    form.food_prefs.includes(f) ? 'bg-apple-blue text-white border-apple-blue' : 'border-gray-200 text-text-secondary hover:border-gray-400'
                  }`}>
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs text-text-secondary mb-2">Activity Preferences</legend>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_OPTIONS.map((a) => (
                <button key={a} type="button" onClick={() => toggleArrayItem('activity_prefs', a)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    form.activity_prefs.includes(a) ? 'bg-apple-blue text-white border-apple-blue' : 'border-gray-200 text-text-secondary hover:border-gray-400'
                  }`}>
                  {a.replace('_', ' ')}
                </button>
              ))}
            </div>
          </fieldset>

          <Button type="submit" loading={submitting} className="w-full">
            {submitting ? 'Creating...' : 'Create Trip'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
