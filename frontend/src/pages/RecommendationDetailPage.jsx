import { Link, useLocation, useParams } from 'react-router-dom'
import { EdIcon } from '../components/editorial'

const CATEGORY_META = {
  hotel:       { label: 'Stay',  color: 'var(--indigo)' },
  restaurant:  { label: 'Eat',   color: 'var(--clay)' },
  attraction:  { label: 'Do',    color: 'var(--green-deep)' },
  flight:      { label: 'Fly',   color: 'var(--ink)' },
  car_rental:  { label: 'Drive', color: 'var(--ink-3)' },
}

export default function RecommendationDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const rec = location.state?.rec

  if (!rec) {
    return (
      <div style={{ padding: '64px 48px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
        <span className="eyebrow">Detail unavailable</span>
        <div className="h-1" style={{ fontSize: 56 }}>
          Open from the<br /><span className="serif-i">list, please.</span>
        </div>
        <p className="body-l">
          This view shows whichever recommendation you click into from the Discover list. Head back and pick one.
        </p>
        <Link to={`/trips/${id}/recommendations`} className="btn" style={{ alignSelf: 'flex-start' }}>
          <EdIcon name="arrowLeft" size={12} />Back to Discover
        </Link>
      </div>
    )
  }

  const meta = CATEGORY_META[rec.category] || { label: 'Idea', color: 'var(--ink-2)' }

  return (
    <>
      <div
        style={{
          padding: '18px 48px',
          borderBottom: '1px solid var(--rule)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link to={`/trips/${id}/recommendations`} className="link">← Back to Discover</Link>
        <span className="cap">
          {rec.is_ai_pick ? 'AI pick' : 'Saved idea'}
        </span>
      </div>

      <div style={{ padding: '40px 48px 48px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 880 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="legend-dot" style={{ background: meta.color, width: 10, height: 10 }} />
          <span className="eyebrow ink" style={{ color: meta.color }}>
            {meta.label}
          </span>
        </div>

        <div className="serif" style={{ fontSize: 72, lineHeight: 0.95, letterSpacing: '-0.02em' }}>
          {rec.name}
        </div>

        {rec.description && (
          <p className="body-l" style={{ fontSize: 17, maxWidth: 680 }}>
            {rec.description}
          </p>
        )}

        {rec.image_url && (
          <img
            src={rec.image_url}
            alt={rec.name}
            style={{
              width: '100%',
              maxHeight: 380,
              objectFit: 'cover',
              borderRadius: 0,
              border: '1px solid var(--ink)',
            }}
          />
        )}

        <div className="rule-thin" />

        {/* Editorial fact strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 24,
          }}
        >
          <Fact
            label="Rating"
            value={rec.rating ? `${rec.rating} / 5` : '—'}
            sub={rec.rating ? '★'.repeat(Math.round(rec.rating)) : null}
          />
          <Fact label="Price level" value={rec.price_level || '—'} />
          <Fact
            label="Address"
            value={rec.address || '—'}
            small
          />
          <Fact
            label="Reviews"
            value={
              rec.review_count != null
                ? Number(rec.review_count).toLocaleString()
                : '—'
            }
          />
        </div>

        {rec.booking_url && (
          <>
            <div className="rule-thin" />
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a
                href={rec.booking_url}
                target="_blank"
                rel="noreferrer"
                className="btn"
              >
                Open booking link <EdIcon name="arrow" size={12} />
              </a>
              <Link to={`/trips/${id}/recommendations`} className="btn ghost">
                Back to Discover
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  )
}

function Fact({ label, value, sub, small = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span className="cap">{label}</span>
      <span
        style={{
          fontFamily: small ? 'var(--sans)' : 'var(--serif)',
          fontSize: small ? 14 : 28,
          lineHeight: small ? 1.4 : 1.0,
          letterSpacing: small ? '-0.011em' : '-0.01em',
        }}
      >
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: 13, color: 'var(--clay)', letterSpacing: '0.1em' }}>{sub}</span>
      )}
    </div>
  )
}
