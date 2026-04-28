import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import Sidebar from './Sidebar'
import { useState, useEffect } from 'react'
import { getTrip } from '../services/tripService'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const { id } = useParams()
  const [tripName, setTripName] = useState('')

  useEffect(() => {
    if (id && user) {
      getTrip(id)
        .then((trip) => setTripName(trip.destination))
        .catch(() => setTripName('Trip'))
    }
  }, [id, user])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-surface-light">
      <div className="w-8 h-8 border-4 border-apple-blue border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen">
      <Sidebar tripName={tripName} />
      <main className="flex-1 bg-surface-light p-8 pt-20 md:pt-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
