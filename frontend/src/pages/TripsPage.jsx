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
  destination: '',
  destination_country: '',
  total_budget: '',
  departure_date: '',
  return_date: '',
  trip_purpose: 'vacation',
  num_travelers: 1,
  food_prefs: [],
  activity_prefs: [],
  hotel_prefs: 'mid_range',
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
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#2D3561' }}>My Trips</h1>
          <p className="text-gray-500 mt-1 text-sm">Plan and manage your travel budgets</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: '#800020' }}>
          + New Trip
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-4">No trips yet</p>
          <button onClick={() => setShowModal(true)}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#800020' }}>
            Plan a Trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {trips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: '#2D3561' }}>New Trip</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 text-xl">&times;</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-gray-600">Destination</span>
                <input type="text" required value={form.destination}
                  onChange={(e) => updateForm('destination', e.target.value)}
                  className="mt-1.5 w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4ECDC4]"
                  placeholder="e.g. Tokyo" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-600">Country</span>
                <input type="text" value={form.destination_country}
                  onChange={(e) => updateForm('destination_country', e.target.value)}
                  className="mt-1.5 w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4ECDC4]"
                  placeholder="e.g. Japan" />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-600">Budget ($)</span>
                  <input type="number" required min="1" value={form.total_budget}
                    onChange={(e) => updateForm('total_budget', e.target.value)}
                    className="mt-1.5 w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4ECDC4]"
                    placeholder="3500" />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-600">Travelers</span>
                  <input type="number" min="1" value={form.num_travelers}
                    onChange={(e) => updateForm('num_travelers', e.target.value)}
                    className="mt-1.5 w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4ECDC4]" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-600">Departure</span>
                  <input type="date" required value={form.departure_date}
                    onChange={(e) => updateForm('departure_date', e.target.value)}
                    className="mt-1.5 w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4ECDC4]" />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-600">Return</span>
                  <input type="date" required value={form.return_date}
                    onChange={(e) => updateForm('return_date', e.target.value)}
                    className="mt-1.5 w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4ECDC4]" />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-semibold text-gray-600">Trip Purpose</span>
                <select value={form.trip_purpose} onChange={(e) => updateForm('trip_purpose', e.target.value)}
                  className="mt-1.5 w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4ECDC4] capitalize">
                  {TRIP_PURPOSES.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-600">Hotel Preference</span>
                <select value={form.hotel_prefs} onChange={(e) => updateForm('hotel_prefs', e.target.value)}
                  className="mt-1.5 w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4ECDC4]">
                  {HOTEL_OPTIONS.map((h) => <option key={h} value={h}>{h.replace('_', ' ')}</option>)}
                </select>
              </label>
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Food Preferences</p>
                <div className="flex flex-wrap gap-2">
                  {FOOD_OPTIONS.map((f) => (
                    <button key={f} type="button" onClick={() => toggleArrayItem('food_prefs', f)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all"
                      style={form.food_prefs.includes(f)
                        ? { background: '#800020', borderColor: '#800020', color: 'white' }
                        : { background: 'white', borderColor: '#e5e7eb', color: '#6b7280' }}>
                      {f.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Activity Preferences</p>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_OPTIONS.map((a) => (
                    <button key={a} type="button" onClick={() => toggleArrayItem('activity_prefs', a)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all"
                      style={form.activity_prefs.includes(a)
                        ? { background: '#4ECDC4', borderColor: '#4ECDC4', color: 'white' }
                        : { background: 'white', borderColor: '#e5e7eb', color: '#6b7280' }}>
                      {a.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" onClick={handleCreate} disabled={submitting}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white mt-2 disabled:opacity-50"
                style={{ background: '#2D3561' }}>
                {submitting ? 'Creating...' : 'Create Trip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
