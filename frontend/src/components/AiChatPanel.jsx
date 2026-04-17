import { useEffect, useRef } from 'react'

export default function AiChatPanel({ messages, onSave }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm flex flex-col h-80">
        <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-[#1d1d1f]">💬 AI Chat</div>
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          Click an action above to start
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm flex flex-col h-96">
      <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-[#1d1d1f]">💬 AI Chat</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
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
              {/* Save buttons — only shown on recommendation messages */}
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
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
