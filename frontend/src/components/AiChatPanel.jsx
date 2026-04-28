import { useEffect, useRef, useState } from 'react';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import ToolBadgeRow from './ToolBadgeRow';
import Button from './ui/Button';
import { relativeTime } from '../utils/relativeTime';
import Badge from './ui/Badge';

function RecommendationRow({ item, onSave }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedRec, setSavedRec] = useState(null);
  const navigate = useNavigate();
  const { id: tripId } = useParams();

  async function doSave() {
    if (saved) return savedRec;
    setSaving(true);
    try {
      const rec = await onSave();
      setSaved(true);
      setSavedRec(rec);
      return rec;
    } catch {
      // Parent surfaces toast
    } finally {
      setSaving(false);
    }
  }

  async function handleRowClick() {
    const rec = await doSave();
    if (rec) {
      navigate(`/trips/${tripId}/recommendations/${rec.id}`, { state: { rec } });
    }                                                                                                                                     
  }

  async function handleClick() {
    setSaving(true);
    try {
      await onSave();
      setSaved(true);
    } catch {
      // Parent surfaces toast; we stay unsaved.
    } finally {
      setSaving(false);
    }
  }

  return (      
    <div className="flex items-center justify-between gap-2">
      <button
        onClick={handleRowClick}
        disabled={saving}
        className="type-body text-text-primary truncate text-left hover:text-apple-blue hover:underline disabled:opacity-50"
      >                                                                                                                                   
        • {item.name}
      </button>                                                                                                                           
      {saved ? (
        <span className="flex items-center gap-1 type-micro text-green-600 shrink-0">
          <CheckCircleIcon className="w-3.5 h-3.5" /> Saved                                                                               
        </span>
      ) : (                                                                                                                               
        <button 
          onClick={doSave}
          disabled={saving}
          className="type-micro text-apple-blue hover:underline shrink-0 disabled:opacity-50"                                             
        >
          {saving ? 'Saving…' : 'Save'}                                                                                                   
        </button>
      )}
    </div>
  );
}

export default function AiChatPanel({ messages, thinking, onSaveRecommendation, onSend, sending }) {
  const bottomRef = useRef(null);
  const [input, setInput] = useState('');

  function handleSend() {
    if (input.trim() && onSend) {
      onSend(input)
      setInput('')
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  if (messages.length === 0 && !thinking) {
    return (
      <div className="bg-white rounded-xl flex flex-col h-80">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 type-body-emphasis">
          <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-text-tertiary" />
          AI Chat
        </div>
        <div className="flex-1 flex items-center justify-center type-caption text-text-tertiary">
          Click an action above to start
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl flex flex-col h-[28rem]">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 type-body-emphasis">
        <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-text-tertiary" />
        AI Chat
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && (
              <div className="w-7 h-7 rounded-full bg-apple-blue flex items-center justify-center type-micro font-semibold text-white flex-shrink-0">AI</div>
            )}
            <div className={`rounded-lg px-3 py-2 type-body max-w-[80%] whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-surface-light text-text-primary'
                : 'bg-white text-text-primary border border-gray-100'
            }`}>
              {msg.content}
              {msg.role === 'ai' && msg.created_at && (
                <div className="flex items-center gap-2 mt-1.5 type-micro text-text-tertiary">
                  <span>{relativeTime(msg.created_at)}</span>
                  {msg.cached && <Badge variant="neutral">Cached</Badge>}
                </div>
              )}
              {msg.role === 'ai' && <ToolBadgeRow toolsUsed={msg.tools_used} />}
              {msg.role === 'ai' && msg.items && msg.items.length > 0 && onSaveRecommendation && (
                <div className="mt-2 pt-2 border-t border-gray-100 space-y-1.5">
                  {msg.items.map((item, j) => (
                    <RecommendationRow
                      key={j}
                      item={item}
                      onSave={() => onSaveRecommendation(item, msg.focus)}
                    />
                  ))}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-text-primary flex items-center justify-center type-micro font-semibold text-white flex-shrink-0">You</div>
            )}
          </div>
        ))}
        {thinking && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-apple-blue flex items-center justify-center type-micro font-semibold text-white flex-shrink-0">AI</div>
            <div
              data-testid="thinking-dots"
              className="bg-white border border-gray-100 rounded-lg px-3 py-3 flex gap-1 items-center"
            >
              <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full" style={{ animation: 'thinking-dot 0.9s infinite', animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full" style={{ animation: 'thinking-dot 0.9s infinite', animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-text-tertiary rounded-full" style={{ animation: 'thinking-dot 0.9s infinite', animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Message Box */}
      <div className="border-t border-gray-100 p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask anything..."
          className="flex-1 bg-surface-light rounded-lg px-3 py-2 type-body focus:outline-none focus:ring-2 focus:ring-apple-blue"
          disabled={sending}
        />
        <Button onClick={handleSend} disabled={!input.trim() || sending}>
          Send
        </Button>
      </div>
    </div>
  );
}
