# LLM Tool Calling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the AI service so both `analyze_budget` and `get_recommendations` run through a shared tool-calling loop with three registered tools, return an enriched `{advice, message_id, tools_used}` response, and keep the frontend working without changes.

**Architecture:** A new `services/ai_tools.py` defines tool JSON schemas and Python implementations in a `TOOL_REGISTRY` dict. The rewritten `services/ai_service.py` uses a private `_run_with_tools()` helper that handles the multi-turn loop (5-iteration cap, recoverable tool errors, terminal API errors). Both public functions return a 3-tuple `(content, tools_used, error)`; `routes/ai.py` adds a per-request UUID `message_id`.

**Tech Stack:** Python 3.11, Flask, `openai>=1.0` (already installed), pytest, `unittest.mock`, Firebase Firestore (mocked in tests).

**Spec:** [docs/superpowers/specs/2026-04-22-llm-tool-calling-design.md](../specs/2026-04-22-llm-tool-calling-design.md)

**Working branch:** `backend` (already on this branch; commit directly).

---

## File inventory (locked in before any tasks)

**New files:**
- `services/ai_tools.py` — tool schemas + implementations + registry
- `tests/test_ai_tools.py` — isolated tool tests
- `tests/test_ai_service.py` — loop and public function tests

**Modified files:**
- `services/ai_service.py` — full rewrite (public API kept, internals replaced)
- `routes/ai.py` — response shape change
- `tests/test_routes.py` — add two tests for enriched shape

**Untouched:** models, frontend, config, extensions, app, other routes.

---

## Task 1: Tool — `_calculate_daily_spend` (pure function, no mocks)

**Files:**
- Create: `services/ai_tools.py`
- Create: `tests/test_ai_tools.py`

- [ ] **Step 1: Write the failing test**

Create `tests/test_ai_tools.py`:

```python
import json
from services.ai_tools import _calculate_daily_spend


class TestCalculateDailySpend:
    def test_happy_path_returns_json_string_with_rounded_daily(self):
        result = _calculate_daily_spend(total_amount=700, num_days=7)
        parsed = json.loads(result)
        assert parsed == {"daily_amount": 100.0}

    def test_rounds_to_two_decimals(self):
        result = _calculate_daily_spend(total_amount=1000, num_days=3)
        parsed = json.loads(result)
        assert parsed == {"daily_amount": 333.33}

    def test_zero_days_returns_error_json_not_raise(self):
        result = _calculate_daily_spend(total_amount=500, num_days=0)
        parsed = json.loads(result)
        assert "error" in parsed
        assert "positive" in parsed["error"]

    def test_negative_days_returns_error(self):
        result = _calculate_daily_spend(total_amount=500, num_days=-3)
        parsed = json.loads(result)
        assert "error" in parsed
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_ai_tools.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'services.ai_tools'`.

- [ ] **Step 3: Create `services/ai_tools.py` with the function**

Create `services/ai_tools.py`:

```python
"""AI tool schemas and implementations. Registered in TOOL_REGISTRY."""
import json


def _calculate_daily_spend(total_amount: float, num_days: int) -> str:
    """Return the daily average spend as a JSON string."""
    if num_days <= 0:
        return json.dumps({"error": "num_days must be positive"})
    return json.dumps({"daily_amount": round(total_amount / num_days, 2)})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_ai_tools.py -v`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add services/ai_tools.py tests/test_ai_tools.py
git commit -m "$(cat <<'EOF'
feat: add _calculate_daily_spend tool for AI tool calling

Pure function, returns JSON string with daily average or error.
First of three tools that will be registered in TOOL_REGISTRY.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Tool — `_get_saved_recommendations` (Firestore-backed)

**Files:**
- Modify: `services/ai_tools.py` (append function)
- Modify: `tests/test_ai_tools.py` (append test class)

- [ ] **Step 1: Write the failing test**

Append to `tests/test_ai_tools.py`:

```python
from unittest.mock import patch


class TestGetSavedRecommendations:
    @patch("services.ai_tools.Recommendation")
    def test_returns_json_list_of_recommendations(self, MockRec):
        MockRec.get_by_trip.return_value = [
            {"name": "Louvre", "category": "attraction", "price_level": "$$", "rating": 5, "description": "art"},
            {"name": "Le Meurice", "category": "hotel", "price_level": "$$$$", "rating": 4, "description": "lux hotel"},
        ]
        result = _get_saved_recommendations(trip_id="trip123")
        parsed = json.loads(result)
        assert len(parsed) == 2
        assert parsed[0]["name"] == "Louvre"
        MockRec.get_by_trip.assert_called_once_with("trip123", category=None)

    @patch("services.ai_tools.Recommendation")
    def test_category_filter_passed_through(self, MockRec):
        MockRec.get_by_trip.return_value = []
        _get_saved_recommendations(trip_id="trip123", category="hotel")
        MockRec.get_by_trip.assert_called_once_with("trip123", category="hotel")

    @patch("services.ai_tools.Recommendation")
    def test_empty_list_returns_empty_json_array(self, MockRec):
        MockRec.get_by_trip.return_value = []
        result = _get_saved_recommendations(trip_id="trip123")
        assert json.loads(result) == []

    @patch("services.ai_tools.Recommendation")
    def test_model_exception_returns_error_json_not_raises(self, MockRec):
        MockRec.get_by_trip.side_effect = RuntimeError("firestore down")
        result = _get_saved_recommendations(trip_id="trip123")
        parsed = json.loads(result)
        assert "error" in parsed
```

Also add `from services.ai_tools import _get_saved_recommendations` at the top of the file.

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_ai_tools.py::TestGetSavedRecommendations -v`
Expected: FAIL with `ImportError: cannot import name '_get_saved_recommendations'`.

- [ ] **Step 3: Implement the function**

Append to `services/ai_tools.py`:

```python
from models.recommendation import Recommendation


def _get_saved_recommendations(trip_id: str, category: str | None = None) -> str:
    """Return saved recommendations for a trip as a JSON string.

    Returns a JSON array of recommendation objects, or {"error": "..."} on failure.
    """
    try:
        recs = Recommendation.get_by_trip(trip_id, category=category)
        simplified = [
            {
                "name": r.get("name"),
                "category": r.get("category"),
                "price_level": r.get("price_level"),
                "rating": r.get("rating"),
                "description": r.get("description"),
            }
            for r in recs
        ]
        return json.dumps(simplified)
    except Exception as e:
        return json.dumps({"error": f"could not fetch saved recommendations: {e}"})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_ai_tools.py -v`
Expected: PASS (all tests so far, 8 total).

- [ ] **Step 5: Commit**

```bash
git add services/ai_tools.py tests/test_ai_tools.py
git commit -m "$(cat <<'EOF'
feat: add _get_saved_recommendations tool

Reads Recommendation model, returns JSON string.
Returns error JSON (not raises) on Firestore failures so the
LLM tool loop can recover and adapt.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Tool — `_get_savings_progress` (Firestore-backed)

**Files:**
- Modify: `services/ai_tools.py`
- Modify: `tests/test_ai_tools.py`

- [ ] **Step 1: Write the failing test**

