# Chat History Persistence + LLM Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist AI chat history to Firestore and cache LLM responses per action, so users don't lose conversations on reload and repeated clicks don't re-invoke the LLM. Add force-refresh 🔄 button + relative timestamps + "Cached" pill.

**Architecture:** New Firestore collection `ai_messages` stores every user prompt + AI response. Backend `/analyze` and `/recommend` check for cached responses before calling the LLM; new `GET /messages` endpoint returns history. Frontend seeds chat on mount, tracks which actions have been asked, and exposes a force-refresh mini-button.

**Tech Stack:** Python 3.11, Flask, Firebase Firestore, pytest; React 19, Vitest + @testing-library/react, existing tokens and primitives.

**Spec:** [docs/superpowers/specs/2026-04-22-chat-history-persistence-design.md](../specs/2026-04-22-chat-history-persistence-design.md)

**Working branch:** `backend` (same as Phase 1 and Phase 2)

---

## File inventory

**New backend files (1):**
- `models/ai_message.py`

**Modified backend files (2):**
- `routes/ai.py`
- `tests/test_routes.py`

**New backend test files (1):**
- `tests/test_ai_message.py`

**New frontend files (2):**
- `frontend/src/utils/relativeTime.js`
- `frontend/src/test/relativeTime.test.js`

**Modified frontend files (5):**
- `frontend/src/services/aiService.js`
- `frontend/src/pages/AiAdvisorPage.jsx`
- `frontend/src/components/AiInsightCard.jsx`
- `frontend/src/components/AiChatPanel.jsx`
- `frontend/src/test/AiChatPanel.test.jsx`

---

## Task 1: `AiMessage` model + tests

**Files:**
- Create: `models/ai_message.py`
- Create: `tests/test_ai_message.py`

- [ ] **Step 1: Write the failing tests**

Create `tests/test_ai_message.py`:

```python
import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timezone


@pytest.fixture
def mock_db():
    """Mock the Firestore db module-level global."""
    with patch('extensions.db') as db:
        yield db


class TestSavePair:
    def test_save_pair_writes_two_documents(self, mock_db):
        from models.ai_message import AiMessage

        mock_collection = MagicMock()
        mock_db.collection.return_value = mock_collection
        user_ref = MagicMock()
        user_ref.id = 'user_doc_id'
        ai_ref = MagicMock()
        ai_ref.id = 'ai_doc_id'
        mock_collection.document.side_effect = [user_ref, ai_ref]

        user_doc, ai_doc = AiMessage.save_pair(
            trip_id='trip1',
            action='recommend:hotels',
            user_content='Get hotels recommendations',
            ai_content='Here are 3 hotels...',
            tools_used=['get_saved_recommendations'],
            category='hotel',
            can_save=True,
        )

        assert mock_collection.document.call_count == 2
        assert user_ref.set.called
        assert ai_ref.set.called

        # user doc shape
        user_payload = user_ref.set.call_args.args[0]
        assert user_payload['trip_id'] == 'trip1'
        assert user_payload['role'] == 'user'
        assert user_payload['content'] == 'Get hotels recommendations'
        assert user_payload['action'] == 'recommend:hotels'
        assert 'created_at' in user_payload

        # ai doc shape
        ai_payload = ai_ref.set.call_args.args[0]
        assert ai_payload['role'] == 'ai'
        assert ai_payload['content'] == 'Here are 3 hotels...'
        assert ai_payload['tools_used'] == ['get_saved_recommendations']
        assert ai_payload['category'] == 'hotel'
        assert ai_payload['can_save'] is True


class TestGetCached:
    def test_get_cached_returns_most_recent_ai_message_for_action(self, mock_db):
        from models.ai_message import AiMessage

        # Mock query chain
        doc1 = MagicMock()
        doc1.id = 'ai_1'
        doc1.to_dict.return_value = {
            'trip_id': 'trip1', 'role': 'ai', 'content': 'advice',
            'action': 'analyze', 'tools_used': [], 'category': None, 'can_save': False,
            'created_at': datetime(2026, 4, 22, tzinfo=timezone.utc),
        }
        query = MagicMock()
        query.where.return_value = query
        query.order_by.return_value = query
        query.limit.return_value = query
        query.stream.return_value = iter([doc1])
        mock_db.collection.return_value = query

        result = AiMessage.get_cached(trip_id='trip1', action='analyze')
        assert result is not None
        assert result['id'] == 'ai_1'
        assert result['content'] == 'advice'

    def test_get_cached_returns_none_when_no_match(self, mock_db):
        from models.ai_message import AiMessage
        query = MagicMock()
        query.where.return_value = query
        query.order_by.return_value = query
        query.limit.return_value = query
        query.stream.return_value = iter([])
        mock_db.collection.return_value = query

        result = AiMessage.get_cached(trip_id='trip1', action='analyze')
        assert result is None


class TestGetByTrip:
    def test_get_by_trip_returns_messages_in_order(self, mock_db):
        from models.ai_message import AiMessage

        doc1 = MagicMock()
        doc1.id = 'm1'
        doc1.to_dict.return_value = {
            'trip_id': 'trip1', 'role': 'user', 'content': 'hi',
            'action': 'analyze', 'created_at': datetime(2026, 4, 22, 10, 0, tzinfo=timezone.utc),
        }
        doc2 = MagicMock()
        doc2.id = 'm2'
        doc2.to_dict.return_value = {
            'trip_id': 'trip1', 'role': 'ai', 'content': 'advice',
            'action': 'analyze', 'created_at': datetime(2026, 4, 22, 10, 0, 5, tzinfo=timezone.utc),
        }
        query = MagicMock()
        query.where.return_value = query
        query.order_by.return_value = query
        query.stream.return_value = iter([doc1, doc2])
        mock_db.collection.return_value = query

        result = AiMessage.get_by_trip('trip1')
        assert len(result) == 2
        assert result[0]['id'] == 'm1'
        assert result[1]['id'] == 'm2'
        # created_at should be ISO string in response
        assert isinstance(result[0]['created_at'], str)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/heitindersingh/CSCI318Project && source .venv/bin/activate && python -m pytest tests/test_ai_message.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'models.ai_message'`.

