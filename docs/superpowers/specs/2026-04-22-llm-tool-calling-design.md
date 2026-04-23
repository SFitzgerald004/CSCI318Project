# LLM Tool Calling — Design Spec

**Date:** 2026-04-22
**Status:** Approved, ready for implementation plan
**Scope:** Phase 1 of the post-feedback feature roadmap — plumbing + prompt steering only

---

## 1. Context and motivation

Feedback from the CSCI318 review meeting flagged seven improvements, grouped and prioritized as:

- **Phase 1 (this spec):** refactor the AI layer to support OpenAI tool calling and strengthen prompt steering toward user preferences.
- Phase 2: wire a real web-search tool and a flights API tool onto the Phase 1 plumbing.
- Phase 3: build the day-to-day itinerary feature and add user feedback on AI responses.
- Phase 4: deeper UI/UX polish.

This spec covers **Phase 1 only**. It is the foundation that makes the rest of the roadmap cheap — Phase 2 becomes "add entries to a tool registry," not "refactor the AI service again."

### Current state

[services/ai_service.py](../../../services/ai_service.py) is two stateless single-turn functions (`analyze_budget`, `get_recommendations`). Each builds a prompt, calls `client.chat.completions.create` once, and returns a string. Preferences are embedded in the prompt as Python list reprs. No tool use. No conversation state. No way for the LLM to reach outside data.

### Goals

1. Refactor both public functions to route through a shared tool-calling loop.
2. Register three tools the LLM can call on demand.
3. Strengthen prompt steering so stated preferences are treated as constraints, not hints.
4. Enrich the response shape with `message_id` and `tools_used` without breaking the existing frontend.
5. Ship with ~18 new tests covering tools in isolation, the loop, and the enriched route responses.

### Non-goals

- No external API integrations (web search, flights) — deferred to Phase 2.
- No persisted conversation state — each request stays stateless, matching current behavior.
- No frontend changes — the enriched response is backward-compatible; feedback buttons and chat history UI are deferred.
- No schema/model changes.

---

## 2. Architecture and file layout

| File | Change | Why |
|---|---|---|
| [services/ai_service.py](../../../services/ai_service.py) | Rewritten — public functions kept, both route through new private `_run_with_tools()` helper | The refactor |
| `services/ai_tools.py` | **New** — JSON tool schemas, Python implementations, `TOOL_REGISTRY` | Isolates tool logic from the LLM loop |
| [routes/ai.py](../../../routes/ai.py) | Minor — response expands to `{advice, message_id, tools_used}` | Enriched response shape |
| `tests/test_ai_tools.py` | **New** — tests each tool in isolation | No AI tests exist today |
| `tests/test_ai_service.py` | **New** — tests the tool-call loop | No AI tests exist today |
| [tests/test_routes.py](../../../tests/test_routes.py) | Add tests for new response shape | Existing route tests need the extra fields |

### Module boundaries

```
services/
├── ai_service.py       ← public: analyze_budget(), get_recommendations()
│                         private: _run_with_tools(), prompt builders
└── ai_tools.py         ← public: TOOL_SCHEMAS, TOOL_REGISTRY
                          private: _get_saved_recommendations(),
                                   _get_savings_progress(),
                                   _calculate_daily_spend()
```

**Why the split:**
- Tools are unit-testable without mocking OpenAI; the loop is unit-testable without mocking Firestore.
- Adding a Phase 2 tool is one-file change — append to `ai_tools.py` and to `TOOL_REGISTRY`.
- Each file stays focused and under ~120 lines.

### What does NOT change

- `models/` — no schema changes (stateless response).
- `frontend/` — enriched response ignored by existing code; no changes required for Phase 1.
- `config.py`, `extensions.py`, `app.py` — untouched.
- Endpoint URLs and auth decorators — untouched.

---

## 3. Tool registry and schemas

Three tools. Each tool is a Python function returning a **JSON string** (the LLM receives tool results as strings) plus a matching JSON schema sent to OpenAI.

### Tool 1 — `get_saved_recommendations(trip_id, category=None)`

**Purpose:** Let the LLM see what the user already saved so recommendations don't duplicate and analysis can factor committed spend.

