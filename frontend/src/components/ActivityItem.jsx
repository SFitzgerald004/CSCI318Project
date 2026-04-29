import { useState } from 'react'

const CATEGORY_META = {
  dining:        { label: 'Dining',        color: 'var(--clay)' },
  sightseeing:   { label: 'Sightseeing',   color: 'var(--indigo)' },
  transport:     { label: 'Transport',     color: 'var(--ink)' },
  accommodation: { label: 'Lodging',       color: 'var(--green-deep)' },
  activity:      { label: 'Activity',      color: 'var(--ink-2)' },
}

const CATEGORIES = Object.keys(CATEGORY_META)

export default function ActivityItem({ activity, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(activity)

  const handleSave = () => {
    onUpdate(editData)
    setIsEditing(false)
  }

  const meta = CATEGORY_META[activity.category] || CATEGORY_META.activity

  return (
    <div
      style={{
        padding: '14px 0',
        borderTop: '1px dashed var(--rule)',
      }}
    >
      {isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label className="ed-input-label">Time</label>
              <input
                type="time"
                value={editData.time}
                onChange={(e) => setEditData({ ...editData, time: e.target.value })}
                className="ed-input"
                style={{ minWidth: 120 }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
              <label className="ed-input-label">Category</label>
              <select
                value={editData.category}
                onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                className="ed-input"
                style={{ background: 'transparent' }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_META[cat].label}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label className="ed-input-label">Title</label>
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="ed-input"
              placeholder="Activity title"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label className="ed-input-label">Location</label>
            <input
              type="text"
              value={editData.location || ''}
              onChange={(e) => setEditData({ ...editData, location: e.target.value })}
              className="ed-input"
              placeholder="Address or area"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label className="ed-input-label">Notes</label>
            <textarea
              value={editData.notes || ''}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              className="ed-input"
              style={{ resize: 'vertical', borderBottom: '1px solid var(--ink)' }}
              placeholder="Additional notes"
              rows={2}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSave} className="btn sm">Save</button>
            <button onClick={() => setIsEditing(false)} className="btn sm ghost">Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <span
            className="mono"
            style={{
              fontSize: 12,
              color: 'var(--indigo)',
              width: 56,
              paddingTop: 3,
              flexShrink: 0,
            }}
          >
            {activity.time || '--:--'}
          </span>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 22, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                {activity.title || 'Untitled activity'}
              </span>
              <span className="legend-dot" style={{ background: meta.color }} />
              <span className="cap" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                {meta.label}
              </span>
            </div>
            {activity.location && (
              <span className="cap">📍 {activity.location}</span>
            )}
            {activity.notes && (
              <span className="serif-i" style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 2 }}>
                "{activity.notes}"
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button
              onClick={() => setIsEditing(true)}
              className="link"
              style={{ fontSize: 12 }}
            >
              Edit
            </button>
            <span style={{ color: 'var(--ink-4)', fontSize: 12 }}>·</span>
            <button
              onClick={onDelete}
              className="link"
              style={{ fontSize: 12, color: 'var(--ink-3)' }}
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
