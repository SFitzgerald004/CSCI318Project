# ai_service.py
import os
from openai import OpenAI
import openai

client = OpenAI(api_key = os.environ.get('OPENAI_API_KEY'))
MODEL = 'gpt-4o-mini'


def _humanize_prefs(prefs: list | None) -> str:
    """Turn ['fine_dining', 'street_food'] into 'fine_dining, street_food'."""
    if not prefs:
        return "no specific preference"
    return ", ".join(prefs)


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
                Suggest 3 specific options with approximate price ranges. \
                Format as a numbered list."""
    
    try:
        response = client.chat.completions.create(
            model=MODEL,
            max_tokens=600,
            messages=[
                {'role': 'system', 'content': 'You are a friendly travel advisor. Give practical, specific recommendations.'},
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