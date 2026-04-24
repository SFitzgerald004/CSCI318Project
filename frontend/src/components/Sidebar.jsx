import { Link, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sidebar({ tripName }) {
  const { id } = useParams()
  const location = useLocation()
  const { user, logout } = useAuth()

  const isActive = (path) => location.pathname === path

  const linkClass = (path) =>
    `flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
      isActive(path)
        ? 'bg-white text-[#800020] shadow-sm'
        : 'text-white/70 hover:text-white hover:bg-white/10'
    }`

  return (
    <aside className="w-56 min-h-screen flex flex-col p-5 flex-shrink-0"
      style={{ background: '#2D3561' }}>
      <Link to="/trips" className="mb-8 block">
        <span className="text-white font-bold text-lg">TripBudget</span>
      </Link>

      {id ? (
        <>
          <Link to="/trips" className="text-white/50 text-xs mb-5 hover:text-white/80 transition-colors">
            ← All Trips
          </Link>
          <div className="px-3 mb-3">
            <p className="text-white/40 text-xs uppercase tracking-widest">Current Trip</p>
            <p className="text-white font-semibold text-sm mt-1 truncate">{tripName || 'Trip'}</p>
          </div>
          <nav className="flex flex-col gap-1">
            <Link to={`/trips/${id}`} className={linkClass(`/trips/${id}`)}>Overview</Link>
            <Link to={`/trips/${id}/budget`} className={linkClass(`/trips/${id}/budget`)}>Budget</Link>
            <Link to={`/trips/${id}/ai`} className={linkClass(`/trips/${id}/ai`)}>AI Advisor</Link>
            <Link to={`/trips/${id}/recommendations`} className={linkClass(`/trips/${id}/recommendations`)}>Recommendations</Link>
          </nav>
        </>
      ) : (
        <nav className="flex flex-col gap-1">
          <Link to="/trips" className={linkClass('/trips')}>My Trips</Link>
        </nav>
      )}

      <div className="mt-auto pt-4 border-t border-white/10">
        <p className="text-white/40 text-xs truncate mb-2">{user?.email}</p>
        <button onClick={logout} className="text-white/40 text-xs hover:text-white/70 transition-colors">
          Sign Out
        </button>
      </div>
    </aside>
  )
}