Append to `tests/test_ai_tools.py`:

```python
class TestGetSavingsProgress:
    @patch("services.ai_tools.SavingsPlan")
    def test_returns_savings_data_with_on_track_true(self, MockPlan):
        MockPlan.get.return_value = {
            "total_budget": 3000,
            "amount_saved": 1200,
            "weekly_savings_needed": 150,
            "weeks_until_trip": 12,
            "amount_remaining": 1800,
        }
        result = _get_savings_progress(trip_id="trip123")
        parsed = json.loads(result)
        assert parsed["saved"] == 1200
        assert parsed["goal"] == 3000
        assert parsed["pct_complete"] == 40
        assert parsed["weekly_target"] == 150
        assert parsed["on_track"] is True

    @patch("services.ai_tools.SavingsPlan")
    def test_on_track_false_when_nothing_saved(self, MockPlan):
        MockPlan.get.return_value = {
            "total_budget": 3000,
            "amount_saved": 0,
            "weekly_savings_needed": 150,
            "weeks_until_trip": 20,
            "amount_remaining": 3000,
        }
        result = _get_savings_progress(trip_id="trip123")
        parsed = json.loads(result)
        assert parsed["on_track"] is False

    @patch("services.ai_tools.SavingsPlan")
    def test_no_plan_returns_error(self, MockPlan):
        MockPlan.get.return_value = None
        result = _get_savings_progress(trip_id="trip123")
        parsed = json.loads(result)
        assert "error" in parsed

    @patch("services.ai_tools.SavingsPlan")
    def test_model_exception_returns_error(self, MockPlan):
        MockPlan.get.side_effect = RuntimeError("firestore down")
        result = _get_savings_progress(trip_id="trip123")
        parsed = json.loads(result)
        assert "error" in parsed
```

Also update the import line at top: `from services.ai_tools import _calculate_daily_spend, _get_saved_recommendations, _get_savings_progress`.

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_ai_tools.py::TestGetSavingsProgress -v`
Expected: FAIL with ImportError.

- [ ] **Step 3: Implement the function**

Append to `services/ai_tools.py`:

```python
from models.savings_plan import SavingsPlan


def _get_savings_progress(trip_id: str) -> str:
    """Return the user's savings progress for this trip as a JSON string."""
    try:
        plan = SavingsPlan.get(trip_id)
        if plan is None:
            return json.dumps({"error": "no savings plan found for this trip"})

        total = plan.get("total_budget", 0)
        saved = plan.get("amount_saved", 0)
        weeks_left = plan.get("weeks_until_trip", 0)
        pct = round((saved / total) * 100) if total > 0 else 0

        return json.dumps({
            "saved": saved,
            "goal": total,
            "pct_complete": pct,
            "weekly_target": plan.get("weekly_savings_needed", 0),
            "on_track": saved > 0 and weeks_left > 0,
        })
    except Exception as e:
        return json.dumps({"error": f"could not fetch savings progress: {e}"})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_ai_tools.py -v`
Expected: PASS (12 tests total).

- [ ] **Step 5: Commit**

```bash
git add services/ai_tools.py tests/test_ai_tools.py
git commit -m "$(cat <<'EOF'
feat: add _get_savings_progress tool

Reads SavingsPlan model, returns JSON string with saved/goal/
pct_complete/weekly_target/on_track. Third and final tool
before registering the full TOOL_REGISTRY.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Tool schemas and registry

**Files:**
- Modify: `services/ai_tools.py` (append `TOOL_SCHEMAS` and `TOOL_REGISTRY`)
- Modify: `tests/test_ai_tools.py` (append registry test)

- [ ] **Step 1: Write the failing test**

Append to `tests/test_ai_tools.py`:

```python
from services.ai_tools import TOOL_SCHEMAS, TOOL_REGISTRY


class TestToolRegistry:
    def test_registry_has_all_three_tools(self):
        assert "get_saved_recommendations" in TOOL_REGISTRY
        assert "get_savings_progress" in TOOL_REGISTRY
        assert "calculate_daily_spend" in TOOL_REGISTRY

    def test_schemas_match_registry_keys(self):
        schema_names = {s["function"]["name"] for s in TOOL_SCHEMAS}
        assert schema_names == set(TOOL_REGISTRY.keys())

    def test_every_schema_has_required_fields(self):
        for schema in TOOL_SCHEMAS:
            assert schema["type"] == "function"
            assert "name" in schema["function"]
            assert "description" in schema["function"]
            assert "parameters" in schema["function"]
            assert schema["function"]["parameters"]["type"] == "object"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_ai_tools.py::TestToolRegistry -v`
Expected: FAIL with ImportError on `TOOL_SCHEMAS`.

- [ ] **Step 3: Append schemas and registry**

Append to `services/ai_tools.py`:

```python
TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "get_saved_recommendations",
            "description": (
                "Fetch the user's saved recommendations for this trip. "
                "Call this before suggesting new hotels/restaurants/attractions "
                "so you don't duplicate what they already have. Also useful when "
                "analyzing budget — saved items represent committed spend."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "trip_id": {"type": "string", "description": "The trip ID to look up"},
                    "category": {
                        "type": "string",
                        "enum": ["hotel", "restaurant", "attraction", "flight", "car_rental"],
                        "description": "Optional filter. Omit to get all categories.",
                    },
                },
                "required": ["trip_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_savings_progress",
            "description": (
                "Get the user's savings progress toward this trip's total budget. "
                "Returns amount saved, goal, percent complete, weekly target, and on_track boolean."
            ),
            "parameters": {
                "type": "object",
                "properties": {"trip_id": {"type": "string"}},
                "required": ["trip_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_daily_spend",
            "description": (
                "Given a budget amount and number of days, return the daily average. "
                "Useful for framing budgets in per-day terms "
                "(e.g., 'your food budget works out to $45/day')."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "total_amount": {"type": "number", "description": "Dollar amount"},
                    "num_days": {"type": "integer", "description": "Number of days"},
                },
                "required": ["total_amount", "num_days"],
            },
        },
    },
]

TOOL_REGISTRY = {
    "get_saved_recommendations": _get_saved_recommendations,
    "get_savings_progress": _get_savings_progress,
    "calculate_daily_spend": _calculate_daily_spend,
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_ai_tools.py -v`
Expected: PASS (15 tests total).

- [ ] **Step 5: Commit**

```bash
git add services/ai_tools.py tests/test_ai_tools.py
git commit -m "$(cat <<'EOF'
feat: register TOOL_SCHEMAS and TOOL_REGISTRY

Three tools registered for OpenAI tool calling. Adding a
future tool (Phase 2 web search, flights) is now a single
entry in each dict.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: `_humanize_prefs` helper in ai_service.py

**Files:**
- Create: `tests/test_ai_service.py`
- Modify: `services/ai_service.py` (add helper)

- [ ] **Step 1: Write the failing test**

Create `tests/test_ai_service.py`:

```python
from services.ai_service import _humanize_prefs


