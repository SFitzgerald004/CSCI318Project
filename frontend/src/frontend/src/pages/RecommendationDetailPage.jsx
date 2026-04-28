import { Link, useLocation, useParams } from 'react-router-dom'

const CATEGORY_COLORS = {
  hotel: 'bg-blue-100 text-blue-700',
  restaurant: 'bg-orange-100 text-orange-700',
  attraction: 'bg-purple-100 text-purple-700',
  flight: 'bg-green-100 text-green-700',
  car_rental: 'bg-gray-100 text-gray-700',
}

export default function RecommendationDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const rec = location.state?.rec

  if (!rec) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">⭐</p>
        <h1 className="text-2xl font-semibold text-[#1d1d1f]">Recommendation unavailable</h1>
        <p className="text-sm text-gray-500 mt-2">
          This quick detail view only works when opened from the recommendations list.
        </p>
        <Link
          to={`/trips/${id}/recommendations`}
          className="mt-6 inline-block bg-[#0071e3] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#0077ed] transition-colors"
        >
          Back to Recommendations
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        to={`/trips/${id}/recommendations`}
        className="text-sm text-[#0071e3] hover:underline"
      >
        ← Back to Recommendations
      </Link>

      <div className="bg-white rounded-2xl shadow-sm p-6 mt-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
              CATEGORY_COLORS[rec.category] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {rec.category}
          </span>

          {/*
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">
            {rec.source?.replace('_', ' ')}
          </span>

          {rec.is_ai_pick && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
              AI Pick
            </span>
          )}
          */}
        </div>

        <h1 className="text-3xl font-semibold text-[#1d1d1f]">{rec.name}</h1>

        {rec.description && (
          <p className="text-sm text-gray-600 leading-7 mt-4 max-w-3xl">
            {rec.description}
          </p>
        )}

        {rec.image_url && (
          <img
            src={rec.image_url}
            alt={rec.name}
            className="w-full max-h-80 object-cover rounded-xl mt-6"
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <div className="bg-[#f5f5f7] rounded-xl p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Rating</p>
            <p className="text-lg font-semibold text-[#1d1d1f] mt-1">
              {rec.rating ? `⭐ ${rec.rating}` : 'Not available'}
            </p>
          </div>

          <div className="bg-[#f5f5f7] rounded-xl p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Price Level</p>
            <p className="text-lg font-semibold text-[#1d1d1f] mt-1">
              {rec.price_level || 'Not available'}
            </p>
          </div>

          <div className="bg-[#f5f5f7] rounded-xl p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Address</p>
            <p className="text-sm font-medium text-[#1d1d1f] mt-1">
              {rec.address || 'Not available'}
            </p>
          </div>

          <div className="bg-[#f5f5f7] rounded-xl p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Reviews</p>
            <p className="text-sm font-medium text-[#1d1d1f] mt-1">
              {rec.review_count || 'Not available'}
            </p>
          </div>
        </div>

        {rec.booking_url && (
          <a
            href={rec.booking_url}
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-6 text-sm text-[#0071e3] hover:underline"
          >
            Open Booking Link
          </a>
        )}
      </div>
    </div>
  )
}