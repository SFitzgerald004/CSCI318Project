# amadeus_service.py
import os
import requests
from datetime import datetime

AMADEUS_BASE_URL = "https://api.amadeus.com"

def get_access_token():
    # Get OAuth access token from Amadeus
    auth_url = f"{AMADEUS_BASE_URL}/v1/security/oauth2/token"
    api_key = os.getenv('AMADEUS_API_KEY')
    api_secret = os.getenv('AMADEUS_API_SECRET')

    if not api_key or not api_secret:
        return None, 'Amadeus API credentials not configured'
    
    response = requests.post(
        auth_url,
        data={'grant_type': 'client_credentials', 'client_id': api_key, 'client_secret': api_secret}
    )

    if response.status_code != 200:
        return None, f"Amadeus auth failed: {response.status_code}"
    
    return response.json().get('access_token'), None

def search_flights(origin, destination, departure_date, return_date=None, passengers=1):
    # Search for different flight offers based on travel parameters
    token, error = get_access_token()
    if error:
        return None, error
    
    url = f"{AMADEUS_BASE_URL}/v2/shopping/flight-offers"

    params = {
        'originLocationCode': origin,
        'destinationLocationCode': destination,
        'departureDate': departure_date,
        'passengers': passengers,
        'max': 10
    }

    if return_date:
        params['returnDate'] = return_date

        headers = {'Authorization': f'Bearer {token}'}

        response = requests.get(url, params=params, headers=headers)

        if response.status_code != 200:
            return None, f'Flight search failed: {response.status_code}'
        
        data = response.json()
        return parse_flight_offers(data), None
    
def parse_flight_offers(data):
    # Parse Amadeus response into simplified formatting
    flights = []

    for offer in data.get('data', []):
        try:
            outbound = offer['itineraries'][0]
            inbound = offer['itineraries'][1] if len(offer['itineraries']) > 1 else None

            # Get flight pricing
            price = offer.get('offerItems', [{}])[0].get('price', {})

            flight = {
                'id': offer.get('id'),
                'price': price.get('total', 'N/A'),
                'currency': price.get('currency', 'USD'),
                'outbound': parse_segment(outbound),
                'inbound': parse_segment(inbound) if inbound else None
            }
            flights.append(flight)
        except (KeyError, IndexError):
            continue

    return flights

def parse_segment(itinerary):
    # Parse a flight segment; outbound or inbound
    if not itinerary:
        return None
    
    segments = []
    for seg in itinerary.get('segments', []):
        dep = seg.get('departure', {})
        arr = seg.get('arrival', {})
        carrier = seg.get('carrierCode', '')

        segments.append({
            'airline': carrier,
            'flight_number': f"{carrier}{seg.get('number', '')}",
            'departure_airport': dep.get('iataCode', ''),
            'departure_time': dep.get('at', ''),
            'arrival_time': arr.get('at', ''),
            'duration': seg.get('duration', '')
        })

    return {
        'duration': itinerary.get('duration', ''),
        'segments': segments
    }