class TestHumanizePrefs:
    def test_joins_list_with_commas(self):
        assert _humanize_prefs(["fine_dining", "street_food"]) == "fine_dining, street_food"

    def test_empty_list_returns_placeholder(self):
        assert _humanize_prefs([]) == "no specific preference"

    def test_none_returns_placeholder(self):
        assert _humanize_prefs(None) == "no specific preference"

    def test_single_item_list(self):
        assert _humanize_prefs(["museums"]) == "museums"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_ai_service.py -v`
Expected: FAIL with `ImportError: cannot import name '_humanize_prefs'`.

- [ ] **Step 3: Add the helper**

In `services/ai_service.py`, add this function (keep existing code intact for now — we'll rewrite the rest of the file in Tasks 6-13):

```python
def _humanize_prefs(prefs: list | None) -> str:
    """Turn ['fine_dining', 'street_food'] into 'fine_dining, street_food'."""
    if not prefs:
        return "no specific preference"
    return ", ".join(prefs)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_ai_service.py -v`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add services/ai_service.py tests/test_ai_service.py
git commit -m "$(cat <<'EOF'
feat: add _humanize_prefs helper for prompt rendering

Converts list-form preferences to comma-joined strings
for cleaner injection into LLM prompts.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: `_build_system_prompt`

**Files:**
- Modify: `services/ai_service.py`
- Modify: `tests/test_ai_service.py`

- [ ] **Step 1: Write the failing test**

Append to `tests/test_ai_service.py`:

```python
from services.ai_service import _build_system_prompt


class TestBuildSystemPrompt:
    def test_mentions_all_three_tools(self):
        prompt = _build_system_prompt()
        assert "get_saved_recommendations" in prompt
        assert "get_savings_progress" in prompt
        assert "calculate_daily_spend" in prompt

    def test_includes_preference_guardrail(self):
        prompt = _build_system_prompt()
        assert "do not override" in prompt.lower()

    def test_discourages_unnecessary_tool_calls(self):
        prompt = _build_system_prompt()
        assert "do NOT call tools just to show" in prompt
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_ai_service.py::TestBuildSystemPrompt -v`
Expected: FAIL with ImportError.

- [ ] **Step 3: Add the function**

Append to `services/ai_service.py`:

```python
def _build_system_prompt() -> str:
    return """You are a travel budget advisor helping a user plan a specific trip.

You have tools available:
- get_saved_recommendations: look up items the user has already saved for this trip
- get_savings_progress: check how close the user is to their savings goal
- calculate_daily_spend: convert total amounts into per-day figures when useful

Use tools when they improve your answer. Do NOT call tools just to show you can.
Do NOT duplicate recommendations the user has already saved.
Be specific (name real places, give price ranges), concise (3-5 bullets unless asked otherwise),
and practical. Ground advice in the user's stated preferences — do not override them."""
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_ai_service.py -v`
Expected: PASS (7 tests total in this file).

- [ ] **Step 5: Commit**

```bash
git add services/ai_service.py tests/test_ai_service.py
git commit -m "$(cat <<'EOF'
feat: add _build_system_prompt with tool steering

System prompt mentions available tools (empirically increases
tool-use rate vs. schema-only) and adds explicit guardrails
against unnecessary tool calls and preference overrides.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: `_build_analyze_prompt`

**Files:**
- Modify: `services/ai_service.py`
- Modify: `tests/test_ai_service.py`

- [ ] **Step 1: Write the failing test**

Append to `tests/test_ai_service.py`:

```python
from datetime import date
from services.ai_service import _build_analyze_prompt


class TestBuildAnalyzePrompt:
    def _trip(self):
        return {
            "destination": "Paris, France",
            "trip_purpose": "vacation",
            "num_travelers": 2,
            "total_budget": 3000,
            "departure_date": date(2026, 7, 1),
            "return_date": date(2026, 7, 8),
            "food_prefs": ["fine_dining", "street_food"],
            "activity_prefs": ["museums"],
            "hotel_prefs": "mid_range",
        }

    def _allocation(self):
        return {
            "flights_budget": 900, "flights_pct": 30,
            "hotel_budget": 800, "hotel_pct": 27,
            "food_budget": 600, "food_pct": 20,
            "activities_budget": 400, "activities_pct": 13,
            "transport_budget": 200, "transport_pct": 7,
            "misc_budget": 100, "misc_pct": 3,
        }

    def test_contains_destination_and_budget(self):
        prompt = _build_analyze_prompt(self._trip(), self._allocation())
        assert "Paris, France" in prompt
        assert "$3000" in prompt

    def test_preferences_are_human_readable_not_python_list(self):
        prompt = _build_analyze_prompt(self._trip(), self._allocation())
        assert "fine_dining, street_food" in prompt
        assert "['fine_dining'" not in prompt

    def test_has_per_day_figure(self):
        prompt = _build_analyze_prompt(self._trip(), self._allocation())
        # 7 nights, $3000 total → ~$428/day
        assert "/day" in prompt

    def test_treats_preferences_as_constraints(self):
        prompt = _build_analyze_prompt(self._trip(), self._allocation())
        assert "firm constraints" in prompt
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_ai_service.py::TestBuildAnalyzePrompt -v`
Expected: FAIL with ImportError.

- [ ] **Step 3: Add the function**

Append to `services/ai_service.py`:

```python
def _build_analyze_prompt(trip: dict, allocation: dict) -> str:
    departure = trip["departure_date"]
    return_date = trip["return_date"]
    if hasattr(departure, "date"):
        departure = departure.date()
    if hasattr(return_date, "date"):
        return_date = return_date.date()
    num_nights = (return_date - departure).days

    per_day = round(trip["total_budget"] / num_nights, 2) if num_nights > 0 else trip["total_budget"]

    return f"""Trip: {trip['num_travelers']} traveler(s) going to {trip['destination']} for {num_nights} nights ({trip['trip_purpose']}).
Total budget: ${trip['total_budget']} (~${per_day}/day).

Allocation:
- Flights: ${allocation['flights_budget']} ({allocation['flights_pct']}%)
- Hotel: ${allocation['hotel_budget']} ({allocation['hotel_pct']}%)
- Food: ${allocation['food_budget']} ({allocation['food_pct']}%)
- Activities: ${allocation['activities_budget']} ({allocation['activities_pct']}%)
- Transport: ${allocation['transport_budget']} ({allocation['transport_pct']}%)
- Misc: ${allocation['misc_budget']} ({allocation['misc_pct']}%)

User preferences (treat as firm constraints, not suggestions):
- Hotel style: {trip.get('hotel_prefs', 'mid_range')}
- Food style: {_humanize_prefs(trip.get('food_prefs'))}
- Activities: {_humanize_prefs(trip.get('activity_prefs'))}

Does this allocation make sense for this destination and trip style?
What should they watch out for? 3-5 bullet points.
You may use tools if they help (e.g., checking savings progress or already-saved items)."""
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_ai_service.py -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/ai_service.py tests/test_ai_service.py
git commit -m "$(cat <<'EOF'
feat: add _build_analyze_prompt with preference steering

Injects preferences as firm constraints (vs. suggestions),
pre-computes per-day figures so the LLM doesn't divide in its
head, and humanizes list-form prefs.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: `_build_recommend_prompt`

**Files:**
- Modify: `services/ai_service.py`
- Modify: `tests/test_ai_service.py`

- [ ] **Step 1: Write the failing test**

Append to `tests/test_ai_service.py`:

```python
from services.ai_service import _build_recommend_prompt


