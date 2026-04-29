import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTrip } from '../services/tripService';
import { getAllocation, getSavings } from '../services/budgetService';
import { getRecommendations } from '../services/recommendationService';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { EdIcon, HeroImg } from '../components/editorial';
import { cityClassFor, shortDate, longDate, daysFromToday } from '../components/editorialHelpers';

const ALLOC_CATEGORIES = [
  { key: 'flights',    label: 'Flights',    color: 'var(--ink)' },
  { key: 'hotel',      label: 'Lodging',    color: 'var(--indigo)' },
  { key: 'food',       label: 'Food & drink', color: 'var(--clay)' },
  { key: 'activities', label: 'Activities', color: 'var(--green)' },
  { key: 'transport',  label: 'Transit',    color: 'var(--ink-3)' },
  { key: 'misc',       label: 'Buffer',     color: 'var(--rule)' },
];

export default function TripDetailPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [allocation, setAllocation] = useState(null);
  const [savings, setSavings] = useState(null);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const showSkeleton = useDelayedLoading(loading);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [t, alloc, sav, recList] = await Promise.allSettled([
        getTrip(id),
        getAllocation(id),
        getSavings(id),
        getRecommendations(id),
      ]);
      if (t.status === 'rejected') throw t.reason;
      setTrip(t.value);
      setAllocation(alloc.status === 'fulfilled' ? alloc.value : null);
      setSavings(sav.status === 'fulfilled' ? sav.value : null);
      setRecs(recList.status === 'fulfilled' ? recList.value : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorState title="Could not load trip" retry={load} />;
  if (showSkeleton) {
    return (
      <div style={{ padding: 48 }}>
        <Skeleton variant="title" className="w-64 mb-6" />
        <Skeleton variant="card" />
      </div>
    );
  }
  if (!trip) return null;

  const days = daysFromToday(trip.departure_date);
  const tripCity = cityClassFor(trip.destination);

  // Funded percentage from savings if available; else 0.
  const funded = savings && savings.total_budget > 0
    ? Math.round((savings.amount_saved / savings.total_budget) * 100)
    : null;

  // Compute nights.
  const nights = (() => {
    if (!trip.departure_date || !trip.return_date) return null;
    const start = new Date(trip.departure_date);
    const end = new Date(trip.return_date);
    return Math.max(1, Math.round((end - start) / 86400000));
  })();

  return (
    <>
      {/* Editorial masthead */}
      <div
        style={{
          padding: '18px 48px',
          borderBottom: '1px solid var(--rule)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/trips" className="link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← All trips
          </Link>
          <span style={{ height: 14, width: 1, background: 'var(--rule)' }} />
          <span className="cap">
            Issue №{String(trip.id).slice(-2).padStart(2, '0')} ·{' '}
            {trip.trip_purpose
              ? trip.trip_purpose.charAt(0).toUpperCase() + trip.trip_purpose.slice(1)
              : 'Journey'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to={`/trips/${id}/budget`} className="btn ghost">
            <EdIcon name="wallet" size={12} />Budget
          </Link>
          <Link to={`/trips/${id}/ai`} className="btn">
            <EdIcon name="sparkle" size={12} />Ask Advisor
          </Link>
        </div>
      </div>

      {/* Hero spread */}
      <div
        style={{
          padding: '40px 48px 28px',
          display: 'flex',
          gap: 48,
          alignItems: 'flex-end',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: '0 0 360px', minWidth: 280 }}>
          <span className="eyebrow">
            A travelogue{nights ? ` · ${nights} ${nights === 1 ? 'night' : 'nights'}` : ''}
          </span>
          <div className="serif" style={{ fontSize: 84, lineHeight: 0.9, marginTop: 10, letterSpacing: '-0.02em' }}>
            {trip.destination}
            <span style={{ color: 'var(--indigo)' }}>,</span>
            <br />
            <span className="serif-i">a chapter.</span>
          </div>
          <p className="body-l" style={{ marginTop: 18, maxWidth: 340 }}>
            {trip.destination_country
              ? `A ${trip.trip_purpose || 'journey'} through ${trip.destination_country}`
              : `A ${trip.trip_purpose || 'journey'} you've been planning`}
            {trip.num_travelers > 1 ? ` with ${trip.num_travelers} travelers.` : ', solo.'}
          </p>
        </div>
        <div style={{ flex: 1, minWidth: 320, position: 'relative' }}>
          <HeroImg city={tripCity} destination={trip.destination} height={360}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 24, width: '100%', color: '#fff' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="cap" style={{ color: 'rgba(255,255,255,0.7)' }}>DESTINATION</span>
                <span className="serif" style={{ fontSize: 30, lineHeight: 1 }}>
                  {trip.destination}
                  {trip.destination_country ? `, ${trip.destination_country}` : ''}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                <span className="cap" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {days !== null && days >= 0 ? 'DEPARTS IN' : 'DEPARTED'}
                </span>
                <span className="serif" style={{ fontSize: 30, lineHeight: 1 }}>
                  {days !== null ? `${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'}` : '—'}
                </span>
              </div>
            </div>
          </HeroImg>
        </div>
      </div>

      <div className="rule" style={{ margin: '0 48px', width: 'auto' }} />

      {/* 3-up editorial columns */}
      <div
        style={{
          padding: '28px 48px 48px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 32,
        }}
      >
        {/* Column I — The plan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span className="eyebrow ink">I. The plan</span>
          <div className="h-3" style={{ fontSize: 24 }}>
            {nights ? `${nights} nights, no haste.` : 'A chapter, ahead.'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 6 }}>
            <DetailRow num="01" title="Departure" date={shortDate(trip.departure_date)} sub={longDate(trip.departure_date)} />
            <DetailRow num="02" title="Return"    date={shortDate(trip.return_date)}    sub={longDate(trip.return_date)} />
            <DetailRow
              num="03"
              title="Travelers"
              date={String(trip.num_travelers || 1)}
              sub={(trip.num_travelers || 1) === 1 ? 'Solo trip' : `${trip.num_travelers} travelers`}
            />
            <DetailRow
              num="04"
              title="Lodging style"
              date={(trip.hotel_prefs || 'mid_range').replace(/_/g, ' ')}
              sub={(trip.activity_prefs || []).slice(0, 3).map((a) => a.replace(/_/g, ' ')).join(' · ') || 'No activities pinned'}
            />
          </div>
        </div>

        {/* Column II — The budget */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          paddingLeft: 32,
          borderLeft: '1px solid var(--rule)',
        }}>
          <span className="eyebrow ink">II. The budget</span>
          {allocation ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <div className="serif" style={{ fontSize: 48, lineHeight: 1 }}>
                  ${(savings?.amount_saved ?? 0).toLocaleString()}
                </div>
                <span className="cap">of ${(trip.total_budget || 0).toLocaleString()}</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill indigo" style={{ width: `${funded ?? 0}%` }} />
              </div>
              <span className="cap">
                {funded !== null
                  ? `${funded}% funded${savings?.weekly_savings_needed ? ` · $${savings.weekly_savings_needed} / week to land` : ''}`
                  : 'No savings plan yet.'}
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                {ALLOC_CATEGORIES.map((c) => {
                  const amt = allocation[`${c.key}_budget`] ?? 0;
                  const pct = allocation[`${c.key}_pct`] ?? 0;
                  return (
                    <div key={c.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13 }}>{c.label}</span>
                        <span className="mono" style={{ fontSize: 12 }}>${amt.toLocaleString()}</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${pct}%`, background: c.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="serif" style={{ fontSize: 48, lineHeight: 1 }}>
                ${(trip.total_budget || 0).toLocaleString()}
              </div>
              <span className="cap">Total budget · not yet allocated.</span>
              <p className="body-l" style={{ marginTop: 8 }}>
                Generate an allocation to split the budget across flights, lodging, food, and more.
              </p>
              <Link to={`/trips/${id}/budget`} className="btn ghost" style={{ alignSelf: 'flex-start' }}>
                Allocate budget <EdIcon name="arrow" size={12} />
              </Link>
            </>
          )}
        </div>

        {/* Column III — From the advisor */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          paddingLeft: 32,
          borderLeft: '1px solid var(--rule)',
        }}>
          <span className="eyebrow ink">III. Saved ideas</span>
          {recs.length > 0 ? (
            <>
              {recs.slice(0, 4).map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    paddingBottom: 10,
                    borderBottom: '1px dashed var(--rule)',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{rec.name}</span>
                    {rec.description && (
                      <span className="cap" style={{
                        marginTop: 4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {rec.description}
                      </span>
                    )}
                  </div>
                  <span className="chip" style={{ textTransform: 'capitalize', flexShrink: 0 }}>
                    {rec.category || 'Idea'}
                  </span>
                </div>
              ))}
              <Link to={`/trips/${id}/recommendations`} className="link" style={{ marginTop: 4 }}>
                See all {recs.length} →
              </Link>
            </>
          ) : (
            <>
              <div className="serif-i" style={{ fontSize: 22, lineHeight: 1.2, color: 'var(--ink-2)' }}>
                "No ideas pinned yet. Ask the advisor — anything from quiet ryokan to walking routes."
              </div>
              <Link to={`/trips/${id}/ai`} className="btn" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                <EdIcon name="sparkle" size={12} />Ask the advisor
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function DetailRow({ num, title, date, sub }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        paddingBottom: 10,
        borderBottom: '1px dashed var(--rule)',
      }}
    >
      <span className="mono" style={{ fontSize: 11, color: 'var(--indigo)', width: 26, paddingTop: 3 }}>
        {num}
      </span>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'capitalize' }}>
            {date}
          </span>
        </div>
        <span className="cap" style={{ textTransform: 'capitalize' }}>{sub}</span>
      </div>
    </div>
  );
}
