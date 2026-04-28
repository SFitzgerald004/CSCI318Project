import { useEffect, useRef, useState } from 'react';
import { ChatBubbleLeftEllipsisIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import ToolBadgeRow from './ToolBadgeRow';
import Button from './ui/Button';
import { relativeTime } from '../utils/relativeTime';
import Badge from './ui/Badge';

function SaveButton({ msg, onSave }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleClick() {
    setSaving(true);
    try {
      await onSave(msg);
      setSaved(true);
    } catch {
      // Parent component surfaces toast; we just stay unsaved.
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <Button
        variant="ghost"
        size="sm"
        icon={CheckCircleIcon}
        disabled
        className="!text-green-600"
        data-testid="save-button-saved"
      >
        Saved
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      icon={BookmarkIcon}
      loading={saving}
      onClick={handleClick}
    >
      Save this
    </Button>
  );
}

export default function AiChatPanel({ messages, thinking, onSaveRecommendation }) {
  const bottomRef = useRef(null);

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
              {msg.role === 'ai' && msg.canSave && onSaveRecommendation && (
                <div className="mt-2">
                  <SaveButton msg={msg} onSave={onSaveRecommendation} />
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
    </div>
  );
}
