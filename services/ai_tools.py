"""AI tool schemas and implementations. Registered in TOOL_REGISTRY."""
import json


def _calculate_daily_spend(total_amount: float, num_days: int) -> str:
    """Return the daily average spend as a JSON string."""
    if num_days <= 0:
        return json.dumps({"error": "num_days must be positive"})
    return json.dumps({"daily_amount": round(total_amount / num_days, 2)})
