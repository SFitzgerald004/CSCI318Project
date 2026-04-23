# Chat History Persistence + LLM Call Cache — Design Spec

**Date:** 2026-04-22
**Status:** Approved, ready for implementation plan
**Scope:** Persist AI chat history to Firestore. Cache LLM responses per action so repeated clicks don't re-invoke the model. Add force-refresh mechanism + relative timestamps.

---

## 1. Context and motivation

Current AI Advisor is stateless: chat messages live in React `useState` and are lost on navigation or page reload. Every click on an action card ("Analyze Budget", "Hotels", "Food", etc.) triggers a fresh OpenAI call, even if the user asked the same thing two minutes ago. This costs money, adds latency, and frustrates users who want to re-read a previous recommendation.

User feedback explicitly requested:
1. Chat and recommendations saved to database so conversation survives navigation
2. LLM should not regenerate a recommendation it already gave — unless the user specifically asks for new ones

### Goals

1. Persist every user prompt + AI response to Firestore
2. AiAdvisorPage loads full chat history on mount; chat panel seeded with past conversations
3. Action cards that have been asked before return cached responses (no LLM call)
4. User can force a fresh LLM call via a per-action 🔄 Refresh mini-button
5. Each AI message displays a relative timestamp ("2 hours ago")
6. Cached responses are visually marked so users know they're seeing a prior answer

### Non-goals

- No editing or deleting past messages (the existing "Save this" → Recommendations flow is separate and out of scope for this feature)
- No pagination — assume a trip has <50 messages, load all at once
- No multi-turn conversational follow-ups (each action stays single-shot)
- No cross-trip sharing of cached responses (cache is per-trip)
- No cache expiry / TTL (responses live forever unless user force-refreshes)

---

## 2. Data model

### New Firestore collection: `ai_messages`

Document shape:
```
{
  trip_id:     string,              // foreign key → trips
  role:        'user' | 'ai',
  content:     string,              // user prompt text OR AI advice text
  action:      string,              // 'analyze' | 'recommend:overall' | 'recommend:hotels' |
                                    //  'recommend:food' | 'recommend:activities'
  tools_used:  string[]?,           // AI messages only; mirrors Phase 1 response field
  category:    string | null,       // AI messages only; 'hotel' | 'restaurant' | 'attraction' | null
  can_save:    boolean,             // AI messages only; true iff category is non-null
  created_at:  timestamp,           // server-side, used for ordering
}
```

**Indexing:** Firestore auto-indexes single-field queries. Two queries needed:
1. `where('trip_id', '==', X).order_by('created_at')` — for loading history
2. `where('trip_id', '==', X).where('action', '==', 'recommend:hotels').order_by('created_at', desc).limit(1)` — for cache lookup

The second is a composite query; Firestore will prompt for index creation on first use. That's acceptable (one-time setup).

### Why a separate collection (vs. extending trips)

Firestore documents have a 1MB limit. An AI response is ~2KB. A trip with 50 messages = ~100KB, still fine as a subcollection, but a top-level collection is simpler to query cross-trip for future analytics (e.g., "total LLM calls per user this month") and keeps the trip document lean.

---

## 3. Backend changes

### Modified: `POST /api/ai/<trip_id>/analyze`

**Request:** optional JSON body `{ force: boolean }` (default false).

**Logic:**
1. Validate trip + auth (unchanged).
2. If `force` is false, query `ai_messages` for most recent document matching `(trip_id, action='analyze')`. If found → return cached response. Set `cached: true` in response.
3. Otherwise, call `analyze_budget(trip, allocation)` as today.
4. On successful LLM response, persist TWO documents atomically:
   - User message: `{role: 'user', content: 'Analyze my budget allocation', action: 'analyze', ...}`
   - AI message: `{role: 'ai', content: advice, tools_used, category: null, can_save: false, action: 'analyze', ...}`
5. Return `{advice, message_id, tools_used, cached: false}`.

