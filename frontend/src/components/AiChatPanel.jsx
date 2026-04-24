import { useEffect, useRef, useState } from 'react'

export default function AiChatPanel({ messages, onSend, loading }) {
  const bottomRef = useRef(null)
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState({})

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim() || loading) return
    onSend(input.trim())
    setInput('')
  }

  function handleFeedback(index, type) {
    setFeedback((prev) => ({ ...prev, [index]: prev[index] === type ? null : type }))
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden" style={{ height: '500px' }}>
      <div className="px-5 py-3 flex items-center gap-2 border-b border-gray-100"
        style={{ background: 'linear-gradient(135deg, #2D3561, #4ECDC4)' }}>
        <span className="text-lg">🤖</span>
        <span className="text-white font-800 text-sm">AI Travel Chat</span>
        <span className="ml-auto text-white/60 text-xs font-600">Ask me anything about your trip!</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: '#FAFAF8' }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3">✈️</div>
            <p className="font-700" style={{ color: '#2D3561' }}>Your AI travel advisor is ready!</p>
            <p className="text-gray-500 text-sm mt-1 font-600">Click a quick action above or type your question below</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #4ECDC4, #44A08D)' }}>🤖</div>
            )}
            <div className="max-w-[80%]">
              <div className={`rounded-2xl px-4 py-3 text-sm font-600 leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user' ? 'text-white' : 'text-gray-700 bg-white shadow-sm'
              }`} style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #2D3561, #667EEA)' } : {}}>
                {msg.content}
              </div>
              {msg.role === 'ai' && (
                <div className="flex items-center gap-2 mt-1.5 px-1">
                  <span className="text-xs text-gray-400 font-600">Helpful?</span>
                  <button onClick={() => handleFeedback(i, 'up')} className="text-sm transition-transform hover:scale-110">
                    <span style={{ filter: feedback[i] === 'up' ? 'none' : 'grayscale(1)', opacity: feedback[i] === 'up' ? 1 : 0.5 }}>👍</span>
                  </button>
                  <button onClick={() => handleFeedback(i, 'down')} className="text-sm transition-transform hover:scale-110">
                    <span style={{ filter: feedback[i] === 'down' ? 'none' : 'grayscale(1)', opacity: feedback[i] === 'down' ? 1 : 0.5 }}>👎</span>
                  </button>
                  {feedback[i] === 'up' && <span className="text-xs text-green-500 font-600">Thanks!</span>}
                  {feedback[i] === 'down' && <span className="text-xs text-orange-400 font-600">Got it, I'll improve!</span>}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 font-700"
                style={{ background: 'linear-gradient(135deg, #800020, #FFE66D)', color: '#2D3561' }}>U</div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg, #4ECDC4, #44A08D)' }}>🤖</div>
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2">
              <span className="text-xs text-gray-400 font-600">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-gray-100 bg-white">
        <div className="flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit(e)}
            placeholder="Ask about hotels, food, activities, budget tips..."
            disabled={loading}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm font-600 focus:outline-none border-2 border-gray-100 focus:border-[#4ECDC4] transition-colors disabled:opacity-50" />
          <button onClick={handleSubmit} disabled={!input.trim() || loading}
            className="text-white px-4 py-2.5 rounded-xl text-sm font-700 transition-opacity disabled:opacity-40 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #4ECDC4, #44A08D)' }}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
