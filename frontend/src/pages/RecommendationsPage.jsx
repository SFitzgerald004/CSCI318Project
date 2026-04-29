import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRecommendations, deleteRecommendation } from '../services/recommendationService';
import { getTrip } from '../services/tripService';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { EdIcon, Topbar } from '../components/editorial';
import { daysFromToday } from '../components/editorialHelpers';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'all',         label: 'All' },
  { value: 'hotel',       label: 'Stay' },
  { value: 'restaurant',  label: 'Eat' },
  { value: 'attraction',  label: 'Do' },
  { value: 'flight',      label: 'Fly' },
  { value: 'car_rental',  label: 'Drive' },
];

export default function RecommendationsPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const showSkeleton = useDelayedLoading(loading);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [t, list] = await Promise.allSettled([getTrip(id), getRecommendations(id)]);
      setTrip(t.status === 'fulfilled' ? t.value : null);
      if (list.status === 'rejected') throw list.reason;
      setRecs(list.value);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleDelete(recId) {
    try {
      await deleteRecommendation(id, recId);
      setRecs((prev) => prev.filter((r) => r.id !== recId));
      toast.success('Removed');
    } catch {
      toast.error('Could not delete');
    }
  }

  const filtered = useMemo(
    () => activeCategory === 'all' ? recs : recs.filter((r) => r.category === activeCategory),
    [recs, activeCategory],
  );

  if (error) return <ErrorState title="Could not load recommendations" retry={loadAll} />;

  const days = trip ? daysFromToday(trip.departure_date) : null;
  const subTitle = trip
    ? `${trip.destination}${days !== null && days >= 0 ? ` · ${days} days out` : ''}`
    : 'Saved ideas';

  return (
    <>
      <Topbar
        sub={subTitle}
        title="Discover"
        action={(
          <Link to={`/trips/${id}/ai`} className="btn ghost">
            <EdIcon name="sparkle" size={12} />Ask Advisor
          </Link>
        )}
      />

      <div style={{ padding: '32px 48px 96px', display: 'flex', flexDirection: 'column', gap: 18, position: 'relative' }}>
        {/* Hero copy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 720 }}>
          <span className="eyebrow">Picked for your trip</span>
          <div className="serif" style={{ fontSize: 56, lineHeight: 0.95, letterSpacing: '-0.02em' }}>
            {recs.length > 0 ? (
              <>
                {recs.length} {recs.length === 1 ? 'place' : 'places'}
                <br />
                <span className="serif-i">worth your time.</span>
              </>
            ) : (
              <>
                Nothing<br /><span className="serif-i">pinned yet.</span>
              </>
            )}
          </div>
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`chip ${activeCategory === cat.value ? 'fill' : ''}`}
              onClick={() => setActiveCategory(cat.value)}
              disabled={cat.value !== 'all' && !recs.some((r) => r.category === cat.value)}
              style={{
                opacity:
                  cat.value !== 'all' && !recs.some((r) => r.category === cat.value) ? 0.4 : 1,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="rule-thin" style={{ marginTop: 8 }} />

        {/* List */}
        {showSkeleton ? (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', marginTop: 12 }}>
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="card" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ paddingTop: 40, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="serif-i" style={{ fontSize: 22, color: 'var(--ink-2)', maxWidth: 520 }}>
              {activeCategory === 'all'
                ? '"No ideas saved yet. Ask the advisor for picks — hotels, food, places to wander — and pin what catches your eye."'
                : `"Nothing in this category yet. Try the advisor or pick a different filter."`}
            </div>
            <Link to={`/trips/${id}/ai`} className="btn" style={{ alignSelf: 'flex-start' }}>
              <EdIcon name="sparkle" size={12} />Ask the advisor
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((rec, i) => (
              <RecRow
                key={rec.id}
                num={String(i + 1).padStart(2, '0')}
                rec={rec}
                tripId={id}
                onDelete={() => handleDelete(rec.id)}
              />
            ))}
          </div>
        )}

        {/* Floating advisor — bottom right */}
        <Link
          to={`/trips/${id}/ai`}
          style={{
            position: 'fixed',
            right: 24,
            bottom: 24,
            padding: '12px 18px',
            background: 'var(--ink)',
            color: 'var(--paper)',
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.18)',
            textDecoration: 'none',
            zIndex: 30,
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'var(--indigo)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <EdIcon name="sparkle" size={12} />
          </div>
          <span className="serif-i" style={{ fontSize: 14 }}>Ask the advisor</span>
        </Link>
      </div>
    </>
  );
}

const CATEGORY_LABEL = {
  hotel:       'Stay',
  restaurant:  'Eat',
  attraction:  'Do',
  flight:      'Fly',
  car_rental:  'Drive',
};

function RecRow({ num, rec, onDelete, tripId }) {
  const label = CATEGORY_LABEL[rec.category] || 'Idea';
  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        padding: '18px 0',
        borderBottom: '1px solid var(--rule)',
        alignItems: 'flex-start',
      }}
    >
      <span
        className="mono"
        style={{ fontSize: 12, color: 'var(--indigo)', width: 32, paddingTop: 4, flexShrink: 0 }}
      >
        {num}
      </span>
      <Link
        to={`/trips/${tripId}/recommendations/${rec.id}`}
        state={{ rec }}
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 26, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            {rec.name}
          </span>
          {rec.is_ai_pick && <span className="chip indigo" style={{ flexShrink: 0 }}>AI pick</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span className="cap">{label}</span>
          {rec.source && (
            <>
              <span className="cap">·</span>
              <span className="cap" style={{ textTransform: 'capitalize' }}>
                {rec.source.replace(/_/g, ' ')}
              </span>
            </>
          )}
        </div>
        {rec.description && (
          <span className="serif-i" style={{ fontSize: 15, color: 'var(--ink-2)', marginTop: 2 }}>
            "{rec.description}"
          </span>
        )}
      </Link>
      <button
        onClick={onDelete}
        aria-label={`Remove ${rec.name}`}
        title="Remove"
        style={{
          background: 'none',
          border: 0,
          color: 'var(--ink-3)',
          cursor: 'pointer',
          padding: 4,
          flexShrink: 0,
        }}
      >
        <EdIcon name="trash" size={14} />
      </button>
    </div>
  );
}