**Response shape** (additive to Phase 1):
```json
{
  "advice": "...",
  "message_id": "<uuid>",
  "tools_used": ["get_savings_progress"],
  "cached": false
}
```

### Modified: `POST /api/ai/<trip_id>/recommend`

Same pattern with `action = f"recommend:{focus}"`. AI message gets the appropriate `category` (`hotel` / `restaurant` / `attraction` / `null` for `overall`) and `can_save: true` when category is non-null.

### New: `GET /api/ai/<trip_id>/messages`

Returns all messages for the trip, ordered by `created_at` ascending.

**Response:**
```json
[
  { "id": "<firestore_doc_id>", "role": "user", "content": "...", "action": "analyze", "created_at": "2026-04-22T10:00:00Z" },
  { "id": "...", "role": "ai", "content": "...", "action": "analyze", "tools_used": [...], "category": null, "can_save": false, "created_at": "2026-04-22T10:00:05Z" },
  ...
]
```

`created_at` serialized as ISO 8601 string.

### New model: `models/ai_message.py`

```python
class AiMessage:
    COLLECTION = 'ai_messages'

    @staticmethod
    def save_pair(trip_id, action, user_content, ai_content, tools_used, category, can_save):
        """Persist a user → ai message pair. Returns (user_doc, ai_doc)."""
        ...

    @staticmethod
    def get_cached(trip_id, action):
        """Return the most recent AI message for this action, or None."""
        ...

    @staticmethod
    def get_by_trip(trip_id):
        """Return all messages for a trip, ordered chronologically."""
        ...
```

Keeps Firestore query logic out of routes.

### Error handling

- If the cache query fails (Firestore down), fall through to fresh LLM call — user still gets a response.
- If persistence fails after a successful LLM call, still return the response to the user. Log the error but don't fail the request (degrades gracefully; worst case user re-asks and the successful response gets persisted on retry).

### No backend cache for concurrency

If a user double-clicks an action card rapidly (before first response returns), both requests miss the cache and both call the LLM. Accepted limitation — actual race window is small, and the second request still succeeds and writes a duplicate. Frontend should disable the action card while loading to minimize this.

---

## 4. Frontend changes

### `AiAdvisorPage.jsx`

**Load on mount:**
```jsx
useEffect(() => {
  Promise.all([getAllocation(id), getAiMessages(id)])
    .then(([_, messages]) => {
      setHasBudget(true);
      setMessages(messages);
    })
    .catch(() => setHasBudget(false))
    .finally(() => setLoading(false));
}, [id]);
```

**Track which actions have been asked:**
```jsx
const askedActions = useMemo(
  () => new Set(messages.filter(m => m.role === 'ai').map(m => m.action)),
  [messages]
);
```

**Handler signatures gain a `force` param:**
```jsx
async function handleAnalyze(force = false) {
  if (!force && askedActions.has('analyze')) {
    // Already have this; scroll to the most recent analyze message
    scrollToMostRecent('analyze');
    return;
  }
  setActiveAction('analyze');
  setMessages(prev => [...prev, { role: 'user', content: '...', action: 'analyze' }]);
  try {
    const { advice, tools_used, cached } = await analyzeBudget(id, { force });
    setMessages(prev => [...prev, {
      role: 'ai', content: advice, tools_used, action: 'analyze', cached, created_at: new Date().toISOString()
    }]);
  } catch { ... }
}
```

Same pattern for `handleRecommend(focus, force = false)`.

### `AiInsightCard.jsx`

Gains two new props:
- `alreadyAsked: boolean` — shows a small ✓ next to title
- `onRefresh?: () => void` — when provided AND `alreadyAsked`, renders a small 🔄 mini-button at top-right of the card

Click behavior:
- Main click: calls `onClick` as today (frontend decides whether to hit cache or skip)
- Refresh click: calls `onRefresh` which triggers `handleX(force=true)`
- Clicking refresh doesn't trigger the main onClick (stopPropagation)

### `AiChatPanel.jsx`