- [ ] **Step 3: Create `models/ai_message.py`**

```python
from extensions import db
from datetime import datetime, timezone


class AiMessage:
    COLLECTION = 'ai_messages'

    @staticmethod
    def save_pair(trip_id, action, user_content, ai_content, tools_used, category, can_save):
        """Persist a user-message + ai-message pair for the given trip/action.

        Returns (user_doc, ai_doc) where each doc is a dict with an 'id' field.
        """
        now = datetime.now(timezone.utc)
        coll = db.collection(AiMessage.COLLECTION)

        user_ref = coll.document()
        user_payload = {
            'trip_id': trip_id,
            'role': 'user',
            'content': user_content,
            'action': action,
            'created_at': now,
        }
        user_ref.set(user_payload)

        ai_ref = coll.document()
        ai_payload = {
            'trip_id': trip_id,
            'role': 'ai',
            'content': ai_content,
            'action': action,
            'tools_used': tools_used or [],
            'category': category,
            'can_save': can_save,
            'created_at': now,
        }
        ai_ref.set(ai_payload)

        return (
            {'id': user_ref.id, **user_payload},
            {'id': ai_ref.id, **ai_payload},
        )

    @staticmethod
    def get_cached(trip_id, action):
        """Return the most recent AI message for this trip + action, or None."""
        query = (
            db.collection(AiMessage.COLLECTION)
            .where('trip_id', '==', trip_id)
            .where('action', '==', action)
            .where('role', '==', 'ai')
            .order_by('created_at', direction='DESCENDING')
            .limit(1)
        )
        docs = list(query.stream())
        if not docs:
            return None
        doc = docs[0]
        return {'id': doc.id, **doc.to_dict()}

    @staticmethod
    def get_by_trip(trip_id):
        """Return all messages for a trip ordered chronologically.

        Each message's created_at is serialized to an ISO 8601 string.
        """
        query = (
            db.collection(AiMessage.COLLECTION)
            .where('trip_id', '==', trip_id)
            .order_by('created_at')
        )
        results = []
        for doc in query.stream():
            data = doc.to_dict()
            if isinstance(data.get('created_at'), datetime):
                data['created_at'] = data['created_at'].isoformat()
            results.append({'id': doc.id, **data})
        return results
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest tests/test_ai_message.py -v`
Expected: PASS (5 tests).

**Note on composite index:** `get_cached` uses three `where` clauses + `order_by`, which requires a composite Firestore index. On first production call, Firestore will return an error with a link to create the index. For testing we're mocking, so no issue. Document this in commit message.

- [ ] **Step 5: Commit**

```bash
git add models/ai_message.py tests/test_ai_message.py
git commit -m "$(cat <<'EOF'
feat: add AiMessage model for chat history persistence

save_pair() writes user + ai documents atomically-ish (same timestamp).
get_cached() returns the most recent ai message matching trip + action.
get_by_trip() returns chronologically-ordered history with ISO dates.

Note: get_cached's three-where + order_by query requires a composite
Firestore index. Production will need to follow the link from the
error message on first call to create it. Tests mock the query so
don't hit this.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `GET /api/ai/<trip_id>/messages` endpoint

**Files:**
- Modify: `routes/ai.py` (add new endpoint)
- Modify: `tests/test_routes.py` (add tests)

- [ ] **Step 1: Write the failing tests**

Append to `tests/test_routes.py` inside `class TestAiRoutes`:

```python
    def test_messages_requires_auth(self, client):
        response = client.get('/api/ai/trip123/messages')
        assert response.status_code == 401

    @patch("routes.ai.AiMessage")
    @patch("routes.ai.Trip")
    def test_messages_returns_history(self, MockTrip, MockAiMsg, app):
        MockTrip.get.return_value = {"user_id": "test-user-123"}
        MockAiMsg.get_by_trip.return_value = [
            {"id": "m1", "role": "user", "content": "hi", "action": "analyze"},
            {"id": "m2", "role": "ai", "content": "advice", "action": "analyze"},
        ]
        from routes.ai import messages
        inner = mock_auth(messages.__wrapped__)
        with app.test_request_context("/api/ai/trip123/messages", method="GET") as ctx:
            ctx.request.uid = "test-user-123"
            response, status = inner("trip123")

        assert status == 200
        data = response.get_json()
        assert len(data) == 2
        assert data[0]["id"] == "m1"
        MockAiMsg.get_by_trip.assert_called_once_with("trip123")

    @patch("routes.ai.Trip")
    def test_messages_trip_not_found(self, MockTrip, app):
        MockTrip.get.return_value = None
        from routes.ai import messages
        inner = mock_auth(messages.__wrapped__)
        with app.test_request_context("/api/ai/trip123/messages", method="GET") as ctx:
            ctx.request.uid = "test-user-123"
            response, status = inner("trip123")
        assert status == 404

    @patch("routes.ai.Trip")
    def test_messages_unauthorized(self, MockTrip, app):
        MockTrip.get.return_value = {"user_id": "other-user"}
        from routes.ai import messages
        inner = mock_auth(messages.__wrapped__)
        with app.test_request_context("/api/ai/trip123/messages", method="GET") as ctx:
            ctx.request.uid = "test-user-123"
            response, status = inner("trip123")
        assert status == 403
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_routes.py::TestAiRoutes -v`
Expected: new tests FAIL with `cannot import name 'messages' from 'routes.ai'`.

- [ ] **Step 3: Add the endpoint to `routes/ai.py`**

Add near the top imports:
```python
from models.ai_message import AiMessage
```

Add this new route (place it alongside the existing `analyze` and `recommend` routes):

```python
@ai_bp.route("/api/ai/<trip_id>/messages", methods=["GET"])
@require_auth
def messages(trip_id):
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({"error": "Trip not found"}), 404
    if trip["user_id"] != request.uid:
        return jsonify({"error": "Unauthorized"}), 403
    msgs = AiMessage.get_by_trip(trip_id)
    return jsonify(msgs), 200
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest tests/test_routes.py::TestAiRoutes -v`
Expected: PASS (including 4 new tests).

- [ ] **Step 5: Commit**

```bash
git add routes/ai.py tests/test_routes.py
git commit -m "$(cat <<'EOF'
feat: add GET /api/ai/<trip_id>/messages endpoint

