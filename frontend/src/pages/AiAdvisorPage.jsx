import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getAllocation } from '../services/budgetService'
import { analyzeBudget, getAiRecommendations, chatWithAi } from '../services/aiService'
import { createRecommendation } from '../services/recommendationService'
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
  const [sendingChat, setSendingChat] = useState(false)

  useEffect(() => {
    getAllocation(id)
      .then(() => setHasBudget(true))
      .catch(() => setHasBudget(false))
      .finally(() => setLoading(false))
  }, [id])

  async function handleAnalyze() {
    setActiveAction('analyze')
    setMessages((prev) => [...prev, { role: 'user', content: '📊 Analyze my budget allocation' }])
    try {
      const { advice } = await analyzeBudget(id)
      setMessages((prev) => [...prev, { role: 'ai', content: advice }])
    } catch {
      toast.error('AI service unavailable')
      setMessages((prev) => [...prev, { role: 'ai', content: 'Sorry, I couldn\'t analyze your budget right now. Please try again.' }])
    } finally {
      setActiveAction(null)
    }
  }

  async function handleRecommend(focus) {
    setActiveAction(focus)
    setMessages((prev) => [...prev, { role: 'user', content: `🔍 Get ${focus} recommendations` }])
    try {
      const { advice, items } = await getAiRecommendations(id, focus)
      // Store items on the message so AiChatPanel can show Save buttons
      setMessages((prev) => [...prev, { role: 'ai', content: advice, items, focus }])
    } catch {
      toast.error('AI service unavailable')
      setMessages((prev) => [...prev, { role: 'ai', content: "Sorry, couldn't get recommendations right now." }])
    } finally {
      setActiveAction(null)
    }
  }

  async function handleSave(item, focus) {
    // Map focus to the recommendation category the backend expects
    const categoryMap = { hotels: 'hotel', food: 'restaurant', activities: 'attraction', overall: 'attraction' }
    try {
      await createRecommendation(id, {
        name: item.name,
        description: item.description,
        category: categoryMap[focus] || 'attraction',
        source: 'ai_generated',
        is_ai_pick: true,
      })
      toast.success(`Saved ${item.name}!`)
    } catch {
      toast.error('Failed to save recommendation')
    }
  }

  if (loading) return <LoadingSpinner />

  if (!hasBudget) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">📊</p>
        <h2 className="text-lg font-semibold text-[#1d1d1f]">Generate a budget first</h2>
        <p className="text-sm text-gray-500 mt-1">The AI advisor needs a budget allocation to work with.</p>
        <Link to={`/trips/${id}/budget`}
          className="mt-4 inline-block bg-[#0071e3] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#0077ed] transition-colors">
          Go to Budget
        </Link>
      </div>
    )
  }

  async function handleChatSend(content) {
    const nextUserMessage = { role: 'user', content }
    const nextMessages = [...messages, nextUserMessage]

    setMessages(nextMessages)
    setSendingChat(true)

    try {
      const history = messages.map((msg) => ({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.content
      }))

      const { response } = await chatWithAi(id, content, history)

      setMessages((prev) => [...prev, { role: 'ai', content: response }])
    } catch {
      toast.error('AI chat unavailable')
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: "Sorry, I couldn't respond right now. Please try again."}
      ])
    } finally {
      setSendingChat(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1d1d1f]">AI Advisor</h1>
      <p className="text-sm text-gray-500 mt-1">Get AI-powered budget analysis and recommendations</p>

      {/* Insight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
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

      {/* Chat Panel */}
      <div className="mt-4">
        <AiChatPanel
          messages={messages}
          onSave={handleSave}
          onSend={handleChatSend}
          sending={sendingChat}
        />
      </div>
    </div>
  )
}
