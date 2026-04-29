import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTrip } from '../services/tripService';
import { getAllocation } from '../services/budgetService';
import { analyzeBudget, getAiRecommendations, getAiMessages } from '../services/aiService';
import { createRecommendation } from '../services/recommendationService';
import AiChatPanel from '../components/AiChatPanel';
import Skeleton from '../components/ui/Skeleton';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { EdIcon } from '../components/editorial';
import { shortDate } from '../components/editorialHelpers';
import toast from 'react-hot-toast';

// Normalize backend snake_case to camelCase for chat panel.
function normalizeMessage(msg) {
  return {
    ...msg,
    canSave: msg.can_save ?? msg.canSave ?? false,
  };
}

const ACTIONS = [
  { key: 'analyze',    label: 'Analyze my budget',         category: null },
  { key: 'overall',    label: 'Overall recommendations',    category: null },
  { key: 'hotels',     label: 'Hotel picks',                category: 'hotel' },
  { key: 'food',       label: 'Food picks',                 category: 'restaurant' },
  { key: 'activities', label: 'Activity picks',             category: 'attraction' },
];

const SUGGESTED_QUESTIONS = [
  '"Find me a quiet place I can afford."',
  '"What\'s a realistic food budget for my trip?"',
  '"Which neighborhoods should I stay in?"',
  '"Pack list for the dates I\'m going."',
];

