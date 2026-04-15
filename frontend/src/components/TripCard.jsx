import { Link } from 'react-router-dom'

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

  return (
    <Link
      to={`/trips/${trip.id}`}
      className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="text-2xl mb-2">
        {PURPOSE_EMOJI[trip.trip_purpose] || '✈️'}
      </div>
      <h3 className="text-sm font-semibold text-[#1d1d1f]">{trip.destination}</h3>
      <p className="text-xs text-gray-500 mt-1 capitalize">{trip.trip_purpose} · {trip.num_travelers} traveler{trip.num_travelers > 1 ? 's' : ''}</p>
      <p className="text-xs text-gray-500">{departure} – {returnDate}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-base font-semibold text-[#1d1d1f]">${trip.total_budget.toLocaleString()}</span>
        <span className="text-xs text-[#0071e3]">View →</span>
      </div>
    </Link>
  )
}
