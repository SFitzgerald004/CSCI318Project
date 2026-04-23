const MS_PER_MIN = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;
const MS_PER_WEEK = MS_PER_DAY * 7;

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/**
 * Format a date as a human-readable relative time.
 * Returns 'just now' / 'N minutes ago' / 'N hours ago' / 'N days ago' / 'Apr 10'
 */
export function relativeTime(input) {
  if (!input) return '';
  const date = typeof input === 'string' ? new Date(input) : input;
  const diff = Date.now() - date.getTime();

  if (diff < MS_PER_MIN) return 'just now';
  if (diff < MS_PER_HOUR) {
    const mins = Math.floor(diff / MS_PER_MIN);
    return rtf.format(-mins, 'minute');
  }
  if (diff < MS_PER_DAY) {
    const hours = Math.floor(diff / MS_PER_HOUR);
    return rtf.format(-hours, 'hour');
  }
  if (diff < MS_PER_WEEK) {
    const days = Math.floor(diff / MS_PER_DAY);
    return rtf.format(-days, 'day');
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
