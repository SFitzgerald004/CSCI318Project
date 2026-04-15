import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getRecommendations, deleteRecommendation } from '../services/recommendationService'
import RecommendationCard from '../components/RecommendationCard'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const TABS = [
  { label: 'All', value: null },
  { label: 'Hotels', value: 'hotel' },
  { label: 'Restaurants', value: 'restaurant' },
  { label: 'Attractions', value: 'attraction' },
]

export default function RecommendationsPage() {
  const { id } = useParams()
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(null)

  useEffect(() => {
    loadRecs()
  }, [id, activeTab])

  async function loadRecs() {
    setLoading(true)
    try {
      const data = await getRecommendations(id, activeTab)
      setRecs(data)
    } catch {
      toast.error('Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(recId) {
    try {
      await deleteRecommendation(id, recId)
      setRecs((prev) => prev.filter((r) => r.id !== recId))
      toast.success('Recommendation removed')
    } catch {
      toast.error('Failed to delete recommendation')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1d1d1f]">Recommendations</h1>
      <p className="text-sm text-gray-500 mt-1">Saved hotels, restaurants, and attractions</p>

      {/* Tabs */}
      <div className="flex gap-2 mt-6">
        {TABS.map((tab) => (
          <button key={tab.label} onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              activeTab === tab.value
                ? 'bg-[#0071e3] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner inline />
      ) : recs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">⭐</p>
          <h2 className="text-lg font-semibold text-[#1d1d1f]">No recommendations yet</h2>
          <p className="text-sm text-gray-500 mt-1">Try the AI Advisor to get personalized picks</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {recs.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} onDelete={() => handleDelete(rec.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
