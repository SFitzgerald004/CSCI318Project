import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTrip, getItinerary, updateItinerary } from '../services/tripService'
import ItineraryDay from '../components/ItineraryDay'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function ItineraryPage() {
  const { id: tripId } = useParams()
  const [trip, setTrip] = useState(null)
  const [itinerary, setItinerary] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      getTrip(tripId),
      getItinerary(tripId).catch(() => [])
    ])
      .then(([tripData, itineraryData]) => {
        setTrip(tripData)
        // If no itinerary exists, generate empty days based on trip dates
        if (!itineraryData || itineraryData.length === 0) {
          const days = generateEmptyDays(tripData)
          setItinerary(days)
        } else {
          setItinerary(itineraryData)
        }
      })
      .catch(() => toast.error('Failed to load trip'))
      .finally(() => setLoading(false))
  }, [tripId])

  const generateEmptyDays = (tripData) => {
    if (!tripData?.departure_date || !tripData?.return_date) return []
    
    const start = new Date(tripData.departure_date)
    const end = new Date(tripData.return_date)
    const days = []
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push({
        date: d.toISOString().split('T')[0],
        activities: []
      })
    }
    return days
  }

  const handleUpdateActivity = (dayIndex, activityIndex, updated) => {
    const newItinerary = [...itinerary]
    newItinerary[dayIndex].activities[activityIndex] = updated
    setItinerary(newItinerary)
  }

  const handleDeleteActivity = (dayIndex, activityIndex) => {
    const newItinerary = [...itinerary]
    newItinerary[dayIndex].activities.splice(activityIndex, 1)
    setItinerary(newItinerary)
  }

  const handleAddActivity = (dayIndex, activity) => {
    const newItinerary = [...itinerary]
    if (!newItinerary[dayIndex].activities) {
      newItinerary[dayIndex].activities = []
    }
    newItinerary[dayIndex].activities.push(activity)
    setItinerary(newItinerary)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateItinerary(tripId, itinerary)
      toast.success('Itinerary saved!')
    } catch (error) {
      toast.error('Failed to save itinerary')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!trip) return <p className="text-gray-500">Trip not found.</p>

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to={`/trips/${tripId}`} className="text-sm text-[#0071e3] hover:underline">
            ← Back to Trip
          </Link>
          <h1 className="text-2xl font-semibold text-[#1d1d1f] mt-1">
            {trip.destination} Itinerary
          </h1>
          <p className="text-sm text-gray-500">
            {new Date(trip.departure_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {new Date(trip.return_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#0071e3] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#005bb5] disabled:opacity50"
        >
          {saving ? 'Saving...' : 'Save Itinerary'}
        </button>
      </div>

      {/* Days */}
      <div className="space-y-4">
        {itinerary.map((day, index) => (
          <ItineraryDay
            key={day.date}
            day={day}
            dayIndex={index}
            onUpdateActivity={handleUpdateActivity}
            onDeleteActivity={handleDeleteActivity}
            onAddActivity={handleAddActivity}
          />
        ))}
      </div>

      {itinerary.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          No trip dates available. Please update your trip dates first.
        </p>
      )}
    </div>
  )
}