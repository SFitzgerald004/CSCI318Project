import { useState } from 'react'
import ActivityItem from './ActivityItem'

const CATEGORIES = [
  { value: 'activity',      label: 'Activity' },
  { value: 'dining',        label: 'Dining' },
  { value: 'sightseeing',   label: 'Sightseeing' },
  { value: 'transport',     label: 'Transport' },
  { value: 'accommodation', label: 'Lodging' },
]

const EMPTY_ACTIVITY = { time: '', title: '', location: '', notes: '', category: 'activity' }

export default function ItineraryDay({ day, dayIndex, onUpdateActivity, onDeleteActivity, onAddActivity }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newActivity, setNewActivity] = useState(EMPTY_ACTIVITY)

  const handleAdd = () => {
    if (!newActivity.time || !newActivity.title) return
    onAddActivity(dayIndex, { ...newActivity, id: Date.now().toString() })
    setNewActivity(EMPTY_ACTIVITY)
    setShowAddForm(false)
  }

  const dateObj = new Date(day.date)
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const numActivities = day.activities?.length || 0

  return (
    <section
      style={{
        borderTop: '1px solid var(--rule)',
        padding: '20px 0',
      }}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          background: 'none',
          border: 0,
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flex: 1, minWidth: 0 }}>
          <span
            className="mono"
            style={{
              fontSize: 12,
              color: 'var(--indigo)',
              fontWeight: 600,
              letterSpacing: '0.16em',
              flexShrink: 0,
            }}
          >
            DAY {String(dayIndex + 1).padStart(2, '0')}
          </span>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 32, lineHeight: 1, letterSpacing: '-0.01em' }}>
            {dayName}
            <span className="serif-i" style={{ color: 'var(--indigo)' }}>,</span>{' '}
            <span className="serif-i" style={{ color: 'var(--ink-2)' }}>{dateStr}</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span className="cap">
            {numActivities === 0 ? 'No plans' : `${numActivities} ${numActivities === 1 ? 'plan' : 'plans'}`}
          </span>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{isExpanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {isExpanded && (
        <div style={{ marginTop: 16 }}>
          {numActivities > 0 ? (
            <div>
              {day.activities
                .slice()
                .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
                .map((activity, idx) => (
                  <ActivityItem
                    key={activity.id || `${dayIndex}-${idx}`}
                    activity={activity}
                    onUpdate={(updated) => onUpdateActivity(dayIndex, idx, updated)}
                    onDelete={() => onDeleteActivity(dayIndex, idx)}
                  />
                ))}
            </div>
          ) : (
            <p className="serif-i" style={{ fontSize: 16, color: 'var(--ink-3)', padding: '8px 0' }}>
              "Nothing scheduled. A blank day is its own kind of plan."
            </p>
          )}

          {showAddForm ? (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                background: 'var(--paper-2)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <span className="eyebrow">New activity</span>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label className="ed-input-label">Time</label>
                  <input
                    type="time"
                    value={newActivity.time}
                    onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                    className="ed-input"
                    style={{ minWidth: 120 }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
                  <label className="ed-input-label">Category</label>
                  <select
                    value={newActivity.category}
                    onChange={(e) => setNewActivity({ ...newActivity, category: e.target.value })}
                    className="ed-input"
                    style={{ background: 'transparent' }}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="ed-input-label">Title</label>
                <input
                  type="text"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                  className="ed-input"
                  placeholder="Activity title"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="ed-input-label">Location</label>
                <input
                  type="text"
                  value={newActivity.location}
                  onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
                  className="ed-input"
                  placeholder="Address or area"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="ed-input-label">Notes</label>
                <textarea
                  value={newActivity.notes}
                  onChange={(e) => setNewActivity({ ...newActivity, notes: e.target.value })}
                  className="ed-input"
                  style={{ resize: 'vertical', borderBottom: '1px solid var(--ink)' }}
                  placeholder="Reservations, reminders, etc."
                  rows={2}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!newActivity.time || !newActivity.title}
                  className="btn sm"
                  style={{ opacity: !newActivity.time || !newActivity.title ? 0.5 : 1 }}
                >
                  Add to day
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn sm ghost"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              style={{
                marginTop: 14,
                padding: '10px 16px',
                width: '100%',
                background: 'transparent',
                border: '1px dashed var(--rule)',
                color: 'var(--ink-3)',
                fontFamily: 'var(--sans)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              + Add activity
            </button>
          )}
        </div>
      )}
    </section>
  )
}
