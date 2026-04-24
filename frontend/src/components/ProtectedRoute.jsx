import { Navigate, Outlet, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'
import LoadingSpinner from './LoadingSpinner'
import { useState, useEffect } from 'react'
import { getTrip } from '../services/tripService'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const { id } = useParams()
  const [tripName, setTripName] = useState('')

  useEffect(() => {
    if (id && user) {
      getTrip(id).then((trip) => setTripName(trip.destination)).catch(() => setTripName('Trip'))
    }
  }, [id, user])

  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen">
      <Sidebar tripName={tripName} />
      <main className="flex-1 overflow-y-auto" style={{ background: 'linear-gradient(135deg, #FFF9F0 0%, #FFF0E8 100%)' }}>
        <Outlet />
      </main>
    </div>
  )
}
