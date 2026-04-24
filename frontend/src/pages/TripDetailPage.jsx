import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTrip } from '../services/tripService'
import { getAllocation } from '../services/budgetService'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function TripDetailPage() {
  const { id } = useParams()
  const [trip, setTrip] = useState(null)
  const [hasBudget, setHasBudget] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getTrip(id), getAllocation(id).catch(() => null)])
      .then(([tripData, allocation]) => {
        setTrip(tripData)
        setHasBudget(!!allocation)
      })
      .catch(() => toast.error('Failed to load trip'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner />
  if (!trip) return <p className="text-gray-500">Trip not found.</p>

  const departure = new Date(trip.departure_date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'long', day: 'numeric', year: 'numeric'
  })
  const returnDate = new Date(trip.return_date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'long', day: 'numeric', year: 'numeric'
  })

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="rounded-2xl p-8 mb-6 text-white" style={{ background: '#2D3561' }}>
        <h1 className="text-2xl font-bold">{trip.destination}</h1>
        <p className="text-white/70 mt-1 capitalize text-sm">{trip.trip_purpose} · {trip.num_travelers} traveler{trip.num_travelers > 1 ? 's' : ''}</p>
        <div className="mt-4 flex gap-3 flex-wrap">
          <span className="bg-white/20 text-sm font-semibold px-4 py-1.5 rounded-full">${trip.total_budget.toLocaleString()}</span>
          <span className="bg-white/20 text-sm px-4 py-1.5 rounded-full">{departure} — {returnDate}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="font-bold mb-4" style={{ color: '#2D3561' }}>Trip Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Destination</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: '#2D3561' }}>{trip.destination}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Budget</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: '#2D3561' }}>${trip.total_budget.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Departure</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: '#2D3561' }}>{departure}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Return</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: '#2D3561' }}>{returnDate}</p>
          </div>
          {trip.hotel_prefs && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Hotel</p>
              <p className="text-sm font-semibold mt-0.5 capitalize" style={{ color: '#2D3561' }}>{trip.hotel_prefs.replace('_', ' ')}</p>
            </div>
          )}
          {trip.food_prefs?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Food</p>
              <p className="text-sm font-semibold mt-0.5 capitalize" style={{ color: '#2D3561' }}>{trip.food_prefs.map(f => f.replace('_', ' ')).join(', ')}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to={`/trips/${id}/budget`} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow block">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg mb-3" style={{ background: '#4ECDC4' }}>💰</div>
          <h3 className="font-bold text-sm" style={{ color: '#2D3561' }}>{hasBudget ? 'View Budget' : 'Generate Budget'}</h3>
          <p className="text-xs text-gray-500 mt-1">See your budget breakdown</p>
        </Link>
        <Link to={`/trips/${id}/ai`} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow block">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg mb-3" style={{ background: '#800020' }}>🤖</div>
          <h3 className="font-bold text-sm" style={{ color: '#2D3561' }}>AI Advisor</h3>
          <p className="text-xs text-gray-500 mt-1">Get AI-powered travel advice</p>
        </Link>
        <Link to={`/trips/${id}/recommendations`} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow block">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg mb-3" style={{ background: '#2D3561' }}>⭐</div>
          <h3 className="font-bold text-sm" style={{ color: '#2D3561' }}>Recommendations</h3>
          <p className="text-xs text-gray-500 mt-1">View saved picks</p>
        </Link>
      </div>
    </div>
  )
}
