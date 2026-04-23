"""AI tool schemas and implementations. Registered in TOOL_REGISTRY."""
import json
from models.recommendation import Recommendation


def _calculate_daily_spend(total_amount: float, num_days: int) -> str:
    """Return the daily average spend as a JSON string."""
    if num_days <= 0:
        return json.dumps({"error": "num_days must be positive"})
    return json.dumps({"daily_amount": round(total_amount / num_days, 2)})


def _get_saved_recommendations(trip_id: str, category: str | None = None) -> str:
    """Return saved recommendations for a trip as a JSON string.

    Returns a JSON array of recommendation objects, or {"error": "..."} on failure.
    """
    try:
        recs = Recommendation.get_by_trip(trip_id, category=category)
        simplified = [
            {
                "name": r.get("name"),
                "category": r.get("category"),
                "price_level": r.get("price_level"),
                "rating": r.get("rating"),
                "description": r.get("description"),
            }
            for r in recs
        ]
        return json.dumps(simplified)
    except Exception as e:
        return json.dumps({"error": f"could not fetch saved recommendations: {e}"})
