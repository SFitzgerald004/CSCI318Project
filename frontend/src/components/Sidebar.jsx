import { Link, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sidebar({ tripName }) {
  const { id } = useParams()
  const location = useLocation()
  const { user, logout } = useAuth()

  // const isActive = (path) => location.pathname === path
  const isActive = (path) => {
    if (path === `/trips/${id}/recommendations`) {
      return location.pathname === path || location.pathname.startsWith(`${path}/`)
    }

    return location.pathname === path
  }

  const linkClass = (path) =>
    `block px-3 py-2 rounded-md text-sm transition-colors ${
      isActive(path)
        ? 'bg-[#0071e3] text-white font-medium'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`

  return (
    <aside className="w-56 bg-[#1d1d1f] min-h-screen flex flex-col p-5 flex-shrink-0">
      <Link to="/trips" className="text-white text-lg font-semibold mb-6">
        TripBudget
      </Link>

      {id ? (
        <>
          <Link to="/trips" className="text-gray-500 text-sm mb-4 hover:text-gray-300">
            ← All Trips
          </Link>
          <p className="px-3 text-xs uppercase tracking-wider text-gray-500 mb-2">
            {tripName || 'Trip'}
          </p>
          <nav className="flex flex-col gap-1">
            <Link to={`/trips/${id}`} className={linkClass(`/trips/${id}`)}>Overview</Link>
            <Link to={`/trips/${id}/budget`} className={linkClass(`/trips/${id}/budget`)}>Budget</Link>
            <Link to={`/trips/${id}/ai`} className={linkClass(`/trips/${id}/ai`)}>AI Advisor</Link>
            <Link to={`/trips/${id}/recommendations`} className={linkClass(`/trips/${id}/recommendations`)}>Recommendations</Link>
            <Link to={`/trips/${id}/itinerary`} className={linkClass(`/trips/${id}/itinerary`)}>Itinerary</Link>
            <Link to={`/trips/${id}/flights`} className={linkClass(`/trips/${id}/flights`)}>Flights</Link>
          </nav>
        </>
      ) : (
        <nav className="flex flex-col gap-1">
          <Link to="/trips" className={linkClass('/trips')}>My Trips</Link>
        </nav>
      )}

      <div className="mt-auto pt-4 border-t border-white/10">
        <p className="text-gray-500 text-xs truncate">{user?.email}</p>
        <button
          onClick={logout}
          className="text-gray-600 text-xs mt-2 hover:text-gray-400 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
