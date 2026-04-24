import { useEffect, useRef, useState } from 'react'

export default function AiChatPanel({ messages, onSave, onSend, sending }) {
  const bottomRef = useRef(null)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e) {
    e.preventDefault()
    const message = draft.trim()
    if (!message || sending) return
    setDraft('')
    await onSend(message)
  }

  // Always show the chat panel and input, even if there are no messages
  return (
    <div className="bg-white rounded-xl shadow-sm flex flex-col h-96">
      <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-[#1d1d1f]">
        AI Chat
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-sm text-gray-400">Ask about your trip, budget, or recommendations.</div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className="flex gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0 ${
                msg.role === 'ai' ? 'bg-[#0071e3]' : 'bg-[#1d1d1f]'
              }`}>
                {msg.role === 'ai' ? 'AI' : 'U'}
              </div>
              <div className="flex-1">
                <div className="bg-[#f5f5f7] rounded-lg px-3 py-2 text-sm text-[#1d1d1f] leading-relaxed max-w-[85%] whitespace-pre-wrap">
                  {msg.content}
                </div>
                {msg.items?.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    {msg.items.map((item, j) => (
                      <button
                        key={j}
                        onClick={() => onSave(item, msg.focus)}
                        className="text-xs text-left text-[#0071e3] hover:underline"
                      >
                        + Save "{item.name}"
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-100 p-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask the AI about this trip..."
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={sending}
          className="bg-[#0071e3] text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}