Each AI message now shows a small relative timestamp under the content (before the tool badges):
- "just now"
- "5 minutes ago"
- "2 hours ago"
- "yesterday"
- "3 days ago"

Use `Intl.RelativeTimeFormat` — built into browsers, no dependency.

Cached responses additionally get a small gray "Cached" pill next to the timestamp.

### New service: `getAiMessages`

In `frontend/src/services/aiService.js`:
```js
export async function getAiMessages(tripId) {
  const { data } = await api.get(`/ai/${tripId}/messages`);
  return data;
}
```

And existing `analyzeBudget` / `getAiRecommendations` gain optional `{ force }` params:
```js
export async function analyzeBudget(tripId, { force = false } = {}) {
  const { data } = await api.post(`/ai/${tripId}/analyze`, { force });
  return data;
}

export async function getAiRecommendations(tripId, focus, { force = false } = {}) {
  const { data } = await api.post(`/ai/${tripId}/recommend`, { focus, force });
  return data;
}
```

---

## 5. UX details

### Timestamp formatting

Rules (using `Intl.RelativeTimeFormat('en', { numeric: 'auto' })`):
- < 1 min → "just now"
- < 1 hour → "N minute(s) ago"
- < 1 day → "N hour(s) ago"
- < 7 days → "N day(s) ago"
- ≥ 7 days → absolute date (e.g., "Apr 15, 2026")

Placed in a small row under the AI bubble content, above the tool badges row. Styled as `type-micro text-text-tertiary`.

### Cached pill

Small gray pill with text "Cached" next to the timestamp:
```
2 hours ago  [Cached]
```

Uses the existing `<Badge variant="neutral">Cached</Badge>` primitive — no new UI work.

**When the pill shows:** only when a request *during the current session* returned `cached: true` from the backend. Historical messages loaded via `GET /messages` on mount do NOT get the pill — the timestamp alone conveys their age, and pilling every single old message would be visually noisy. This means: the pill effectively means "you just clicked a button and we skipped the LLM for you." A first-time page-load of a user's history shows only timestamps.

**Implementation:** Each message object in React state carries a `cached` boolean. Set to the value from the `POST` response during the session; omitted (treated as false) for messages loaded from `GET /messages`.

### Refresh mini-button placement

Top-right of the AiInsightCard, overlapping the card's own `onClick` area. Uses `ArrowPathIcon` from Heroicons at 14px. On click: `stopPropagation()` + call `onRefresh`. Tooltip: "Get fresh recommendations".

Visible only when `alreadyAsked` is true (cleaner UI for first-time users).

### Already-asked indicator

Small green ✓ (`CheckCircleIcon` solid, 12px, `text-green-500`) appearing next to the card's title text when `alreadyAsked === true`. Subtle cue that the card has content to show.

### Loading state during cache hit

Backend returns cache responses in <50ms. Frontend should still go through the loading state briefly (pulsing dots on the card) for UX consistency — the response appearing instantly without any loading animation feels jarring.

Actually: accept the instant return. Skip the loading animation on cache hits. Response appears immediately. User gets positive reinforcement ("ah, this is fast because it's cached").

### Empty state (no history yet)

Unchanged from current behavior: if `messages.length === 0`, show the existing EmptyState with "Ask the AI" prompt.

---

## 6. Testing strategy

### Backend tests (new, in `tests/test_ai_messages.py` and `tests/test_routes.py`)

1. `AiMessage.save_pair()` writes two documents with correct shape
2. `AiMessage.get_cached()` returns most recent AI message for action, None when absent
3. `AiMessage.get_by_trip()` returns messages in chronological order
4. `POST /analyze` without force + no prior message → calls LLM + saves pair
5. `POST /analyze` without force + prior message exists → returns cached, does NOT call LLM
6. `POST /analyze` with `force=true` + prior message → calls LLM + saves new pair
7. `POST /recommend` variants mirror the above
8. `GET /messages` returns persisted messages with correct ordering
9. Auth failures on messages endpoint return 401/403/404 per convention