export default function AiAdvisorPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [hasBudget, setHasBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState(null);
  const [messages, setMessages] = useState([]);
  const showSkeleton = useDelayedLoading(loading);

  useEffect(() => {
    Promise.all([
      getTrip(id).catch(() => null),
      getAllocation(id).then(() => true).catch(() => false),
      getAiMessages(id).catch(() => []),
    ]).then(([t, budgetExists, history]) => {
      setTrip(t);
      setHasBudget(budgetExists);
      setMessages(history.map(normalizeMessage));
    }).finally(() => setLoading(false));
  }, [id]);

  const askedActions = useMemo(
    () => new Set(messages.filter((m) => m.role === 'ai').map((m) => m.action).filter(Boolean)),
    [messages],
  );

  async function handleAnalyze(force = false) {
    setActiveAction('analyze');
    setMessages((prev) => [...prev, {
      role: 'user',
      content: 'Analyze my budget allocation',
      action: 'analyze',
      created_at: new Date().toISOString(),
    }]);
    try {
      const { advice, tools_used, cached, message_id } = await analyzeBudget(id, { force });
      setMessages((prev) => [...prev, normalizeMessage({
        id: message_id,
        role: 'ai',
        content: advice,
        action: 'analyze',
        tools_used,
        cached,
        can_save: false,
        created_at: new Date().toISOString(),
      })]);
    } catch {
      toast.error('AI service unavailable');
      setMessages((prev) => [...prev, {
        role: 'ai',
        content: "Sorry, I couldn't analyze your budget right now. Please try again.",
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setActiveAction(null);
    }
  }

  async function handleRecommend(focus, force = false) {
    setActiveAction(focus);
    const action = ACTIONS.find((a) => a.key === focus);
    const category = action?.category ?? null;

    setMessages((prev) => [...prev, {
      role: 'user',
      content: `Get ${focus} recommendations`,
      action: `recommend:${focus}`,
      created_at: new Date().toISOString(),
    }]);
    try {
      const { advice, tools_used, cached, message_id } = await getAiRecommendations(id, focus, { force });
      setMessages((prev) => [...prev, normalizeMessage({
        id: message_id,
        role: 'ai',
        content: advice,
        action: `recommend:${focus}`,
        tools_used,
        cached,
        can_save: category !== null,
        category,
        created_at: new Date().toISOString(),
      })]);
    } catch {
      toast.error('AI service unavailable');
      setMessages((prev) => [...prev, {
        role: 'ai',
        content: "Sorry, I couldn't get recommendations right now. Please try again.",
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setActiveAction(null);
    }
  }

  async function handleSaveRecommendation(msg) {
    if (!msg.category) {
      toast.error('Cannot save this type of recommendation');
      throw new Error('No category');
    }
    try {
      const categoryLabel = msg.category === 'hotel' ? 'Hotel'
        : msg.category === 'restaurant' ? 'Food'
        : msg.category === 'attraction' ? 'Activity'
        : 'AI';
      const name = `AI ${categoryLabel} Picks`;
      const rec = await createRecommendation(id, {
        category: msg.category,
        source: 'ai_generated',
        name,
        description: msg.content,
        is_ai_pick: true,
      });
      toast.success('Saved');
      return rec;
    } catch (err) {
      toast.error('Could not save');
      throw err;
    }
  }

  function runAction(key, force = false) {
    if (key === 'analyze') return handleAnalyze(force);
    return handleRecommend(key, force);
  }

  if (showSkeleton) {
    return (
      <div style={{ padding: 48 }}>
        <Skeleton variant="title" className="w-64 mb-6" />
        <Skeleton variant="card" />
      </div>
    );
  }

  if (!hasBudget) {
    return (
      <div style={{ padding: '64px 48px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
        <span className="eyebrow">Advisor not yet ready</span>
        <div className="h-1" style={{ fontSize: 56 }}>
          A budget,<br /><span className="serif-i">first.</span>
        </div>
        <p className="body-l">
          The advisor needs a budget allocation before it can offer informed advice. Generate one and come back.
        </p>
        <Link to={`/trips/${id}/budget`} className="btn" style={{ alignSelf: 'flex-start' }}>
          <EdIcon name="wallet" size={12} />Go to budget
        </Link>
      </div>
    );
  }

  const firstName = trip?.destination || 'your trip';
  const dates = trip?.departure_date && trip?.return_date
    ? `${shortDate(trip.departure_date)} – ${shortDate(trip.return_date)}`
    : null;

  return (
    <>
      {/* Editorial header */}
      <div
        style={{
          padding: '24px 48px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--ink)',
              color: 'var(--paper)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <EdIcon name="sparkle" size={14} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span className="eyebrow">Wayfare Advisor</span>
            <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>A travel companion · always on</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {trip && <span className="chip">{firstName}{dates ? ` · ${dates.split(' – ')[0]}` : ''}</span>}
          {trip?.total_budget && <span className="chip">${Number(trip.total_budget).toLocaleString()} budget</span>}
          {trip?.trip_purpose && (
            <span className="chip" style={{ textTransform: 'capitalize' }}>
              {trip.trip_purpose}{trip.num_travelers > 1 ? ` · ${trip.num_travelers}` : ' · solo'}
            </span>
          )}
        </div>
      </div>

      {/* Hero question */}
      <div style={{ padding: '40px 48px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span className="eyebrow">Today, ask me about…</span>
        <div className="serif" style={{ fontSize: 64, lineHeight: 0.95, letterSpacing: '-0.02em', maxWidth: 880 }}>
          What should I know
          <br />about <span className="serif-i" style={{ color: 'var(--indigo)' }}>{firstName}</span>
          <br />before I go?
        </div>
      </div>

      {/* Action chips */}
      <div style={{ padding: '0 48px 16px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {ACTIONS.map((a) => {
          const isActive = activeAction === a.key;
          const wasAsked = askedActions.has(a.key === 'analyze' ? 'analyze' : `recommend:${a.key}`);
          return (
            <button
              key={a.key}
              className={`chip ${wasAsked ? 'indigo' : ''}`}
              style={{
                padding: '8px 14px',
                fontSize: 12,
                cursor: 'pointer',
                opacity: activeAction && !isActive ? 0.5 : 1,
              }}
              onClick={() => runAction(a.key, wasAsked)}
              disabled={activeAction !== null}
              title={wasAsked ? 'Re-ask · forces a fresh answer' : 'Ask the advisor'}
            >
              {wasAsked && <EdIcon name="refresh" size={10} />}
              {a.label}
            </button>
          );
        })}
      </div>

      {/* Reply area + right rail */}
      <div
        style={{
          padding: '12px 48px 96px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(220px, 280px)',
          gap: 32,
          alignItems: 'start',
        }}
      >
        <div style={{ minWidth: 0 }}>
          {messages.length === 0 && !activeAction ? (
            <div
              style={{
                padding: '40px 0',
                borderTop: '1px solid var(--rule)',
                borderBottom: '1px solid var(--rule)',
              }}
            >
              <div className="serif-i" style={{ fontSize: 26, lineHeight: 1.3, maxWidth: 620, color: 'var(--ink-2)' }}>
                "Pick an action above and I'll draft something useful — analyze the budget, suggest hotels, food spots, or activities. I'll show my sources every time."
              </div>
            </div>
          ) : (
            <AiChatPanel
              messages={messages}
              thinking={activeAction !== null}
              onSaveRecommendation={handleSaveRecommendation}
            />
          )}
        </div>

        {/* Right rail — Try also */}
        <aside
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            paddingLeft: 28,
            borderLeft: '1px solid var(--rule)',
          }}
        >
          <span className="eyebrow ink">Try also</span>
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <div
              key={i}
              className="serif-i"
              style={{
                fontSize: 16,
                lineHeight: 1.3,
                paddingBottom: 10,
                borderBottom: '1px dashed var(--rule)',
                color: 'var(--ink-2)',
              }}
            >
              {q}
            </div>
          ))}
          <p className="cap" style={{ marginTop: 6 }}>
            Use the action chips above — they wire to your trip and budget for grounded answers.
          </p>
        </aside>
      </div>
    </>
  );
}
