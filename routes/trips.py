# trips.py
from flask import Blueprint, request, jsonify
from models.trip import Trip
from routes.auth import require_auth
from datetime import datetime

trips_bp = Blueprint('trips', __name__)

@trips_bp.route('/api/trips', methods=['GET'])
@require_auth
def get_trips():
    data = request.get_json()
    required = ['destination', 'total_budget', 'departure_date', 'return_date', 'trip_purpose']
    if not all(k in data for k in required):
        return jsonify({'error': 'Missing required fields'}), 400
    
    trip = Trip.create(
        user_id = request.uid,
        destination = data['destination'],
        destination_country = data.get('destination_country'),
        total_budget = data['total_budget'],
        departure_date = datetime.fromisoformat(data['departure_date']).date(),
        return_date=datetime.fromisoformat(data['return_date']).date(),                                                       
        trip_purpose=data['trip_purpose'],
        num_travelers=data.get('num_travelers', 1),                                                                           
        food_prefs=data.get('food_prefs', []),                                                                                
        activity_prefs=data.get('activity_prefs', []),
        hotel_prefs=data.get('hotel_prefs', 'mid_range')
    )
    return jsonify(trip), 201

@trips_bp.route('/api/trips/<trip_id>', methods=['GET'])
@require_auth
def get_trip(trip_id):
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404
    if trip['user_id'] != request.uid:
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify(trip), 200

@trips_bp.route('/api/trips/<trip_id>', methods=['PUT'])
@require_auth
def update_trip(trip_id):
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404
    if trip['user_id'] != request.uid:
        return jsonify({'error': 'Unauthorized'}), 403
    Trip.update(trip_id, request.get_json())
    return jsonify(Trip.get(trip_id)), 200

@trips_bp.route('/api/trips/<trip_id>', methods=['DELETE'])
@require_auth
def delete_trip(trip_id):
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404
    if trip['user_id'] != request.uid:
        return jsonify({'error': 'Unauthorized'}), 403
    Trip.delete(trip_id)
    return jsonify({'message': 'Trip deleted'}), 200
