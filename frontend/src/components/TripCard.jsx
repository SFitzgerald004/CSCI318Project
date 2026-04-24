import { Link } from 'react-router-dom'

const PURPOSE_COLOR = {
  vacation: '#800020',
  business: '#2D3561',
  family: '#A18CD1',
  adventure: '#4ECDC4',
}

const PURPOSE_EMOJI = {
  vacation: '🌴',
  business: '💼',
  family: '👨‍👩‍👧‍👦',
  adventure: '🏔️',
}

export default function TripCard({ trip }) {
  const departure = new Date(trip.departure_date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
  const returnDate = new Date(trip.return_date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
  const color = PURPOSE_COLOR[trip.trip_purpose] || '#2D3561'

  return (
    <Link to={`/trips/${trip.id}`} className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="px-5 pt-5 pb-6 text-white" style={{ background: color }}>
        <div className="text-2xl mb-2">{PURPOSE_EMOJI[trip.trip_purpose] || '✈️'}</div>
        <h3 className="font-bold text-lg">{trip.destination}</h3>
        <span className="inline-block bg-white/20 text-xs font-semibold px-2 py-0.5 rounded-full mt-1 capitalize">
          {trip.trip_purpose}
        </span>
      </div>
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-gray-400">Budget</p>
            <p className="font-bold" style={{ color: '#2D3561' }}>${trip.total_budget.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Travelers</p>
            <p className="text-sm font-semibold text-gray-700">{trip.num_travelers}</p>
          </div>
        </div>
        <p className="text-xs text-gray-400">{departure} — {returnDate}</p>
      </div>
    </Link>
  )
}
