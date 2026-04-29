import { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

// Editorial inline icon — mirrors design's Icon primitive (24x24 viewBox)
function EdIcon({ name, size = 14, stroke = 1.6 }) {
  const paths = {
    plane:   <path d="m22 12-7 6V14L3 13v-2l12-1V6l7 6Z" />,
    wallet:  (
      <>
        <rect x="3" y="6" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
        <circle cx="17" cy="15" r="1.2" fill="currentColor" />
      </>
    ),
    pig: (
      <>
        <path d="M5 12a7 7 0 0 1 14 0v3l2 1v3h-3l-1 2h-3v-2H10v2H7l-1-2H4v-3l1-1v-3z" />
        <circle cx="9" cy="11" r=".8" fill="currentColor" />
      </>
    ),
    sparkle: (
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.8 2.8M15.7 15.7l2.8 2.8M5.5 18.5l2.8-2.8M15.7 8.3l2.8-2.8" />
    ),
    map: (
      <>
        <path d="M3 6v15l6-3 6 3 6-3V3l-6 3-6-3-6 3z" />
        <path d="M9 3v15M15 6v15" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v3M12 20v3M3 12H1M23 12h-2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
      </>
    ),
    arrowLeft: <path d="M19 12H5M12 19l-7-7 7-7" />,
    menu:      <path d="M4 6h16M4 12h16M4 18h16" />,
    close:     <path d="M6 6l12 12M18 6 6 18" />,
    cal:       <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
    flight:    <path d="M3 16v-2l8-3V5a1.5 1.5 0 0 1 3 0v6l8 3v2l-8-2v4l2 1v2l-3.5-1L9 21v-2l2-1v-4l-8 2z" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export default function Sidebar({ tripName }) {
  const { id } = useParams();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const isActive = (path) => location.pathname === path;
  const itemClass = (active) => `ed-nav-item ${active ? 'active' : ''}`;

  // Reuse first-letter chunk of email as fallback display name.
  const handle = user?.email?.split('@')[0] || 'Traveler';

  const sidebarContent = (
    <>
      <Link to="/trips" className="ed-brand" onClick={() => setMobileOpen(false)}>
        <span className="brand-dot" />
        Wayfare
      </Link>

      {id ? (
        <>
          <Link
            to="/trips"
            className="ed-nav-item"
            style={{ color: 'var(--ink-3)', fontSize: 12 }}
            onClick={() => setMobileOpen(false)}
          >
            <span className="glyph"><EdIcon name="arrowLeft" size={12} /></span>All trips
          </Link>
          <div className="ed-nav-section">{tripName ? `Issue · ${tripName}` : 'Trip'}</div>
          <Link
            to={`/trips/${id}`}
            className={itemClass(isActive(`/trips/${id}`))}
            onClick={() => setMobileOpen(false)}
          >
            <span className="glyph"><EdIcon name="plane" /></span>Overview
          </Link>
          <Link
            to={`/trips/${id}/budget`}
            className={itemClass(isActive(`/trips/${id}/budget`))}
            onClick={() => setMobileOpen(false)}
          >
            <span className="glyph"><EdIcon name="wallet" /></span>Budget
          </Link>
          <Link
            to={`/trips/${id}/itinerary`}
            className={itemClass(isActive(`/trips/${id}/itinerary`))}
            onClick={() => setMobileOpen(false)}
          >
            <span className="glyph"><EdIcon name="cal" /></span>Itinerary
          </Link>
          <Link
            to={`/trips/${id}/flights`}
            className={itemClass(isActive(`/trips/${id}/flights`))}
            onClick={() => setMobileOpen(false)}
          >
            <span className="glyph"><EdIcon name="flight" /></span>Flights
          </Link>
          <Link
            to={`/trips/${id}/ai`}
            className={itemClass(isActive(`/trips/${id}/ai`))}
            onClick={() => setMobileOpen(false)}
          >
            <span className="glyph"><EdIcon name="sparkle" /></span>Advisor
          </Link>
          <Link
            to={`/trips/${id}/recommendations`}
            className={itemClass(isActive(`/trips/${id}/recommendations`))}
            onClick={() => setMobileOpen(false)}
          >
            <span className="glyph"><EdIcon name="map" /></span>Discover
          </Link>
        </>
      ) : (
        <>
          <div className="ed-nav-section">Plan</div>
          <Link
            to="/trips"
            className={itemClass(isActive('/trips'))}
            onClick={() => setMobileOpen(false)}
          >
            <span className="glyph"><EdIcon name="plane" /></span>Trips
          </Link>
        </>
      )}

      <div style={{ flex: 1 }} />

      <button
        type="button"
        onClick={logout}
        className="ed-nav-item"
        style={{ background: 'none', border: 0, textAlign: 'left', width: '100%', cursor: 'pointer' }}
      >
        <span className="glyph"><EdIcon name="settings" /></span>Sign out
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: 10,
          marginTop: 6,
          borderTop: '1px solid var(--rule)',
          paddingTop: 14,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #5b5fc7, #a8aaed)',
            flexShrink: 0,
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, minWidth: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {handle}
          </span>
          <span className="cap" style={{ fontSize: 10 }}>Solo traveler</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setMobileOpen(true)}
        className="ed-mobile-toggle"
      >
        <EdIcon name="menu" size={18} />
      </button>

      {mobileOpen && (
        <div
          className="md:hidden"
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(16,16,18,0.4)' }}
          onClick={() => setMobileOpen(false)}
          data-testid="sidebar-overlay"
        />
      )}

      <aside className={`ed-sidebar ${mobileOpen ? 'open' : ''}`}>
        {mobileOpen && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              background: 'none',
              border: 0,
              color: 'var(--ink-3)',
              cursor: 'pointer',
            }}
          >
            <EdIcon name="close" size={18} />
          </button>
        )}
        {sidebarContent}
      </aside>
    </>
  );
}
