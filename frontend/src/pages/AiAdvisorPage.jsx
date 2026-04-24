import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getAllocation } from '../services/budgetService'
import { analyzeBudget, getAiRecommendations } from '../services/aiService'
import api from '../services/api'
import AiInsightCard from '../components/AiInsightCard'
import AiChatPanel from '../components/AiChatPanel'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function AiAdvisorPage() {
  const { id } = useParams()
  const [hasBudget, setHasBudget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeAction, setActiveAction] = useState(null)
  const [messages, setMessages] = useState([])
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    getAllocation(id)
      .then(() => setHasBudget(true))
      .catch(() => setHasBudget(false))
      .finally(() => setLoading(false))
  }, [id])

  async function handleAnalyze() {
    setActiveAction('analyze')
    setMessages((prev) => [...prev, { role: 'user', content: 'Analyze my budget allocation' }])
    try {
      const { advice } = await analyzeBudget(id)
      setMessages((prev) => [...prev, { role: 'ai', content: advice }])
    } catch {
      toast.error('AI service unavailable')
      setMessages((prev) => [...prev, { role: 'ai', content: "Sorry, I couldn't analyze your budget right now." }])
    } finally {
      setActiveAction(null)
    }
  }

  async function handleRecommend(focus) {
    setActiveAction(focus)
    setMessages((prev) => [...prev, { role: 'user', content: `Get ${focus} recommendations` }])
    try {
      const result = await getAiRecommendations(id, focus)
      const advice = result.advice ?? result.recommendations ?? JSON.stringify(result)
      setMessages((prev) => [...prev, { role: 'ai', content: advice }])
    } catch {
      toast.error('AI service unavailable')
      setMessages((prev) => [...prev, { role: 'ai', content: "Sorry, I couldn't get recommendations right now." }])
    } finally {
      setActiveAction(null)
    }
  }

  async function handleFreeChat(message) {
    setMessages((prev) => [...prev, { role: 'user', content: message }])
    setChatLoading(true)
    try {
      const { data } = await api.post(`/ai/${id}/chat`, { message })
      setMessages((prev) => [...prev, { role: 'ai', content: data.reply }])
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', content: "Sorry, I couldn't respond right now." }])
    } finally {
      setChatLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  if (!hasBudget) {
    return (
      <div style={{ minHeight: '100vh', padding: '2rem' }}>
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-2">Generate a budget first</p>
          <p className="text-gray-400 text-sm mb-6">The AI advisor needs a budget allocation to work with.</p>
          <Link to={`/trips/${id}/budget`}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#800020' }}>
            Go to Budget
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#2D3561' }}>AI Advisor</h1>
        <p className="text-gray-500 mt-1 text-sm">Get AI-powered budget analysis and recommendations</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <AiInsightCard icon="📊" title="Analyze Budget" description="Get AI feedback on your allocation"
          onClick={handleAnalyze} loading={activeAction === 'analyze'} />
        <AiInsightCard icon="🌍" title="Overall" description="Get overall recommendations"
          onClick={() => handleRecommend('overall')} loading={activeAction === 'overall'} />
        <AiInsightCard icon="🏨" title="Hotels" description="Get hotel picks"
          onClick={() => handleRecommend('hotels')} loading={activeAction === 'hotels'} />
        <AiInsightCard icon="🍽️" title="Food" description="Get food picks"
          onClick={() => handleRecommend('food')} loading={activeAction === 'food'} />
        <AiInsightCard icon="🎯" title="Activities" description="Get activity picks"
          onClick={() => handleRecommend('activities')} loading={activeAction === 'activities'} />
      </div>
      <AiChatPanel
        messages={messages}
        onSend={handleFreeChat}
        loading={chatLoading || activeAction !== null}
      />
    </div>
  )
}
