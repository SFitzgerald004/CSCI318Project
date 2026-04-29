import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getTrips, createTrip } from '../services/tripService';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { EdIcon, HeroImg, Topbar } from '../components/editorial';
import { cityClassFor, shortDate, daysFromToday } from '../components/editorialHelpers';
import toast from 'react-hot-toast';

const TRIP_PURPOSES = [
  { value: 'vacation', label: 'Vacation' },
  { value: 'business', label: 'Business' },
  { value: 'family', label: 'Family' },
  { value: 'adventure', label: 'Adventure' },
];
const HOTEL_OPTIONS = [
  { value: 'budget', label: 'Budget' },
  { value: 'mid_range', label: 'Mid range' },
  { value: 'luxury', label: 'Luxury' },
];
const FOOD_OPTIONS = ['fine_dining', 'street_food', 'budget_eats', 'local_cuisine'];
const ACTIVITY_OPTIONS = ['museums', 'nightlife', 'beaches', 'hiking', 'attractions', 'shopping'];

const INITIAL_FORM = {
  destination: '', destination_country: '', total_budget: '',
  departure_date: '', return_date: '', trip_purpose: 'vacation',
  num_travelers: 1, food_prefs: [], activity_prefs: [], hotel_prefs: 'mid_range',
};

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// Project an ISO date onto a 0–100% horizontal position within its calendar year.
function yearPercent(iso) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const start = new Date(y, 0, 1).getTime();
  const end = new Date(y + 1, 0, 1).getTime();
  return ((d.getTime() - start) / (end - start)) * 100;
}

// Pick a band color for a trip based on its time relative to today.
function trackColor(departure) {
  const days = daysFromToday(departure);
  if (days === null) return 'var(--ink-3)';
  if (days < 0) return 'var(--ink-3)';     // past — soft grey
  if (days <= 60) return 'var(--indigo)';  // upcoming — booked
  if (days <= 180) return 'var(--clay)';   // planning
  return 'var(--ink)';                     // far future — saving
}

