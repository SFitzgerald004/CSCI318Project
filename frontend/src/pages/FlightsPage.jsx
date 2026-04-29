import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTrip } from '../services/tripService'
import { getFlightRecommendations } from '../services/aiService'
import { createRecommendation } from '../services/recommendationService'
import LoadingSpinner from '../components/LoadingSpinner'
import { EdIcon, Topbar } from '../components/editorial'
import { shortDate } from '../components/editorialHelpers'
import toast from 'react-hot-toast'

const PRICE_LABEL = {
  budget:      'Budget',
  'mid-range': 'Mid-range',
  premium:     'Premium',
}

const PRICE_COLOR = {
  budget:      'var(--green-deep)',
  'mid-range': 'var(--indigo)',
  premium:     'var(--clay)',
}

export default function FlightsPage() {
  const { id: tripId } = useParams()
  const [trip, setTrip] = useState(null)
  const [tripLoading, setTripLoading] = useState(true)
  const [origin, setOrigin] = useState('JFK')
  const [destination, setDestination] = useState('')
  const [flights, setFlights] = useState([])
  const [savedFlights, setSavedFlights] = useState(new Set())
  const [searching, setSearching] = useState(false)
  const [savingIdx, setSavingIdx] = useState(null)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    getTrip(tripId)
      .then(setTrip)
      .catch(() => toast.error('Failed to load trip'))
      .finally(() => setTripLoading(false))
  }, [tripId])

  const handleSearch = async (e) => {
    e?.preventDefault?.()
    if (!origin || !destination) {
      toast.error('Enter both origin and destination airport codes')
      return
    }
    setSearching(true)
    setSearched(true)
    try {
      const data = await getFlightRecommendations(
        tripId,
        origin.toUpperCase(),
        destination.toUpperCase(),
      )
      setFlights(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to get flight recommendations')
    } finally {
      setSearching(false)
    }
  }

  const handleSaveFlight = async (flight, idx) => {
    if (savedFlights.has(idx)) return
    setSavingIdx(idx)
    try {
      await createRecommendation(tripId, {
        name: `${flight.airline} ${flight.flight_number}`,
        description: `${origin} → ${destination} | ${flight.departure_time} – ${flight.arrival_time} | ${flight.duration}`,
        category: 'flight',
        source: 'ai_generated',
        is_ai_pick: true,
      })
      setSavedFlights((prev) => new Set([...prev, idx]))
      toast.success(`Saved ${flight.airline} ${flight.flight_number}`)
    } catch {
      toast.error('Failed to save flight')
    } finally {
      setSavingIdx(null)
    }
  }

  if (tripLoading) return <LoadingSpinner />

  const dateRange = trip?.departure_date && trip?.return_date
    ? `${shortDate(trip.departure_date)} – ${shortDate(trip.return_date)}`
    : ''

  return (
    <>
      <Topbar
        sub={trip ? `${trip.destination}${dateRange ? ` · ${dateRange}` : ''}` : 'Flights'}
        title="Flight options"
        action={(
          <Link to={`/trips/${tripId}/recommendations`} className="btn ghost">
            Saved <EdIcon name="arrow" size={12} />
          </Link>
        )}
      />

      <div style={{ padding: '32px 48px 16px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 920 }}>
        <Link to={`/trips/${tripId}`} className="link">← Back to trip</Link>
        <span className="eyebrow">Departures, in order</span>
        <div className="serif" style={{ fontSize: 56, lineHeight: 0.95, letterSpacing: '-0.02em' }}>
          From <span className="serif-i" style={{ color: 'var(--indigo)' }}>{origin || '—'}</span>
          <br />
          to <span className="serif-i">{destination || (trip?.destination ?? '—')}</span>
        </div>
        <p className="body-l" style={{ maxWidth: 540 }}>
          Enter IATA codes for both ends of your route. The advisor will sketch five candidate
          flights with airline, times, duration, and a price tier.
        </p>
      </div>

      <div className="rule-thin" style={{ margin: '16px 48px 0', width: 'auto' }} />

      {/* Search form */}
      <form
        onSubmit={handleSearch}
        style={{
          padding: '24px 48px 16px',
          display: 'flex',
          gap: 24,
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          maxWidth: 920,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 }}>
          <label htmlFor="origin-iata" className="ed-input-label">Origin · IATA</label>
          <input
            id="origin-iata"
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value.toUpperCase())}
            className="ed-input"
            placeholder="JFK"
            maxLength={3}
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 22,
              letterSpacing: '0.18em',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 }}>
          <label htmlFor="dest-iata" className="ed-input-label">Destination · IATA</label>
          <input
            id="dest-iata"
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value.toUpperCase())}
            className="ed-input"
            placeholder="LAX"
            maxLength={3}
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 22,
              letterSpacing: '0.18em',
            }}
          />
        </div>
        <button type="submit" disabled={searching} className="btn">
          <EdIcon name="sparkle" size={12} />
          {searching ? 'Searching…' : 'Get recommendations'}
        </button>
      </form>

      <div style={{ padding: '24px 48px 48px' }}>
        {flights.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: 0,
            }}
          >
            {flights.map((flight, idx) => (
              <FlightRow
                key={idx}
                num={String(idx + 1).padStart(2, '0')}
                flight={flight}
                origin={origin}
                destination={destination}
                saved={savedFlights.has(idx)}
                saving={savingIdx === idx}
                onSave={() => handleSaveFlight(flight, idx)}
              />
            ))}
          </div>
        ) : searched && !searching ? (
          <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 520 }}>
            <div className="serif-i" style={{ fontSize: 22, color: 'var(--ink-2)' }}>
              "No flights came back. Double-check the airport codes and try again."
            </div>
          </div>
        ) : (
          <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 520 }}>
            <div className="serif-i" style={{ fontSize: 22, color: 'var(--ink-2)' }}>
              "Three letters, two airports. Then a draft of options."
            </div>
            <span className="cap">Example: JFK → LAX</span>
          </div>
        )}
      </div>
    </>
  )
}

