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
    Promise.all([
      getTrip(id),
      getAllocation(id).catch(() => null),
    ])
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
    <div>
      <h1 className="text-2xl font-semibold text-[#1d1d1f]">{trip.destination}</h1>
      <p className="text-sm text-gray-500 mt-1 capitalize">{trip.trip_purpose} · {trip.num_travelers} traveler{trip.num_travelers > 1 ? 's' : ''}</p>

      {/* Trip Info */}
      <div className="bg-white rounded-xl p-5 shadow-sm mt-6">
        <h2 className="text-sm font-semibold text-[#1d1d1f] mb-4">Trip Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Destination</span><p className="font-medium text-[#1d1d1f]">{trip.destination}{trip.destination_country ? `, ${trip.destination_country}` : ''}</p></div>
          <div><span className="text-gray-500">Budget</span><p className="font-medium text-[#1d1d1f]">${trip.total_budget.toLocaleString()}</p></div>
          <div><span className="text-gray-500">Departure</span><p className="font-medium text-[#1d1d1f]">{departure}</p></div>
          <div><span className="text-gray-500">Return</span><p className="font-medium text-[#1d1d1f]">{returnDate}</p></div>
          {trip.hotel_prefs && <div><span className="text-gray-500">Hotel Preference</span><p className="font-medium text-[#1d1d1f] capitalize">{trip.hotel_prefs.replace('_', ' ')}</p></div>}
          {trip.food_prefs?.length > 0 && <div><span className="text-gray-500">Food Preferences</span><p className="font-medium text-[#1d1d1f] capitalize">{trip.food_prefs.map(f => f.replace('_', ' ')).join(', ')}</p></div>}
          {trip.activity_prefs?.length > 0 && <div><span className="text-gray-500">Activity Preferences</span><p className="font-medium text-[#1d1d1f] capitalize">{trip.activity_prefs.map(a => a.replace('_', ' ')).join(', ')}</p></div>}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Link to={`/trips/${id}/budget`} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-2xl mb-2">📊</div>
          <h3 className="text-sm font-semibold text-[#1d1d1f]">{hasBudget ? 'View Budget' : 'Generate Budget'}</h3>
          <p className="text-xs text-gray-500 mt-1">{hasBudget ? 'See your budget breakdown' : 'Get a smart budget allocation'}</p>
        </Link>
        <Link to={`/trips/${id}/ai`} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-2xl mb-2">🤖</div>
          <h3 className="text-sm font-semibold text-[#1d1d1f]">AI Advisor</h3>
          <p className="text-xs text-gray-500 mt-1">Get AI-powered travel advice</p>
        </Link>
        <Link to={`/trips/${id}/recommendations`} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-2xl mb-2">⭐</div>
          <h3 className="text-sm font-semibold text-[#1d1d1f]">Recommendations</h3>
          <p className="text-xs text-gray-500 mt-1">View saved recommendations</p>
        </Link>
        <Link to={`/trips/${id}/itinerary`} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-2xl mb-2">📋</div>
          <h3 className="text-sm font-semibold text-[#1d1d1f]">Itinerary</h3>
          <p className="text-xs text-gray-500 mt-1">Plan your day-to-day activities</p>
        </Link>
      </div>
    </div>
  )
}
