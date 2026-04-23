# ai.py
from flask import Blueprint, request, jsonify
from models.trip import Trip
from models.budget import BudgetAllocation
from models.ai_message import AiMessage
from services.ai_service import analyze_budget, get_recommendations
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

    _, ai_doc = AiMessage.save_pair(
        trip_id=trip_id,
        action="analyze",
        user_content="Analyze my budget allocation",
        ai_content=advice,
        tools_used=tools_used,
        category=None,
        can_save=False,
    )

    return jsonify({
        "advice": advice,
        "message_id": ai_doc["id"],
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
    _, ai_doc = AiMessage.save_pair(
        trip_id=trip_id,
        action=action,
        user_content=f"Get {focus} recommendations",
        ai_content=advice,
        tools_used=tools_used,
        category=category,
        can_save=category is not None,
    )

    return jsonify({
        "advice": advice,
        "message_id": ai_doc["id"],
        "tools_used": tools_used,
        "cached": False,
    }), 200
