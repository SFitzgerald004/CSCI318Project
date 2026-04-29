import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAllocation, createAllocation, updateAllocation, getSavings, createSavings } from '../services/budgetService';
import { getTrip } from '../services/tripService';
import Skeleton from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { EdIcon, Topbar } from '../components/editorial';
import { shortDate } from '../components/editorialHelpers';
import toast from 'react-hot-toast';

const ALLOC_CATEGORIES = [
  { key: 'flights',    label: 'Flights',      color: 'var(--ink)',     note: 'Round-trip · estimated' },
  { key: 'hotel',      label: 'Lodging',      color: 'var(--indigo)',  note: 'Hotels & ryokan' },
  { key: 'food',       label: 'Food & drink', color: 'var(--clay)',    note: 'Per-day estimate' },
  { key: 'activities', label: 'Activities',   color: 'var(--green)',   note: 'Tours, museums, tickets' },
  { key: 'transport',  label: 'Transit',      color: 'var(--ink-3)',   note: 'Local transport · transfers' },
  { key: 'misc',       label: 'Buffer',       color: 'var(--rule)',    note: 'For when plans shift' },
];

export default function BudgetPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [allocation, setAllocation] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [amountSaved, setAmountSaved] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [savingAlloc, setSavingAlloc] = useState(false);
  const showSkeleton = useDelayedLoading(loading);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [t, alloc, savings] = await Promise.allSettled([
        getTrip(id),
        getAllocation(id),
        getSavings(id),
      ]);
      if (t.status === 'rejected') throw t.reason;
      setTrip(t.value);
      setAllocation(alloc.status === 'fulfilled' ? alloc.value : null);
      setPlan(savings.status === 'fulfilled' ? savings.value : null);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const newAlloc = await createAllocation(id);
      setAllocation(newAlloc);
      toast.success('Budget allocated');
    } catch {
      toast.error('Could not generate budget');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveAmount(e) {
    e.preventDefault();
    setSavingPlan(true);
    try {
      const updated = await createSavings(id, Number(amountSaved));
      setPlan(updated);
      setAmountSaved('');
      toast.success('Savings updated');
    } catch {
      toast.error('Could not update savings');
    } finally {
      setSavingPlan(false);
    }
  }

  function startEdit() {
    if (!allocation) return;
    const initial = ALLOC_CATEGORIES.reduce((acc, c) => {
      acc[c.key] = Number(allocation[`${c.key}_budget`] ?? 0);
      return acc;
    }, {});
    setDraft(initial);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(null);
  }

  function setDraftAmount(key, value) {
    const cleaned = value === '' ? 0 : Math.max(0, Math.floor(Number(value) || 0));
    setDraft((prev) => ({ ...prev, [key]: cleaned }));
  }

  async function handleSaveAllocation() {
    if (!draft) return;
    setSavingAlloc(true);
    try {
      const updated = await updateAllocation(id, draft);
      setAllocation(updated);
      setEditing(false);
      setDraft(null);
      toast.success('Allocation saved');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Could not save allocation';
      toast.error(msg);
    } finally {
      setSavingAlloc(false);
    }
  }

  if (loadError) return <ErrorState title="Could not load budget" retry={loadData} />;
  if (showSkeleton) {
    return (
      <div style={{ padding: 48 }}>
        <Skeleton variant="title" className="w-64 mb-6" />
        <Skeleton variant="card" />
      </div>
    );
  }
  if (!trip) return null;

  const total = trip.total_budget || 0;
  const saved = plan?.amount_saved ?? 0;
  const fundedPct = total > 0 ? Math.min(100, Math.round((saved / total) * 100)) : 0;
  const remaining = Math.max(0, total - saved);

  // Live draft totals — only meaningful in edit mode
  const draftSum = draft
    ? ALLOC_CATEGORIES.reduce((s, c) => s + (Number(draft[c.key]) || 0), 0)
    : 0;
  const draftDelta = draftSum - total;
  const canSave = editing && Math.abs(draftDelta) <= 1;

  // Compute spent placeholder — backend doesn't track spend yet, so omit honestly.
  const dateRange = trip.departure_date && trip.return_date
    ? `${shortDate(trip.departure_date)} – ${shortDate(trip.return_date)}`
    : '';

  return (
    <>
      <Topbar
        sub={`${trip.destination}${dateRange ? ` · ${dateRange}` : ''}`}
        title="Budget"
        action={(
          <button className="btn" onClick={handleGenerate} disabled={generating}>
            <EdIcon name="sparkle" size={12} />
            {generating ? 'Optimizing…' : allocation ? 'Re-optimize' : 'Optimize'}
          </button>
        )}
      />

      {!allocation ? (
        <div style={{ padding: '48px 48px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
          <span className="eyebrow">A pact with your money</span>
          <div className="h-1" style={{ fontSize: 56 }}>
            ${total.toLocaleString()}<span style={{ color: 'var(--indigo)' }}>.</span>
          </div>
          <p className="body-l">
            Generate a smart split of <strong>${total.toLocaleString()}</strong> across flights,
            lodging, food, activities, transit, and a buffer for the unplanned.
          </p>
          <button className="btn" onClick={handleGenerate} disabled={generating} style={{ alignSelf: 'flex-start' }}>
            <EdIcon name="sparkle" size={12} />
            {generating ? 'Allocating…' : 'Allocate budget'}
          </button>
        </div>
      ) : (
        <>
          {/* Hero numbers + ribbon */}
          <div
            style={{
              padding: '36px 48px 20px',
              display: 'flex',
              gap: 48,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '0 0 380px', minWidth: 280 }}>
              <span className="eyebrow">Total trip budget</span>
              <div className="h-hero" style={{ fontSize: 84 }}>
                ${total.toLocaleString()}
              </div>
              <div style={{ display: 'flex', gap: 28, marginTop: 16, flexWrap: 'wrap' }}>
                <Stat label="Saved" value={`$${saved.toLocaleString()}`} accent />
                <Stat label="Goal" value={`$${total.toLocaleString()}`} />
                <Stat label="Remaining" value={`$${remaining.toLocaleString()}`} />
              </div>
              <p className="body-l" style={{ marginTop: 18, maxWidth: 340 }}>
                The bars below show how the AI split your budget. Re-run optimize to try a different mix.
              </p>
            </div>

            <div style={{ flex: 1, minWidth: 320, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <span className="eyebrow ink">How ${total.toLocaleString()} splits</span>
              <div
                style={{
                  display: 'flex',
                  height: 48,
                  marginTop: 14,
                  border: '1px solid var(--ink)',
                }}
              >
                {ALLOC_CATEGORIES.map((c, i) => {
                  const amt = allocation[`${c.key}_budget`] ?? 0;
                  if (amt <= 0) return null;
                  return (
                    <div
                      key={c.key}
                      title={`${c.label}: $${amt.toLocaleString()}`}
                      style={{
                        flex: amt,
                        background: c.color,
                        position: 'relative',
                        borderRight:
                          i < ALLOC_CATEGORIES.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: -22,
                          left: 0,
                          fontFamily: 'var(--display)',
                          fontSize: 9,
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          color: 'var(--ink-2)',
                        }}
                      >
                        {c.label}
                      </span>
                      <span
                        className="mono"
                        style={{
                          position: 'absolute',
                          bottom: -22,
                          left: 0,
                          fontSize: 11,
                          color: 'var(--ink-2)',
                        }}
                      >
                        ${amt.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rule" style={{ margin: '48px 48px 0', width: 'auto' }} />

          {/* Categories ledger */}
          <div style={{ padding: '24px 48px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <span className="eyebrow ink">Categories</span>
              {editing ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span
                    className="cap mono"
                    style={{
                      fontSize: 12,
                      color:
                        draftDelta === 0 ? 'var(--green-deep)'
                        : Math.abs(draftDelta) <= 1 ? 'var(--ink-2)'
                        : 'var(--red)',
                    }}
                  >
                    ${draftSum.toLocaleString()} / ${total.toLocaleString()}
                    {draftDelta !== 0 && (
                      <> · {draftDelta > 0 ? '+' : ''}${draftDelta.toLocaleString()} {draftDelta > 0 ? 'over' : 'under'}</>
                    )}
                  </span>
                  <button className="btn sm ghost" onClick={cancelEdit} disabled={savingAlloc}>
                    Cancel
                  </button>
                  <button
                    className="btn sm"
                    onClick={handleSaveAllocation}
                    disabled={!canSave || savingAlloc}
                    style={{ opacity: !canSave || savingAlloc ? 0.5 : 1 }}
                    title={!canSave ? `Adjust until total equals $${total.toLocaleString()}` : undefined}
                  >
                    {savingAlloc ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              ) : (
                <button className="btn sm ghost" onClick={startEdit}>
                  <EdIcon name="edit" size={12} />Adjust allocation
                </button>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              {ALLOC_CATEGORIES.map((c, i) => {
                const baseAmt = allocation[`${c.key}_budget`] ?? 0;
                const basePct = allocation[`${c.key}_pct`] ?? 0;
                const draftAmt = editing ? (draft?.[c.key] ?? 0) : baseAmt;
                const livePct = total > 0 ? Math.min(100, (draftAmt / total) * 100) : 0;
                const showPct = editing ? Math.round(livePct) : basePct;
                return (
                  <div
                    key={c.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 24,
                      padding: '18px 0',
                      borderBottom: i < ALLOC_CATEGORIES.length - 1 ? '1px solid var(--rule)' : 'none',
                    }}
                  >
                    <div style={{ flex: '0 0 200px' }}>
                      <span style={{ fontFamily: 'var(--serif)', fontSize: 22, letterSpacing: '-0.01em' }}>
                        {c.label}
                      </span>
                      <span className="cap" style={{ display: 'block' }}>{c.note}</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 }}>
                      <div style={{ position: 'relative', height: 8, background: 'var(--paper-2)' }}>
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: 0,
                            width: `${editing ? livePct : basePct}%`,
                            background: c.color,
                            transition: editing ? 'width 0.15s linear' : 'width 0.5s ease-out',
                          }}
                        />
                        {!editing && (
                          <div
                            aria-hidden="true"
                            style={{
                              position: 'absolute',
                              top: -4,
                              left: `${basePct}%`,
                              transform: 'translateX(-50%)',
                              width: 14,
                              height: 16,
                              background: 'var(--paper)',
                              border: '1px solid var(--ink)',
                            }}
                          />
                        )}
                      </div>
                      <span className="cap">{showPct}% of total</span>
                    </div>
                    <div style={{ flex: '0 0 130px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      {editing ? (
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            border: '1px solid var(--ink)',
                            padding: '4px 10px',
                            background: 'var(--paper)',
                            cursor: 'text',
                          }}
                        >
                          <span className="mono" style={{ fontSize: 16, color: 'var(--ink-3)' }}>$</span>
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={draftAmt}
                            onChange={(e) => setDraftAmount(c.key, e.target.value)}
                            aria-label={`${c.label} amount`}
                            style={{
                              fontFamily: 'var(--mono)',
                              fontSize: 18,
                              fontVariantNumeric: 'tabular-nums',
                              width: 90,
                              border: 0,
                              outline: 'none',
                              background: 'transparent',
                              textAlign: 'right',
                              color: 'var(--ink)',
                              padding: 0,
                            }}
                          />
                        </label>
                      ) : (
                        <span className="mono" style={{ fontSize: 22, letterSpacing: '-0.01em' }}>
                          ${baseAmt.toLocaleString()}
                        </span>
                      )}
                      <span className="cap" style={{ fontSize: 10, marginTop: 4 }}>
                        of ${total.toLocaleString()}
                      </span>
                    </div>
                    {!editing && <EdIcon name="drag" size={14} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advisor nudge */}
          <Link
            to={`/trips/${id}/ai`}
            style={{
              margin: '24px 48px 0',
              padding: '18px 22px',
              background: 'var(--ink)',
              color: 'var(--paper)',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              justifyContent: 'space-between',
              textDecoration: 'none',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--indigo)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <EdIcon name="sparkle" size={14} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="cap" style={{ color: 'rgba(250,250,247,0.6)' }}>
                  ADVISOR · ASK ABOUT THIS BUDGET
                </span>
                <span className="serif-i" style={{ fontSize: 18 }}>
                  "Want a second opinion on whether this split holds for {trip.destination}?"
                </span>
              </div>
            </div>
            <span className="btn" style={{ background: 'var(--paper)', color: 'var(--ink)', borderColor: 'var(--paper)' }}>
              Open advisor <EdIcon name="arrow" size={12} />
            </span>
          </Link>
        </>
      )}

      {/* SAVINGS — Thermometer hero */}
      <div className="rule" style={{ margin: '48px 48px 0', width: 'auto' }} />
      <div
        style={{
          padding: '40px 48px 48px',
          display: 'flex',
          gap: 48,
          flexWrap: 'wrap',
        }}
      >
        {/* Left — narrative */}
        <div style={{ flex: '0 0 380px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span className="eyebrow">A pact with future-you</span>
          <div className="serif" style={{ fontSize: 56, lineHeight: 0.92, letterSpacing: '-0.02em' }}>
            You are<br />
            <span style={{ color: 'var(--indigo)' }}>{fundedPct}%</span> of<br />
            the way to <span className="serif-i">{trip.destination}.</span>
          </div>
          <div className="rule-thin" style={{ marginTop: 8 }} />
          <div style={{ display: 'flex', gap: 28, marginTop: 8, flexWrap: 'wrap' }}>
            <Stat label="Saved" value={`$${saved.toLocaleString()}`} />
            <Stat label="Goal"  value={`$${total.toLocaleString()}`} />
            {plan?.weekly_savings_needed && (
              <Stat label="Cadence" value={`$${plan.weekly_savings_needed} / wk`} />
            )}
          </div>
          <p className="body-l" style={{ marginTop: 4, maxWidth: 380 }}>
            {plan
              ? `At your current cadence, the goal lands by ${shortDate(trip.departure_date)}. Adjust the amount below to update the plan.`
              : 'Log your savings so far and we\'ll calculate weekly, bi-weekly, and monthly cadences to land before departure.'}
          </p>

          <form
            onSubmit={handleSaveAmount}
            style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 8 }}
          >
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="amount-saved" className="ed-input-label">
                Update amount saved
              </label>
              <input
                id="amount-saved"
                type="number"
                value={amountSaved}
                onChange={(e) => setAmountSaved(e.target.value)}
                className="ed-input"
                placeholder="500"
              />
            </div>
            <button type="submit" disabled={savingPlan || !amountSaved} className="btn">
              {savingPlan ? 'Saving…' : 'Save'}
            </button>
          </form>
        </div>

        {/* Center — Thermometer */}
        <div
          style={{
            flex: '0 0 200px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <Thermometer pct={fundedPct} amountLabel={`$${saved.toLocaleString()}`} goalLabel={`$${total.toLocaleString()}`} />
        </div>

        {/* Right — Cadence + recents */}
        <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span className="eyebrow ink">Cadence</span>
          {plan ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
              <Cadence label="Per month"   value={`$${plan.monthly_savings_needed}`} />
              <Cadence label="Bi-weekly"   value={`$${plan.biweekly_savings_needed}`} />
              <Cadence label="Per week"    value={`$${plan.weekly_savings_needed}`} />
            </div>
          ) : (
            <p className="body-l">Set an amount saved to see weekly, bi-weekly, and monthly targets.</p>
          )}

          <div className="rule-thin" style={{ margin: '14px 0 6px' }} />
          <span className="eyebrow ink">A note from the advisor</span>
          <div className="serif-i" style={{ fontSize: 22, lineHeight: 1.25, color: 'var(--ink-2)' }}>
            {fundedPct >= 100
              ? `"You're fully funded. Send a small weekly contribution anyway — buffer never hurts."`
              : fundedPct >= 50
                ? `"You're past the halfway mark. Hold the cadence and the trip lands on time."`
                : `"Early days. Even small weekly contributions compound — pick a cadence and stick to it."`}
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span className="cap">{label}</span>
      <span
        className="mono"
        style={{ fontSize: 18, fontWeight: 500, color: accent ? 'var(--indigo)' : 'var(--ink)' }}
      >
        {value}
      </span>
    </div>
  );
}

function Cadence({ label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '14px 16px',
        background: 'var(--paper-2)',
        borderRadius: 6,
      }}
    >
      <span className="cap">{label}</span>
      <span className="serif" style={{ fontSize: 28, lineHeight: 1 }}>{value}</span>
    </div>
  );
}

function Thermometer({ pct, amountLabel, goalLabel }) {
  const safePct = Math.max(0, Math.min(100, pct));
  return (
    <div style={{ position: 'relative', width: 80, height: 460 }}>
      {/* Tube */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 32,
          height: 380,
          border: '1px solid var(--ink)',
          borderRadius: '16px 16px 0 0',
          background: 'var(--paper)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${safePct}%`,
            background: 'linear-gradient(180deg, var(--indigo), #8084d7)',
            transition: 'height 0.6s ease-out',
          }}
        />
      </div>
      {/* Bulb */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 80,
          height: 80,
          borderRadius: '50%',
          border: '1px solid var(--ink)',
          background: 'var(--indigo)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--paper)',
          fontFamily: 'var(--serif)',
          fontSize: 24,
        }}
      >
        {safePct}%
      </div>
      {/* Labels right */}
      <div
        style={{
          position: 'absolute',
          left: 'calc(50% + 32px)',
          bottom: '100px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          whiteSpace: 'nowrap',
        }}
      >
        <span className="mono" style={{ fontSize: 12, color: 'var(--indigo)', fontWeight: 600 }}>
          {amountLabel}
        </span>
        <span className="cap" style={{ fontSize: 9 }}>You · today</span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 'calc(50% + 32px)',
          top: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          whiteSpace: 'nowrap',
        }}
      >
        <span className="mono" style={{ fontSize: 12 }}>{goalLabel}</span>
        <span className="cap" style={{ fontSize: 9 }}>Goal</span>
      </div>
    </div>
  );
}