**JSON schema:**
```json
{
  "type": "function",
  "function": {
    "name": "get_saved_recommendations",
    "description": "Fetch the user's saved recommendations for this trip. Call this before suggesting new hotels/restaurants/attractions so you don't duplicate what they already have. Also useful when analyzing budget — saved items represent committed spend.",
    "parameters": {
      "type": "object",
      "properties": {
        "trip_id": { "type": "string", "description": "The trip ID to look up" },
        "category": {
          "type": "string",
          "enum": ["hotel", "restaurant", "attraction", "flight", "car_rental"],
          "description": "Optional filter. Omit to get all categories."
        }
      },
      "required": ["trip_id"]
    }
  }
}
```

**Implementation:** Reads via [models/recommendation.py](../../../models/recommendation.py) `get_by_trip`. Applies in-Python category filter if provided. Returns JSON string: `[{"name", "category", "price_level", "rating", "description"}, ...]`.

### Tool 2 — `get_savings_progress(trip_id)`

**Purpose:** Gives `analyze_budget` something concrete to reason about — current savings pace vs. goal.

**JSON schema:**
```json
{
  "type": "function",
  "function": {
    "name": "get_savings_progress",
    "description": "Get the user's savings progress toward this trip's total budget. Returns amount saved, goal, percent complete, weekly target, and an on_track boolean.",
    "parameters": {
      "type": "object",
      "properties": { "trip_id": { "type": "string" } },
      "required": ["trip_id"]
    }
  }
}
```

**Implementation:** Reads via [models/savings_plan.py](../../../models/savings_plan.py). Computes `on_track` by comparing current weekly pace to target. Returns JSON: `{"saved", "goal", "pct_complete", "weekly_target", "on_track"}`.

### Tool 3 — `calculate_daily_spend(total_amount, num_days)`

**Purpose:** Pure math, no Firestore, no mocking needed in tests. Proves the loop handles non-DB tools correctly.

**JSON schema:**
```json
{
  "type": "function",
  "function": {
    "name": "calculate_daily_spend",
    "description": "Given a budget amount and number of days, return the daily average. Useful for framing budgets in per-day terms (e.g., 'your food budget works out to $45/day').",
    "parameters": {
      "type": "object",
      "properties": {
        "total_amount": { "type": "number", "description": "Dollar amount" },
        "num_days": { "type": "integer", "description": "Number of days" }
      },
      "required": ["total_amount", "num_days"]
    }
  }
}
```

**Implementation:** Returns `{"daily_amount": round(total_amount / num_days, 2)}`. Guards against `num_days <= 0` by returning `{"error": "num_days must be positive"}`.

### The registry

In `services/ai_tools.py`:

```python
TOOL_SCHEMAS = [ ... ]  # list of the 3 JSON schemas above

TOOL_REGISTRY = {
    "get_saved_recommendations": _get_saved_recommendations,
    "get_savings_progress": _get_savings_progress,
    "calculate_daily_spend": _calculate_daily_spend,
}
```

The loop calls `TOOL_REGISTRY[name](**args)`. Adding a Phase 2 tool is one entry in each dict.

### Safety

Each tool wraps its body in `try/except` and returns a JSON error string on failure (e.g., `{"error": "trip not found"}`) rather than raising. The LLM sees the error and can recover. Raising would crash the loop.

---

## 4. The tool-call loop

### Signature

```python
def _run_with_tools(
    messages: list,
    tools: list,
    max_iterations: int = 5,
) -> tuple[str | None, list[str], str | None]:
    """
    Returns (final_content, tools_used, error).
    """
```

### Loop logic

```
tools_used = []
for iteration in range(max_iterations):
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
        try:
            args = json.loads(tool_call.function.arguments)
        except json.JSONDecodeError:
            result = json.dumps({"error": "invalid arguments"})
        else:
            if name not in TOOL_REGISTRY:
                result = json.dumps({"error": f"unknown tool: {name}"})
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

The whole `for iteration` body is also wrapped in a try/except catching `openai.APIConnectionError`, `openai.RateLimitError`, `openai.APIStatusError` — see §6.

### Design decisions

- **`tool_choice="auto"`** — model decides whether to call a tool. No forcing.
- **`tools=None` fallback** — passing `tools=None` is a plain completion. `analyze_budget` can use this helper even with an empty tool list (though per the design it passes the full `TOOL_SCHEMAS`).
- **`json.loads` on arguments** — OpenAI sends tool args as a JSON string, not a dict.
- **Errors inside tools become JSON strings**, not raises. LLM gets a chance to adapt.
- **`max_iterations=5`** — real flows terminate in 2-3 iterations. 5 is comfortable; 10 risks runaway cost.
- **`tools_used` is a list, not a set** — preserves order and duplicates for UI display.

### Public functions

```python
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

