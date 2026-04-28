import { useEffect, useState } from 'react';

/**
 * Returns true only if `loading` has been true for at least `delayMs`.
 * Once it becomes true, it stays true for a minimum of `minVisibleMs` after
 * loading flips back to false, preventing "flash of skeleton" on fast responses.
 */
export function useDelayedLoading(loading, delayMs = 150, minVisibleMs = 300) {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setShowLoading(true), delayMs);
      return () => clearTimeout(timer);
    }
    if (showLoading) {
      const timer = setTimeout(() => setShowLoading(false), minVisibleMs);
      return () => clearTimeout(timer);
    }
  }, [loading, delayMs, minVisibleMs, showLoading]);

  return showLoading;
}
