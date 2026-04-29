// Plain helpers used across Wayfare editorial pages.
// Kept in a .js file (no JSX exports) so vite-plugin-react fast-refresh
// can hot-update the JSX components in editorial.jsx without forcing a full reload.

const KNOWN_CITY_SLUGS = ['tokyo', 'lisbon', 'reykjavik', 'mexico', 'paris', 'bali'];

// Slugify a destination string into one of the available .city-* gradients.
export function cityClassFor(destination) {
  if (!destination) return 'city-default';
  const norm = destination
    .toLowerCase()
    .normalize('NFD')
    // strip combining diacritical marks (Reykjavík → reykjavik)
    .replace(/[̀-ͯ]/g, '');
  for (const slug of KNOWN_CITY_SLUGS) {
    if (norm.includes(slug)) return `city-${slug}`;
  }
  if (norm.includes('cdmx')) return 'city-mexico';
  return 'city-default';
}

// Format ISO date string → "Mar 14"
export function shortDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Format ISO date string → "March 14, 2025"
export function longDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// Days between today and an ISO date — positive = future.
export function daysFromToday(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}
