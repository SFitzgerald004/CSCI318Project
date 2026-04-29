# ai_service.py
from __future__ import annotations
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
                    try:
                        result = TOOL_REGISTRY[name](**args)
                    except Exception as exc:
                        result = _json.dumps({"error": f"tool error: {exc}"})

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

# ====================================================================
# New helpers (cherry-picked from backend branch): chat / itinerary /
# AI flight recommendations / Google-Places-augmented activity recs.
# These run on plain `client.chat.completions.create(...)` without the
# tool-loop above — the structured analyze/recommend path stays as-is.
# ====================================================================

def chat_with_ai(trip, user_message, history=None):
    """Free-form conversational chat scoped to a trip."""
    history = history or []

    prompt = (
        f"You are a travel assistant helping with a trip to {trip['destination']}. "
        f"The trip purpose is {trip['trip_purpose']}. "
        "Give practical, concise answers. If you make suggestions, keep them relevant to the trip. "
        "For formatting purposes, do not add special characters as if to add a header or title. "
        "For example, do not send a message '**Transport Costs**:'. Instead, just send 'Transport Costs:'."
    )

    messages = [{"role": "system", "content": prompt}]
    for item in history:
        role = item.get("role")
        content = item.get("content")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": user_message})

    try:
        response = client.chat.completions.create(
            model=MODEL,
            max_tokens=600,
            messages=messages,
        )
        return response.choices[0].message.content, None
    except openai.APIConnectionError:
        return None, "Could not reach AI service"
    except openai.RateLimitError:
        return None, "AI service rate limit reached"
    except openai.APIStatusError as e:
        return None, f"AI error: {e.status_code}"


def generate_itinerary_from_recommendations(trip, recommendations):
    """Generate a day-by-day itinerary from saved recommendations using the LLM."""
    try:
        departure = trip.get("departure_date")
        return_date = trip.get("return_date")
        if not departure or not return_date:
            return None, "Trip dates not found"

        from datetime import datetime
        if isinstance(departure, str):
            start = datetime.fromisoformat(departure.replace("Z", ""))
        else:
            start = departure
        if isinstance(return_date, str):
            end = datetime.fromisoformat(return_date.replace("Z", ""))
        else:
            end = return_date

        if hasattr(start, "date"):
            start = start.date()
        if hasattr(end, "date"):
            end = end.date()

        num_days = (end - start).days + 1

        # Group recommendations by category for the prompt.
        hotels = [r for r in recommendations if r.get("category") == "hotel"]
        restaurants = [r for r in recommendations if r.get("category") == "restaurant"]
        attractions = [r for r in recommendations if r.get("category") == "attraction"]
        flights = [r for r in recommendations if r.get("category") == "flight"]

        recs_text = []
        if hotels:
            recs_text.append("HOTELS:\n" + "\n".join(
                [f"- {h.get('name')}: {h.get('description', '')}" for h in hotels]
            ))
        if restaurants:
            recs_text.append("RESTAURANTS:\n" + "\n".join(
                [f"- {r.get('name')}: {r.get('description', '')}" for r in restaurants]
            ))
        if attractions:
            recs_text.append("ATTRACTIONS:\n" + "\n".join(
                [f"- {a.get('name')}: {a.get('description', '')}" for a in attractions]
            ))
        if flights:
            recs_text.append("FLIGHTS:\n" + "\n".join(
                [f"- {f.get('name')}: {f.get('description', '')}" for f in flights]
            ))

        recommendations_str = "\n\n".join(recs_text)

        prompt = f"""Create a {num_days}-day itinerary for a {trip.get('trip_purpose', 'trip')} to {trip.get('destination')}.

Available recommendations:
{recommendations_str}

Rules:
- Day 1: Outbound flight in the morning/afternoon (use saved flight info)
- Day {num_days}: Return flight in the afternoon/evening (use saved flight info)
- Day 1: Check-in at hotel in the afternoon (around 15:00)
- Day {num_days}: Check-out from hotel in the morning (around 11:00)
- Distribute activities, restaurants, and hotels across the days logically
- Breakfast is typically 8:00-9:00, lunch 12:00-13:00, dinner 18:00-20:00
- Morning activities: 9:00-12:00, Afternoon activities: 14:00-18:00
- If you run out of a category, repeat items as needed

Respond ONLY with a JSON array (no extra text), where each day has:
{{
  "date": "YYYY-MM-DD",
  "activities": [
    {{"time": "HH:MM", "title": "Activity name", "location": "address or empty", "notes": "description or empty", "category": "one of: transport, accommodation, dining, sightseeing, activity"}}
  ]
}}"""

        response = client.chat.completions.create(
            model=MODEL,
            max_tokens=4000,
            messages=[
                {"role": "system", "content": "You are a travel planner. Create well-organized day-by-day itineraries. Respond only with valid JSON, no markdown."},
                {"role": "user", "content": prompt},
            ],
        )

        import json
        raw = response.choices[0].message.content
        itinerary = json.loads(raw)
        return itinerary, None

    except _json.JSONDecodeError:
        return None, "Failed to parse AI response"
    except Exception as e:
        return None, str(e)


