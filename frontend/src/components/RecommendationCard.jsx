import { TrashIcon } from '@heroicons/react/24/outline'

const CATEGORY_STYLE = {
  hotel:      { bg: '#4ECDC415', color: '#44A08D', emoji: '🏨' },
  restaurant: { bg: '#80002015', color: '#800020', emoji: '🍽️' },
  attraction: { bg: '#A18CD115', color: '#A18CD1', emoji: '🎡' },
  flight:     { bg: '#96FBC415', color: '#44A08D', emoji: '✈️' },
  car_rental: { bg: '#FFE66D15', color: '#F59E0B', emoji: '🚗' },
}

export default function RecommendationCard({ rec, onDelete }) {
  const style = CATEGORY_STYLE[rec.category] || { bg: '#f3f4f6', color: '#6b7280', emoji: '📍' }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm relative group card-hover border-2 border-transparent hover:border-gray-100 transition-all">
      <button onClick={onDelete}
        className="absolute top-4 right-4 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <TrashIcon className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: style.bg }}>
          {style.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-800 text-sm truncate pr-6" style={{ color: '#2D3561' }}>{rec.name}</h3>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full font-700 capitalize" style={{ background: style.bg, color: style.color }}>{rec.category}</span>
            {rec.source && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-600 capitalize">{rec.source.replace('_', ' ')}</span>}
            {rec.is_ai_pick && <span className="text-xs px-2 py-0.5 rounded-full font-700" style={{ background: '#FFE66D40', color: '#D97706' }}>🤖 AI Pick</span>}
          </div>
        </div>
      </div>
      {rec.description && <p className="text-xs text-gray-500 mb-3 font-600 line-clamp-2">{rec.description}</p>}
      <div className="flex items-center gap-3 text-xs text-gray-500 font-600">
        {rec.rating && <span>⭐ {rec.rating}</span>}
        {rec.price_level && <span style={{ color: style.color }}>{rec.price_level}</span>}
        {rec.address && <span className="truncate text-gray-400">{rec.address}</span>}
      </div>
    </div>
  )
}