class TestBuildRecommendPrompt:
    def _trip(self):
        return {
            "destination": "Tokyo, Japan",
            "trip_purpose": "vacation",
            "num_travelers": 1,
            "total_budget": 2500,
            "departure_date": date(2026, 9, 1),
            "return_date": date(2026, 9, 8),
            "food_prefs": ["street_food"],
            "activity_prefs": ["museums", "nightlife"],
            "hotel_prefs": "budget",
        }

    def _allocation(self):
        return {
            "flights_budget": 900, "flights_pct": 36,
            "hotel_budget": 700, "hotel_pct": 28,
            "food_budget": 400, "food_pct": 16,
            "activities_budget": 300, "activities_pct": 12,
            "transport_budget": 150, "transport_pct": 6,
            "misc_budget": 50, "misc_pct": 2,
        }

    def test_hotels_focus_uses_hotel_budget(self):
        prompt = _build_recommend_prompt(self._trip(), self._allocation(), focus="hotels")
        assert "$700" in prompt
        assert "hotels" in prompt

    def test_food_focus_uses_food_budget(self):
        prompt = _build_recommend_prompt(self._trip(), self._allocation(), focus="food")
        assert "$400" in prompt
        assert "food" in prompt

    def test_activities_focus_uses_activities_budget(self):
        prompt = _build_recommend_prompt(self._trip(), self._allocation(), focus="activities")
        assert "$300" in prompt

    def test_prompt_nudges_saved_recommendations_tool(self):
        prompt = _build_recommend_prompt(self._trip(), self._allocation(), focus="hotels")
        assert "get_saved_recommendations" in prompt

    def test_preferences_are_humanized(self):
        prompt = _build_recommend_prompt(self._trip(), self._allocation(), focus="food")
        assert "street_food" in prompt
        assert "museums, nightlife" in prompt
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_ai_service.py::TestBuildRecommendPrompt -v`
Expected: FAIL with ImportError.

- [ ] **Step 3: Add the function**

Append to `services/ai_service.py`:

```python
def _build_recommend_prompt(trip: dict, allocation: dict, focus: str) -> str:
    focus_to_budget_key = {
        "hotels": ("hotel_budget", "hotel_pct"),
        "food": ("food_budget", "food_pct"),
        "activities": ("activities_budget", "activities_pct"),
        "overall": ("hotel_budget", "hotel_pct"),  # fallback
    }
    budget_key, pct_key = focus_to_budget_key.get(focus, focus_to_budget_key["overall"])
    category_budget = allocation[budget_key]
    category_pct = allocation[pct_key]

    departure = trip["departure_date"]
    return_date = trip["return_date"]
    if hasattr(departure, "date"):
        departure = departure.date()
    if hasattr(return_date, "date"):
        return_date = return_date.date()
    num_nights = (return_date - departure).days

    per_day = round(category_budget / num_nights, 2) if num_nights > 0 else category_budget

    return f"""Trip: {trip['destination']}, {num_nights} nights, {trip['trip_purpose']}, {trip['num_travelers']} traveler(s).

Budget for {focus}: ${category_budget} total (${per_day}/day, {category_pct}% of trip budget).

User preferences (treat as firm constraints):
- Hotel style: {trip.get('hotel_prefs', 'mid_range')}
- Food style: {_humanize_prefs(trip.get('food_prefs'))}
- Activities: {_humanize_prefs(trip.get('activity_prefs'))}

Suggest 3 specific {focus} options in {trip['destination']} that fit this budget and these preferences.
Before suggesting, check get_saved_recommendations so you don't repeat what's already saved.
For each option: name, brief description, price range, and why it matches their preferences."""
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_ai_service.py -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/ai_service.py tests/test_ai_service.py
git commit -m "$(cat <<'EOF'
feat: add _build_recommend_prompt with saved-items nudge

Focus-specific budget framing, explicit tool-use hint to
avoid duplicating saved items, preferences as constraints.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: `_run_with_tools` — happy path (no tool calls)

**Files:**
- Modify: `services/ai_service.py`
- Modify: `tests/test_ai_service.py`

- [ ] **Step 1: Write the failing test**

Append to `tests/test_ai_service.py`:

```python
from types import SimpleNamespace
from unittest.mock import patch


def _fake_message(content=None, tool_calls=None):
    """Build a fake OpenAI ChatCompletionMessage-like object."""
    return SimpleNamespace(content=content, tool_calls=tool_calls or [])


def _fake_response(message):
    return SimpleNamespace(choices=[SimpleNamespace(message=message)])


class TestRunWithToolsNoToolCalls:
    @patch("services.ai_service.client")
    def test_returns_content_and_empty_tools_used(self, mock_client):
        mock_client.chat.completions.create.return_value = _fake_response(
            _fake_message(content="Here is my advice.", tool_calls=[])
        )
        from services.ai_service import _run_with_tools

        content, tools_used, error = _run_with_tools(
            messages=[{"role": "user", "content": "test"}],
            tools=[],
        )
        assert content == "Here is my advice."
        assert tools_used == []
        assert error is None
        mock_client.chat.completions.create.assert_called_once()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_ai_service.py::TestRunWithToolsNoToolCalls -v`
Expected: FAIL with `ImportError: cannot import name '_run_with_tools'`.

- [ ] **Step 3: Implement the minimal function**

Append to `services/ai_service.py`:

```python
import json as _json  # alias to avoid any shadowing in later tasks
from services.ai_tools import TOOL_REGISTRY, TOOL_SCHEMAS


def _run_with_tools(
    messages: list,
    tools: list,
    max_iterations: int = 5,
) -> tuple:
    """Run an OpenAI chat completion with optional tool calling.

    Returns (final_content, tools_used, error).
    """
    tools_used: list[str] = []

    for _ in range(max_iterations):
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            tools=tools if tools else None,
            tool_choice="auto" if tools else None,
            max_tokens=800,
        )
        message = response.choices[0].message

        if not message.tool_calls:
            return (message.content, tools_used, None)

        # Tool-call branch will be extended in Tasks 10-12.
        # For now, break out — happy-path-only test.
        break

    return (None, tools_used, f"AI exceeded {max_iterations} tool-call iterations")
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest tests/test_ai_service.py -v`
Expected: PASS (includes the new `TestRunWithToolsNoToolCalls`).

- [ ] **Step 5: Commit**

```bash
git add services/ai_service.py tests/test_ai_service.py
git commit -m "$(cat <<'EOF'
feat: add _run_with_tools happy path (no tool calls)

First iteration — handles the case where the LLM answers
directly without calling any tool. Tool dispatch will be
added in subsequent tasks.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: `_run_with_tools` — single and parallel tool calls

**Files:**
- Modify: `services/ai_service.py`
- Modify: `tests/test_ai_service.py`

- [ ] **Step 1: Write the failing tests**

Append to `tests/test_ai_service.py`:

```python
def _fake_tool_call(call_id, name, arguments_json):
    return SimpleNamespace(
        id=call_id,
        function=SimpleNamespace(name=name, arguments=arguments_json),
    )


