# flights.py
from flask import Blueprint, request, jsonify
from datetime import datetime
from models.trip import Trip
from routes.auth import require_auth
from services.flight_service import search_departures

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
    origin = request.args.get('origin')  # e.g., 'JFK'
    destination = request.args.get('destination')  # e.g., 'LAX'
    
    if not origin or not destination:
        return jsonify({'error': 'origin and destination are required'}), 400
    
    # Get trip dates
    departure = trip.get('departure_date')
    return_date = trip.get('return_date')
    
    if not departure or not return_date:
        return jsonify({'error': 'Trip dates not set'}), 400
    
    # Parse departure date
    if hasattr(departure, 'date'):
        dep_date = departure.date()
    else:
        dep_date = datetime.fromisoformat(str(departure)[:10]).date()
    
    # Parse return date
    if hasattr(return_date, 'date'):
        ret_date = return_date.date()
    else:
        ret_date = datetime.fromisoformat(str(return_date)[:10]).date()
    
    # Get outbound flights (departures from origin on departure date)
    outbound, error = search_departures(
        origin,
        dep_date.year,
        dep_date.month,
        dep_date.day
    )
    
    if error:
        return jsonify({'error': error}), 500
    
    outbound = outbound or []
    
    # Get return flights (departures from destination on return date)
    return_flights, error = search_departures(
        destination,
        ret_date.year,
        ret_date.month,
        ret_date.day
    )
    
    if error:
        return_flights = []
    
    return jsonify({
        'outbound': outbound[:20],
        'return': return_flights[:20],
        'search_info': {
            'origin': origin,
            'destination': destination,
            'departure_date': dep_date.isoformat(),
            'return_date': ret_date.isoformat()
        }
    }), 200