Returns chronologically-ordered AI chat history for a trip.
Enforces trip ownership (403 for wrong user, 404 for missing trip).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Cache + persist in `POST /analyze`

**Files:**
- Modify: `routes/ai.py` (analyze endpoint)
- Modify: `tests/test_routes.py` (new tests)

- [ ] **Step 1: Write the failing tests**

Append to `tests/test_routes.py` inside `class TestAiRoutes`:

```python
    @patch("routes.ai.analyze_budget")
    @patch("routes.ai.AiMessage")
    @patch("routes.ai.BudgetAllocation")
    @patch("routes.ai.Trip")
    def test_analyze_cache_hit_returns_cached_without_llm_call(
        self, MockTrip, MockAllocation, MockAiMsg, mock_analyze, app
    ):
        MockTrip.get.return_value = {"user_id": "test-user-123"}
        MockAllocation.get.return_value = {"hotel_budget": 800}
        MockAiMsg.get_cached.return_value = {
            "id": "cached_msg_id",
            "content": "cached advice",
            "tools_used": ["get_savings_progress"],
        }

        from routes.ai import analyze
        inner = mock_auth(analyze.__wrapped__)
        with app.test_request_context(
            "/api/ai/trip123/analyze", method="POST", json={}
        ) as ctx:
            ctx.request.uid = "test-user-123"
            response, status = inner("trip123")

        assert status == 200
        data = response.get_json()
        assert data["advice"] == "cached advice"
        assert data["cached"] is True
        assert data["tools_used"] == ["get_savings_progress"]
        MockAiMsg.get_cached.assert_called_once_with("trip123", "analyze")
        mock_analyze.assert_not_called()

    @patch("routes.ai.analyze_budget")
    @patch("routes.ai.AiMessage")
    @patch("routes.ai.BudgetAllocation")
    @patch("routes.ai.Trip")
    def test_analyze_cache_miss_calls_llm_and_persists(
        self, MockTrip, MockAllocation, MockAiMsg, mock_analyze, app
    ):
        MockTrip.get.return_value = {"user_id": "test-user-123"}
        MockAllocation.get.return_value = {"hotel_budget": 800}
        MockAiMsg.get_cached.return_value = None
        mock_analyze.return_value = ("fresh advice", ["get_savings_progress"], None)

        from routes.ai import analyze
        inner = mock_auth(analyze.__wrapped__)
        with app.test_request_context(
            "/api/ai/trip123/analyze", method="POST", json={}
        ) as ctx:
            ctx.request.uid = "test-user-123"
            response, status = inner("trip123")

        assert status == 200
        data = response.get_json()
        assert data["advice"] == "fresh advice"
        assert data["cached"] is False
        mock_analyze.assert_called_once()
        MockAiMsg.save_pair.assert_called_once()
        call_kwargs = MockAiMsg.save_pair.call_args.kwargs
        assert call_kwargs["trip_id"] == "trip123"
        assert call_kwargs["action"] == "analyze"
        assert call_kwargs["ai_content"] == "fresh advice"
        assert call_kwargs["tools_used"] == ["get_savings_progress"]
        assert call_kwargs["category"] is None
        assert call_kwargs["can_save"] is False

    @patch("routes.ai.analyze_budget")
    @patch("routes.ai.AiMessage")
    @patch("routes.ai.BudgetAllocation")
    @patch("routes.ai.Trip")
    def test_analyze_force_true_bypasses_cache(
        self, MockTrip, MockAllocation, MockAiMsg, mock_analyze, app
    ):
        MockTrip.get.return_value = {"user_id": "test-user-123"}
        MockAllocation.get.return_value = {"hotel_budget": 800}
        # Even though there's a cached message, force=true should skip it
        MockAiMsg.get_cached.return_value = {"id": "cached", "content": "old"}
        mock_analyze.return_value = ("fresh advice", [], None)

        from routes.ai import analyze
        inner = mock_auth(analyze.__wrapped__)
        with app.test_request_context(
            "/api/ai/trip123/analyze", method="POST", json={"force": True}
        ) as ctx:
            ctx.request.uid = "test-user-123"
            response, status = inner("trip123")

        data = response.get_json()
        assert data["advice"] == "fresh advice"
        assert data["cached"] is False
        # With force, get_cached should not be called (optimisation), OR is called
        # but ignored. We assert the LLM WAS called and the result WAS saved.
        mock_analyze.assert_called_once()
        MockAiMsg.save_pair.assert_called_once()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_routes.py::TestAiRoutes -v`