class TestRunWithToolsSingleCall:
    @patch("services.ai_service.TOOL_REGISTRY")
    @patch("services.ai_service.client")
    def test_dispatches_tool_then_returns_final_content(self, mock_client, mock_registry):
        # Tool returns a canned JSON string
        mock_registry.__contains__.return_value = True
        mock_registry.__getitem__.return_value = lambda **kw: '{"daily_amount": 100}'

        # First call returns a tool_call; second returns final content
        mock_client.chat.completions.create.side_effect = [
            _fake_response(_fake_message(tool_calls=[
                _fake_tool_call("call_1", "calculate_daily_spend", '{"total_amount": 700, "num_days": 7}')
            ])),
            _fake_response(_fake_message(content="Your daily spend is $100.")),
        ]
        from services.ai_service import _run_with_tools

        content, tools_used, error = _run_with_tools(
            messages=[{"role": "user", "content": "test"}],
            tools=[{"type": "function", "function": {"name": "calculate_daily_spend"}}],
        )
        assert content == "Your daily spend is $100."
        assert tools_used == ["calculate_daily_spend"]
        assert error is None
        assert mock_client.chat.completions.create.call_count == 2


class TestRunWithToolsParallelCalls:
    @patch("services.ai_service.TOOL_REGISTRY")
    @patch("services.ai_service.client")
    def test_multiple_tools_one_iteration_all_dispatched(self, mock_client, mock_registry):
        mock_registry.__contains__.return_value = True
        mock_registry.__getitem__.return_value = lambda **kw: '{"ok": true}'

        mock_client.chat.completions.create.side_effect = [
            _fake_response(_fake_message(tool_calls=[
                _fake_tool_call("a", "get_saved_recommendations", '{"trip_id": "t1"}'),
                _fake_tool_call("b", "get_savings_progress", '{"trip_id": "t1"}'),
            ])),
            _fake_response(_fake_message(content="Done.")),
        ]
        from services.ai_service import _run_with_tools

        content, tools_used, error = _run_with_tools(
            messages=[{"role": "user", "content": "test"}],
            tools=[{}],
        )
        assert tools_used == ["get_saved_recommendations", "get_savings_progress"]
        assert content == "Done."
        assert mock_client.chat.completions.create.call_count == 2
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_ai_service.py::TestRunWithToolsSingleCall tests/test_ai_service.py::TestRunWithToolsParallelCalls -v`
Expected: FAIL — the `break` in the current implementation short-circuits before dispatching.

- [ ] **Step 3: Replace the `break` with tool dispatch**

In `services/ai_service.py`, update the body of `_run_with_tools` — replace the `# Tool-call branch will be extended ...` comment and `break` with the dispatch logic:

```python
def _run_with_tools(
    messages: list,
    tools: list,
    max_iterations: int = 5,
) -> tuple:
    tools_used: list[str] = []

    for _ in range(max_iterations):
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            tools=tools if tools else None,
            tool_choice="auto" if tools else None,
            max_tokens=800,
        )
        message = response.choices[0].message

        if not message.tool_calls:
            return (message.content, tools_used, None)

        messages.append(message)

        for tool_call in message.tool_calls:
            name = tool_call.function.name
            args = _json.loads(tool_call.function.arguments)
            result = TOOL_REGISTRY[name](**args)
            tools_used.append(name)
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result,
            })

    return (None, tools_used, f"AI exceeded {max_iterations} tool-call iterations")
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest tests/test_ai_service.py -v`
Expected: PASS (all existing tests + the two new ones).

- [ ] **Step 5: Commit**

```bash
git add services/ai_service.py tests/test_ai_service.py
git commit -m "$(cat <<'EOF'
feat: _run_with_tools dispatches single and parallel tool calls

Handles both one tool call per response and multiple parallel
tool calls in one response, dispatching through TOOL_REGISTRY
and appending results before the next iteration.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: `_run_with_tools` — error recovery (unknown tool, bad JSON)

**Files:**
- Modify: `services/ai_service.py`
- Modify: `tests/test_ai_service.py`

- [ ] **Step 1: Write the failing tests**

Append to `tests/test_ai_service.py`:

```python
class TestRunWithToolsErrorRecovery:
    @patch("services.ai_service.client")
    def test_unknown_tool_appends_error_and_continues(self, mock_client):
        mock_client.chat.completions.create.side_effect = [
            _fake_response(_fake_message(tool_calls=[
                _fake_tool_call("x", "nonexistent_tool", "{}")
            ])),
            _fake_response(_fake_message(content="Recovered.")),
        ]
        from services.ai_service import _run_with_tools

        content, tools_used, error = _run_with_tools(
            messages=[{"role": "user", "content": "test"}],
            tools=[{}],
        )
        assert content == "Recovered."
        assert tools_used == ["nonexistent_tool"]  # name still tracked
        assert error is None

    @patch("services.ai_service.client")
    def test_bad_json_arguments_appends_error_and_continues(self, mock_client):
        mock_client.chat.completions.create.side_effect = [
            _fake_response(_fake_message(tool_calls=[
                _fake_tool_call("x", "calculate_daily_spend", "{not valid json")
            ])),
            _fake_response(_fake_message(content="Recovered.")),
        ]
        from services.ai_service import _run_with_tools

        content, tools_used, error = _run_with_tools(
            messages=[{"role": "user", "content": "test"}],
            tools=[{}],
        )
        assert content == "Recovered."
        assert tools_used == ["calculate_daily_spend"]
        assert error is None
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_ai_service.py::TestRunWithToolsErrorRecovery -v`
Expected: FAIL — the current code will raise `KeyError` on the unknown tool and `JSONDecodeError` on bad JSON.

- [ ] **Step 3: Add error recovery to the dispatch block**

In `services/ai_service.py`, replace the inner `for tool_call` loop with:

```python
        for tool_call in message.tool_calls:
            name = tool_call.function.name
            try:
                args = _json.loads(tool_call.function.arguments)
            except _json.JSONDecodeError:
                result = _json.dumps({"error": "invalid arguments"})
            else:
                if name not in TOOL_REGISTRY:
                    result = _json.dumps({"error": f"unknown tool: {name}"})
                else:
                    result = TOOL_REGISTRY[name](**args)

            tools_used.append(name)
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result,
            })
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest tests/test_ai_service.py -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/ai_service.py tests/test_ai_service.py
git commit -m "$(cat <<'EOF'
feat: recover from unknown tool names and malformed JSON args

Errors become JSON strings fed back to the LLM so it can adapt
instead of crashing the loop. Matches the design spec's
'tool errors are recoverable' principle.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: `_run_with_tools` — max iterations and API errors

**Files:**
- Modify: `services/ai_service.py`
- Modify: `tests/test_ai_service.py`

- [ ] **Step 1: Write the failing tests**

Append to `tests/test_ai_service.py`:

