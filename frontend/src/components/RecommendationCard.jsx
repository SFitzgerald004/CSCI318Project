import { TrashIcon } from '@heroicons/react/24/outline'
import { Link, useParams } from 'react-router-dom'

const CATEGORY_COLORS = {
  hotel: 'bg-blue-100 text-blue-700',
  restaurant: 'bg-orange-100 text-orange-700',
  attraction: 'bg-purple-100 text-purple-700',
  flight: 'bg-green-100 text-green-700',
  car_rental: 'bg-gray-100 text-gray-700',
}

export default function RecommendationCard({ rec, onDelete }) {
  const { id } = useParams()

  function handleDelete(event) {
    event.preventDefault()
    event.stopPropagation()
    onDelete()
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm relative group">
      <button 
        onClick={onDelete}
        className="absolute top-3 right-3 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={`Delete ${rec.name}`}
      >
        <TrashIcon className="w-4 h-4" />
      </button>


      <Link
        to={`/trips/${id}/recommendations/${rec.id}`}
        state={{ rec }}
        className="block"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${CATEGORY_COLORS[rec.category] || 'bg-gray-100 text-gray-700'}`}>
            {rec.category}
          </span>
          {/* <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">{rec.source?.replace('_', ' ')}</span> */}
          {/* {rec.is_ai_pick && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">AI Pick</span>} */}
        </div>

        <h3 className="text-sm font-semibold text-[#1d1d1f]">{rec.name}</h3>
        {rec.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{rec.description}</p>}

        <div className="flex items-center justify-between gap-3 mt-3 text-xs text-gray-500">
          {rec.rating && <span>⭐ {rec.rating}</span>}
          {rec.price_level && <span>{rec.price_level}</span>}
        </div>
      </Link>
    </div>
  )
}
