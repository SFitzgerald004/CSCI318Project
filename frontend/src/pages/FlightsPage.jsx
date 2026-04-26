// FlightsPage.jsx

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTrip, getFlights } from '../services/tripService'
import { getFlights as fetchFlights } from '../services/flightService'
import FlightCard from '../components/FlightCard'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function FlightsPage() {
    const { id: tripId } = useParams()
    const [trip, setTrip] = useState(null)
    const [flights, setFlights] = useState([])
    const [loading, setLoading] = useState(true)
    const [origin, setOrigin] = useState('JFK')

    useEffect(() => {
        getTrip(tripId)
            .then(setTrip)
            .catch(() => toast.error('Failed to load trip'))
            .finally(() => setLoading(false))
    }, [tripId])

    const handleSearch = async () => {
        setLoading(true)
        try {
            const data = await fetchFlights(tripId, origin, trip?.num_travelers || 1)
            setFlights(data)
        } catch {
            toast.error('Failed to search flights')
        } finally {
            setLoading(false)
        }
    }

    if (loading && !trip) return <LoadingSpinner />

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <Link to={`/trips/${tripId}`} className="text-sm text-[#0071e3] hover:underline">
                    Back to trip
                </Link>
                <h1 className="text-2xl font-semibold text-[#1d1d1f] mt-1">
                    Flights to {trip?.destination}
                </h1>
                <p className="text-sm test-gray-500">
                    {trip ? new Date(trip.departure_date).toLocaleDateString() : ''} - {trip ? new Date(trip.return_date).toLocaleDateString() : ''}
                </p>
            </div>

            {/* Search Form */}
            <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
                <div className="flex gap-4 items-end">
                <div className="flex-1">
                    <label className="text-sm text-gray-500">From</label>
                    <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Airport code (e.g., JFK)"
                    maxLength={3}
                    />
                </div>
                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="bg-[#0071e3] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#005bb5] disabled:opacity50"
                >
                    {loading ? 'Searching...' : 'Search Flights'}
                </button>
                </div>
            </div>

            {/* Flight Results */}
            {flights.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flights.map((flight) => (
                    <FlightCard key={flight.id} flight={flight} />
                ))}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-4">✈️</p>
                <p>Search for flights to see available options</p>
                </div>
            )}
        </div>
    )
}