```python
import openai


class TestRunWithToolsLimits:
    @patch("services.ai_service.TOOL_REGISTRY")
    @patch("services.ai_service.client")
    def test_max_iterations_exceeded_returns_error(self, mock_client, mock_registry):
        # Registry always returns something so no error-recovery path interferes
        mock_registry.__contains__.return_value = True
        mock_registry.__getitem__.return_value = lambda **kw: '{"ok": true}'

        # Every response triggers another tool call — never terminates
        mock_client.chat.completions.create.return_value = _fake_response(
            _fake_message(tool_calls=[_fake_tool_call("x", "calculate_daily_spend", "{}")])
        )
        from services.ai_service import _run_with_tools

        content, tools_used, error = _run_with_tools(
            messages=[{"role": "user", "content": "test"}],
            tools=[{}],
            max_iterations=3,
        )
        assert content is None
        assert "3 tool-call iterations" in error
        assert len(tools_used) == 3  # one per iteration

    @patch("services.ai_service.client")
    def test_api_connection_error_returns_error_tuple(self, mock_client):
        mock_client.chat.completions.create.side_effect = openai.APIConnectionError(request=None)
        from services.ai_service import _run_with_tools

        content, tools_used, error = _run_with_tools(
            messages=[{"role": "user", "content": "test"}],
            tools=[],
        )
        assert content is None
        assert tools_used == []
        assert "Could not reach AI service" in error

    @patch("services.ai_service.client")
    def test_rate_limit_returns_error_tuple(self, mock_client):
        mock_client.chat.completions.create.side_effect = openai.RateLimitError(
            message="rate limit", response=SimpleNamespace(status_code=429), body=None
        )
        from services.ai_service import _run_with_tools

        content, tools_used, error = _run_with_tools(
            messages=[{"role": "user", "content": "test"}],
            tools=[],
        )
        assert content is None
        assert "rate limit" in error.lower()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_ai_service.py::TestRunWithToolsLimits -v`
Expected:
- `test_max_iterations_exceeded_returns_error` — likely PASS already (the existing code has this behavior from Task 9).
- The two API error tests — FAIL because no try/except wraps the API call yet.

- [ ] **Step 3: Wrap the loop body in API-error handling**

In `services/ai_service.py`, wrap the `response = client.chat.completions.create(...)` call inside the loop with try/except:

```python
def _run_with_tools(
    messages: list,
    tools: list,
    max_iterations: int = 5,
) -> tuple:
    tools_used: list[str] = []

    for _ in range(max_iterations):
        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=messages,
                tools=tools if tools else None,
                tool_choice="auto" if tools else None,
                max_tokens=800,
            )
        except openai.APIConnectionError:
            return (None, tools_used, "Could not reach AI service")
        except openai.RateLimitError:
            return (None, tools_used, "AI service rate limit hit, try again shortly")
        except openai.APIStatusError as e:
            return (None, tools_used, f"AI error: {e.status_code}")

        message = response.choices[0].message

        if not message.tool_calls:
            return (message.content, tools_used, None)

        messages.append(message)

        for tool_call in message.tool_calls:
            name = tool_call.function.name
            try:
                args = _json.loads(tool_call.function.arguments)
            except _json.JSONDecodeError:
                result = _json.dumps({"error": "invalid arguments"})
            else:
                if name not in TOOL_REGISTRY:
                    result = _json.dumps({"error": f"unknown tool: {name}"})
                else:
                    result = TOOL_REGISTRY[name](**args)

            tools_used.append(name)
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result,
            })

    return (None, tools_used, f"AI exceeded {max_iterations} tool-call iterations")
```

