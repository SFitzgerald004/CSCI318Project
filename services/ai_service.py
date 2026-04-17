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

    prompt = f"""I have ${category_budget} for {focus} in {trip['destination']} \
                for {num_nights} nights. I prefer {trip.get('hotel_prefs', 'mid_range')} \
                accommodations and I'm traveling for {trip['trip_purpose']}.
                Suggest 3 specific options. Respond ONLY with a JSON array, no extra text:
                [
                  {{
                    "name": "Place Name",
                    "description": "Brief description",
                    "price_level": "$$$",
                    "rating": 4.5
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