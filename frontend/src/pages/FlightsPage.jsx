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
                
            </div>
        </div>
    )
}