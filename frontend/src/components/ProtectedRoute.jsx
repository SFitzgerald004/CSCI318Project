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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--paper)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: '2px solid var(--rule)',
          borderTopColor: 'var(--indigo)',
          borderRadius: '50%',
          animation: 'spin 0.9s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="ed-shell">
      <Sidebar tripName={tripName} />
      <main className="ed-main">
        <Outlet />
      </main>
    </div>
  )
}
