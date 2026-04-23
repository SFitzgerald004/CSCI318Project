"""AI tool schemas and implementations. Registered in TOOL_REGISTRY."""
import json
from models.recommendation import Recommendation
from models.savings_plan import SavingsPlan


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


def _get_savings_progress(trip_id: str) -> str:
    """Return the user's savings progress for this trip as a JSON string."""
    try:
        plan = SavingsPlan.get(trip_id)
        if plan is None:
            return json.dumps({"error": "no savings plan found for this trip"})

        total = plan.get("total_budget", 0)
        saved = plan.get("amount_saved", 0)
        weeks_left = plan.get("weeks_until_trip", 0)
        pct = round((saved / total) * 100) if total > 0 else 0

        return json.dumps({
            "saved": saved,
            "goal": total,
            "pct_complete": pct,
            "weekly_target": plan.get("weekly_savings_needed", 0),
            "on_track": saved > 0 and weeks_left > 0,
        })
    except Exception as e:
        return json.dumps({"error": f"could not fetch savings progress: {e}"})