Both return `(content, tools_used, error)`. The route layer adds `message_id`.

---

## 5. Prompt steering and response shape

### System prompt (shared)

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

Why this shape:
- Tool descriptions repeated in the system prompt (in addition to the JSON schemas) makes the model measurably more likely to actually use them when appropriate.
- "Do NOT call tools just to show you can" prevents gpt-4o-mini's habit of calling tools on empty datasets and wasting iterations.
- "Do not override them" guards against the LLM "correcting" stated preferences.

### Preference rendering helper

Both user prompts use `{food_prefs_human}` and `{activity_prefs_human}` placeholders. These are comma-joined strings built by a small helper:

```python
def _humanize_prefs(prefs: list | None) -> str:
    if not prefs:
        return "no specific preference"
    return ", ".join(prefs)
```

Used to turn `["fine_dining", "street_food"]` into `"fine_dining, street_food"` before interpolation.

### User prompt — `_build_analyze_prompt`

```
Trip: {num_travelers} traveler(s) going to {destination} for {num_nights} nights ({trip_purpose}).
Total budget: ${total_budget} (≈ ${per_day}/day).

Allocation:
- Flights: ${flights_budget} ({flights_pct}%)
- Hotel: ${hotel_budget} ({hotel_pct}%)
- Food: ${food_budget} ({food_pct}%)
- Activities: ${activities_budget} ({activities_pct}%)
- Transport: ${transport_budget} ({transport_pct}%)
- Misc: ${misc_budget} ({misc_pct}%)

User preferences (treat as firm constraints, not suggestions):
- Hotel style: {hotel_prefs}
- Food style: {food_prefs_human}
- Activities: {activity_prefs_human}

Does this allocation make sense for this destination and trip style?
What should they watch out for? 3-5 bullet points.
You may use tools if they help (e.g., checking savings progress or already-saved items).
```

### User prompt — `_build_recommend_prompt`

```
Trip: {destination}, {num_nights} nights, {trip_purpose}, {num_travelers} traveler(s).

Budget for {focus}: ${category_budget} total (${per_day}/day, {pct}% of trip budget).

User preferences (treat as firm constraints):
- Hotel style: {hotel_prefs}
- Food style: {food_prefs_human}
- Activities: {activity_prefs_human}

Suggest 3 specific {focus} options in {destination} that fit this budget and these preferences.
Before suggesting, check get_saved_recommendations so you don't repeat what's already saved.
For each option: name, brief description, price range, and why it matches their preferences.
```

Key deltas from existing prompts:
- Preferences join as `"fine_dining, street_food"` instead of `['fine_dining', 'street_food']`.
- Per-day figures precomputed (LLM reasons better with `$300/day` than with raw division).
- Explicit "treat as firm constraints" steering language.
- Recommend prompt explicitly nudges `get_saved_recommendations` usage.

### Response shape — route layer

**Current:**
```python
return jsonify({'advice': advice}), 200
```

**New in [routes/ai.py](../../../routes/ai.py):**
```python
advice, tools_used, error = analyze_budget(trip, allocation)
if error:
    return jsonify({'error': error}), 503
return jsonify({
    'advice': advice,
    'message_id': str(uuid.uuid4()),
    'tools_used': tools_used,
}), 200
```

- `message_id` generated fresh per request at the route layer. Not persisted (stateless).
- `tools_used` is the list returned from the loop, possibly empty.
- Frontend ignores new fields until Phase 3 wires feedback UI. No frontend changes required.

---

## 6. Error handling

| Failure | Where | Handling | User sees |
|---|---|---|---|
| `openai.APIConnectionError` | `_run_with_tools` try/except | `(None, tools_used, 'Could not reach AI service')` | 503 |
| `openai.RateLimitError` | `_run_with_tools` try/except | `(None, tools_used, 'AI service rate limit hit, try again shortly')` | 503 |
| `openai.APIStatusError` | `_run_with_tools` try/except | `(None, tools_used, f'AI error: {e.status_code}')` | 503 |
| Max iterations exceeded | Loop fallthrough | `(None, tools_used, 'AI exceeded 5 tool-call iterations')` | 503 |
| Bad JSON in tool args | `json.loads` | Append `{"error": "invalid arguments"}` tool result, continue loop | Usually invisible — model self-corrects |
| Unknown tool name | Registry dispatch | Append `{"error": "unknown tool: X"}` tool result, continue loop | Invisible |
| Exception inside a tool | Tool's own try/except | Tool returns `{"error": "..."}` string | Invisible — model adapts |
| LLM loops forever | Max iterations cap | Abort at 5 iterations | 503 |

