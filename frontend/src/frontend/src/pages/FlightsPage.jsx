// FlightsPage.jsx

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTrip } from '../services/tripService'
import { getFlightRecommendations } from '../services/aiService'
import { createRecommendation } from '../services/recommendationService'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const PRICE_ICONS = {
  budget: '💰',
  'mid-range': '💵',
  premium: '💎'
}

export default function FlightsPage() {
  const { id: tripId } = useParams()
  const [trip, setTrip] = useState(null)
  const [origin, setOrigin] = useState('JFK')
  const [destination, setDestination] = useState('')
  const [flights, setFlights] = useState([])
  const [savedFlights, setSavedFlights] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    getTrip(tripId)
      .then(setTrip)
      .catch(() => toast.error('Failed to load trip'))
  }, [tripId])

  const handleSearch = async () => {
    if (!origin || !destination) {
      toast.error('Please enter both origin and destination airports')
      return
    }
    
    setLoading(true)
    try {
      const data = await getFlightRecommendations(tripId, origin.toUpperCase(), destination.toUpperCase())
      setFlights(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to get flight recommendations')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveFlight = async (flight, idx) => {
    if (savedFlights.has(idx)) return
    
    setSaving(idx)
    try {
      await createRecommendation(tripId, {
        name: `${flight.airline} ${flight.flight_number}`,
        description: `${origin} → ${destination} | ${flight.departure_time} - ${flight.arrival_time} | ${flight.duration}`,
        category: 'flight',
        source: 'ai_generated',
        is_ai_pick: true,
      })
      setSavedFlights(new Set([...savedFlights, idx]))
      toast.success(`Saved ${flight.airline} ${flight.flight_number}!`)
    } catch {
      toast.error('Failed to save flight')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link to={`/trips/${tripId}`} className="text-sm text-[#0071e3] hover:underline">
          ← Back to Trip
        </Link>
        <h1 className="text-2xl font-semibold text-[#1d1d1f] mt-1">
          Flight Options
        </h1>
        <p className="text-sm text-gray-500">
          {trip ? `${new Date(trip.departure_date).toLocaleDateString()} - ${new Date(trip.return_date).toLocaleDateString()}` : ''}
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm text-gray-500">From (IATA)</label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value.toUpperCase())}
              className="w-full p-2 border rounded-lg"
              placeholder="JFK"
              maxLength={3}
            />
          </div>
          <div className="flex-1">
            <label className="text-sm text-gray-500">To (IATA)</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value.toUpperCase())}
              className="w-full p-2 border rounded-lg"
              placeholder="LAX"
              maxLength={3}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-[#0071e3] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#005bb5] disabled:opacity50"
          >
            {loading ? 'Searching...' : 'Get Recommendations'}
          </button>
        </div>
      </div>

      {/* Flight Cards */}
      {flights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flights.map((flight, idx) => (
            <div key={idx} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold text-[#1d1d1f]">{flight.airline}</div>
                  <div className="text-sm text-gray-500">{flight.flight_number}</div>
                </div>
                <div className="text-2xl">
                  {PRICE_ICONS[flight.price_range] || '💵'}
                </div>
              </div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-center">
                  <div className="text-lg font-semibold">{flight.departure_time}</div>
                  <div className="text-xs text-gray-500">{origin}</div>
                </div>
                <div className="flex-1 px-4">
                  <div className="text-xs text-gray-400 text-center">{flight.duration}</div>
                  <div className="border-t border-gray-300 relative my-1">
                    <span className="absolute right-0 -top-1 bg-white text-xs">✈️</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{flight.arrival_time}</div>
                  <div className="text-xs text-gray-500">{destination}</div>
                </div>
              </div>
              <div className="text-sm text-gray-500 mb-3">
                {flight.notes}
              </div>
              <button
                onClick={() => handleSaveFlight(flight, idx)}
                disabled={savedFlights.has(idx) || saving === idx}
                className="w-full py-2 border rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: savedFlights.has(idx) ? '#34C759' : 'white',
                  borderColor: savedFlights.has(idx) ? '#34C759' : '#e5e5e5',
                  color: savedFlights.has(idx) ? 'white' : '#0071e3'
                }}
              >
                {savedFlights.has(idx) ? '✓ Saved' : saving === idx ? 'Saving...' : 'Save to Itinerary'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {flights.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-4">✈️</p>
          <p>Enter airport codes to get flight recommendations</p>
          <p className="text-sm text-gray-400 mt-2">Example: JFK → LAX</p>
        </div>
      )}
    </div>
  )
}