(This is the final form of `_run_with_tools`.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest tests/test_ai_service.py -v`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add services/ai_service.py tests/test_ai_service.py
git commit -m "$(cat <<'EOF'
feat: _run_with_tools handles API errors and iteration cap

Terminal OpenAI errors (connection, rate limit, API status)
return error tuples. Max iterations already handled by loop
fallthrough. Completes the tool-call helper.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Refactor `analyze_budget` and `get_recommendations` to use the helper

**Files:**
- Modify: `services/ai_service.py` (replace old function bodies, remove old imports)
- Modify: `tests/test_ai_service.py` (add public-function tests)

- [ ] **Step 1: Write the failing tests**

Append to `tests/test_ai_service.py`:

```python
class TestAnalyzeBudgetReturnShape:
    @patch("services.ai_service._run_with_tools")
    def test_returns_three_tuple_with_tools_used(self, mock_run):
        mock_run.return_value = ("some advice", ["get_savings_progress"], None)

        from services.ai_service import analyze_budget
        trip = {
            "destination": "Paris, France",
            "trip_purpose": "vacation",
            "num_travelers": 2,
            "total_budget": 3000,
            "departure_date": date(2026, 7, 1),
            "return_date": date(2026, 7, 8),
            "food_prefs": ["fine_dining"],
            "activity_prefs": ["museums"],
            "hotel_prefs": "mid_range",
        }
        allocation = {
            "flights_budget": 900, "flights_pct": 30,
            "hotel_budget": 800, "hotel_pct": 27,
            "food_budget": 600, "food_pct": 20,
            "activities_budget": 400, "activities_pct": 13,
            "transport_budget": 200, "transport_pct": 7,
            "misc_budget": 100, "misc_pct": 3,
        }

        content, tools_used, error = analyze_budget(trip, allocation)
        assert content == "some advice"
        assert tools_used == ["get_savings_progress"]
        assert error is None
        mock_run.assert_called_once()


class TestGetRecommendationsReturnShape:
    @patch("services.ai_service._run_with_tools")
    def test_returns_three_tuple_with_tools_used(self, mock_run):
        mock_run.return_value = ("3 options", ["get_saved_recommendations"], None)

        from services.ai_service import get_recommendations
        trip = {
            "destination": "Tokyo, Japan",
            "trip_purpose": "vacation",
            "num_travelers": 1,
            "total_budget": 2500,
            "departure_date": date(2026, 9, 1),
            "return_date": date(2026, 9, 8),
            "food_prefs": ["street_food"],
            "activity_prefs": ["museums"],
            "hotel_prefs": "budget",
        }
        allocation = {
            "flights_budget": 900, "flights_pct": 36,
            "hotel_budget": 700, "hotel_pct": 28,
            "food_budget": 400, "food_pct": 16,
            "activities_budget": 300, "activities_pct": 12,
            "transport_budget": 150, "transport_pct": 6,
            "misc_budget": 50, "misc_pct": 2,
        }

        content, tools_used, error = get_recommendations(trip, allocation, focus="hotels")
        assert content == "3 options"
        assert tools_used == ["get_saved_recommendations"]
        assert error is None
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_ai_service.py::TestAnalyzeBudgetReturnShape tests/test_ai_service.py::TestGetRecommendationsReturnShape -v`
Expected: FAIL — the existing `analyze_budget` and `get_recommendations` return 2-tuples, not 3-tuples.

- [ ] **Step 3: Rewrite the two public functions**

In `services/ai_service.py`, **replace** the existing `analyze_budget` and `get_recommendations` function bodies. The final file should look like this (in this order):

```python
# ai_service.py
import os
import json as _json
from openai import OpenAI
import openai

from services.ai_tools import TOOL_REGISTRY, TOOL_SCHEMAS

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
MODEL = "gpt-4o-mini"


def _humanize_prefs(prefs: list | None) -> str:
    if not prefs:
        return "no specific preference"
    return ", ".join(prefs)


def _build_system_prompt() -> str:
    return """You are a travel budget advisor helping a user plan a specific trip.

You have tools available:
- get_saved_recommendations: look up items the user has already saved for this trip
- get_savings_progress: check how close the user is to their savings goal
- calculate_daily_spend: convert total amounts into per-day figures when useful

Use tools when they improve your answer. Do NOT call tools just to show you can.
Do NOT duplicate recommendations the user has already saved.
Be specific (name real places, give price ranges), concise (3-5 bullets unless asked otherwise),
and practical. Ground advice in the user's stated preferences — do not override them."""


def _build_analyze_prompt(trip: dict, allocation: dict) -> str:
    departure = trip["departure_date"]
    return_date = trip["return_date"]
    if hasattr(departure, "date"):
        departure = departure.date()
    if hasattr(return_date, "date"):
        return_date = return_date.date()
    num_nights = (return_date - departure).days
    per_day = round(trip["total_budget"] / num_nights, 2) if num_nights > 0 else trip["total_budget"]

    return f"""Trip: {trip['num_travelers']} traveler(s) going to {trip['destination']} for {num_nights} nights ({trip['trip_purpose']}).
Total budget: ${trip['total_budget']} (~${per_day}/day).

Allocation:
- Flights: ${allocation['flights_budget']} ({allocation['flights_pct']}%)
- Hotel: ${allocation['hotel_budget']} ({allocation['hotel_pct']}%)
- Food: ${allocation['food_budget']} ({allocation['food_pct']}%)
- Activities: ${allocation['activities_budget']} ({allocation['activities_pct']}%)
- Transport: ${allocation['transport_budget']} ({allocation['transport_pct']}%)
- Misc: ${allocation['misc_budget']} ({allocation['misc_pct']}%)

User preferences (treat as firm constraints, not suggestions):
- Hotel style: {trip.get('hotel_prefs', 'mid_range')}
- Food style: {_humanize_prefs(trip.get('food_prefs'))}
- Activities: {_humanize_prefs(trip.get('activity_prefs'))}

Does this allocation make sense for this destination and trip style?
What should they watch out for? 3-5 bullet points.
You may use tools if they help (e.g., checking savings progress or already-saved items)."""


def _build_recommend_prompt(trip: dict, allocation: dict, focus: str) -> str:
    focus_to_budget_key = {
        "hotels": ("hotel_budget", "hotel_pct"),
        "food": ("food_budget", "food_pct"),
        "activities": ("activities_budget", "activities_pct"),
        "overall": ("hotel_budget", "hotel_pct"),
    }
    budget_key, pct_key = focus_to_budget_key.get(focus, focus_to_budget_key["overall"])
    category_budget = allocation[budget_key]
    category_pct = allocation[pct_key]

    departure = trip["departure_date"]
    return_date = trip["return_date"]
    if hasattr(departure, "date"):
        departure = departure.date()
    if hasattr(return_date, "date"):
        return_date = return_date.date()
    num_nights = (return_date - departure).days
    per_day = round(category_budget / num_nights, 2) if num_nights > 0 else category_budget

    return f"""Trip: {trip['destination']}, {num_nights} nights, {trip['trip_purpose']}, {trip['num_travelers']} traveler(s).

Budget for {focus}: ${category_budget} total (${per_day}/day, {category_pct}% of trip budget).

User preferences (treat as firm constraints):
- Hotel style: {trip.get('hotel_prefs', 'mid_range')}
- Food style: {_humanize_prefs(trip.get('food_prefs'))}
- Activities: {_humanize_prefs(trip.get('activity_prefs'))}

Suggest 3 specific {focus} options in {trip['destination']} that fit this budget and these preferences.
Before suggesting, check get_saved_recommendations so you don't repeat what's already saved.
For each option: name, brief description, price range, and why it matches their preferences."""


def _run_with_tools(
    messages: list,
    tools: list,
    max_iterations: int = 5,
) -> tuple:
    tools_used: list[str] = []

    for _ in range(max_iterations):
        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=messages,
                tools=tools if tools else None,
                tool_choice="auto" if tools else None,
                max_tokens=800,
            )
        except openai.APIConnectionError:
            return (None, tools_used, "Could not reach AI service")
        except openai.RateLimitError:
            return (None, tools_used, "AI service rate limit hit, try again shortly")
        except openai.APIStatusError as e:
            return (None, tools_used, f"AI error: {e.status_code}")

        message = response.choices[0].message

        if not message.tool_calls:
            return (message.content, tools_used, None)

        messages.append(message)

        for tool_call in message.tool_calls:
            name = tool_call.function.name
            try:
                args = _json.loads(tool_call.function.arguments)
            except _json.JSONDecodeError:
                result = _json.dumps({"error": "invalid arguments"})
            else:
                if name not in TOOL_REGISTRY:
                    result = _json.dumps({"error": f"unknown tool: {name}"})
                else:
                    result = TOOL_REGISTRY[name](**args)

            tools_used.append(name)
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result,
            })

    return (None, tools_used, f"AI exceeded {max_iterations} tool-call iterations")


def analyze_budget(trip, allocation):
    messages = [
        {"role": "system", "content": _build_system_prompt()},
        {"role": "user", "content": _build_analyze_prompt(trip, allocation)},
    ]
    return _run_with_tools(messages, TOOL_SCHEMAS)


def get_recommendations(trip, allocation, focus):
    messages = [
        {"role": "system", "content": _build_system_prompt()},
        {"role": "user", "content": _build_recommend_prompt(trip, allocation, focus)},
    ]
    return _run_with_tools(messages, TOOL_SCHEMAS)
```

Delete any leftover code from the old implementation (the old single-turn `client.chat.completions.create` blocks inside `analyze_budget`/`get_recommendations`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest tests/test_ai_service.py tests/test_ai_tools.py -v`
Expected: PASS (all AI-layer tests).

- [ ] **Step 5: Commit**

```bash
git add services/ai_service.py tests/test_ai_service.py
git commit -m "$(cat <<'EOF'
refactor: route analyze_budget and get_recommendations through tool loop

Both public functions now return 3-tuple (content, tools_used, error)
and delegate to _run_with_tools. Old single-turn bodies removed.
Callers in routes/ai.py updated in next task.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

**Note:** At this point, `python -m pytest tests/` will have **failing route tests** because `routes/ai.py` still unpacks a 2-tuple. Task 14 fixes this.

---

## Task 14: Update `routes/ai.py` response shape

**Files:**
- Modify: `routes/ai.py`
- Modify: `tests/test_routes.py`

- [ ] **Step 1: Write the failing test**

The existing `test_routes.py` only spot-checks auth (401) because decorator-patching the Flask app mid-test is fragile in this codebase (see the `# Need to re-register routes with patched decorator` comment in `TestTripsRoutes`). So instead of adding a route-level test that patches the auth decorator, we'll test the response shape by calling the view function directly with a mocked `request.uid` — this is a clean, deterministic integration test for the route.