function FlightRow({ num, flight, origin, destination, saved, saving, onSave }) {
  const tier = flight.price_range || 'mid-range'
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: '24px 0',
        borderBottom: '1px solid var(--rule)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <span className="mono" style={{ fontSize: 12, color: 'var(--indigo)' }}>{num}</span>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 30, lineHeight: 1, letterSpacing: '-0.01em' }}>
            {flight.airline}
          </span>
          <span className="mono" style={{ fontSize: 13, color: 'var(--ink-3)' }}>{flight.flight_number}</span>
        </div>
        <span
          className="chip"
          style={{
            background: 'transparent',
            borderColor: PRICE_COLOR[tier] || 'var(--rule)',
            color: PRICE_COLOR[tier] || 'var(--ink-2)',
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            fontSize: 10,
          }}
        >
          {PRICE_LABEL[tier] || tier}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 70 }}>
          <span className="mono" style={{ fontSize: 22, fontWeight: 500 }}>{flight.departure_time}</span>
          <span className="cap mono" style={{ fontSize: 10, letterSpacing: '0.16em' }}>{origin}</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span className="cap" style={{ fontSize: 10 }}>{flight.duration}</span>
          <div style={{ width: '100%', height: 1, background: 'var(--ink)', position: 'relative' }}>
            <span style={{ position: 'absolute', right: -4, top: -7, fontSize: 12, color: 'var(--indigo)' }}>›</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 70, textAlign: 'right' }}>
          <span className="mono" style={{ fontSize: 22, fontWeight: 500 }}>{flight.arrival_time}</span>
          <span className="cap mono" style={{ fontSize: 10, letterSpacing: '0.16em' }}>{destination}</span>
        </div>
      </div>

      {flight.notes && (
        <span className="serif-i" style={{ fontSize: 15, color: 'var(--ink-2)' }}>"{flight.notes}"</span>
      )}

      <button
        type="button"
        onClick={onSave}
        disabled={saved || saving}
        className={saved ? 'btn ghost' : 'btn'}
        style={{
          alignSelf: 'flex-start',
          opacity: saved ? 0.7 : 1,
        }}
      >
        {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save to itinerary'}
      </button>
    </div>
  )
}