### Frontend tests (extensions to existing test files)

1. `AiAdvisorPage` loads `getAiMessages` on mount, seeds message state
2. `AiInsightCard` shows ✓ when `alreadyAsked`
3. `AiInsightCard` shows 🔄 button only when `alreadyAsked + onRefresh`
4. Clicking 🔄 calls `onRefresh`, does NOT call main `onClick`
5. `AiChatPanel` renders relative timestamp on AI messages
6. Cached AI messages render the "Cached" badge
7. New `aiService.getAiMessages` + `{force}` arg tests

### Manual smoke test (end-of-plan step)

1. Reload page → previously-asked Hotels response persists in chat
2. Click Hotels a second time → no network call to LLM (check network tab)
3. Click 🔄 on Hotels card → network call happens, new response appended to chat
4. Both old and new hotel responses visible in chat
5. Cached vs fresh responses visually distinguishable via "Cached" pill

---

## 7. File inventory

### New backend files
- `models/ai_message.py`

### Modified backend files
- `routes/ai.py` (cache logic, persistence, messages endpoint)
- `tests/test_routes.py` (add tests for new behavior)

### New backend test files
- `tests/test_ai_message.py` (model tests)

### New frontend files
- `frontend/src/utils/relativeTime.js` (small formatter helper)

### Modified frontend files
- `frontend/src/services/aiService.js` (add `getAiMessages`, add `{force}` params)
- `frontend/src/pages/AiAdvisorPage.jsx` (load history on mount, track asked actions, force-refresh)
- `frontend/src/components/AiInsightCard.jsx` (✓ indicator + 🔄 button)
- `frontend/src/components/AiChatPanel.jsx` (timestamps + Cached badge)
- `frontend/src/test/AiAdvisorPage.test.jsx` (if it exists) or new test file
- `frontend/src/test/AiChatPanel.test.jsx` (extend)

**Count:** ~2 new files, ~8 modified, ~2 new test files.

---

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Firestore composite index required for cache query → first request after deploy fails with index error | Plan step: have the developer create the index manually after first deploy (Firebase console provides a link). Or: just use `get_by_trip` + filter in Python (slightly less efficient but avoids index). Plan will choose the simpler path. |
| Stale cache: user's budget allocation changes after an "Analyze" response was cached → stale advice | Accepted. User can force-refresh via 🔄. Budget-change-invalidation is Phase 3+ work. |
| Messages accumulate indefinitely per trip, slowing `GET /messages` | Assume <50 messages/trip for this project. If volume ever grows, add pagination. |
| `Intl.RelativeTimeFormat` not available in very old browsers | Accepted. Target is modern browsers per Vite config. Fallback formatter optional if issue emerges. |
| Double-click race (two concurrent requests miss cache, both call LLM) | Frontend disables action card while `activeAction !== null`. Duplicate writes are tolerated; `get_cached` returns the most recent. |

---

## 9. Success criteria

- [x] Reload page with existing trip history → chat panel shows all past messages in order
- [x] Click any previously-asked action → instant response from cache, no LLM call, response marked "Cached"
- [x] Click 🔄 on an asked action → force fresh LLM call, new message appears, no Cached badge
- [x] Every AI message shows a relative timestamp
- [x] Existing 115 frontend tests + 88 backend tests still pass
- [x] ~12 new tests added across model, routes, and frontend
- [x] Smoke test: hotels response persists through reload; second click is instant; 🔄 gets fresh response

---

## 10. Out of scope (future work)

- Stream LLM responses (Phase 4+ — would change the shape entirely)
- Edit/delete individual messages
- Multi-turn follow-up prompts (user can reply to AI)
- Cross-trip message sharing or aggregate analytics
- Cache TTL / auto-expiry
- Soft-delete instead of overwriting on force-refresh (keep N versions)
- Full-text search over message history

These build on Phase 3's foundation but are not required for the user's stated ask.