**Two principles:**
1. **OpenAI API errors are terminal** — bail out with 503. Matches current behavior.
2. **Tool errors are recoverable** — become JSON strings the LLM reads, model gets another iteration.

### Cost guardrails

- `max_iterations=5`
- `max_tokens=800` per completion (bumped from 600 for tool-use overhead)
- No per-call budget tracking in Phase 1 (YAGNI)

Worst-case estimate: 5 iterations × ~2.3K tokens ≈ 11K tokens ≈ ~$0.002 per API call with gpt-4o-mini. Safe.

---

## 7. Testing strategy

### `tests/test_ai_tools.py` (new)

| Test | Verifies |
|---|---|
| `test_calculate_daily_spend_happy_path` | Returns correct JSON with rounded daily amount |
| `test_calculate_daily_spend_zero_days` | Returns error JSON, doesn't raise |
| `test_get_saved_recommendations_returns_list` | Mocks `Recommendation.get_by_trip`, verifies JSON shape |
| `test_get_saved_recommendations_with_category_filter` | Category kwarg flows through |
| `test_get_saved_recommendations_handles_model_error` | Forces model to raise, tool returns error JSON |
| `test_get_savings_progress_on_track_true` | Mocks `SavingsPlan.get` with on-pace data |
| `test_get_savings_progress_no_plan` | Model returns None, tool returns error JSON |

### `tests/test_ai_service.py` (new)

| Test | Verifies |
|---|---|
| `test_run_with_tools_no_tool_calls` | Loop returns content + empty `tools_used` on first iteration |
| `test_run_with_tools_single_tool_call_then_answer` | Tool dispatched, `tools_used == ['tool_name']` |
| `test_run_with_tools_multiple_tools_one_iteration` | Parallel tool_calls all dispatched before next API call |
| `test_run_with_tools_unknown_tool` | Error result appended, loop continues |
| `test_run_with_tools_bad_json_arguments` | Error result appended, no raise |
| `test_run_with_tools_max_iterations_exceeded` | Aborts at iteration 5 with error tuple |
| `test_run_with_tools_api_connection_error` | Returns `(None, [], 'Could not reach AI service')` |
| `test_analyze_budget_returns_tools_used` | Return tuple shape correct |
| `test_get_recommendations_returns_tools_used` | Return tuple shape correct |

### `tests/test_routes.py` (additions)

| Test | Verifies |
|---|---|
| `test_analyze_route_returns_enriched_shape` | Response has `advice`, `message_id` (UUID-ish), `tools_used` |
| `test_recommend_route_returns_enriched_shape` | Same for the recommend endpoint |

### Mocking approach

- Patch `services.ai_service.client.chat.completions.create` via `unittest.mock.patch`.
- Build fake response objects with `types.SimpleNamespace`.
- No real OpenAI calls in the test suite.

### Not tested in Phase 1

- Prompt output quality (manual evaluation only)
- Token counts / cost assertions
- End-to-end against real OpenAI (manual spot-check after the refactor)
- Firestore concurrency

---

## 8. Out of scope (Phase 2+)

- External API tools: web search for activities, flights API (Amadeus/Duffel/Kiwi)
- Persisted conversation history / stateful chat
- Feedback buttons on AI responses
- Day-to-day itinerary feature
- Frontend UI changes (tool transparency, feedback, chat history)
- Deeper UI/UX polish per the global Apple-inspired design system

These build on Phase 1's foundation — once the tool-call loop exists, Phase 2 is "add to `TOOL_REGISTRY`"; Phase 3 is "persist `ai_messages` collection and add frontend UI".

---

## 9. Success criteria

- `python -m pytest tests/ -v` passes (old tests + ~18 new ones).
- Running the app manually with a real OpenAI key: both `/api/ai/<trip_id>/analyze` and `/api/ai/<trip_id>/recommend` return responses that demonstrably reference saved items and savings progress when the LLM chooses to look them up.
- `tools_used` is populated with tool names in the response when tools were called, `[]` when they weren't.
- No frontend changes required for the app to continue working — existing UI reads `advice` and ignores new fields.
- Adding a hypothetical new tool in Phase 2 is a single-file diff to `services/ai_tools.py`.
