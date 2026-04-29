import { useEffect, useState } from 'react'

// Hero photos for destinations, fetched from Wikipedia's REST summary API.
// No API key needed; CORS-enabled. Falls back to null on miss/error so the
// caller can keep showing its gradient placeholder.

const memoryCache = new Map()
const SESSION_PREFIX = 'wf-hero-img:'
const NULL_SENTINEL = '__null__'

function readSessionCache(key) {
  try {
    const raw = sessionStorage.getItem(SESSION_PREFIX + key)
    if (raw === null) return undefined // never fetched
    return raw === NULL_SENTINEL ? null : raw
  } catch {
    return undefined
  }
}

function writeSessionCache(key, value) {
  try {
    sessionStorage.setItem(SESSION_PREFIX + key, value ?? NULL_SENTINEL)
  } catch {
    // sessionStorage may be unavailable (private mode, quota exceeded) — ignore
  }
}

// Resolve a cached image (memory → session) without firing a fetch.
function readCache(destination) {
  if (!destination) return null
  if (memoryCache.has(destination)) return memoryCache.get(destination)
  const session = readSessionCache(destination)
  if (session !== undefined) {
    // Promote into memory cache so subsequent reads are O(1).
    memoryCache.set(destination, session)
    return session
  }
  return null
}

async function fetchWikipediaImage(destination) {
  // Use first comma-separated chunk: "Paris, France" → "Paris"
  const title = destination.split(',')[0].trim()
  if (!title) return null
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return data.originalimage?.source || data.thumbnail?.source || null
  } catch {
    return null
  }
}

export function useDestinationImage(destination) {
  const [src, setSrc] = useState(() => readCache(destination))
  const [trackedDestination, setTrackedDestination] = useState(destination)

  // React-canonical "adjust state during render" — when destination changes
  // mid-tree, immediately rebase `src` to whatever the new cache says.
  // This avoids an extra render and keeps useEffect free of synchronous
  // state-syncing (which react-hooks/set-state-in-effect now disallows).
  if (trackedDestination !== destination) {
    setTrackedDestination(destination)
    setSrc(readCache(destination))
  }

  useEffect(() => {
    if (!destination) return
    // Skip fetch if we already have a definitive answer (URL or known-null)
    if (memoryCache.has(destination)) return
    if (readSessionCache(destination) !== undefined) return

    let alive = true
    fetchWikipediaImage(destination).then((url) => {
      memoryCache.set(destination, url)
      writeSessionCache(destination, url)
      if (alive) setSrc(url)
    })
    return () => {
      alive = false
    }
  }, [destination])

  return src
}
