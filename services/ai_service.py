# ai_service.py
import os
from openai import OpenAI
import openai

client = OpenAI(api_key = os.environ.get('OPENAI_API_KEY'))
MODEL = 'gpt-4o-mini'

def analyze_budget(trip, allocation):
    departure = trip['departure_date']
    return_date = trip['return_date']
    if hasattr(departure, 'date'):
        departure = departure.date()
    if hasattr(return_date, 'date'):
        return_date = return_date.date()
    num_nights = (return_date - departure).days

    prompt = f"""I'm planning a {trip['trip_purpose']} trip to {trip['destination']} \
                for {num_nights} nights for {trip['num_travelers']} traveler(s). \
                My total budget is ${trip['total_budget']}.
                My budget breakdown:
                - Flights: ${allocation['flights_budget']} ({allocation['flights_pct']}%)
                - Hotel: ${allocation['hotel_budget']} ({allocation['hotel_pct']}%)
                - Food: ${allocation['food_budget']} ({allocation['food_pct']}%)
                - Activities: ${allocation['activities_budget']} ({allocation['activities_pct']}%)
                - Local transport: ${allocation['transport_budget']} ({allocation['transport_pct']}%)
                - Miscellaneous: ${allocation['misc_budget']} ({allocation['misc_pct']}%)                                       
                My preferences — Food: {trip.get('food_prefs', [])}, \
                Activities: {trip.get('activity_prefs', [])}, \
                Hotel: {trip.get('hotel_prefs', 'mid_range')}.
                Does this allocation make sense for this destination and trip type? \
                What should I watch out for? Keep it to 3-5 bullet points."""
    
    try:
        response = client.chat.completions.create(
            model = MODEL,
            max_tokens=600,
            messages=[
                {'role': 'system', 'content': 'You are a friendly travel budget advisor. Give practical, specifc, and concise advice.'},
                {'role': 'user', 'content': prompt}
            ]
        )
        return response.choices[0].message.content, None
    except openai.APIConnectionError:
        return None, 'Could not reach AI service'
    except openai.RateLimitError:
        return None, 'AI service rate limit hit, try again shortly'
    except openai.APIStatusError as e:
        return None, f'AI error: {e.status_code}'
    
def get_recommendations(trip, allocation, focus):
    category_budget = {
        'hotels': allocation['hotel_budget'],
        'food': allocation['food_budget'],
        'activities': allocation['activities_budget'],
    }.get(focus, allocation['hotel_budget'])

    departure = trip['departure_date']
    return_date = trip['return_date']
    if hasattr(departure, 'date'):
        departure = departure.date()
    if hasattr(return_date, 'date'):
        return_date = return_date.date()
    num_nights = (return_date - departure).days

    prompt = f"""
                I have ${category_budget} for {focus} in {trip['destination']} \
                for {num_nights} nights. I prefer {trip.get('hotel_prefs', 'mid_range')} \
                accommodations and I'm traveling for {trip['trip_purpose']}.
                Suggest 3 specific real-world options. Do not invent ratings, addresses, or review counts.
                Respond ONLY with a JSON array, no extra text:
                [
                  {{
                    "name": "Place Name",
                    "description": "Brief description",
                  }}
                ]"""
    
    try:
        response = client.chat.completions.create(
            model=MODEL,
            max_tokens=600,
            messages=[
                {'role': 'system', 'content': 'You are a travel advisor. Respond only with valid JSON, no markdown, no extra text.'},
                {'role': 'user', 'content': prompt}
            ]
        )
        import json
        raw = response.choices[0].message.content
        items = json.loads(raw)  # parse the JSON list
        # Also build a readable version for the chat panel
        readable = "\n".join([f"{i+1}. {r['name']} ({r.get('price_level','')}) — {r.get('description','')}" for i, r in enumerate(items)])
        return {'text': readable, 'items': items}, None
    except json.JSONDecodeError:
        # If GPT doesn't return valid JSON, fall back to raw text
        return {'text': raw, 'items': []}, None
    except openai.APIConnectionError:
        return None, 'Could not reach AI service'
    except openai.RateLimitError:
        return None, 'AI service rate limit hit, try again shortly'
    except openai.APIStatusError as e:
        return None, f'AI error: {e.status_code}'
    