def get_flight_recommendations(trip, origin, destination):
    """LLM-generated flight options between two airports."""
    departure = trip.get("departure_date")
    return_date = trip.get("return_date")

    if hasattr(departure, "date"):
        departure = departure.date()
    if hasattr(return_date, "date"):
        return_date = return_date.date()

    prompt = f"""Provide flight recommendations for a trip from {origin} to {destination}.

Trip Details:
- Destination: {trip.get('destination')}
- Departure: {departure}
- Return: {return_date}
- Purpose: {trip.get('trip_purpose')}
- Travelers: {trip.get('num_travelers')}

Provide 5 flight options as a JSON array (no other text):
[
  {{
    "airline": "Airline Name",
    "flight_number": "AA123",
    "departure_time": "08:00",
    "arrival_time": "11:30",
    "duration": "5h 30m",
    "price_range": "budget" | "mid-range" | "premium",
    "notes": "Why this is a good option"
  }}
]"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            max_tokens=1000,
            messages=[
                {"role": "system", "content": "You are a travel advisor. Respond ONLY with valid JSON array, no markdown, no extra text."},
                {"role": "user", "content": prompt},
            ],
        )

        import json
        raw = response.choices[0].message.content
        flights = json.loads(raw)
        return flights, None
    except _json.JSONDecodeError:
        return None, "Failed to parse AI response"
    except openai.APIConnectionError:
        return None, "Could not reach AI service"
    except openai.RateLimitError:
        return None, "AI service rate limit hit, try again shortly"
    except openai.APIStatusError as e:
        return None, f"AI error: {e.status_code}"


def get_activity_recommendations(trip, allocation):
    """Hybrid: LLM picks activity types, then Google Places returns real venues."""
    from services.google_places_service import search_place, normalize_place

    activities_budget = allocation.get("activities_budget", 0)
    activity_prefs = trip.get("activity_prefs", [])
    destination = trip.get("destination")
    destination_country = trip.get("destination_country", "")
    trip_purpose = trip.get("trip_purpose", "vacation")

    location = f"{destination}, {destination_country}" if destination_country else destination

    prompt = f"""Based on a trip to {location} for {trip_purpose} with a budget of ${activities_budget} for activities:

User preferences: {activity_prefs if activity_prefs else 'None specified'}

Suggest 5-7 specific activity search terms that a traveler would search for on Google.
These should be specific types of attractions or activities (e.g., "museums", "hiking trails", "beaches", "theme parks", "local markets").

Respond ONLY with a JSON array of strings, no other text:
["activity 1", "activity 2", "activity 3"]"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            max_tokens=300,
            messages=[
                {"role": "system", "content": "You are a travel advisor. Respond ONLY with a JSON array of search terms, no markdown, no extra text."},
                {"role": "user", "content": prompt},
            ],
        )

        import json
        search_terms = json.loads(response.choices[0].message.content)

        results = []
        trip_context = {
            "destination": destination,
            "destination_country": destination_country,
        }

        for term in search_terms[:5]:
            place = search_place(term, "attraction", trip_context)
            if place:
                normalized = normalize_place(place)
                results.append({
                    "name": place.get("displayName", {}).get("text", term),
                    "description": f"Popular {term} in {destination}",
                    "address": normalized.get("address"),
                    "rating": normalized.get("rating"),
                    "review_count": normalized.get("review_count"),
                    "price_level": normalized.get("price_level"),
                    "booking_url": normalized.get("booking_url"),
                    "external_id": normalized.get("external_id"),
                })

        if results:
            readable = "Here are some popular activities I found:\n\n"
            for i, r in enumerate(results, 1):
                rating_str = f" ⭐ {r['rating']}/5" if r.get("rating") else ""
                address_str = f" 📍 {r['address']}" if r.get("address") else ""
                readable += f"{i}. **{r['name']}**{rating_str}{address_str}\n   {r['description']}\n\n"
        else:
            readable = "I couldn't find specific activities for this destination. Try browsing the recommendations page for saved activities."

        return {"text": readable, "items": results}, None

    except _json.JSONDecodeError:
        return {"text": "Failed to get activity suggestions", "items": []}, None
    except Exception as e:
        print(f"[ai_service] Error in get_activity_recommendations: {e}")
        return {"text": "Sorry, I couldn't find activities right now.", "items": []}, None
