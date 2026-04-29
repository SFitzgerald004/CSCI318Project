// Editorial JSX primitives shared across Wayfare hi-fi pages.
// Plain helpers (cityClassFor, shortDate, …) live in ./editorialHelpers.js
// — import them from there directly to keep this file JSX-only for fast-refresh.

import { useDestinationImage } from '../hooks/useDestinationImage';

const ICON_PATHS = {
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </>
  ),
  arrow: <><path d="M5 12h14" /><path d="m13 5 7 7-7 7" /></>,
  arrowLeft: <path d="M19 12H5M12 19l-7-7 7-7" />,
  sparkle: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.8 2.8M15.7 15.7l2.8 2.8M5.5 18.5l2.8-2.8M15.7 8.3l2.8-2.8" />,
  map: <><path d="M3 6v15l6-3 6 3 6-3V3l-6 3-6-3-6 3z" /><path d="M9 3v15M15 6v15" /></>,
  plane: <path d="m22 12-7 6V14L3 13v-2l12-1V6l7 6Z" />,
  wallet: (
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
  edit: <><path d="M4 20h4l11-11-4-4L4 16z" /><path d="m14 5 4 4" /></>,
  drag: (
    <>
      <circle cx="9" cy="6" r="1" fill="currentColor" />
      <circle cx="15" cy="6" r="1" fill="currentColor" />
      <circle cx="9" cy="12" r="1" fill="currentColor" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
      <circle cx="9" cy="18" r="1" fill="currentColor" />
      <circle cx="15" cy="18" r="1" fill="currentColor" />
    </>
  ),
  send: <path d="M3 12 21 3l-4 18-5-7-9-2z" />,
  mic: <><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  filter: <path d="M3 5h18l-7 9v6l-4-2v-4z" />,
  check: <path d="m4 12 5 5L20 6" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="19" cy="12" r="1.2" fill="currentColor" />
    </>
  ),
  refresh: (
    <>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </>
  ),
  pin: <><path d="M12 2a6 6 0 0 0-6 6c0 5 6 12 6 12s6-7 6-12a6 6 0 0 0-6-6z" /><circle cx="12" cy="8" r="2" /></>,
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </>
  ),
  cal: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
};

export function EdIcon({ name, size = 14, stroke = 1.6, style }) {
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
      style={style}
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

export function HeroImg({ city, destination, children, height = 240, style, className = '' }) {
  // Try a real Wikipedia photo for the destination; fall back to the
  // editorial gradient (city-* class) while loading or on miss.
  const photo = useDestinationImage(destination);
  const cityClass = photo ? '' : (city || '');
  const photoStyle = photo
    ? {
        backgroundImage: `url(${photo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : null;
  return (
    <div
      className={`hero-img grain ${cityClass} ${className}`.trim()}
      style={{ height, ...photoStyle, ...style }}
    >
      {children}
    </div>
  );
}

export function Topbar({ sub, title, action }) {
  return (
    <div className="ed-topbar">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        {sub && <span className="eyebrow ink">{sub}</span>}
        <span className="ed-topbar-title">{title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{action}</div>
    </div>
  );
}
