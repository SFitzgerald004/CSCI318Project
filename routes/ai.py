# ai.py
from flask import Blueprint, request, jsonify
from models.trip import Trip
from models.budget import BudgetAllocation
from models.ai_message import AiMessage
from services.ai_service import (
    analyze_budget,
    get_recommendations,
    chat_with_ai,
    generate_itinerary_from_recommendations,
    get_flight_recommendations,
    get_activity_recommendations,
)
from routes.auth import require_auth

ai_bp = Blueprint("ai", __name__)

FOCUS_TO_CATEGORY = {
    "hotels": "hotel",
    "food": "restaurant",
    "activities": "attraction",
    "overall": None,
}


@ai_bp.route("/api/ai/<trip_id>/analyze", methods=["POST"])
@require_auth
def analyze(trip_id):
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({"error": "Trip not found"}), 404
    if trip["user_id"] != request.uid:
        return jsonify({"error": "Unauthorized"}), 403

    allocation = BudgetAllocation.get(trip_id)
    if not allocation:
        return jsonify({"error": "No budget allocation found, POST to /api/budget/<trip_id>/allocate first"}), 400

    body = request.get_json(silent=True) or {}
    force = bool(body.get("force"))

    if not force:
        cached = AiMessage.get_cached(trip_id, "analyze")
        if cached:
            return jsonify({
                "advice": cached["content"],
                "message_id": cached["id"],
                "tools_used": cached.get("tools_used", []),
                "cached": True,
            }), 200

    advice, tools_used, error = analyze_budget(trip, allocation)
    if error:
        return jsonify({"error": error}), 503

    message_id = None
    try:
        _, ai_doc = AiMessage.save_pair(
            trip_id=trip_id,
            action="analyze",
            user_content="Analyze my budget allocation",
            ai_content=advice,
            tools_used=tools_used,
            category=None,
            can_save=False,
        )
        message_id = ai_doc["id"]
    except Exception:
        # Persistence failed; still return the generated advice so the user
        # doesn't lose their LLM response. They can re-ask to retry saving.
        pass

    return jsonify({
        "advice": advice,
        "message_id": message_id,
        "tools_used": tools_used,
        "cached": False,
    }), 200


@ai_bp.route("/api/ai/<trip_id>/messages", methods=["GET"])
@require_auth
def messages(trip_id):
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({"error": "Trip not found"}), 404
    if trip["user_id"] != request.uid:
        return jsonify({"error": "Unauthorized"}), 403
    msgs = AiMessage.get_by_trip(trip_id)
    return jsonify(msgs), 200


@ai_bp.route("/api/ai/<trip_id>/recommend", methods=["POST"])
@require_auth
def recommend(trip_id):
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({"error": "Trip not found"}), 404
    if trip["user_id"] != request.uid:
        return jsonify({"error": "Unauthorized"}), 403

    allocation = BudgetAllocation.get(trip_id)
    if not allocation:
        return jsonify({"error": "No budget allocation found, POST to /api/budget/<trip_id>/allocate first"}), 400

    body = request.get_json(silent=True) or {}
    focus = body.get("focus", "overall")
    if focus not in FOCUS_TO_CATEGORY:
        return jsonify({"error": "focus must be hotels, food, activities, or overall"}), 400
    force = bool(body.get("force"))

    action = f"recommend:{focus}"

    if not force:
        cached = AiMessage.get_cached(trip_id, action)
        if cached:
            return jsonify({
                "advice": cached["content"],
                "message_id": cached["id"],
                "tools_used": cached.get("tools_used", []),
                "cached": True,
            }), 200

    advice, tools_used, error = get_recommendations(trip, allocation, focus)
    if error:
        return jsonify({"error": error}), 503

    category = FOCUS_TO_CATEGORY[focus]
    message_id = None
    try:
        _, ai_doc = AiMessage.save_pair(
            trip_id=trip_id,
            action=action,
            user_content=f"Get {focus} recommendations",
            ai_content=advice,
            tools_used=tools_used,
            category=category,
            can_save=category is not None,
        )
        message_id = ai_doc["id"]
    except Exception:
        pass

    return jsonify({
        "advice": advice,
        "message_id": message_id,
        "tools_used": tools_used,
        "cached": False,
    }), 200


# ===== New endpoints (cherry-picked from backend) =====

@ai_bp.route("/api/ai/<trip_id>/chat", methods=["POST"])
@require_auth
def ai_chat(trip_id):
    """Free-form chat with the travel advisor. Sends `message` + optional `history`."""
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({"error": "Trip not found"}), 404
    if trip["user_id"] != request.uid:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    if not data:
        return jsonify({"error": "Empty request"}), 400

    user_message = (data.get("message") or "").strip()
    if not user_message:
        return jsonify({"error": "message is required"}), 400

    history = data.get("history", [])

    reply, error = chat_with_ai(trip, user_message, history)
    if error:
        return jsonify({"error": error}), 503

    return jsonify({"response": reply}), 200


@ai_bp.route("/api/ai/<trip_id>/generate-itinerary", methods=["POST"])
@require_auth
def generate_itinerary(trip_id):
    """Generate a day-by-day itinerary using saved recommendations."""
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({"error": "Trip not found"}), 404
    if trip["user_id"] != request.uid:
        return jsonify({"error": "Unauthorized"}), 403

    from models.recommendation import Recommendation
    recommendations = Recommendation.get_by_trip(trip_id)

    if not recommendations:
        return jsonify({"error": "No saved recommendations found. Save some recommendations first!"}), 400

    itinerary, error = generate_itinerary_from_recommendations(trip, recommendations)
    if error:
        return jsonify({"error": error}), 503

    Trip.update_itinerary(trip_id, itinerary)
    return jsonify({"itinerary": itinerary, "message": "Itinerary generated and saved"}), 200


@ai_bp.route("/api/ai/<trip_id>/flights", methods=["GET"])
@require_auth
def ai_flight_recommendations(trip_id):
    """LLM-generated flight options for the trip route."""
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({"error": "Trip not found"}), 404
    if trip["user_id"] != request.uid:
        return jsonify({"error": "Unauthorized"}), 403

    origin = request.args.get("origin", "JFK")
    destination = request.args.get("destination")

    if not destination:
        return jsonify({"error": "destination is required"}), 400

    recommendations, error = get_flight_recommendations(trip, origin, destination)
    if error:
        return jsonify({"error": error}), 503

    return jsonify(recommendations), 200


@ai_bp.route("/api/ai/<trip_id>/activities", methods=["POST"])
@require_auth
def ai_activity_recommendations(trip_id):
    """Hybrid LLM + Google Places activity recommendations."""
    trip = Trip.get(trip_id)
    if not trip:
        return jsonify({"error": "Trip not found"}), 404
    if trip["user_id"] != request.uid:
        return jsonify({"error": "Unauthorized"}), 403

    allocation = BudgetAllocation.get(trip_id)
    if not allocation:
        return jsonify({"error": "No budget allocation found"}), 400

    result, error = get_activity_recommendations(trip, allocation)
    if error:
        return jsonify({"error": error}), 503

    return jsonify({"advice": result["text"], "items": result["items"]}), 200
