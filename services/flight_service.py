# flight_service.py
import os
import requests
from datetime import datetime

FLIGHT_API_BASE = "https://api.flightapi.io/schedule/v2"

def get_api_key():
    return os.getenv('FLIGHT_API_KEY')

def search_departures(iata_code, year, month, day, page=1):
    """Get departures from an airport for a specific date."""
    api_key = get_api_key()
    if not api_key:
        return None, 'Flight API key not configured'
    
    url = f"{FLIGHT_API_BASE}/{api_key}"
    params = {
        'mode': 'dep',
        'iata': iata_code,
        'year': year,
        'month': month,
        'day': day,
        'page': page
    }
    
    print(f"[flight_service] Calling: {url}")
    print(f"[flight_service] Params: {params}")
    
    response = requests.get(url, params=params)
    
    print(f"[flight_service] Status: {response.status_code}")
    print(f"[flight_service] Response: {response.text[:500]}")
    
    if response.status_code != 200:
        return None, f'Flight API error: {response.status_code}'
    
    data = response.json()
    return parse_flights(data), None


def search_arrivals(iata_code, year, month, day, page=1):
    """Get arrivals to an airport for a specific date."""
    api_key = get_api_key()
    if not api_key:
        return None, 'Flight API key not configured'
    
    url = f"{FLIGHT_API_BASE}/{api_key}"
    params = {
        'mode': 'arr',
        'iata': iata_code,
        'year': year,
        'month': month,
        'day': day,
        'page': page
    }
    
    response = requests.get(url, params=params)
    
    if response.status_code != 200:
        return None, f'Flight API error: {response.status_code}'
    
    data = response.json()
    return parse_flights(data), None


def parse_flights(data):
    """Parse FlightAPI.io response into simplified format."""
    flights = []
    
    try:
        # The structure is: data.flights[]
        flight_list = data.get('data', {}).get('flights', [])
        
        for item in flight_list:
            departure = item.get('departureTime', {})
            arrival = item.get('arrivalTime', {})
            airline = item.get('airline', {})
            route = item.get('route', {})
            
            flight_data = {
                'flight_number': f"{airline.get('iata', '')}{item.get('number', '')}",
                'airline': airline.get('name', ''),
                'airline_iata': airline.get('iata', ''),
                'departure_airport': departure.get('iataCode', ''),
                'departure_airport_name': departure.get('airportName', ''),
                'departure_terminal': departure.get('terminal', ''),
                'departure_time': departure.get('scheduled', ''),
                'arrival_airport': arrival.get('iataCode', ''),
                'arrival_airport_name': arrival.get('airportName', ''),
                'arrival_terminal': arrival.get('terminal', ''),
                'arrival_time': arrival.get('scheduled', ''),
            }
            flights.append(flight_data)
    except (KeyError, TypeError) as e:
        print(f"[flight_service] Parse error: {e}")
    
    return flights