# Used to chat with AI model in trip
def chat_with_ai(trip, user_message, history=None):
    history = history or []

    prompt = f"""
        You are a travel assistant helping with a trip to {trip['destination']}. \
        The trip purpose is {trip['trip_purpose']}. \
        Give practical, concise answers. If you make suggestions, keep them relevant to the trip. \
        For formatting purposes, do not add special characters as if to add a header or title. \
        For example, do not send a message '**Transport Costs**:'. Instead, just send 'Transport Costs:'
    """

    messages = [
        {"role": "system", "content": prompt}
    ]

    for item in history:
        role = item.get("role")
        content = item.get("content")
        if role in ["user", "assistant"] and content:
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": user_message})

    try:
        response = client.chat.completions.create(
            model=MODEL,
            max_tokens=600,
            messages=messages
        )
        return response.choices[0].message.content, None
    except openai.APIConnectionError:
        return None, "Could not reach AI service"
    except openai.RateLimitError:
        return None, "AI service rate limit reached"
    except openai.APIStatusError as e:
        return None, f"AI error: {e.status_code}"
    
def generate_itinerary_from_recommendations(trip, recommendations):
    # Generate a day-by-day itinerary from saved recommendations using AI 
    try:
        # Get trip dates
        departure = trip.get('departure_date')
        return_date = trip.get('return_date')

        if not departure or not return_date:
            return None, 'Trip dates not found'
        
        from datetime import datetime, timedelta
        start = datetime.fromisoformat(departure.replace('+00:00', 'Z').replace('Z', '')) if isinstance(departure, str) else departure
        end = datetime.fromisoformat(return_date.replace('+00:00', 'Z').replace('Z', '')) if isinstance(return_date, str) else return_date

        if hasattr(start, 'date'):
            start = start.date()
        if hasattr(end, 'date'):
            end = end.date()

        num_days = (end - start).days + 1

        # Format recommendations for the prompt - NOW INCLUDING FLIGHTS
        hotels = [r for r in recommendations if r.get('category') == 'hotel']
        restaurants = [r for r in recommendations if r.get('category') == 'restaurant']
        attractions = [r for r in recommendations if r.get('category') == 'attraction']
        flights = [r for r in recommendations if r.get('category') == 'flight']

        recs_text = []
        if hotels:
            recs_text.append("HOTELS:\n" + "\n".join([f"- {h.get('name')}: {h.get('description', '')}" for h in hotels]))
        if restaurants:
            recs_text.append("RESTAURANTS:\n" + "\n".join([f"- {r.get('name')}: {r.get('description', '')}" for r in restaurants]))
        if attractions:
            recs_text.append("ATTRACTIONS:\n" + "\n".join([f"- {a.get('name')}: {a.get('description', '')}" for a in attractions]))
        if flights:
            recs_text.append("FLIGHTS:\n" + "\n".join([f"- {f.get('name')}: {f.get('description', '')}" for f in flights]))

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
}}

