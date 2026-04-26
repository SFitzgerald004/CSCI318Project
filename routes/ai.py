# ai.py
from flask import Blueprint, request, jsonify
from models.trip import Trip
from models.budget import BudgetAllocation
from services.ai_service import analyze_budget, get_recommendations
from services.ai_service import chat_with_ai
from routes.auth import require_auth
from services.ai_service import get_flight_recommendations

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/api/ai/<trip_id>/analyze', methods=['POST'])
@require_auth
def analyze(trip_id):
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404
    if trip['user_id'] != request.uid:
        return jsonify({'error': 'Unauthorized'}), 403

    allocation = BudgetAllocation.get(trip_id)
    if not allocation:
        return jsonify({'error': 'No budget allocation found, POST to /api/budget/<trip_id>/allocate first'}), 400

    advice, error = analyze_budget(trip, allocation)
    if error:
        return jsonify({'error': error}), 503
    return jsonify({'advice': advice}), 200

@ai_bp.route('/api/ai/<trip_id>/recommend', methods=['POST'])
@require_auth
def recommend(trip_id):
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404
    if trip['user_id'] != request.uid:
        return jsonify({'error': 'Unauthorized'}), 403

    allocation = BudgetAllocation.get(trip_id)
    if not allocation:
        return jsonify({'error': 'No budget allocation found, POST to /api/budget/<trip_id>/allocate first'}), 400
                                                                                                                                                
    focus = request.get_json().get('focus', 'overall')
    if focus not in ['hotels', 'food', 'activities', 'overall']:
        return jsonify({'error': 'focus must be hotels, food, activities, or overall'}), 400

    result, error = get_recommendations(trip, allocation, focus)
    if error:
        return jsonify({'error': error}), 503
    return jsonify({'advice': result['text'], 'items': result['items'], 'focus': focus}), 200

# New route to allow for chatting directly with the AI agent
@ai_bp.route('/api/ai/<trip_id>/chat', methods=['POST'])
@require_auth
def ai_chat(trip_id):
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404
    if trip['user_id'] != request.uid:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Empty request'}), 400
    
    user_message = (data.get("message") or "").strip()
    if not user_message:
        return jsonify({"error": "message is required"}), 400
    
    history = data.get("history", [])

    reply, error = chat_with_ai(trip, user_message, history)
    if error:
        return jsonify({"error": error}), 503

    return jsonify({'response': reply})

# New route to let the AI build an itinerary
@ai_bp.route('/api/ai/<trip_id>/generate-itinerary', methods=['POST'])
@require_auth
def generate_itinerary(trip_id):
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404
    if trip['user_id'] != request.uid:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get all saved recommendations for this trip
    from models.recommendation import Recommendation
    recommendations = Recommendation.get_by_trip(trip_id)

    if not recommendations:
        return jsonify({'error': 'No saved recommendations found. Saved some recommendations first!'}), 400
    
    # Generate itinerary using AI service
    from services.ai_service import generate_itinerary_from_recommendations
    itinerary, error = generate_itinerary_from_recommendations(trip, recommendations)

    if error:
        return jsonify({'error': error}), 503
    
    # Save the generated itinerary to the trip
    Trip.update_itinerary(trip_id, itinerary)

    return jsonify({'itinerary': itinerary, 'message': 'Itinerary generated and saved'})

@ai_bp.route('/api/ai/<trip_id>/flights', methods=['GET'])
@require_auth
def get_flights(trip_id):
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404
    if trip['user_id'] != request.uid:
        return jsonify({'error': 'Unauthorized'}), 403
    
    origin = request.args.get('origin', 'JFK')
    destination = request.args.get('destination')
    
    if not destination:
        return jsonify({'error': 'destination is required'}), 400
    
    recommendations, error = get_flight_recommendations(trip, origin, destination)
    
    if error:
        return jsonify({'error': error}), 503
    
    return jsonify(recommendations), 200  # Return the array directly