# ai_service.py
import os
import json as _json
from openai import OpenAI
import openai
from services.ai_tools import TOOL_REGISTRY, TOOL_SCHEMAS

client = OpenAI(api_key = os.environ.get('OPENAI_API_KEY'))
MODEL = 'gpt-4o-mini'


def _humanize_prefs(prefs: list | None) -> str:
    """Turn ['fine_dining', 'street_food'] into 'fine_dining, street_food'."""
    if not prefs:
        return "no specific preference"
    return ", ".join(prefs)


def _normalize_dates_and_count_nights(trip: dict) -> int:
    """Normalize Firestore-backed dates and return the nights between them."""
    departure = trip["departure_date"]
    return_date = trip["return_date"]
    if hasattr(departure, "date"):
        departure = departure.date()
    if hasattr(return_date, "date"):
        return_date = return_date.date()
    return (return_date - departure).days


def _build_system_prompt() -> str:
    return """You are a travel budget advisor helping a user plan a specific trip.

You have tools available:
- get_saved_recommendations: look up items the user has already saved for this trip
- get_savings_progress: check how close the user is to their savings goal
- calculate_daily_spend: convert total amounts into per-day figures when useful

Use tools when they improve your answer. do NOT call tools just to show you can.
Do NOT duplicate recommendations the user has already saved.
Be specific (name real places, give price ranges), concise (3-5 bullets unless asked otherwise),
and practical. Ground advice in the user's stated preferences — do not override them."""


def _build_analyze_prompt(trip: dict, allocation: dict) -> str:
    num_nights = _normalize_dates_and_count_nights(trip)
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

    num_nights = _normalize_dates_and_count_nights(trip)
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
    """Run an OpenAI chat completion with optional tool calling.

    Returns (final_content, tools_used, error).
    """
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
