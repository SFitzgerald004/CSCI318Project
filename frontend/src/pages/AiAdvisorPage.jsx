import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChartBarIcon,
  GlobeAltIcon,
  BuildingOffice2Icon,
  CakeIcon,
  MapPinIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { getAllocation } from '../services/budgetService';
import { analyzeBudget, getAiRecommendations, getAiMessages } from '../services/aiService';
import { createRecommendation } from '../services/recommendationService';
import AiInsightCard from '../components/AiInsightCard';
import AiChatPanel from '../components/AiChatPanel';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import toast from 'react-hot-toast';

export default function AiAdvisorPage() {
  const { id } = useParams();
  const [hasBudget, setHasBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState(null);
  const [messages, setMessages] = useState([]);
  const showSkeleton = useDelayedLoading(loading);

  useEffect(() => {
    Promise.all([
      getAllocation(id).then(() => true).catch(() => false),
      getAiMessages(id).catch(() => []),
    ]).then(([budgetExists, history]) => {
      setHasBudget(budgetExists);
      const normalized = history.map((m) => ({ ...m, canSave: m.can_save }));
      setMessages(normalized);
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
      setMessages((prev) => [...prev, {
        id: message_id,
        role: 'ai',
        content: advice,
        action: 'analyze',
        tools_used,
        cached,
        created_at: new Date().toISOString(),
      }]);
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
    const category = focus === 'hotels' ? 'hotel'
      : focus === 'food' ? 'restaurant'
      : focus === 'activities' ? 'attraction'
      : null;

    setMessages((prev) => [...prev, {
      role: 'user',
      content: `Get ${focus} recommendations`,
      action: `recommend:${focus}`,
      created_at: new Date().toISOString(),
    }]);
    try {
      const { advice, tools_used, cached, message_id } = await getAiRecommendations(id, focus, { force });
      setMessages((prev) => [...prev, {
        id: message_id,
        role: 'ai',
        content: advice,
        action: `recommend:${focus}`,
        tools_used,
        cached,
        canSave: category !== null,
        category,
        created_at: new Date().toISOString(),
      }]);
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

  if (showSkeleton) {
    return <div><Skeleton variant="title" className="w-48 mb-6" /><Skeleton variant="card" /></div>;
  }

  if (!hasBudget) {
    return (
      <EmptyState
        icon={<ChartBarIcon className="w-12 h-12" />}
        title="Generate a budget first"
        description="The AI advisor needs a budget allocation to work with."
        action={
          <Link to={`/trips/${id}/budget`}>
            <Button>Go to Budget</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <h1 className="type-section-heading">AI Advisor</h1>
      <p className="type-caption text-text-secondary mt-1">Get AI-powered budget analysis and recommendations</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
        <AiInsightCard
          icon={ChartBarIcon} title="Analyze Budget" description="Get AI feedback on your allocation"
          onClick={() => handleAnalyze(false)} loading={activeAction === 'analyze'}
          alreadyAsked={askedActions.has('analyze')} onRefresh={() => handleAnalyze(true)}
        />
        <AiInsightCard
          icon={GlobeAltIcon} title="Overall" description="Get overall recommendations"
          onClick={() => handleRecommend('overall', false)} loading={activeAction === 'overall'}
          alreadyAsked={askedActions.has('recommend:overall')} onRefresh={() => handleRecommend('overall', true)}
        />
        <AiInsightCard
          icon={BuildingOffice2Icon} title="Hotels" description="Get hotel picks"
          onClick={() => handleRecommend('hotels', false)} loading={activeAction === 'hotels'}
          alreadyAsked={askedActions.has('recommend:hotels')} onRefresh={() => handleRecommend('hotels', true)}
        />
        <AiInsightCard
          icon={CakeIcon} title="Food" description="Get food picks"
          onClick={() => handleRecommend('food', false)} loading={activeAction === 'food'}
          alreadyAsked={askedActions.has('recommend:food')} onRefresh={() => handleRecommend('food', true)}
        />
        <AiInsightCard
          icon={MapPinIcon} title="Activities" description="Get activity picks"
          onClick={() => handleRecommend('activities', false)} loading={activeAction === 'activities'}
          alreadyAsked={askedActions.has('recommend:activities')} onRefresh={() => handleRecommend('activities', true)}
        />
      </div>

      <div className="mt-6">
        {messages.length === 0 && !activeAction ? (
          <EmptyState
            icon={<SparklesIcon className="w-12 h-12" />}
            title="Ask the AI"
            description="Click an action above to start a conversation."
          />
        ) : (
          <AiChatPanel
            messages={messages}
            thinking={activeAction !== null}
            onSaveRecommendation={handleSaveRecommendation}
          />
        )}
      </div>
    </div>
  );
}