export default function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const showSkeleton = useDelayedLoading(loading);

  async function loadTrips() {
    setLoading(true);
    setError(false);
    try {
      const data = await getTrips();
      setTrips(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTrips(); }, []);

  const featured = useMemo(() => {
    if (!trips.length) return null;
    const now = Date.now();
    const upcoming = trips
      .filter((t) => new Date(t.departure_date).getTime() >= now)
      .sort((a, b) => new Date(a.departure_date) - new Date(b.departure_date));
    if (upcoming.length) return upcoming[0];
    // fall back to most recent past trip
    return [...trips].sort((a, b) => new Date(b.departure_date) - new Date(a.departure_date))[0];
  }, [trips]);

  const yearTrips = useMemo(
    () => trips.filter((t) => new Date(t.departure_date).getFullYear() === year),
    [trips, year],
  );

  const otherTrips = useMemo(
    () => trips.filter((t) => t.id !== featured?.id),
    [trips, featured],
  );

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleArrayItem(field, item) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i) => i !== item)
        : [...prev[field], item],
    }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newTrip = await createTrip({
        ...form,
        total_budget: Number(form.total_budget),
        num_travelers: Number(form.num_travelers),
      });
      setTrips((prev) => [...prev, newTrip]);
      setShowModal(false);
      setForm(INITIAL_FORM);
      toast.success('Trip created');
    } catch {
      toast.error('Could not create trip');
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <ErrorState title="Could not load trips" retry={loadTrips} />;

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayPct = year === todayYear ? yearPercent(today.toISOString()) : null;

  // Build percent-based position + width for each trip bar.
  const timelineBars = yearTrips.map((t, i) => {
    const start = yearPercent(t.departure_date);
    const end = yearPercent(t.return_date || t.departure_date);
    const width = Math.max(2.5, end - start);
    const top = i % 2 === 0 ? 8 : 60;
    return { trip: t, left: start, width, top };
  });

  return (
    <>
      <Topbar
        sub={`Maya · ${year}`}
        title="Your year of journeys"
        action={(
          <button className="btn" onClick={() => setShowModal(true)}>
            <EdIcon name="plus" size={12} />New trip
          </button>
        )}
      />

      {showSkeleton ? (
        <div style={{ padding: '32px 48px' }}>
          <Skeleton variant="title" className="w-64 mb-6" />
          <Skeleton variant="card" />
        </div>
      ) : trips.length === 0 ? (
        <div
          style={{
            padding: '80px 48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 16,
            maxWidth: 560,
          }}
        >
          <span className="eyebrow">Begin a chapter</span>
          <div className="h-1">No journeys<br/><span className="serif-i">yet.</span></div>
          <p className="body-l" style={{ maxWidth: 420 }}>
            Plan your first trip and we'll start mapping flights, season notes, and what to pack.
          </p>
          <button className="btn" onClick={() => setShowModal(true)}>
            <EdIcon name="plus" size={12} />Plan a trip
          </button>
        </div>
      ) : (
        <>
          {/* HERO featured trip */}
          {featured && (
            <div
              style={{
                display: 'flex',
                gap: 48,
                padding: '32px 48px 24px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: '0 0 460px', display: 'flex', flexDirection: 'column', gap: 16, minWidth: 320 }}>
                <span className="eyebrow">
                  {(() => {
                    const d = daysFromToday(featured.departure_date);
                    if (d === null) return 'Featured trip';
                    if (d > 0) return `Up next · ${d} days`;
                    if (d === 0) return 'Today';
                    return `Last journey · ${Math.abs(d)} days ago`;
                  })()}
                </span>
                <div className="h-hero" style={{ fontSize: 96 }}>
                  {featured.destination}
                  <span className="serif-i" style={{ color: 'var(--indigo)' }}>.</span>
                </div>
                <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginTop: 4 }}>
                  <FactCol label="Departure" value={shortDate(featured.departure_date)} />
                  <FactCol label="Return" value={shortDate(featured.return_date)} />
                  <FactCol label="Budget" value={`$${(featured.total_budget || 0).toLocaleString()}`} />
                  {featured.num_travelers > 1 && (
                    <FactCol label="Travelers" value={String(featured.num_travelers)} />
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {featured.trip_purpose && (
                    <span className="chip indigo" style={{ textTransform: 'capitalize' }}>
                      {featured.trip_purpose}
                    </span>
                  )}
                  {featured.destination_country && (
                    <span className="chip">{featured.destination_country}</span>
                  )}
                  {(featured.activity_prefs || []).slice(0, 2).map((a) => (
                    <span key={a} className="chip" style={{ textTransform: 'capitalize' }}>
                      {a.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                  <Link to={`/trips/${featured.id}`} className="btn">
                    Open itinerary <EdIcon name="arrow" size={12} />
                  </Link>
                  <Link to={`/trips/${featured.id}/budget`} className="btn ghost">
                    Adjust budget
                  </Link>
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 320 }}>
                <HeroImg city={cityClassFor(featured.destination)} destination={featured.destination} height={420}>
                  <div style={{ padding: 24, color: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
                    {featured.destination_country && (
                      <span
                        className="cap"
                        style={{ color: 'rgba(255,255,255,0.7)', letterSpacing: '0.18em', textTransform: 'uppercase' }}
                      >
                        {featured.destination_country}
                      </span>
                    )}
                    <span className="serif" style={{ fontSize: 38, lineHeight: 1.0, marginTop: 6 }}>
                      "A {featured.trip_purpose || 'journey'} of new days."
                    </span>
                  </div>
                </HeroImg>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 14,
                    fontSize: 12,
                  }}
                >
                  <span className="cap">Plate 01 / {trips.length}</span>
                  <span className="cap">Captured by Wayfare Advisor</span>
                </div>
              </div>
            </div>
          )}

          <div className="rule" style={{ margin: '8px 48px 0', width: 'auto' }} />

          {/* YEAR TIMELINE */}
          <div style={{ padding: '24px 48px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="eyebrow ink">The year ahead</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {[year - 1, year, year + 1].map((y) => (
                  <button
                    key={y}
                    className={`chip ${y === year ? 'fill' : ''}`}
                    onClick={() => setYear(y)}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ position: 'relative', marginTop: 8 }}>
              {/* Months scale */}
              <div style={{ display: 'flex', position: 'relative' }}>
                {MONTHS.map((m, i) => (
                  <div
                    key={m}
                    style={{
                      flex: 1,
                      borderLeft: i === 0 ? '1px solid var(--ink)' : '1px solid var(--rule)',
                      padding: '4px 6px 24px',
                    }}
                  >
                    <span className="cap mono" style={{ fontSize: 10 }}>{m}</span>
                  </div>
                ))}
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    borderRight: '1px solid var(--ink)',
                  }}
                />
              </div>

              {/* trip bars */}
              <div style={{ position: 'relative', height: 130, marginTop: -20, paddingTop: 8 }}>
                {todayPct !== null && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${todayPct}%`,
                      top: -22,
                      bottom: 0,
                      borderLeft: '1px dashed var(--indigo)',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: -18,
                        left: -18,
                        fontSize: 9,
                        color: 'var(--indigo)',
                        fontFamily: 'var(--display)',
                        letterSpacing: '0.18em',
                      }}
                    >
                      TODAY
                    </span>
                  </div>
                )}
                {timelineBars.length === 0 && (
                  <span
                    className="cap"
                    style={{ position: 'absolute', left: 8, top: 18 }}
                  >
                    No trips in {year}.
                  </span>
                )}
                {timelineBars.map(({ trip, left, width, top }) => (
                  <Link
                    key={trip.id}
                    to={`/trips/${trip.id}`}
                    style={{
                      position: 'absolute',
                      left: `${left}%`,
                      width: `${width}%`,
                      top,
                      height: 46,
                      background: trackColor(trip.departure_date),
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      padding: '0 8px',
                      color: '#fff',
                      borderRadius: 2,
                      textDecoration: 'none',
                      minWidth: 56,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--serif)',
                        fontSize: 16,
                        lineHeight: 1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {trip.destination}
                    </span>
                    <span className="mono" style={{ fontSize: 9, opacity: 0.85 }}>
                      {shortDate(trip.departure_date)}{trip.return_date ? `–${shortDate(trip.return_date).split(' ')[1]}` : ''}
                    </span>
                  </Link>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: 'var(--ink-3)' }}>
                <Legend dot="var(--indigo)" label="Booked" />
                <Legend dot="var(--clay)" label="Planning" />
                <Legend dot="var(--ink)" label="Saving" />
                <Legend dot="var(--ink-3)" label="Past" />
              </div>
            </div>
          </div>

          {/* Other trips, editorial list */}
          {otherTrips.length > 0 && (
            <div style={{ padding: '32px 48px 48px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <span className="eyebrow ink">All journeys</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                {otherTrips.map((trip) => (
                  <Link
                    key={trip.id}
                    to={`/trips/${trip.id}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      textDecoration: 'none',
                      color: 'var(--ink)',
                      padding: '18px 0',
                      borderTop: '1px solid var(--rule)',
                    }}
                  >
                    <HeroImg
                      city={cityClassFor(trip.destination)}
                      destination={trip.destination}
                      height={140}
                      style={{ borderRadius: 6 }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontFamily: 'var(--serif)', fontSize: 26, letterSpacing: '-0.01em' }}>
                        {trip.destination}
                      </span>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                        {shortDate(trip.departure_date)}
                      </span>
                    </div>
                    <span className="cap" style={{ textTransform: 'capitalize' }}>
                      {(trip.trip_purpose || 'journey').replace(/_/g, ' ')} ·{' '}
                      ${(trip.total_budget || 0).toLocaleString()}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Plan a new trip">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Destination" value={form.destination}
            onChange={(v) => updateForm('destination', v)} placeholder="Tokyo" required />

          <Input label="Country" value={form.destination_country}
            onChange={(v) => updateForm('destination_country', v)} placeholder="Japan" />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Total budget ($)" type="number" value={form.total_budget}
              onChange={(v) => updateForm('total_budget', v)} placeholder="3500" required />
            <Input label="Travelers" type="number" value={form.num_travelers}
              onChange={(v) => updateForm('num_travelers', v)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Departure" type="date" value={form.departure_date}
              onChange={(v) => updateForm('departure_date', v)} required />
            <Input label="Return" type="date" value={form.return_date}
              onChange={(v) => updateForm('return_date', v)} required />
          </div>

          <Select label="Trip purpose" options={TRIP_PURPOSES}
            value={form.trip_purpose} onChange={(v) => updateForm('trip_purpose', v)} />

          <Select label="Hotel preference" options={HOTEL_OPTIONS}
            value={form.hotel_prefs} onChange={(v) => updateForm('hotel_prefs', v)} />

          <fieldset>
            <legend className="ed-input-label" style={{ marginBottom: 8 }}>Food preferences</legend>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {FOOD_OPTIONS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleArrayItem('food_prefs', f)}
                  className={`chip ${form.food_prefs.includes(f) ? 'fill' : ''}`}
                  style={{ textTransform: 'capitalize' }}
                >
                  {f.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="ed-input-label" style={{ marginBottom: 8 }}>Activity preferences</legend>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ACTIVITY_OPTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleArrayItem('activity_prefs', a)}
                  className={`chip ${form.activity_prefs.includes(a) ? 'fill' : ''}`}
                  style={{ textTransform: 'capitalize' }}
                >
                  {a.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </fieldset>

          <button type="submit" disabled={submitting} className="btn" style={{ width: '100%', justifyContent: 'center' }}>
            {submitting ? 'Creating…' : 'Create trip'}
          </button>
        </form>
      </Modal>
    </>
  );
}

function FactCol({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span className="cap">{label}</span>
      <span className="mono" style={{ fontSize: 15, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function Legend({ dot, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span className="legend-dot" style={{ background: dot }} />
      {label}
    </span>
  );
}
