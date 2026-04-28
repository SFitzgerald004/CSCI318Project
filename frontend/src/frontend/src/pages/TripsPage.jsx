import { useState, useEffect } from 'react'
import { getTrips, createTrip } from '../services/tripService'
import TripCard from '../components/TripCard'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const TRIP_PURPOSES = ['vacation', 'business', 'family', 'adventure']
const FOOD_OPTIONS = ['fine_dining', 'street_food', 'budget_eats', 'local_cuisine']
const ACTIVITY_OPTIONS = ['museums', 'nightlife', 'beaches', 'hiking', 'attractions', 'shopping']
const HOTEL_OPTIONS = ['budget', 'mid_range', 'luxury']

const INITIAL_FORM = {
  destination: '', destination_country: '', total_budget: '',
  departure_date: '', return_date: '', trip_purpose: 'vacation',
  num_travelers: 1, food_prefs: [], activity_prefs: [], hotel_prefs: 'mid_range',
}

export default function TripsPage() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getTrips()
      .then(setTrips)
      .catch(() => toast.error('Failed to load trips'))
      .finally(() => setLoading(false))
  }, [])

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleArrayItem(field, item) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i) => i !== item)
        : [...prev[field], item],
    }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const newTrip = await createTrip({
        ...form,
        total_budget: Number(form.total_budget),
        num_travelers: Number(form.num_travelers),
      })
      setTrips((prev) => [...prev, newTrip])
      setShowModal(false)
      setForm(INITIAL_FORM)
      toast.success('Trip created!')
    } catch {
      toast.error('Failed to create trip')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f]">My Trips</h1>
          <p className="text-sm text-gray-500 mt-1">Plan and manage your travel budgets</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#0071e3] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0077ed] transition-colors"
        >
          + New Trip
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">✈️</p>
          <h2 className="text-lg font-semibold text-[#1d1d1f]">No trips yet</h2>
          <p className="text-sm text-gray-500 mt-1">Plan your first trip to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 bg-[#0071e3] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0077ed] transition-colors"
          >
            Plan a Trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}

      {/* Create Trip Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#1d1d1f]">Plan a New Trip</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <label className="block">
                <span className="text-sm text-gray-600">Destination</span>
                <input type="text" required value={form.destination} onChange={(e) => updateForm('destination', e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]" placeholder="Tokyo" />
              </label>

              <label className="block">
                <span className="text-sm text-gray-600">Country</span>
                <input type="text" value={form.destination_country} onChange={(e) => updateForm('destination_country', e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]" placeholder="Japan" />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm text-gray-600">Total Budget ($)</span>
                  <input type="number" required min="1" value={form.total_budget} onChange={(e) => updateForm('total_budget', e.target.value)}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]" placeholder="3500" />
                </label>
                <label className="block">
                  <span className="text-sm text-gray-600">Travelers</span>
                  <input type="number" min="1" value={form.num_travelers} onChange={(e) => updateForm('num_travelers', e.target.value)}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm text-gray-600">Departure</span>
                  <input type="date" required value={form.departure_date} onChange={(e) => updateForm('departure_date', e.target.value)}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]" />
                </label>
                <label className="block">
                  <span className="text-sm text-gray-600">Return</span>
                  <input type="date" required value={form.return_date} onChange={(e) => updateForm('return_date', e.target.value)}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]" />
                </label>
              </div>

              <label className="block">
                <span className="text-sm text-gray-600">Trip Purpose</span>
                <select value={form.trip_purpose} onChange={(e) => updateForm('trip_purpose', e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3] capitalize">
                  {TRIP_PURPOSES.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-gray-600">Hotel Preference</span>
                <select value={form.hotel_prefs} onChange={(e) => updateForm('hotel_prefs', e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]">
                  {HOTEL_OPTIONS.map((h) => <option key={h} value={h}>{h.replace('_', ' ')}</option>)}
                </select>
              </label>

              <fieldset>
                <legend className="text-sm text-gray-600 mb-2">Food Preferences</legend>
                <div className="flex flex-wrap gap-2">
                  {FOOD_OPTIONS.map((f) => (
                    <button key={f} type="button" onClick={() => toggleArrayItem('food_prefs', f)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        form.food_prefs.includes(f) ? 'bg-[#0071e3] text-white border-[#0071e3]' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}>
                      {f.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm text-gray-600 mb-2">Activity Preferences</legend>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_OPTIONS.map((a) => (
                    <button key={a} type="button" onClick={() => toggleArrayItem('activity_prefs', a)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        form.activity_prefs.includes(a) ? 'bg-[#0071e3] text-white border-[#0071e3]' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}>
                      {a.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </fieldset>

              <button type="submit" disabled={submitting}
                className="w-full bg-[#0071e3] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#0077ed] transition-colors disabled:opacity-50 mt-2">
                {submitting ? 'Creating...' : 'Create Trip'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
