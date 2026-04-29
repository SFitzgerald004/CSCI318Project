import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTrip, getItinerary, updateItinerary } from '../services/tripService'
import { generateItinerary } from '../services/aiService'
import ItineraryDay from '../components/ItineraryDay'
import LoadingSpinner from '../components/LoadingSpinner'
import { EdIcon, Topbar } from '../components/editorial'
import { longDate, daysFromToday } from '../components/editorialHelpers'
import toast from 'react-hot-toast'

export default function ItineraryPage() {
  const { id: tripId } = useParams()
  const [trip, setTrip] = useState(null)
  const [itinerary, setItinerary] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    Promise.all([
      getTrip(tripId),
      getItinerary(tripId).catch(() => []),
    ])
      .then(([tripData, itineraryData]) => {
        setTrip(tripData)
        if (!itineraryData || itineraryData.length === 0) {
          setItinerary(generateEmptyDays(tripData))
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
        activities: [],
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
      toast.success('Itinerary saved')
    } catch {
      toast.error('Failed to save itinerary')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const data = await generateItinerary(tripId)
      if (data?.itinerary) {
        setItinerary(data.itinerary)
        toast.success('Itinerary drafted from your saved ideas')
      }
    } catch (err) {
      const msg = err?.response?.data?.error || 'Could not generate itinerary'
      toast.error(msg)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!trip) {
    return (
      <div style={{ padding: 48 }}>
        <p className="serif-i" style={{ fontSize: 22, color: 'var(--ink-2)' }}>"Trip not found."</p>
      </div>
    )
  }

  const days = daysFromToday(trip.departure_date)
  const numDays = itinerary.length
  const totalActivities = itinerary.reduce(
    (sum, day) => sum + (day.activities?.length || 0),
    0,
  )

  return (
    <>
      <Topbar
        sub={`${trip.destination}${days !== null && days >= 0 ? ` · ${days} days out` : ''}`}
        title="Itinerary"
        action={(
          <>
            <button
              className="btn ghost"
              onClick={handleGenerate}
              disabled={generating || saving}
            >
              <EdIcon name="sparkle" size={12} />
              {generating ? 'Drafting…' : 'Auto-draft'}
            </button>
            <button className="btn" onClick={handleSave} disabled={saving || generating}>
              {saving ? 'Saving…' : 'Save itinerary'}
            </button>
          </>
        )}
      />

      <div style={{ padding: '32px 48px 16px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 920 }}>
        <Link to={`/trips/${tripId}`} className="link">← Back to trip</Link>
        <span className="eyebrow">A travelogue, day-by-day</span>
        <div className="serif" style={{ fontSize: 56, lineHeight: 0.95, letterSpacing: '-0.02em' }}>
          {trip.destination}
          <span className="serif-i" style={{ color: 'var(--indigo)' }}>,</span>
          <br />
          <span className="serif-i">in {numDays} {numDays === 1 ? 'day' : 'days'}.</span>
        </div>
        <p className="body-l" style={{ maxWidth: 560 }}>
          {longDate(trip.departure_date)} — {longDate(trip.return_date)}.{' '}
          {totalActivities > 0
            ? `${totalActivities} ${totalActivities === 1 ? 'plan' : 'plans'} so far.`
            : 'Auto-draft to populate it from your saved ideas, or add activities by hand below.'}
        </p>
      </div>

      <div className="rule-thin" style={{ margin: '24px 48px 0', width: 'auto' }} />

      <div style={{ padding: '0 48px 48px' }}>
        {itinerary.length === 0 ? (
          <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 520 }}>
            <div className="serif-i" style={{ fontSize: 22, color: 'var(--ink-2)' }}>
              "No trip dates yet. Set departure and return on the trip overview, then return here."
            </div>
            <Link to={`/trips/${tripId}`} className="btn ghost" style={{ alignSelf: 'flex-start' }}>
              Open trip overview <EdIcon name="arrow" size={12} />
            </Link>
          </div>
        ) : (
          <div>
            {itinerary.map((day, index) => (
              <ItineraryDay
                key={day.date || index}
                day={day}
                dayIndex={index}
                onUpdateActivity={handleUpdateActivity}
                onDeleteActivity={handleDeleteActivity}
                onAddActivity={handleAddActivity}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