Example format:
[
  {{"date": "2026-05-01", "activities": [
    {{"time": "10:00", "title": "Flight AA123 to Destination", "location": "", "notes": "Outbound flight", "category": "transport"}},
    {{"time": "15:00", "title": "Check-in at Hotel Name", "location": "123 Main St", "notes": "Confirmation #123", "category": "accommodation"}},
    {{"time": "19:00", "title": "Dinner at Restaurant Name", "location": "456 Oak Ave", "notes": "Reservation made", "category": "dining"}}
  ]}}
]"""

        response = client.chat.completions.create(
            model=MODEL,
            max_tokens=4000,
            messages=[
                {'role': 'system', 'content': 'You are a travel planner. Create well-organized day-by-day itineraries. Respond only with valid JSON, no markdown.'},
                {'role': 'user', 'content': prompt}
            ]
        )

        import json
        raw = response.choices[0].message.content
        itinerary = json.loads(raw)
        return itinerary, None

    except json.JSONDecodeError:
        return None, 'Failed to parse AI response'
    except Exception as e:
        return None, str(e)
    
# Using this in place of Flight Lookup APIs
def get_flight_recommendations(trip, origin, destination):
    """Get flight recommendations using AI."""
    departure = trip.get('departure_date')
    return_date = trip.get('return_date')
    
    if hasattr(departure, 'date'):
        departure = departure.date()
    if hasattr(return_date, 'date'):
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
                {'role': 'system', 'content': 'You are a travel advisor. Respond ONLY with valid JSON array, no markdown, no extra text.'},
                {'role': 'user', 'content': prompt}
            ]
        )
        
        import json
        raw = response.choices[0].message.content
        flights = json.loads(raw)
        return flights, None
    except json.JSONDecodeError:
        return None, 'Failed to parse AI response'
    except openai.APIConnectionError:
        return None, 'Could not reach AI service'
    except openai.RateLimitError:
        return None, 'AI service rate limit hit, try again shortly'
    except openai.APIStatusError as e:
        return None, f'AI error: {e.status_code}'
    
# This will help the LLM get a better understanding of the available attractions
def get_activity_recommendations(trip, allocation):
    """
    Hybrid approach: Use LLM to suggest activity types, then search Google Places for real venues.
    """
    from services.google_places_service import search_place, normalize_place
    
    activities_budget = allocation.get('activities_budget', 0)
    activity_prefs = trip.get('activity_prefs', [])
    destination = trip.get('destination')
    destination_country = trip.get('destination_country', '')
    trip_purpose = trip.get('trip_purpose', 'vacation')
    
    # Step 1: Use LLM to suggest activity search terms
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
                {'role': 'system', 'content': 'You are a travel advisor. Respond ONLY with a JSON array of search terms, no markdown, no extra text.'},
                {'role': 'user', 'content': prompt}
            ]
        )
        
        import json
        search_terms = json.loads(response.choices[0].message.content)
        
        # Step 2: Search Google Places for each activity type
        results = []
        trip_context = {
            'destination': destination,
            'destination_country': destination_country
        }
        
        for term in search_terms[:5]:  # Limit to 5 searches
            place = search_place(term, 'attraction', trip_context)
            if place:
                normalized = normalize_place(place)
                results.append({
                    'name': place.get('displayName', {}).get('text', term),
                    'description': f"Popular {term} in {destination}",
                    'address': normalized.get('address'),
                    'rating': normalized.get('rating'),
                    'review_count': normalized.get('review_count'),
                    'price_level': normalized.get('price_level'),
                    'booking_url': normalized.get('booking_url'),
                    'external_id': normalized.get('external_id')
                })
        
        # Build readable response
        if results:
            readable = "Here are some popular activities I found:\n\n"
            for i, r in enumerate(results, 1):
                rating_str = f" ⭐ {r['rating']}/5" if r.get('rating') else ""
                address_str = f" 📍 {r['address']}" if r.get('address') else ""
                readable += f"{i}. **{r['name']}**{rating_str}{address_str}\n   {r['description']}\n\n"
        else:
            readable = "I couldn't find specific activities for this destination. Try browsing the recommendations page for saved activities."
        
        return {'text': readable, 'items': results}, None
        
    except json.JSONDecodeError:
        return {'text': 'Failed to get activity suggestions', 'items': []}, None
    except Exception as e:
        print(f"[ai_service] Error in get_activity_recommendations: {e}")
        return {'text': 'Sorry, I couldn\'t find activities right now.', 'items': []}, None