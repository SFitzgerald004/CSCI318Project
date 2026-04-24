# ai.py
from flask import Blueprint, request, jsonify
from models.trip import Trip
from models.budget import BudgetAllocation
from services.ai_service import analyze_budget, get_recommendations
from services.ai_service import chat_with_ai
from routes.auth import require_auth

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