Expected: new tests FAIL (current analyze route doesn't know about AiMessage).

- [ ] **Step 3: Rewrite `analyze` view in `routes/ai.py`**

Replace the existing `analyze` function body with this cache-aware version:

```python
@ai_bp.route("/api/ai/<trip_id>/analyze", methods=["POST"])
@require_auth
def analyze(trip_id):
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({"error": "Trip not found"}), 404
    if trip["user_id"] != request.uid:
        return jsonify({"error": "Unauthorized"}), 403

    allocation = BudgetAllocation.get(trip_id)
    if not allocation:
        return jsonify({"error": "No budget allocation found, POST to /api/budget/<trip_id>/allocate first"}), 400

    body = request.get_json(silent=True) or {}
    force = bool(body.get("force"))

    if not force:
        cached = AiMessage.get_cached(trip_id, "analyze")
        if cached:
            return jsonify({
                "advice": cached["content"],
                "message_id": cached["id"],
                "tools_used": cached.get("tools_used", []),
                "cached": True,
            }), 200

    advice, tools_used, error = analyze_budget(trip, allocation)
    if error:
        return jsonify({"error": error}), 503

    user_doc, ai_doc = AiMessage.save_pair(
        trip_id=trip_id,
        action="analyze",
        user_content="Analyze my budget allocation",
        ai_content=advice,
        tools_used=tools_used,
        category=None,
        can_save=False,
    )

    return jsonify({
        "advice": advice,
        "message_id": ai_doc["id"],
        "tools_used": tools_used,
        "cached": False,
    }), 200
```

(Remove the old `message_id: str(uuid.uuid4())` line and the ephemeral-id comment — the `id` now comes from the saved document.)

If the `uuid` import becomes unused after this change, leave it — it's still used in the `recommend` route until Task 4.

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest tests/test_routes.py -v`
Expected: PASS (all tests, including the 3 new ones).

- [ ] **Step 5: Commit**

```bash
git add routes/ai.py tests/test_routes.py
git commit -m "$(cat <<'EOF'
feat: /analyze returns cached response when available, persists on LLM call

Flow:
1. Check AiMessage.get_cached(trip_id, 'analyze'). If hit + no force → return.
2. Call analyze_budget() for fresh advice.
3. Save user + ai message pair via AiMessage.save_pair().
4. Return message_id from the saved document (replaces ephemeral UUID).

Request body now accepts optional {force: bool}. Response includes
new 'cached' boolean so frontend can show the Cached pill.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Cache + persist in `POST /recommend`

**Files:**
- Modify: `routes/ai.py` (recommend endpoint)
- Modify: `tests/test_routes.py` (new tests)

- [ ] **Step 1: Write the failing tests**

Append to `tests/test_routes.py` inside `class TestAiRoutes`:

```python
    @patch("routes.ai.get_recommendations")
    @patch("routes.ai.AiMessage")
    @patch("routes.ai.BudgetAllocation")
    @patch("routes.ai.Trip")
    def test_recommend_cache_hit_for_hotels(
        self, MockTrip, MockAllocation, MockAiMsg, mock_get_recs, app
    ):
        MockTrip.get.return_value = {"user_id": "test-user-123"}
        MockAllocation.get.return_value = {"hotel_budget": 800}
        MockAiMsg.get_cached.return_value = {
            "id": "cached_hotel_msg",
            "content": "cached hotel picks",
            "tools_used": ["get_saved_recommendations"],
        }

        from routes.ai import recommend
        inner = mock_auth(recommend.__wrapped__)
        with app.test_request_context(
            "/api/ai/trip123/recommend", method="POST",
            json={"focus": "hotels"},
        ) as ctx:
            ctx.request.uid = "test-user-123"
            response, status = inner("trip123")

        assert status == 200
        data = response.get_json()
        assert data["advice"] == "cached hotel picks"
        assert data["cached"] is True
        MockAiMsg.get_cached.assert_called_once_with("trip123", "recommend:hotels")
        mock_get_recs.assert_not_called()

    @patch("routes.ai.get_recommendations")
    @patch("routes.ai.AiMessage")
    @patch("routes.ai.BudgetAllocation")
    @patch("routes.ai.Trip")
    def test_recommend_cache_miss_persists_with_category(
        self, MockTrip, MockAllocation, MockAiMsg, mock_get_recs, app
    ):
        MockTrip.get.return_value = {"user_id": "test-user-123"}
        MockAllocation.get.return_value = {"hotel_budget": 800}
        MockAiMsg.get_cached.return_value = None
        mock_get_recs.return_value = ("new hotel picks", ["get_saved_recommendations"], None)

        from routes.ai import recommend
        inner = mock_auth(recommend.__wrapped__)
        with app.test_request_context(
            "/api/ai/trip123/recommend", method="POST",
            json={"focus": "hotels"},
        ) as ctx:
            ctx.request.uid = "test-user-123"
            response, status = inner("trip123")

        data = response.get_json()
        assert data["advice"] == "new hotel picks"
        assert data["cached"] is False
        MockAiMsg.save_pair.assert_called_once()
        call_kwargs = MockAiMsg.save_pair.call_args.kwargs
        assert call_kwargs["action"] == "recommend:hotels"
        assert call_kwargs["category"] == "hotel"
        assert call_kwargs["can_save"] is True

    @patch("routes.ai.get_recommendations")
    @patch("routes.ai.AiMessage")
    @patch("routes.ai.BudgetAllocation")
    @patch("routes.ai.Trip")
    def test_recommend_overall_category_is_null_cansave_false(
        self, MockTrip, MockAllocation, MockAiMsg, mock_get_recs, app
    ):
        MockTrip.get.return_value = {"user_id": "test-user-123"}
        MockAllocation.get.return_value = {"hotel_budget": 800}
        MockAiMsg.get_cached.return_value = None
        mock_get_recs.return_value = ("overall advice", [], None)

        from routes.ai import recommend
        inner = mock_auth(recommend.__wrapped__)
        with app.test_request_context(
            "/api/ai/trip123/recommend", method="POST",
            json={"focus": "overall"},
        ) as ctx:
            ctx.request.uid = "test-user-123"
            response, status = inner("trip123")

        call_kwargs = MockAiMsg.save_pair.call_args.kwargs
        assert call_kwargs["category"] is None
        assert call_kwargs["can_save"] is False
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_routes.py::TestAiRoutes -v`
Expected: new tests FAIL.

- [ ] **Step 3: Rewrite `recommend` view in `routes/ai.py`**

Replace the existing `recommend` function body with this cache-aware version:

```python
FOCUS_TO_CATEGORY = {
    "hotels": "hotel",
    "food": "restaurant",
    "activities": "attraction",
    "overall": None,
}


@ai_bp.route("/api/ai/<trip_id>/recommend", methods=["POST"])
@require_auth
def recommend(trip_id):
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({"error": "Trip not found"}), 404
    if trip["user_id"] != request.uid:
        return jsonify({"error": "Unauthorized"}), 403

    allocation = BudgetAllocation.get(trip_id)
    if not allocation:
        return jsonify({"error": "No budget allocation found, POST to /api/budget/<trip_id>/allocate first"}), 400

    body = request.get_json(silent=True) or {}
    focus = body.get("focus", "overall")
    if focus not in FOCUS_TO_CATEGORY:
        return jsonify({"error": "focus must be hotels, food, activities, or overall"}), 400
    force = bool(body.get("force"))

    action = f"recommend:{focus}"

    if not force:
        cached = AiMessage.get_cached(trip_id, action)
        if cached:
            return jsonify({
                "advice": cached["content"],
                "message_id": cached["id"],
                "tools_used": cached.get("tools_used", []),
                "cached": True,
            }), 200

    advice, tools_used, error = get_recommendations(trip, allocation, focus)
    if error:
        return jsonify({"error": error}), 503

    category = FOCUS_TO_CATEGORY[focus]
    user_doc, ai_doc = AiMessage.save_pair(
        trip_id=trip_id,
        action=action,
        user_content=f"Get {focus} recommendations",
        ai_content=advice,
        tools_used=tools_used,
        category=category,
        can_save=category is not None,
    )

    return jsonify({
        "advice": advice,
        "message_id": ai_doc["id"],
        "tools_used": tools_used,
        "cached": False,
    }), 200
```

(The old `uuid` import in this file is no longer used. Remove `import uuid` from the top of the file.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest tests/ -v`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add routes/ai.py tests/test_routes.py
git commit -m "$(cat <<'EOF'
feat: /recommend returns cached response, persists with focus-derived category

Flow mirrors /analyze: get_cached → skip LLM; otherwise call LLM +
save_pair with action='recommend:<focus>'. Category derived from
FOCUS_TO_CATEGORY map (hotels→hotel, food→restaurant, activities→
attraction, overall→null). can_save mirrors category presence.

Removes unused 'import uuid' now that message_id comes from the saved
document id in both analyze and recommend.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Frontend `relativeTime` utility + tests

**Files:**
- Create: `frontend/src/utils/relativeTime.js`
- Create: `frontend/src/test/relativeTime.test.js`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/test/relativeTime.test.js`:

```javascript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { relativeTime } from '../utils/relativeTime';

describe('relativeTime', () => {
  beforeEach(() => {
    // Fix "now" to a known value
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-22T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for less than a minute ago', () => {
    const date = new Date('2026-04-22T11:59:30Z');
    expect(relativeTime(date)).toBe('just now');
  });

  it('returns minutes for less than an hour', () => {
    const date = new Date('2026-04-22T11:55:00Z'); // 5 min ago
    expect(relativeTime(date)).toMatch(/5 minutes? ago/);
  });

  it('returns hours for less than a day', () => {
    const date = new Date('2026-04-22T09:00:00Z'); // 3 hours ago
    expect(relativeTime(date)).toMatch(/3 hours? ago/);
  });

  it('returns days for less than a week', () => {
    const date = new Date('2026-04-20T12:00:00Z'); // 2 days ago
    expect(relativeTime(date)).toMatch(/2 days? ago/);
  });

  it('returns absolute date for 7+ days ago', () => {
    const date = new Date('2026-04-10T12:00:00Z');
    // Absolute format — matches month name + day
    expect(relativeTime(date)).toMatch(/Apr 10/);
  });

  it('accepts ISO string input', () => {
    expect(relativeTime('2026-04-22T11:55:00Z')).toMatch(/5 minutes? ago/);
  });

  it('handles null/undefined gracefully', () => {
    expect(relativeTime(null)).toBe('');
    expect(relativeTime(undefined)).toBe('');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/heitindersingh/CSCI318Project/frontend && npm test -- relativeTime.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Create `frontend/src/utils/relativeTime.js`**

```javascript
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
  // 7+ days ago: absolute date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- relativeTime.test.js`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/utils/relativeTime.js frontend/src/test/relativeTime.test.js
git commit -m "$(cat <<'EOF'
feat(frontend): add relativeTime utility for chat timestamps

Uses Intl.RelativeTimeFormat for 'just now' / 'N minutes ago' /
'N hours ago' / 'N days ago'. Falls back to short absolute date
('Apr 10') for 7+ days. Accepts Date object or ISO string.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: `aiService` — add `getAiMessages` + `{force}` param

**Files:**
- Modify: `frontend/src/services/aiService.js`

- [ ] **Step 1: Replace the contents of `frontend/src/services/aiService.js`**

```javascript
import api from './api';

export async function analyzeBudget(tripId, { force = false } = {}) {
  const { data } = await api.post(`/ai/${tripId}/analyze`, { force });
  return data;
}

export async function getAiRecommendations(tripId, focus = 'overall', { force = false } = {}) {
  const { data } = await api.post(`/ai/${tripId}/recommend`, { focus, force });
  return data;
}

export async function getAiMessages(tripId) {
  const { data } = await api.get(`/ai/${tripId}/messages`);
  return data;
}
```

- [ ] **Step 2: Run existing tests**

Run: `cd frontend && npm test`
Expected: all tests pass (signatures are backwards-compatible — existing callers pass no options object, which defaults to `{force: false}`).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/aiService.js
git commit -m "$(cat <<'EOF'
feat(frontend): aiService supports {force} + getAiMessages

Backward-compatible: existing call sites that don't pass options
default to {force: false}. Adds new getAiMessages(tripId) for
history load on mount.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: `AiInsightCard` — ✓ indicator + 🔄 refresh button

**Files:**
- Modify: `frontend/src/components/AiInsightCard.jsx`

- [ ] **Step 1: Replace `frontend/src/components/AiInsightCard.jsx`**

```jsx
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import Card from './ui/Card';

export default function AiInsightCard({
  icon: Icon,
  title,
  description,
  onClick,
  loading,
  alreadyAsked = false,
  onRefresh,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="text-left w-full disabled:opacity-50 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue focus-visible:ring-offset-2 rounded-xl relative"
    >
      {alreadyAsked && onRefresh && (
        <button
          type="button"
          aria-label="Get fresh recommendations"
          title="Get fresh recommendations"
          onClick={(e) => {
            e.stopPropagation();
            onRefresh();
          }}
          className="absolute top-2 right-2 p-1 text-text-tertiary hover:text-apple-blue rounded transition-colors z-10"
        >
          <ArrowPathIcon className="w-4 h-4" />
        </button>
      )}
      <Card padding="md" className="h-full">
        {Icon && <Icon className="w-6 h-6 text-apple-blue mb-2" />}
        <h3 className="type-body-emphasis flex items-center gap-1.5">
          {title}
          {alreadyAsked && <CheckCircleIcon className="w-3.5 h-3.5 text-green-500" />}
        </h3>
        <p className="type-caption text-text-secondary mt-1">
          {loading ? (
            <span className="inline-flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-apple-blue rounded-full" style={{ animation: 'thinking-dot 0.9s infinite', animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-apple-blue rounded-full" style={{ animation: 'thinking-dot 0.9s infinite', animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-apple-blue rounded-full" style={{ animation: 'thinking-dot 0.9s infinite', animationDelay: '300ms' }} />
            </span>
          ) : description}
        </p>
      </Card>
    </button>
  );
}
```

- [ ] **Step 2: Run existing tests**

Run: `npm test`
Expected: all existing tests pass (new props default to off, so behavior is unchanged unless `alreadyAsked` is passed).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/AiInsightCard.jsx
git commit -m "$(cat <<'EOF'
feat(frontend): AiInsightCard shows ✓ and 🔄 when already asked

- alreadyAsked prop: renders a small green CheckCircle next to title
- onRefresh prop: when provided AND alreadyAsked, renders a small
  ArrowPath mini-button top-right that stops propagation and
  invokes onRefresh (for force-refresh)
- Main card click behavior unchanged

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: `AiChatPanel` — timestamps + Cached pill

**Files:**
- Modify: `frontend/src/components/AiChatPanel.jsx`
- Modify: `frontend/src/test/AiChatPanel.test.jsx`

- [ ] **Step 1: Add failing tests for timestamp + Cached pill**

Append to `frontend/src/test/AiChatPanel.test.jsx` inside the `describe` block:

```jsx
  it('renders relative timestamp on AI messages', () => {
    // Message from 5 minutes ago (relative to system clock)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    render(<AiChatPanel
      messages={[{ role: 'ai', content: 'Advice', created_at: fiveMinutesAgo }]}
      thinking={false}
    />);
    expect(screen.getByText(/minutes? ago/i)).toBeInTheDocument();
  });

  it('renders "Cached" pill when message has cached: true', () => {
    render(<AiChatPanel
      messages={[{ role: 'ai', content: 'Cached advice', cached: true, created_at: new Date().toISOString() }]}
      thinking={false}
    />);
    expect(screen.getByText('Cached')).toBeInTheDocument();
  });

  it('does not render "Cached" pill on fresh messages', () => {
    render(<AiChatPanel
      messages={[{ role: 'ai', content: 'Fresh advice', cached: false, created_at: new Date().toISOString() }]}
      thinking={false}
    />);
    expect(screen.queryByText('Cached')).not.toBeInTheDocument();
  });

  it('does not render timestamp on user messages', () => {
    render(<AiChatPanel
      messages={[{ role: 'user', content: 'Hello', created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() }]}
      thinking={false}
    />);
    expect(screen.queryByText(/minutes? ago/i)).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- AiChatPanel.test.jsx`
Expected: new tests FAIL.

- [ ] **Step 3: Modify `frontend/src/components/AiChatPanel.jsx`**

Add these imports at the top (next to existing ones):

```jsx
import { relativeTime } from '../utils/relativeTime';
import Badge from './ui/Badge';
```

Inside the existing AI message rendering block, after `{msg.content}` and before `{msg.role === 'ai' && <ToolBadgeRow ...`, add a metadata row:

```jsx
{msg.role === 'ai' && msg.created_at && (
  <div className="flex items-center gap-2 mt-1.5 type-micro text-text-tertiary">
    <span>{relativeTime(msg.created_at)}</span>
    {msg.cached && <Badge variant="neutral">Cached</Badge>}
  </div>
)}
```

Place this block immediately after the `{msg.content}` line and before the `<ToolBadgeRow>` line. The resulting order inside the AI bubble is:
1. Content
2. Timestamp + optional Cached pill
3. Tool badges
4. Save button

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- AiChatPanel.test.jsx`
Expected: PASS (9 tests total in file).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/AiChatPanel.jsx frontend/src/test/AiChatPanel.test.jsx
git commit -m "$(cat <<'EOF'
feat(frontend): AiChatPanel shows timestamps + Cached pill on AI messages

Each AI message renders a small timestamp ('5 minutes ago') in
type-micro text-tertiary. Messages flagged cached:true also render
a small 'Cached' Badge next to the timestamp. User messages don't
show timestamps (reduces noise).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: `AiAdvisorPage` — load history, force-refresh, wire new props

**Files:**
- Modify: `frontend/src/pages/AiAdvisorPage.jsx`

- [ ] **Step 1: Replace `frontend/src/pages/AiAdvisorPage.jsx`**

```jsx
import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChartBarIcon,
  GlobeAltIcon,
  BuildingOffice2Icon,
  CakeIcon,
  MapPinIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { getAllocation } from '../services/budgetService';
import { analyzeBudget, getAiRecommendations, getAiMessages } from '../services/aiService';
import { createRecommendation } from '../services/recommendationService';
import AiInsightCard from '../components/AiInsightCard';
import AiChatPanel from '../components/AiChatPanel';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import toast from 'react-hot-toast';

export default function AiAdvisorPage() {
  const { id } = useParams();
  const [hasBudget, setHasBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState(null);
  const [messages, setMessages] = useState([]);
  const showSkeleton = useDelayedLoading(loading);

  // Load allocation presence + chat history in parallel
  useEffect(() => {
    Promise.all([
      getAllocation(id).then(() => true).catch(() => false),
      getAiMessages(id).catch(() => []),
    ]).then(([budgetExists, history]) => {
      setHasBudget(budgetExists);
      setMessages(history);
    }).finally(() => setLoading(false));
  }, [id]);

  // Which action keys already have an AI response in the history
  const askedActions = useMemo(
    () => new Set(messages.filter((m) => m.role === 'ai').map((m) => m.action).filter(Boolean)),
    [messages],
  );

  async function handleAnalyze(force = false) {
    setActiveAction('analyze');
    setMessages((prev) => [...prev, {
      role: 'user',
      content: 'Analyze my budget allocation',
      action: 'analyze',
      created_at: new Date().toISOString(),
    }]);
    try {
      const { advice, tools_used, cached, message_id } = await analyzeBudget(id, { force });
      setMessages((prev) => [...prev, {
        id: message_id,
        role: 'ai',
        content: advice,
        action: 'analyze',
        tools_used,
        cached,
        created_at: new Date().toISOString(),
      }]);
    } catch {
      toast.error('AI service unavailable');
      setMessages((prev) => [...prev, {
        role: 'ai',
        content: "Sorry, I couldn't analyze your budget right now. Please try again.",
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setActiveAction(null);
    }
  }

  async function handleRecommend(focus, force = false) {
    setActiveAction(focus);
    const category = focus === 'hotels' ? 'hotel'
      : focus === 'food' ? 'restaurant'
      : focus === 'activities' ? 'attraction'
      : null;

    setMessages((prev) => [...prev, {
      role: 'user',
      content: `Get ${focus} recommendations`,
      action: `recommend:${focus}`,
      created_at: new Date().toISOString(),
    }]);
    try {
      const { advice, tools_used, cached, message_id } = await getAiRecommendations(id, focus, { force });
      setMessages((prev) => [...prev, {
        id: message_id,
        role: 'ai',
        content: advice,
        action: `recommend:${focus}`,
        tools_used,
        cached,
        canSave: category !== null,
        category,
        created_at: new Date().toISOString(),
      }]);
    } catch {
      toast.error('AI service unavailable');
      setMessages((prev) => [...prev, {
        role: 'ai',
        content: "Sorry, I couldn't get recommendations right now. Please try again.",
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setActiveAction(null);
    }
  }

  async function handleSaveRecommendation(msg) {
    if (!msg.category) {
      toast.error('Cannot save this type of recommendation');
      throw new Error('No category');
    }
    try {
      const categoryLabel = msg.category === 'hotel' ? 'Hotel'
        : msg.category === 'restaurant' ? 'Food'
        : msg.category === 'attraction' ? 'Activity'
        : 'AI';
      const name = `AI ${categoryLabel} Picks`;
      const rec = await createRecommendation(id, {
        category: msg.category,
        source: 'ai_generated',
        name,
        description: msg.content,
        is_ai_pick: true,
      });
      toast.success('Saved');
      return rec;
    } catch (err) {
      toast.error('Could not save');
      throw err;
    }
  }

  if (showSkeleton) {
    return <div><Skeleton variant="title" className="w-48 mb-6" /><Skeleton variant="card" /></div>;
  }

  if (!hasBudget) {
    return (
      <EmptyState
        icon={<ChartBarIcon className="w-12 h-12" />}
        title="Generate a budget first"
        description="The AI advisor needs a budget allocation to work with."
        action={
          <Link to={`/trips/${id}/budget`}>
            <Button>Go to Budget</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <h1 className="type-section-heading">AI Advisor</h1>
      <p className="type-caption text-text-secondary mt-1">Get AI-powered budget analysis and recommendations</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
        <AiInsightCard
          icon={ChartBarIcon}
          title="Analyze Budget"
          description="Get AI feedback on your allocation"
          onClick={() => handleAnalyze(false)}
          loading={activeAction === 'analyze'}
          alreadyAsked={askedActions.has('analyze')}
          onRefresh={() => handleAnalyze(true)}
        />
        <AiInsightCard
          icon={GlobeAltIcon}
          title="Overall"
          description="Get overall recommendations"
          onClick={() => handleRecommend('overall', false)}
          loading={activeAction === 'overall'}
          alreadyAsked={askedActions.has('recommend:overall')}
          onRefresh={() => handleRecommend('overall', true)}
        />
        <AiInsightCard
          icon={BuildingOffice2Icon}
          title="Hotels"
          description="Get hotel picks"
          onClick={() => handleRecommend('hotels', false)}
          loading={activeAction === 'hotels'}
          alreadyAsked={askedActions.has('recommend:hotels')}
          onRefresh={() => handleRecommend('hotels', true)}
        />
        <AiInsightCard
          icon={CakeIcon}
          title="Food"
          description="Get food picks"
          onClick={() => handleRecommend('food', false)}
          loading={activeAction === 'food'}
          alreadyAsked={askedActions.has('recommend:food')}
          onRefresh={() => handleRecommend('food', true)}
        />
        <AiInsightCard
          icon={MapPinIcon}
          title="Activities"
          description="Get activity picks"
          onClick={() => handleRecommend('activities', false)}
          loading={activeAction === 'activities'}
          alreadyAsked={askedActions.has('recommend:activities')}
          onRefresh={() => handleRecommend('activities', true)}
        />
      </div>

      <div className="mt-6">
        {messages.length === 0 && !activeAction ? (
          <EmptyState
            icon={<SparklesIcon className="w-12 h-12" />}
            title="Ask the AI"
            description="Click an action above to start a conversation."
          />
        ) : (
          <AiChatPanel
            messages={messages}
            thinking={activeAction !== null}
            onSaveRecommendation={handleSaveRecommendation}
          />
        )}
      </div>
    </div>
  );
}
```

**Note:** The AiChatPanel message object uses `canSave` (camelCase) internally, while history loaded from the backend uses `can_save` (snake_case from Firestore). We need to normalize. Add this right after `getAiMessages` in the load effect:

Actually, let me fix this properly. Update the useEffect loader to normalize snake_case → camelCase:

Replace the existing useEffect with:

```jsx
  useEffect(() => {
    Promise.all([
      getAllocation(id).then(() => true).catch(() => false),
      getAiMessages(id).catch(() => []),
    ]).then(([budgetExists, history]) => {
      setHasBudget(budgetExists);
      // Normalize backend snake_case to frontend camelCase for can_save
      const normalized = history.map((m) => ({
        ...m,
        canSave: m.can_save,
      }));
      setMessages(normalized);
    }).finally(() => setLoading(false));
  }, [id]);
```

- [ ] **Step 2: Run all frontend tests**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/AiAdvisorPage.jsx
git commit -m "$(cat <<'EOF'
feat(frontend): AiAdvisorPage loads chat history + supports force-refresh

- On mount: fetch getAiMessages in parallel with getAllocation, seed
  chat panel with normalized messages (can_save → canSave)
- askedActions (derived from history) drives AiInsightCard.alreadyAsked
- Each card wires onRefresh to call handler with force=true
- Handlers accept a force param; stamp created_at on the user message
  client-side for optimistic display (AI created_at gets the real
  ISO string once response returns)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Full-suite verification + smoke test

**Files:** None modified.

- [ ] **Step 1: Backend full suite**

Run: `cd /Users/heitindersingh/CSCI318Project && source .venv/bin/activate && python -m pytest tests/ -v 2>&1 | tail -3`
Expected: all tests pass (88 existing + ~11 new from Tasks 1, 2, 3, 4 = ~99).

- [ ] **Step 2: Frontend full suite**

Run: `cd frontend && npm test 2>&1 | tail -3`
Expected: all tests pass (115 existing + ~11 new from Tasks 5, 8 = ~126).

- [ ] **Step 3: Frontend lint**

Run: `npm run lint`
Expected: 0 errors, 0 warnings.

- [ ] **Step 4: Manual smoke test**

Start both servers:
```bash
# Terminal 1:
cd /Users/heitindersingh/CSCI318Project && source .venv/bin/activate && python app.py

# Terminal 2:
cd frontend && npm run dev
```

In browser at http://localhost:5173:

**Test 1 — Persistence:**
1. Log in, pick your Paris trip, go to AI Advisor
2. Click "Hotels" — wait for response
3. Hard refresh (cmd+shift+R) the page
4. ✅ The chat panel should still show your "Hotels" conversation (both the user message and the AI response)

**Test 2 — Cache hit:**
1. Open browser DevTools → Network tab, filter by Fetch/XHR
2. Click "Hotels" again on the action card (the one that already has a green ✓ next to the title)
3. ✅ Response appears instantly. The network request to `/api/ai/<id>/recommend` should return `cached: true`.
4. ✅ The new AI message in the chat shows a small "Cached" pill next to its timestamp.

**Test 3 — Force refresh:**
1. Hover over the Hotels card — a small 🔄 icon appears top-right
2. Click the 🔄 icon (NOT the card itself)
3. ✅ A fresh LLM call happens (thinking dots animate on the card, new response takes a few seconds)
4. ✅ New AI message appears in chat WITHOUT the "Cached" pill
5. ✅ Both the old and new hotel responses are now visible in chat history

**Test 4 — Timestamps:**
- All AI messages show relative timestamps under their content (e.g., "5 minutes ago", "just now")
- User messages do not show timestamps (less noise)

- [ ] **Step 5: Firestore sanity check (optional)**

In one terminal:
```bash
cd /Users/heitindersingh/CSCI318Project
source .venv/bin/activate
python /tmp/firestore_diag.py  # or equivalent ad-hoc script
```

Or write a one-off:
```python
from extensions import init_firebase
init_firebase('firebase.json')
import extensions
count = sum(1 for _ in extensions.db.collection('ai_messages').stream())
print(f"ai_messages count: {count}")
```

Expected: count matches the number of user+ai pairs you created during the smoke test (e.g., 4 messages = 2 conversations = 2 user + 2 ai).

- [ ] **Step 6: If any of the above manual checks fail — stop and debug**

Don't proceed to "done" if any smoke test step fails. Return to systematic-debugging.

---

## Success criteria (from spec §9)

- [x] Reload page with existing trip history → chat panel shows all past messages in order
- [x] Click any previously-asked action → instant response from cache, no LLM call, response marked "Cached"
- [x] Click 🔄 on an asked action → force fresh LLM call, new message appears, no Cached badge
- [x] Every AI message shows a relative timestamp
- [x] Existing 115 frontend tests + 88 backend tests still pass
- [x] ~11 new tests added across model, routes, and frontend
- [x] Smoke test: hotels response persists through reload; second click is instant; 🔄 gets fresh response

---

## Out of scope (deferred to future phases)

- Stream LLM responses
- Edit/delete individual messages
- Multi-turn follow-up prompts
- Cross-trip message sharing
- Cache TTL / auto-expiry
- Soft-delete versioning on force-refresh
- Full-text search over message history

These are documented in the spec's §10 for future planning.
