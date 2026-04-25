# flights.py
from flask import Blueprint, request, jsonify
from models.trip import Trip
from routes.auth import require_auth
from services.amadeus_service import search_flights

flights_bp = Blueprint('flights', __name__)

@flights_bp.route('/api/flights/<trip_id>', methods=['GET'])
@require_auth
def get_flights(trip_id):
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404
    if trip['user_id'] != request.uid:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get query parameters
    origin = request.args.get('origin', 'JFK') # This will just default to JFK for ease
    passengers = int(request.args.get('passengers', trip.get('num_travelers', 1)))

    # Get trip dates
    departure = trip.get('departure_date')
    return_date = trip.get('return_date')

    if not departure or not return_date:
        return jsonify({'error': 'Trip dates not set'}), 400
    
    # Format dates for Amadeus (YYYY-MM-DD formatting)
    if hasattr(departure, 'date'):
        dep_str = departure.strftime('%Y-%m-%d')
    else:
        dep_str = str(departure)[:10]

    if hasattr(return_date, 'date'):
        ret_str = return_date.strftime('%Y-%m-%d')
    else:
        ret_str = str(return_date)[:10]

    # Get destination airpot code (simplified - would need proper mapping)
    destination = 'LAX' # This should be derived from the trip destination; for simplicitiy though this can be kept hardcoded

    flights, error = search_flights(origin, destination, dep_str, ret_str, passengers)

    if error:
        return jsonify({'error': error}), 500
    
    return jsonify(flights), 200