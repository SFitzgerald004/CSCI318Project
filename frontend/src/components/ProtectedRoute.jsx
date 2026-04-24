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
      getTrip(id)
        .then((trip) => setTripName(trip.destination))
        .catch(() => setTripName('Trip'))
    }
  }, [id, user])

  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen">
      <Sidebar tripName={tripName} />
      <main className="flex-1 bg-[#f5f5f7] p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