Append to `tests/test_routes.py` inside `class TestAiRoutes` (after `test_recommend_requires_auth`):

```python
    @patch("routes.ai.get_recommendations")
    @patch("routes.ai.BudgetAllocation")
    @patch("routes.ai.Trip")
    def test_recommend_view_returns_enriched_shape(
        self, MockTrip, MockAllocation, mock_get_recs, app
    ):
        MockTrip.get.return_value = {"user_id": "test-user-123"}
        MockAllocation.get.return_value = {
            "hotel_budget": 800, "hotel_pct": 27,
            "food_budget": 600, "food_pct": 20,
            "activities_budget": 400, "activities_pct": 13,
            "flights_budget": 900, "flights_pct": 30,
            "transport_budget": 200, "transport_pct": 7,
            "misc_budget": 100, "misc_pct": 3,
        }
        mock_get_recs.return_value = ("3 hotels listed", ["get_saved_recommendations"], None)

        from routes.ai import recommend
        with app.test_request_context(
            "/api/ai/trip123/recommend",
            method="POST",
            json={"focus": "hotels"},
        ) as ctx:
            ctx.request.uid = "test-user-123"
            response, status = recommend("trip123")

        data = response.get_json()
        assert status == 200
        assert data["advice"] == "3 hotels listed"
        assert data["tools_used"] == ["get_saved_recommendations"]
        assert "message_id" in data
        assert len(data["message_id"]) == 36  # UUID string length

    @patch("routes.ai.analyze_budget")
    @patch("routes.ai.BudgetAllocation")
    @patch("routes.ai.Trip")
    def test_analyze_view_returns_enriched_shape(
        self, MockTrip, MockAllocation, mock_analyze, app
    ):
        MockTrip.get.return_value = {"user_id": "test-user-123"}
        MockAllocation.get.return_value = {
            "hotel_budget": 800, "hotel_pct": 27,
            "food_budget": 600, "food_pct": 20,
            "activities_budget": 400, "activities_pct": 13,
            "flights_budget": 900, "flights_pct": 30,
            "transport_budget": 200, "transport_pct": 7,
            "misc_budget": 100, "misc_pct": 3,
        }
        mock_analyze.return_value = ("advice bullets", ["get_savings_progress"], None)

        from routes.ai import analyze
        with app.test_request_context("/api/ai/trip123/analyze", method="POST") as ctx:
            ctx.request.uid = "test-user-123"
            response, status = analyze("trip123")

        data = response.get_json()
        assert status == 200
        assert data["advice"] == "advice bullets"
        assert data["tools_used"] == ["get_savings_progress"]
        assert "message_id" in data
```

This approach works because the view functions can be invoked directly inside a `test_request_context`, where we set `request.uid` manually (bypassing the auth decorator that lives on the URL route, not the function body).

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_routes.py -v`
Expected:
- Existing 401 tests: **FAIL** now, because `routes/ai.py` imports `analyze_budget` which was refactored. Actually wait — the import is fine. The tests fail only when the routes try to unpack the return tuple. The 401 tests don't reach that code path (they fail at auth), so they should still pass.
- New contract tests: PASS trivially (they're self-documenting).

So run: `python -m pytest tests/ -v` — if any route-handler code runs and hits the tuple unpack, it will crash. Expected: the app might crash on an actual analyze/recommend POST, but existing tests don't exercise that.

- [ ] **Step 3: Update `routes/ai.py`**

Replace the full contents of `routes/ai.py` with:

```python
# ai.py
import uuid
from flask import Blueprint, request, jsonify
from models.trip import Trip
from models.budget import BudgetAllocation
from services.ai_service import analyze_budget, get_recommendations
from routes.auth import require_auth

ai_bp = Blueprint("ai", __name__)


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

    advice, tools_used, error = analyze_budget(trip, allocation)
    if error:
        return jsonify({"error": error}), 503
    return jsonify({
        "advice": advice,
        "message_id": str(uuid.uuid4()),
        "tools_used": tools_used,
    }), 200


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

    focus = request.get_json().get("focus", "overall")
    if focus not in ["hotels", "food", "activities", "overall"]:
        return jsonify({"error": "focus must be hotels, food, activities, or overall"}), 400

    advice, tools_used, error = get_recommendations(trip, allocation, focus)
    if error:
        return jsonify({"error": error}), 503
    return jsonify({
        "advice": advice,
        "message_id": str(uuid.uuid4()),
        "tools_used": tools_used,
    }), 200
```

- [ ] **Step 4: Run tests to verify everything passes**

Run: `python -m pytest tests/ -v`
Expected: PASS (all tests — old + new).

- [ ] **Step 5: Commit**

```bash
git add routes/ai.py tests/test_routes.py
git commit -m "$(cat <<'EOF'
feat: enrich AI route responses with message_id and tools_used

Both /api/ai/<trip_id>/analyze and /recommend now return
{advice, message_id, tools_used}. Backward-compatible — the
frontend reads 'advice' as before and ignores new fields.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: Full-suite verification and manual smoke test

**Files:** None modified.

- [ ] **Step 1: Run the full test suite**

Run: `python -m pytest tests/ -v`
Expected: PASS on all tests — 40+ pre-existing + ~18 new.

- [ ] **Step 2: Check test counts**

Run: `python -m pytest tests/ --collect-only -q | tail -5`
Expected: confirms 58+ tests collected (40 existing + 18+ new).

- [ ] **Step 3: Start the backend and manually smoke-test**

In one terminal:
```bash
source .venv/bin/activate
python app.py
```

In another terminal (once Flask is up), authenticate via the running frontend (`npm run dev` in `frontend/`), create or pick a trip, generate a budget allocation, then hit the AI Advisor page and click "Analyze budget." Watch the Flask logs for a successful request and verify:
- Response JSON contains `advice`, `message_id` (UUID), and `tools_used` (list — possibly empty if the LLM didn't call a tool).
- Click "Recommendations" — same checks.
- If you have saved items on the trip, note whether `tools_used` includes `get_saved_recommendations` (evidence the tool loop works end-to-end).

- [ ] **Step 4: Commit anything uncommitted from the smoke test (usually nothing)**

```bash
git status
# if anything is staged unexpectedly, inspect before committing
```

- [ ] **Step 5: Final summary commit (optional — only if notes/changelog updated)**

No commit required if `git status` is clean. Phase 1 complete.

---

## Success criteria (from spec §9)

- [x] `python -m pytest tests/ -v` passes with ~18 new tests added.
- [x] `/api/ai/<trip_id>/analyze` and `/recommend` return `{advice, message_id, tools_used}`.
- [x] `tools_used` populated when tools called, `[]` when not.
- [x] No frontend changes needed.
- [x] Adding a Phase 2 tool is a single-file diff to `services/ai_tools.py`.

---

## What this plan does NOT do (deferred to later phases)

- Real web search tool (Tavily / Serper / Google Places)
- Flights API tool (Amadeus / Duffel / Kiwi)
- Conversation persistence / chat history
- Feedback buttons on AI responses
- Day-to-day itinerary feature
- Frontend UI changes
