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
        Give practical, concise answers. If you make suggestions, keep them relevant to the trip.
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
    # Generates a day-by-day itinterary from saved recommendations
    try:
        # Group recommendations by category
        hotels = [r for r in recommendations if r.get('category') == 'hotel']
        restaurants = [r for r in recommendations if r.get('category') == 'restaurant']
        attractions = [r for r in recommendations if r.get('category') == 'attraction']
        # Activities too maybe?

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

        # Build Itinerary Structure
        itinerary = []
        current_date = start

        for day_num in range(num_days):
            day_date = current_date.isoformat() if isinstance(current_date, datetime) else str(current_date)
            day_activities = []

            # Morning: First attraction or activity
            if attractions:
                att = attractions.pop(0)
                day_activities.append({
                    'time': '09:00',
                    'title': f"Visit {att.get('name')}",
                    'location': att.get('address', ''),
                    'notes': att.get('description', ''),
                    'category': 'sightseeing'
                })
            
            # Lunch: Restaurant
            if restaurants:
                rest = restaurants.pop(0)
                day_activities.append({
                    'time': '12:00',
                    'title': f"Lunch at {rest.get('name')}",
                    'location': rest.get('address', ''),
                    'notes': rest.get('description', ''),
                    'category': 'dining'
                })
            
            # Afternoon: Another attraction or activity
            if attractions:
                att = attractions.pop(0)
                day_activities.append({
                    'time': '14:00',
                    'title': f"Explore {att.get('name')}",
                    'location': att.get('address', ''),
                    'notes': att.get('description', ''),
                    'category': 'sightseeing'
                })
            
            # Dinner: Another restaurant
            if restaurants:
                rest = restaurants.pop(0)
                day_activities.append({
                    'time': '19:00',
                    'title': f"Dinner at {rest.get('name')}",
                    'location': rest.get('address', ''),
                    'notes': rest.get('description', ''),
                    'category': 'dining'
                })
            
            # Accommodation for first day
            if day_num == 0 and hotels:
                hotel = hotels[0]
                day_activities.append({
                    'time': '15:00',
                    'title': f"Check-in at {hotel.get('name')}",
                    'location': hotel.get('address', ''),
                    'notes': hotel.get('description', ''),
                    'category': 'accommodation'
                })
            
            # Last day: Check-out
            if day_num == num_days - 1 and hotels:
                hotel = hotels[0]
                day_activities.append({
                    'time': '11:00',
                    'title': f"Check-out from {hotel.get('name')}",
                    'location': hotel.get('address', ''),
                    'notes': 'Checkout time',
                    'category': 'accommodation'
                })

            itinerary.append({
                'date': day_date,
                'activities': day_activities
            })

            if hasattr(current_date, 'date'):
                current_date = current_date + timedelta(days=1)
            else:
                current_date = current_date + timedelta(days=1)

        return itinerary, None
    
    except Exception as e:
        return None, str(e)